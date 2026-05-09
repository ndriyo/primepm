# Quickstart: Schedule Baseline & Tracking Gantt Overlay

**Feature**: 002-schedule-baseline-tracking-overlay
**Audience**: Engineers picking up the Phase 2 task list, plus QA verifying
the user-visible behaviour.

This document is the runbook for taking the feature from "merged spec + plan"
to "shippable demo". It assumes `research.md`, `data-model.md`, and
`contracts/` have already been read.

## 1. Local environment prerequisites

You should already be set up for PrimePM development. If not:

```bash
# 1. Install Node deps
npm install

# 2. Start Supabase locally (provisions Postgres + Edge runtime)
supabase start

# 3. Apply existing migrations
npm run db:migrate:dev
```

Confirm `http://localhost:54321` (Supabase Studio) shows the existing tables
including `schedule_tasks`.

## 2. Add the new database table

```bash
# Create migration scaffold
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_schedule_baselines
```

Copy the SQL block from `data-model.md` ("SQL migration outline") into the
new `migration.sql`. Then update `prisma/schema.prisma` with the
`ScheduleBaseline` model (also in `data-model.md`).

```bash
# Apply the migration locally
npm run db:migrate:dev

# Regenerate the Prisma client
npm run db:generate
```

Smoke test that the table exists and that an UPDATE is rejected:

```sql
-- expected: ok
INSERT INTO schedule_baselines (project_id, version_label, version_index, rationale, payload, created_by)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  'v0', 0, 'smoke test', '{}'::jsonb,
  (SELECT id FROM users LIMIT 1)
);

-- expected: ERROR — schedule_baselines is append-only
UPDATE schedule_baselines SET rationale = 'changed' WHERE version_label = 'v0';
```

## 3. Wire the API

Create the route file:

```
supabase/functions/api/routes/baselines.ts
```

It must implement the three operations from
`contracts/baselines.openapi.yaml`:

- `GET /projects/:projectId/baselines` → list headers
- `POST /projects/:projectId/baselines` → capture new baseline
- `GET /projects/:projectId/baselines/:baselineId` → fetch full payload

Reuse the existing snapshot serialiser:

```ts
import { loadSnapshot } from '../sql/snapshot.ts';

// inside the POST handler, all in one transaction:
//   1. await sql.begin(...) {
//   2.   const versionIndex = SELECT COUNT(*) FROM schedule_baselines WHERE project_id = ?
//   3.   const payload = await loadSnapshot(projectId);
//   4.   INSERT INTO schedule_baselines (...) VALUES (...);
//   5.   await audit(userId, 'baseline.set', 'ScheduleBaseline', baselineId);
//   6. }
```

Mount the routes in `supabase/functions/api/index.ts`:

```ts
import { baselineRoutes } from './routes/baselines.ts';
app.route('/', baselineRoutes);
```

Verify with curl (substitute a real auth header / project id):

```bash
# Capture baseline v0
curl -X POST "$API/projects/$PROJECT_ID/baselines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rationale":"Approved by steering committee 2026-05-08"}'

# Expect 201 + { id, projectId, versionLabel: "v0", versionIndex: 0, ... }

# List
curl "$API/projects/$PROJECT_ID/baselines" -H "Authorization: Bearer $TOKEN"

# Try to set with empty rationale
curl -X POST "$API/projects/$PROJECT_ID/baselines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rationale":""}'
# Expect 400 with error: "rationale_required"
```

## 4. Wire the client API binding

Add to `src/api/types.ts`:

```ts
export interface BaselineHeaderDto { /* see data-model.md */ }
export interface BaselinePayloadDto { /* see data-model.md */ }
```

Add to `src/api/client.ts`:

```ts
listBaselines(projectId: string): Promise<BaselineHeaderDto[]>
getBaseline(projectId: string, baselineId: string): Promise<BaselineHeaderDto & { payload: BaselinePayloadDto }>
setBaseline(projectId: string, rationale: string): Promise<BaselineHeaderDto>
```

## 5. Add the Zustand baseline slice

Extend `src/store/projectStore.ts` with the `BaselineSlice` and
`BaselineActions` shapes from `data-model.md`. The active baseline reference
is **session-scoped** — do not persist it via `persistence.ts`.

`loadBaselineHeaders` should run on `loadProject` if the project has any
baselines (it can be called unconditionally — the API returns `[]` for
projects with none).

## 6. Build the UI

Three new components:

| Component                          | Path                                                        | Owns                                              |
| ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `SetBaselineDialog`                | `src/components/gantt/SetBaselineDialog.tsx`                | Confirmation modal + rationale capture            |
| `BaselineVersionSelector`          | `src/components/gantt/BaselineVersionSelector.tsx`          | Header dropdown for active baseline               |
| `BaselineBar` (or `TaskBar` fork)  | `src/components/gantt/BaselineBar.tsx`                      | The secondary bar drawn behind the current bar    |

Wire them per the rules in `contracts/overlay-ui.contract.md`. Important
things to get right:

- The Confirm button stays disabled while rationale is empty/whitespace.
- The selector is hidden when there is at most one baseline.
- `data-variance="true"` is set on variant rows so tests can assert without
  pinning to colour values.

## 7. Tests to write (red-green)

| Layer        | Test file                                                                        | Asserts                                                                                |
| ------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Unit         | `src/components/gantt/__tests__/overlay.test.tsx`                                | Pairing rules; variance threshold (`= 1` not variant, `> 1` variant); added/removed   |
| Unit         | `src/store/__tests__/baselineSlice.test.ts`                                      | `loadBaselinePayload` is memoised; `activeBaselineRef = 'latest'` resolves correctly  |
| Integration  | `supabase/functions/api/__tests__/baselines.test.ts` (new)                       | POST creates row; rationale required; immutability trigger fires; audit row written   |
| Integration  | `src/api/__tests__/client.baselines.test.ts` (new)                               | Round-trip POST → GET list → GET payload                                              |
| UI           | `src/components/gantt/__tests__/SetBaselineDialog.test.tsx`                      | Confirm disabled until rationale; submit calls `setBaseline` with trimmed value       |
| Performance  | `src/components/gantt/__tests__/overlay.perf.test.tsx`                           | 100 tasks: switch active baseline → re-render under 1 s (SC-005)                      |

## 8. Manual acceptance walkthrough (mirrors spec User Stories)

US1 — Set v0:

1. Open a project that has tasks but no baselines.
2. Confirm the Gantt looks unchanged (no overlay, no version selector).
3. Click "Set baseline". Try Confirm with empty rationale → button is disabled.
4. Type "Approved by steering committee 2026-05-08" → Confirm enabled → click.
5. Reload the project. Open the Gantt. The overlay now appears.

US2 — Tracking overlay:

1. Modify several tasks (drag dates, change durations).
2. Open the Gantt. Tasks whose start/finish drifted by > 1 day show a
   variance treatment; tasks within ±1 day do not.
3. Add a new task → it shows as "added since baseline" (+ badge, no
   baseline bar).
4. Delete a task that existed at v0 → it appears as a baseline-only bar
   marked "removed since baseline".

US3 — Rebaseline:

1. Click "Set baseline" again with a different rationale → v1 is created;
   v0 still retrievable via `GET /projects/:id/baselines/:v0Id`.

US4 — Switch reference:

1. With v0 and v1 both present, the version selector becomes visible in
   the Gantt header.
2. Switch from "latest" to "v0" → overlay re-renders within 1 s; values
   match spec.

US5 — Audit:

1. Open the database (Supabase Studio) and inspect `audit_logs` — there
   should be a row per baseline-set with `action = 'baseline.set'`.

## 9. Definition of done

- All Functional Requirements (FR-001…FR-018) ticked off in the PR
  description with the test or file that satisfies each.
- All Success Criteria (SC-001…SC-008) checked manually on at least 5
  test projects.
- The Gantt for a project with zero baselines is byte-identical to the
  pre-feature version (smoke-tested by visual diff).
- `npm run test:run` is green; `npm run build` is green.
