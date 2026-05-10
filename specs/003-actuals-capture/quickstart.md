# Quickstart: Actuals Capture

**Feature**: 003-actuals-capture
**Audience**: Engineers picking up the Phase 2 task list, plus QA verifying
the user-visible behaviour.

This document is the runbook for taking the feature from "merged spec +
plan" to "shippable demo". It assumes `research.md`, `data-model.md`, and
`contracts/` have already been read. The Figma deep-links in `plan.md` are
the visual reference for every scene below.

## 1. Local environment prerequisites

You should already be set up for PrimePM development. If not:

```bash
# 1. Install Node deps
npm install

# 2. Start Supabase locally (provisions Postgres + Edge runtime)
supabase start

# 3. Apply existing migrations (includes 002 baselines)
npm run db:migrate:dev
```

Confirm `http://localhost:54321` (Supabase Studio) shows the existing
tables including `schedule_tasks`, `audit_logs`, and `schedule_baselines`.

## 2. Add the schema changes

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_task_actuals_and_audit_payload
```

Copy the SQL block from `data-model.md` ("SQL migration outline") into
`migration.sql`, then update `prisma/schema.prisma`:

- Add `actualStart DateTime? @map("actual_start") @db.Date` and
  `actualFinish DateTime? @map("actual_finish") @db.Date` to
  `ScheduleTask` (data-model.md §"Prisma model").
- Add `payload Json?` plus the new composite index to `AuditLog`.

Apply and regenerate:

```bash
npm run db:migrate:dev
npm run db:generate
```

Smoke tests:

```sql
-- expected: ok
UPDATE schedule_tasks
   SET progress_pct = 30,
       actual_start = '2026-05-04'
 WHERE id = (SELECT id FROM schedule_tasks LIMIT 1);

-- expected: ERROR — schedule_tasks_actuals_order
UPDATE schedule_tasks
   SET actual_start = '2026-05-10',
       actual_finish = '2026-05-04'
 WHERE id = (SELECT id FROM schedule_tasks LIMIT 1);

-- expected: ERROR — schedule_tasks_progress_pct_range
UPDATE schedule_tasks SET progress_pct = 150 WHERE id = ...;
```

## 3. Wire the API

Create the route file:

```
supabase/functions/api/routes/actuals.ts
```

It implements the three operations from
`contracts/actuals.openapi.yaml`:

- `GET  /tasks/:taskId/actuals`           → read snapshot
- `PUT  /tasks/:taskId/actuals`           → set/update with auto-fill
- `GET  /tasks/:taskId/actuals/audit`     → cursor-paginated history

Inside the PUT handler, the transactional shape (R12 budget):

```ts
// 1. await sql.begin(...) {
// 2.   const before = await readActuals(taskId);                 // 1 row
// 3.   const merged = applyAutoFill({...before, ...input}, today);
// 4.   validateRange(merged);                                    // FR-005, FR-006
// 5.   if (isSummary(taskId)) throw err422('summary_task_actuals');
// 6.   await sql`UPDATE schedule_tasks SET progress_pct = ${merged.progressPct}, actual_start = ${merged.actualStart}, actual_finish = ${merged.actualFinish}, updated_at = now() WHERE id = ${taskId}`;
// 7.   const auditId = await audit({
//        userId, action: pickAction(before, merged),             // .set | .update | .cleared
//        entityType: 'ScheduleTask', entityId: taskId,
//        payload: { before: before ?? null, after: merged },
//      });
// 8. }
```

`auditPayload` flows through the existing `audit_logs` insert helper —
extend `lib/audit.ts` to accept the optional `payload jsonb` parameter
(it already takes `userId/action/entityType/entityId`).

Add `lib/validation.ts` schemas:

```ts
export const actualsUpdateSchema = z.object({
  progressPct: z.number().int().min(0).max(100).optional(),
  actualStart: z.union([z.string().date(), z.null()]).optional(),
  actualFinish: z.union([z.string().date(), z.null()]).optional(),
}).strict();
```

Mount the routes in `supabase/functions/api/index.ts`:

```ts
import { actualsRoutes } from './routes/actuals.ts';
app.route('/', actualsRoutes);
```

### Task-deletion path (FR-019)

Find the existing `DELETE /tasks/:taskId` handler (or the schedule-save
path that issues task deletes). Before performing the delete, emit a
final audit row:

```ts
const before = await readActuals(taskId);
await audit({
  userId,
  action: 'task.actuals.deleted',
  entityType: 'ScheduleTask',
  entityId: taskId,
  payload: { before, after: null },
});
// ...then proceed with the delete; cascade removes the live row.
```

Verify with curl:

```bash
# Set first actuals (server records 'task.actuals.set')
curl -X PUT "$API/tasks/$TASK_ID/actuals" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"progressPct":30,"actualStart":"2026-05-04"}'

# Auto-fill: 100% with no actualFinish — server fills today
curl -X PUT "$API/tasks/$TASK_ID/actuals" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"progressPct":100}'
# → response.actualFinish = today's date, response.auditEntryId set

# Read history
curl "$API/tasks/$TASK_ID/actuals/audit" -H "Authorization: Bearer $TOKEN"

# Validation failure (FR-005)
curl -X PUT "$API/tasks/$TASK_ID/actuals" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"progressPct":150}'
# → 400 { error: "progress_pct_range" }
```

## 4. Wire the client API binding

Add to `src/api/types.ts`:

```ts
export interface ActualsSnapshotDto { /* see data-model.md */ }
export interface ActualsAuditEntryDto { /* see data-model.md */ }
```

Add to `src/api/client.ts`:

```ts
getActuals(taskId: string): Promise<ActualsSnapshotDto>
saveActuals(taskId: string, update: Partial<ActualsSnapshotDto>): Promise<ActualsSnapshotDto & { auditEntryId: string }>
listActualsAudit(taskId: string, cursor?: string, limit?: number): Promise<{ entries: ActualsAuditEntryDto[]; nextCursor: string | null }>
```

The PUT body should preserve **key existence** semantics (per the
contract): omit a field to mean "leave alone", send `null` to mean
"clear".

## 5. Extend the Zustand task slice

In `src/store/projectStore.ts`, the existing `Task` type already carries
`progressPct`. Add the two new optional ISO-date fields:

```ts
interface Task {
  // ...existing...
  progressPct: number;
  actualStart?: string;
  actualFinish?: string;
}
```

Add the new actions per `data-model.md` §"Frontend (Zustand) shape
additions":

- `updateActuals(taskId, partial)` — calls `saveActuals`, patches the
  local task in-place on success, surfaces validation errors via the
  existing toast/error channel.
- `loadActualsAudit(taskId)` — lazy; populates `audit: Map<taskId, AuditEntry[]>`.

`updateActuals` MUST NOT bypass the existing snapshot save's atomicity
guarantees: when the user blurs an inspector field that affects both
non-actuals (e.g. name) and actuals (e.g. % complete), the save still
goes through the existing project-snapshot save endpoint. Use the new
`PUT /tasks/:taskId/actuals` endpoint **only** for the case where the
inspector's only change is to actuals — in that case the smaller
endpoint hits the SC-010 latency target without an entire snapshot
round-trip.

## 6. Build the UI

### 6.1 Inspector

Edit `src/components/inspector/TaskInspector.tsx` to insert a new
"Actuals" section directly below the existing "Start (computed) / Finish
(computed)" grid (see `inspector-ui.contract.md` §3 for layout rules).

New components owned by this feature:

| Component                          | Path                                                          | Owns                                        |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `ActualsSection`                   | `src/components/inspector/ActualsSection.tsx`                 | The 3-field block + auto-fill UX echo       |
| `ActualsAuditPanel`                | `src/components/inspector/ActualsAuditPanel.tsx`              | Slide-in audit drawer                       |
| `ActualsBar`                       | `src/components/gantt/ActualsBar.tsx`                         | The third lane on the Gantt row             |

The `ActualsSection` reuses the existing `<Field label="…">` block and
the existing `ProgressField` input pattern. New `DateField` component
(or inline `<input type="date">`) provides the actual-start/actual-finish
inputs.

### 6.2 Gantt three-track row

Edit `src/components/gantt/GanttChart.tsx`:

- Render `<ActualsBar>` for each row, keyed `actuals-${task.id}`,
  positioned per the lane rules in `inspector-ui.contract.md` §4.
- Set `data-actuals` and `data-actuals-state` attributes on the row /
  bar containers.

`TaskBar.tsx` itself does not need to change: the actuals lane sits
above the current bar and does not occlude it. The 002 baseline lane
remains where it is (below).

### 6.3 Summary rollups

Add `computeRolledUpActuals(rootId, tasks)` to `src/lib/progress.ts`:

```ts
export function computeRolledUpActuals(
  rootId: string,
  tasks: Map<string, Task>,
): {
  rolledUpProgressPct: number | null;
  earliestActualStart: string | null;
  latestActualFinish: string | null;
}
```

Implement per R8/R9 (duration-weighted % complete; min start; max finish
only-if-all-finished). Use it in the inspector for summary tasks
(US5 AS3 / FR-011).

## 7. Tests to write (red-green)

| Layer        | Test file                                                                                | Asserts                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Unit         | `src/lib/__tests__/progress.actuals.test.ts`                                             | Duration-weighted rollup; min start; max finish only-if-all-finished                              |
| Unit         | `src/components/inspector/__tests__/actuals.test.tsx`                                    | Empty placeholder; auto-fill UX echo; validation error inline; summary task read-only              |
| Unit         | `src/components/gantt/__tests__/actualsOverlay.test.tsx`                                 | Three-lane geometry; in-progress hatched edge; finished flag; no-actuals → no third lane          |
| Unit         | `src/store/__tests__/actualsSlice.test.ts`                                               | `updateActuals` patches in-place; `loadActualsAudit` is memoised                                   |
| Integration  | `supabase/functions/api/__tests__/actuals.test.ts` (new)                                 | PUT round-trip; auto-fill in both directions; validation rejections; summary 422; audit row written |
| Integration  | `supabase/functions/api/__tests__/actuals.delete.test.ts` (new)                          | Task delete emits final `task.actuals.deleted`; existing audit rows survive                        |
| Integration  | `src/api/__tests__/client.actuals.test.ts` (new)                                         | Round-trip PUT → GET → audit list                                                                  |
| Performance  | `supabase/functions/api/__tests__/actuals.perf.test.ts` (new)                            | p95 ≤ 500 ms on 500-task project (SC-010)                                                          |
| UI           | `src/components/inspector/__tests__/ActualsAuditPanel.test.tsx`                          | Newest-first ordering; before/after diff highlight; "load more" cursor; deleted-task header        |

## 8. Manual acceptance walkthrough (mirrors spec User Stories)

### US1 — PM records actual progress

1. Open a project with at least one started task and no actuals.
2. Select a task. The inspector shows the new "Actuals" section with
   three empty fields labelled "% complete", "Actual start", "Actual
   finish". Empty date inputs read "not yet recorded".
3. Type `30` into "% complete" → blur. The progress bar in the inspector
   updates; the Gantt row keeps its existing current bar unchanged.
4. Type `2026-05-04` into "Actual start" → blur. The Gantt row now shows
   a third bar (the actuals lane) starting at 2026-05-04.
5. Reload. All three values persist; planned start/finish unchanged.

### US2 — In the existing inspector

1. Confirm there is no separate "Actuals" navigation step or modal —
   actuals fields are in the same panel as Name/Duration/Progress.
2. Confirm Tab order moves naturally through Name → Duration →
   Progress → Actuals % → Actuals start → Actuals finish → Notes.

### US3 — Validation rejections

1. Enter `% complete = 150` → blur. Inline error appears under the
   field; previous value is NOT replaced; save is suppressed.
2. Enter `% complete = -10` → blur. Same behavior.
3. Enter `actualStart = 2026-05-10`, `actualFinish = 2026-05-04` → blur
   on the finish field. Inline error appears under `actualFinish`.
4. Correct each value → save proceeds atomically.

### US4 — Side-by-side baseline / scheduled / actual

1. Open a project that has both a v0 baseline (002) and actuals on the
   same task.
2. Inspector shows three rows of dates: baseline (from 002), scheduled
   (current), and actual.
3. Gantt shows three lanes per row: baseline (below), current (middle),
   actuals (above). Use a 1280-wide viewport to confirm no horizontal
   overflow (SC-009).

### US5 — Summary rollup

1. Build a summary task with three children: child A duration 5d / 100% / finished;
   child B duration 5d / 50% / in-progress; child C duration 10d / 0%.
2. Select the summary. Inspector shows actuals as read-only:
   - `% complete = round((100·5 + 50·5 + 0·10) / (5+5+10)) = 38%`
   - `Actual start = min(A.start, B.start)` (C has no start)
   - `Actual finish = —` (not all children finished)
3. Try to type into the summary's actuals fields → no effect.

### Audit log (FR-016, FR-019)

1. After the changes above, click the "history" button in the inspector's
   Actuals section header. The audit panel opens, showing entries
   newest-first.
2. Each entry shows actor, time-ago, and a before/after diff with
   changed fields highlighted.
3. Delete the task. Reopen the audit panel from the project history
   view (or via direct API). The trailing `task.actuals.deleted` entry
   is present; previous entries are intact.

## 9. Definition of done

- All Functional Requirements (FR-001…FR-019) ticked off in the PR
  description with the test or file that satisfies each.
- All Success Criteria (SC-001…SC-010) checked manually on at least 3
  test projects and via the integration / perf test suite.
- The Gantt for a project with zero actuals is byte-identical to the
  pre-feature version (smoke-tested by visual diff against a 002-only
  baseline).
- The audit panel renders correctly for a deleted task (FR-019
  scenario), verified manually.
- `npm run test:run` is green; `npm run build` is green; SC-010 perf
  test passes locally and in CI.
- The 002 baseline overlay continues to render correctly on the same
  Gantt row that now also has an actuals lane (no regression).
