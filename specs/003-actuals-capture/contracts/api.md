# API Contract — Actuals Capture

**Feature**: 003-actuals-capture
**Date**: 2026-05-09

This file documents the request/response shape for actuals operations as a
human-readable companion to the Zod schemas in this directory. Every endpoint
listed here already exists; this feature only extends bodies and adds error
codes — no new routes.

---

## Endpoint summary

| Method | Path | Purpose | Changed by 003? |
|---|---|---|---|
| `PATCH` | `/api/projects/:projectId/tasks/:taskId` | Edit one task's fields, including actuals | **Yes** — body extended, new validation, new error codes |
| `PUT`   | `/api/projects/:projectId`  | Replace full project snapshot | **Yes** — `tasks[*]` shape extended (additive) |
| `GET`   | `/api/projects/:projectId`  | Load full project snapshot | **Yes** — response shape extended (additive) |
| `POST`  | `/api/projects/:projectId/tasks` | Create task | No — actuals never set on creation |
| `DELETE` | `/api/projects/:projectId/tasks/:taskId` | Delete task | No — actuals cascade with the row |

---

## `PATCH /api/projects/:projectId/tasks/:taskId`

### Request body (extended)

`Content-Type: application/json`

All fields are optional. Body is a partial patch.

```json
{
  "name": "Task A",
  "durationDays": 5,
  "progressPct": 75,
  "actualStart":  "2026-05-01",
  "actualFinish": null
}
```

New keys for this feature:

| Key | Type | Description |
|---|---|---|
| `progressPct` | integer 0..100 | Actual percent complete. Pre-existed; semantics now "actual" per data-model.md. |
| `actualStart` | `YYYY-MM-DD` \| `null` | Actual start date. `null` clears it. Omit to leave unchanged. |
| `actualFinish` | `YYYY-MM-DD` \| `null` | Actual finish date. `null` clears it. Omit to leave unchanged. |

Validated by `taskUpdateSchema` (extended; see `task-actuals.zod.ts`).

### Success response

`200 OK`

```json
{ "ok": true }
```

### Error responses

| Status | `error` code | When | User message |
|---|---|---|---|
| 400 | `validation_error` | `progressPct` out of 0..100 or non-integer | "% complete must be between 0 and 100" |
| 400 | `validation_error` | `actualStart` / `actualFinish` not a valid `YYYY-MM-DD` | "Date is not valid" |
| 400 | `validation_error` | `actualFinish` < `actualStart` (in the patch OR composed with current row) | "Actual finish cannot be earlier than actual start" |
| 409 | `summary_actuals_readonly` | Patch touches any of the three actuals fields AND target task has children | "Actuals on a summary task are derived; edit children instead" |
| 404 | `task_not_found` | Task does not exist or is in a different project | "Task not found" |
| 401 | `unauthenticated` | Missing/invalid token | (existing) |
| 403 | `forbidden` | Caller lacks edit permission on project | (existing — no separate actuals permission per spec Assumptions §3) |

Error body shape (existing contract):

```json
{
  "error": "validation_error",
  "issues": [
    { "path": ["progressPct"], "message": "% complete must be between 0 and 100" },
    { "path": ["actualFinish"], "message": "Actual finish cannot be earlier than actual start" }
  ]
}
```

### Atomicity (FR-010)

The handler still issues per-field UPDATE statements. The summary-task guard
runs **before** any UPDATE so a rejected patch does not partially write. If
multiple validation issues exist, all are returned in `issues[]` so the
inspector can highlight every offending field at once (FR-010 + spec User
Story 3 acceptance scenarios).

### Cross-row consistency (FR-006 corner case)

If only `actualFinish` is in the patch, and the existing row has an
`actualStart`, the handler must compose the existing `actualStart` with the new
`actualFinish` and re-run the pair check. Implementation:

```typescript
if (patch.actualFinish !== undefined) {
  const [row] = await sql<{ actual_start_date: string | null }[]>`
    SELECT actual_start_date FROM schedule_tasks WHERE id = ${taskId}
  `;
  const effectiveStart =
    'actualStart' in patch ? patch.actualStart : row.actual_start_date;
  if (effectiveStart && patch.actualFinish && patch.actualFinish < effectiveStart) {
    throw new ApiError(400, 'validation_error', /* ... */);
  }
}
```

---

## `GET /api/projects/:projectId`

Response: full snapshot.

`tasks[*]` is now:

```json
{
  "id": "uuid",
  "name": "...",
  "durationDays": 5,
  "isMilestone": false,
  "scheduleMode": "auto",
  "manualStart": "2026-05-01T00:00:00.000Z",
  "constraint": { "kind": "ASAP" },
  "progressPct": 50,
  "actualStart":  "2026-05-01",
  "actualFinish": "2026-05-04",
  "color": "#1d4ed8",
  "parentId": "uuid",
  "notes": "..."
}
```

`actualStart` / `actualFinish` are **omitted** from the response object when the
DB value is NULL (existing snapshot serializer pattern: omit nullable
optionals rather than emitting `null`).

---

## `PUT /api/projects/:projectId`

Body: same snapshot shape as `GET` returns. The `actualStart` / `actualFinish`
keys are optional inside each `tasks[*]`. A snapshot persisted before this
feature shipped will not carry them; that is valid.

`saveSnapshot()` writes `NULL` to the DB columns when the keys are absent.

---

## Idempotency & race conditions

- Last-write-wins per spec Assumptions §9. No `If-Match` / ETag.
- The summary-task guard is read-then-check-then-write within a single
  request; a race where a user adds children to a task between the guard
  check and the UPDATE is acceptable (the actuals values then become "stale
  on a now-summary"). Phase 2 EVM rollup will recompute regardless.

---

## Open question for review

The spec leaves "audit log of actuals edits" as desirable but not required
(spec Assumptions §10). This contract does not specify any audit trail.
If reviewers want one, the existing `audit_log` infrastructure (referenced
in PRD §2 inherited capabilities) can be wired with an additional row write
inside the same SQL transaction. Add to tasks.md if accepted.
