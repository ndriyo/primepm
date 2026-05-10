# Phase 0 Research: Actuals Capture

**Feature**: 003-actuals-capture
**Date**: 2026-05-10
**Spec**: ./spec.md

This document records the technical decisions taken to plan the feature, the
rationale for each choice, and the alternatives that were considered and
rejected. The Technical Context in `plan.md` references these decisions.

The five spec-level Q/A clarifications from session 2026-05-10 (audit log,
auto-fill, read scope, server latency, audit retention on delete) are
covered below by R2/R7, R6, R10, R12 and R3 respectively.

## Decision summary table

| ID  | Topic                                          | Decision                                                                            |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| R1  | Where actuals live (per-task vs. side table)   | Extend `schedule_tasks` with two date columns; reuse existing `progress_pct`        |
| R2  | Audit log shape (existing vs. new table)       | Extend `audit_logs` with `payload jsonb` column; reuse infra; one new audit action  |
| R3  | Audit retention on task deletion               | Audit rows are not cascaded; emit a final `task.actuals.deleted` event              |
| R4  | Auto-fill for `% = 100` ↔ `actualFinish`       | Server-side, inside the same write transaction; client mirrors for UX echo          |
| R5  | Validation of out-of-range / ordering          | Frontend (immediate) + zod at API boundary + Postgres CHECK (defence in depth)      |
| R6  | Read-side permission scope                     | Project-read parity (FR-018); no new role; same RLS as existing schedule reads      |
| R7  | Where actuals are entered (UI)                 | Inside the existing `TaskInspector` panel; no new screen, no separate save button   |
| R8  | Summary rollup math (% complete)               | Duration-weighted; computed client-side at render; never persisted on summary rows  |
| R9  | Summary rollup dates (start/finish)            | `min(child.actualStart)` / `max(child.actualFinish if all children finished)`       |
| R10 | Three-track Gantt overlay rendering            | Add a third `motion.div` lane above current bar; reuse `BaselineBar` lane discipline|
| R11 | Concurrency / conflict detection               | Last-write-wins per spec assumption; no optimistic concurrency token in this release|
| R12 | Server-side latency target                     | p95 ≤ 500 ms at ≤500 tasks/project; single-statement UPDATE inside the txn          |
| R13 | Reading audit history                          | New `GET /tasks/:taskId/actuals/audit` endpoint; cursor pagination by `created_at`  |
| R14 | Stable identity                                | Reuse `schedule_tasks.id` (UUID); audit rows reference it as `entity_id`            |

## R1 — Where actuals live

**Decision**: Add two new nullable date columns directly to `schedule_tasks`:

```
actual_start  DATE NULL
actual_finish DATE NULL
```

The `progress_pct` (smallint 0–100) column already exists on `ScheduleTask`
and is what the inspector renders today as "Progress". Per spec assumption
("the existing task data model has, or can hold, a percent-complete field as
a first-class task attribute"), this column **is** the actuals "% complete"
field — we do not introduce a parallel one.

**Rationale**:

- Per task there is exactly one set of actuals (FR-001). Splitting them into
  a side table would buy nothing and create lifecycle headaches: deletes
  (FR-012) would need a cascade definition, reads (FR-008, FR-018) would
  need a join, and the existing inspector save path already touches
  `schedule_tasks` — adding two columns keeps actuals atomic with the rest
  of the row update (FR-010).
- The Prisma model already exposes `progressPct` at line 406; treating it
  as the actuals %-complete avoids data duplication and keeps the existing
  Gantt progress fill working unchanged.
- Two nullable date columns is the cheapest possible representation and
  matches the way `manualStart` is already modeled (`@db.Date`, NULL when
  unset).

**Alternatives considered**:

1. _New table `schedule_task_actuals(task_id PK, …)`_. Rejected: every
   write becomes a two-statement transaction (UPSERT on actuals + UPDATE on
   the task for the rest of the inspector form), violating the
   single-atomic-save spec rule (FR-010) without justification. The "one
   task, one actuals row" cardinality is a 1:1 anyway.
2. _Three new columns `actual_start`, `actual_finish`, `actual_progress_pct`
   alongside the existing `progress_pct`_. Rejected: introduces meaning
   ambiguity ("which one drives the Gantt fill?") and migration risk —
   `progress_pct` is already the user-entered progress today.

## R2 — Audit log shape

**Decision**: Extend the existing `audit_logs` table with one new nullable
JSONB column:

```sql
ALTER TABLE audit_logs ADD COLUMN payload jsonb NULL;
```

For actuals events the payload carries `{ before: { ... }, after: { ... } }`
where `before` and `after` each contain `progressPct`, `actualStart`,
`actualFinish`. New action strings reserved for this feature:

- `task.actuals.set` — first time any actuals field becomes non-null
- `task.actuals.update` — subsequent change
- `task.actuals.cleared` — all three fields go back to null
- `task.actuals.deleted` — emitted by the task-delete path (FR-019); the
  payload's `before` carries the last-known actuals; `after` is null

**Rationale**:

- FR-016 requires "before/after values of all three actuals fields". The
  existing audit_logs row has `(user_id, action, entity_type, entity_id,
  created_at)` but no value-payload — we need a column to put the JSON in.
  Adding a single nullable jsonb column is additive and unblocks future
  audit users (e.g. baseline rationale changes, schedule edits) without a
  parallel table per feature.
- 002 already writes `audit_logs` rows with `entity_type = 'ScheduleBaseline'`
  — extending the same table keeps a single audit timeline per project.
- Per FR-019, `audit_logs.entity_id` is a generic UUID (no FK) so rows are
  not cascade-deleted when a task is deleted. The retention behavior we
  need is the **default**; we just need to emit the final event explicitly.

**Alternatives considered**:

1. _New table `task_actuals_audit`_. Rejected: every audit consumer (Phase
   3 anti-gaming, exec dashboards, support tooling) would need to know
   about N tables instead of one. Schema duplication.
2. _Use a separate JSON event log (Kafka, outbox, etc.)_. Rejected: too
   heavy for the scale (low single-digit concurrent writers per project)
   and contradicts the existing pattern.

## R3 — Audit retention on task deletion

**Decision**: When a `ScheduleTask` is deleted:

1. The cascade from `Project → ScheduleTask` continues to remove the live
   task row including its `actual_start` / `actual_finish` / `progress_pct`
   values (FR-012).
2. **Before** the task row is deleted, the API path emits one
   `task.actuals.deleted` audit row capturing the last-known values in
   `payload.before` and a `null` `payload.after`. This is a service-layer
   guarantee, not a DB trigger — placing it in the deletion handler keeps
   the audit emission alongside the actor identity that the trigger would
   not have.
3. Existing audit rows are untouched — `audit_logs` has no FK to
   `schedule_tasks`, so they remain by default. FR-019 is satisfied.

**Rationale**: Spec FR-019 explicitly requires that audit entries survive
the task. The cascade FK lives between Project and ScheduleTask, not
between ScheduleTask and AuditLog, so retention is "free"; the only work
is to emit the deletion event.

**Alternatives considered**:

1. _DB trigger that fires on `BEFORE DELETE` on `schedule_tasks`_. Rejected:
   the trigger does not have access to the authenticated user identity —
   we would need session variables or `SET LOCAL`. Service-layer emission
   is the simpler, testable path.
2. _Soft-delete the task instead of hard-delete_. Rejected: out of scope;
   would change the entire schedule lifecycle for the sake of one feature.

## R4 — Auto-fill behavior

**Decision**: Auto-fill is enforced on the **server**, inside the same
transaction that performs the actuals UPDATE. The client mirrors the same
rule purely for UX (so the field shows the auto-filled value before the
network round-trip), but the server is the source of truth.

Rules (from FR-017):

```ts
function applyAutoFill(input, today) {
  let { progressPct, actualStart, actualFinish } = input;
  // % complete = 100 with no actual finish → set actual finish = today
  if (progressPct === 100 && actualFinish == null && input._userProvidedFinish !== true) {
    actualFinish = today;
  }
  // actual finish present with % < 100 → bump % to 100
  if (actualFinish != null && progressPct !== 100 && input._userProvidedPct !== true) {
    progressPct = 100;
  }
  return { progressPct, actualStart, actualFinish };
}
```

- The `_userProvidedFinish` / `_userProvidedPct` flags carry the
  "explicit user-entered value" semantics required by the second sentence
  of FR-017. They are derived from the request body: a field is "user
  provided" if it is present in the JSON payload (key existence, not just
  non-null value). Missing keys mean "not changed by this request".
- After auto-fill, the standard ordering check (FR-006) runs against the
  final values, not the raw input.
- The audit log "after" snapshot reflects the auto-filled values, per
  FR-017's third sentence.

**Rationale**: Server-side enforcement is the only way to honour the
guarantee in FR-017 across all clients (curl, future mobile, future
imports). Client mirroring is a UX nicety that costs ~10 lines.

**Alternatives considered**: Client-only rule (rejected — bypassed by
direct API calls); DB-level rule via trigger (rejected — too far from the
audit emission path).

## R5 — Validation

**Decision**: Three-layer validation on every actuals write:

| Layer    | Tool                              | Purpose                                                      |
| -------- | --------------------------------- | ------------------------------------------------------------ |
| Frontend | inspector field-level validation  | Immediate feedback per FR-005, FR-006; disable Save button   |
| API      | zod schema in `lib/validation.ts` | Reject malformed clients (curl, future SDKs)                 |
| DB       | `CHECK` constraints on columns    | Final defence; reject silently broken rows                   |

Constraints to enforce:

- `progress_pct BETWEEN 0 AND 100` (already implicit via SmallInt range,
  promoted to explicit CHECK)
- `actual_finish IS NULL OR actual_start IS NULL OR actual_finish >= actual_start`

The CHECK constraints are added as part of the same migration that adds
the new columns. The existing `progress_pct` column gains an explicit
CHECK if it does not already have one.

**Rationale**: Spec FR-005 explicitly bans clamping; rejection must be
explicit. SC-005 requires "100% of attempts" rejected; layered validation
ensures no path through the system can persist invalid data.

## R6 — Read-side permission scope

**Decision**: Read access to `progress_pct`, `actual_start`,
`actual_finish`, derived rollups, and the actuals audit log inherits from
project-read permission, identical to how `schedule_tasks` rows are
already read today (FR-018).

**Implementation notes**:

- The existing API surface for reading a task already returns
  `progress_pct`; we simply extend the DTO to include
  `actualStart`/`actualFinish`. Project-read RLS on `schedule_tasks`
  carries unchanged.
- The new `GET /tasks/:taskId/actuals/audit` endpoint authorizes via the
  same project-read check used by `GET /projects/:id` reads — joining
  `audit_logs` with `schedule_tasks` (and `schedule_tasks` to `projects`)
  to scope to the requesting user's accessible projects.
- Write authorization (FR-001) continues to require task-edit permission,
  inherited from the existing `PUT /projects/:id/snapshot` path.

**Alternatives considered**: New "actuals viewer" role (rejected — out of
scope per Q3 clarification); restricting actuals to task editors only
(rejected — would break parity with baseline visibility).

## R7 — UI placement

**Decision**: All three actuals fields (`% complete`, `actualStart`,
`actualFinish`) live inside the existing `TaskInspector`
(`src/components/inspector/TaskInspector.tsx`). They appear as a new
"Actuals" section directly under the existing "Start / Finish (computed)"
grid. No new page, no new modal, no separate save button (FR-002, FR-010).

**Layout**:

- The existing inspector renders three rows of `<Field label="…">` blocks
  (Name, Duration/Progress, Start/Finish). Insert a fourth labeled section
  named "Actuals" below the computed dates.
- For leaf tasks: three editable inputs (% complete, actual start, actual
  finish) in a 2-column grid, with the % field on its own row above the
  date pair. Empty inputs render the placeholder text "not yet recorded"
  (FR-009).
- For summary tasks: read-only display of the rolled-up values (US5,
  FR-011). Show a small lock icon + tooltip explaining "derived from
  children".
- Validation errors (FR-005, FR-006) render inline beneath the offending
  field in danger-faint background with the danger ink.

**Rationale**: Spec US2 + FR-002 are explicit: same panel, no separate
flow. Adding a fourth section preserves existing keyboard flow because
each field's `<input>` participates in the natural Tab order.

## R8 — Summary rollup math

**Decision**: Summary `% complete` is computed as

```
sum(child.percent_complete × child.planned_duration) /
  sum(child.planned_duration)
```

rounded to the nearest integer, **at render time** in the inspector and
the Gantt. Never persisted on the summary task row. Excludes summary
descendants from the iteration — only leaf descendants count, with their
planned durations as weights.

**Rationale**: Spec FR-011 + Q1 clarification (2026-05-09). Pre-computing
on save would require transactional rollup of the entire ancestor chain
on every leaf save, which violates the latency budget (R12) without any
read-side benefit — readers can do this in O(n_leaves) when they render.

**Implementation**:

- Add `computeRolledUpPercentComplete(rootId, tasks)` to
  `src/lib/progress.ts` next to the existing `computeSummaryProgress`. The
  existing helper appears to compute a different rollup (line 8 of
  TaskInspector imports `computeSummaryProgress`); keep the existing
  function unchanged and add the new one with explicit duration-weighting
  semantics.

## R9 — Summary rollup dates

**Decision**:

- Summary `actualStart` = `min(child.actualStart)` over children that have
  one. Null if no children have started.
- Summary `actualFinish` = `max(child.actualFinish)` over children **only
  if every leaf descendant has a non-null `actualFinish`**. Otherwise null
  (the summary is still in progress).

**Rationale**: Spec FR-011 + US5 acceptance scenarios 1–3. The "only if
all finished" rule mirrors how baseline finish is treated in 002 and
matches the schedule-engine "summary task is not done until all children
are done" semantics already in `engine/`.

## R10 — Three-track Gantt overlay rendering

**Decision**: Add a third lane to each task row alongside the existing
current bar (`TaskBar`) and baseline bar (`BaselineBar`). The actuals lane:

- Renders only when the task has at least one of `actualStart`,
  `actualFinish`, or `progressPct > 0` distinct from the planned (i.e.
  not just the implicit-progress mirror).
- Uses a **filled** bar treatment with the actuals color token
  (`--color-bar-actual`, defaults to a desaturated brand variant) and a
  small flag at the actual-finish edge if the task is finished.
- For in-progress tasks (actual start, no actual finish), the bar runs
  from `actualStart` to "today" (clipped at the visible range), with a
  hatched right edge to signal "still running".
- Variant rows (where actual differs visibly from current) inherit the
  002 `data-variance` attribute as a re-export so existing tests don't
  break; a new `data-actuals="present|absent"` attribute on the row gates
  CSS-only treatments.

**Rationale**: SC-009 ("three distinct visual tracks per task without
horizontal overflow on a 1280px viewport") is the binding constraint. Two
existing lanes are 22 px (current) + 10 px (baseline) inside a 28 px row;
adding a 6 px actuals stripe above the current bar fits without resizing
rows. Larger rows would violate the Gantt density spec implicit in 002.

**Alternatives considered**:

1. _Replace baseline with actuals when both exist_. Rejected — spec
   explicitly requires three coexisting tracks (US4, FR-015).
2. _Toggle: show actuals OR baseline_. Rejected — same reason.

## R11 — Concurrency

**Decision**: Last-write-wins. The actuals UPDATE statement is a single
SQL statement; no optimistic-concurrency token (`If-Match` etag,
`updatedAt` precondition) is checked.

**Rationale**: Spec edge case ("two PMs save actuals for the same task
within the same second. Last-write-wins is acceptable for this release;
conflict-detection is not required.") + spec assumption.

The audit log makes "who clobbered whom" visible after the fact, which is
sufficient for this release. Optimistic concurrency can be layered on
later by gating the write on `updated_at = ?`.

## R12 — Server-side latency target

**Decision**: p95 ≤ 500 ms for the actuals-save round trip on a project
of ≤500 tasks (SC-010).

**Implementation approach**:

- Single SQL statement: `UPDATE schedule_tasks SET … WHERE id = $1` plus
  `INSERT INTO audit_logs (…)`, both inside one `sql.begin(...)`.
- No reads of the wider project required for the write itself (the
  before-snapshot for the audit log is read in the same transaction at
  the start; this is one extra round-trip but stays well under the
  budget).
- The existing snapshot serializer (`loadSnapshot`) is **not** invoked on
  this path — actuals saves don't capture a baseline.
- No N+1 queries; no full task-tree fetch.

**Budget breakdown (target)**:

| Stage                                                       | Target  |
| ----------------------------------------------------------- | ------- |
| Auth + RLS evaluation                                       | < 30 ms |
| Read-before-update (one row)                                | < 30 ms |
| UPDATE schedule_tasks (one row)                             | < 50 ms |
| INSERT audit_logs                                           | < 30 ms |
| Network + serialization                                     | < 60 ms |
| Headroom for cold-start, contention, GC pauses              | < 300 ms|
| **Total (p95 target)**                                      | **≤ 500 ms** |

**Rationale**: SC-010 + Q4 clarification. Mirrors the 002 baseline-save
target so the test harness can be reused.

## R13 — Reading audit history

**Decision**: New endpoint
`GET /tasks/:taskId/actuals/audit?cursor=<ISO>&limit=<n>` returning rows
in `created_at DESC` order. Cursor pagination on `created_at`. Default
limit 50, max 200.

**Rationale**: FR-016 ("retrievable in chronological order on request").
A read-only endpoint scoped to a single task is the smallest possible
surface; ordering by `created_at DESC` matches "latest change first" UI
consumers and reverses cleanly when needed.

## R14 — Stable identity

**Decision**: `audit_logs.entity_id` stores the `schedule_tasks.id`
(UUID) for actuals events. The UUID is stable across renames, reparenting,
and inspector re-edits — same property used for baseline pairing in 002
(R6 of 002).

**Rationale**: FR-019 ("the task identifier on each retained entry remains
as a frozen historical reference") is satisfied because UUIDs are not
recycled.

## Open questions deferred to Phase 2 / Phase 3

- **EVM derivations** (PV, EV, AC, SPI, CPI, EAC, ETC, VAC) — Phase 2
  consumes actuals; out of scope for 003.
- **Optimistic concurrency on actuals saves** — Phase 3 if PM hostility
  tests show data loss is a real problem.
- **Live-sync of actuals** to other connected clients — Phase 3, same as
  baseline live-sync in 002.
- **Auto-derivation of % complete from time logs** — out of scope per
  spec assumptions; that is a Phase 2+ concern that depends on the
  timesheet feature not yet in flight.

## Outstanding NEEDS CLARIFICATION

None. The spec's eight Q/A clarifications (Sessions 2026-05-09 and
2026-05-10) cover all the previously-open shape questions. Technical
unknowns are resolved by R1–R14 above.
