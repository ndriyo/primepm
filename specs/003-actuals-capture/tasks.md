---
description: "Task list for feature 003 — Actuals Capture (% complete, actual start, actual finish per task + audit log + tracking Gantt third lane)"
---

# Tasks: Actuals Capture

**Input**: Design documents from `/specs/003-actuals-capture/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/actuals.openapi.yaml`, `contracts/inspector-ui.contract.md`

> **Revision log** — 2026-05-10: applied remediation from `/speckit.analyze` round 1.
> - **C1** (CRITICAL): FR-013 ↔ 002 `BaselineTask.progressPct` reconciled per spec.md §"Clarifications" → 2026-05-10 Q6. The baseline is conceptually planned-schedule only; `progressPct` is a convenience-copy in the snapshot. Tightened FR-013 wording in `spec.md`; rewrote the FR-004/FR-013 paragraph in `plan.md §"Constraints"`.
> - **H1** (HIGH): added T011a — SC-004 byte-identity test (v0 payload unchanged after actuals PUT).
> - **C1 follow-up**: added T011b — defensive test that `actualStart`/`actualFinish` never appear in any baseline payload, even when the source task has them set.
> - **L1** (LOW): T024's `appendAuditEntry` timing pinned: post-server-success, not optimistic.
> - **M2** (MED): T010 file path pinned: `loadProject` action in `src/store/projectStore.ts`.
> - **M4**: false positive on first read — T015 already tests `GET /tasks/:taskId/actuals/audit` for project-read users; no edit needed.
> - **M3**: out of scope (constitution is unmodified template; recommend `/speckit.constitution` separately).

**Tests**: Test tasks **are included**. The spec's User Stories define
acceptance scenarios that must be observable, and `quickstart.md §7`
explicitly enumerates a red-green test suite (progress unit, inspector
unit, actuals-overlay unit, actuals slice unit, Edge integration,
delete-path integration, client API integration, audit-panel UI, and a
performance gate for SC-010). Independence of each user story is verified
by these tests.

**Organization**: Tasks are grouped by user story (US1–US5) so each story
can be implemented and verified independently. Each phase ends with a
checkpoint that maps directly to the spec's "Independent Test" criterion
for that story. The cross-cutting Audit log (FR-016 + FR-019) and
auto-fill (FR-017) land inside US1 because they fire on every actuals
write; the audit **drawer** UI is in Phase 8 polish since it consumes the
data US1 already produces.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- All file paths are absolute under the repo root.

## Path conventions (from `plan.md`)

- Backend (Edge): `supabase/functions/api/**`
- Frontend: `src/**` (Vite + React 19 + Zustand 5)
- Database: `prisma/schema.prisma` + `prisma/migrations/<timestamp>_add_task_actuals_and_audit_payload/`
- Tests live next to code under `__tests__/` (project convention).
- Visual reference: Figma scenes A–H linked from `plan.md §"Design references"`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding that does not by itself enable a user story but is required before anyone touches DB, backend, or the new color token.

- [ ] T001 Create migration directory `prisma/migrations/<timestamp>_add_task_actuals_and_audit_payload/` and an empty `migration.sql` placeholder for Phase 2 to populate (`quickstart.md §2`).
- [ ] T002 [P] Add the two new actuals columns and the audit `payload` column to `prisma/schema.prisma`:
  - `ScheduleTask` gains `actualStart DateTime? @map("actual_start") @db.Date` and `actualFinish DateTime? @map("actual_finish") @db.Date` (after the existing `progressPct` line).
  - `AuditLog` gains `payload Json?` plus `@@index([entityType, entityId, createdAt(sort: Desc)], map: "audit_logs_entity_recent_idx")`.
  Match the wording in `data-model.md` §"Prisma model".
- [ ] T003 [P] Run `npm run db:generate` so the regenerated Prisma client picks up the two new fields and the index — workflow checkpoint, no code change yet.
- [ ] T004 [P] Add the new color token to `src/styles/pp-tokens.css`: `--color-bar-actual: #16A34A;` and `--color-bar-actual-faint: #DCFCE7;`. Add a one-line comment `/* Spec 003 — actuals lane (matches DS RAG green) */`. No other styles change.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB columns + CHECK constraints + audit payload column + zod boundary + DTOs + audit helper. Until this phase is complete, no user story work can run end-to-end.

**⚠️ CRITICAL**: No US1–US5 task may start until Phase 2 is checkpointed.

- [ ] T005 Populate `prisma/migrations/<timestamp>_add_task_actuals_and_audit_payload/migration.sql` with the SQL from `data-model.md` §"SQL migration outline":
  - `ALTER TABLE schedule_tasks ADD COLUMN actual_start date NULL, ADD COLUMN actual_finish date NULL;`
  - `ALTER TABLE schedule_tasks ADD CONSTRAINT schedule_tasks_progress_pct_range CHECK (progress_pct BETWEEN 0 AND 100);`
  - `ALTER TABLE schedule_tasks ADD CONSTRAINT schedule_tasks_actuals_order CHECK (actual_finish IS NULL OR actual_start IS NULL OR actual_finish >= actual_start);`
  - `ALTER TABLE audit_logs ADD COLUMN payload jsonb NULL;`
  - `CREATE INDEX audit_logs_entity_recent_idx ON audit_logs (entity_type, entity_id, created_at DESC);`
- [ ] T006 Apply the migration locally with `npm run db:migrate:dev` and run the smoke SQL from `quickstart.md §2`: a valid actuals UPDATE succeeds; an out-of-order actuals UPDATE returns the `schedule_tasks_actuals_order` CHECK error; a `progress_pct = 150` UPDATE returns the `schedule_tasks_progress_pct_range` CHECK error.
- [ ] T007 [P] Extend `supabase/functions/api/lib/audit.ts` so the existing `audit(...)` helper accepts an optional `payload?: unknown` argument. Persist it as `payload jsonb` on `audit_logs`. Existing callers (e.g. `baseline.set` in 002) keep passing no payload; the column stays NULL for those rows — no behavioral change for 002.
- [ ] T008 [P] Add `actualsUpdateSchema` (zod) to `supabase/functions/api/lib/validation.ts`:
  ```ts
  export const actualsUpdateSchema = z.object({
    progressPct:  z.number().int().min(0).max(100).optional(),
    actualStart:  z.union([z.string().date(), z.null()]).optional(),
    actualFinish: z.union([z.string().date(), z.null()]).optional(),
  }).strict();
  ```
  Strict so unknown keys are rejected (matches contract). Also export a small helper `pickProvidedKeys(body)` that returns the set of keys present on `body` (for the FR-017 "user provided" rule per `research.md` §R4).
- [ ] T009 [P] Hand-mirror `ActualsSnapshotDto`, `ActualsUpdateDto`, `ActualsSaveResponseDto`, and `ActualsAuditEntryDto` into `src/api/types.ts` matching the schemas in `contracts/actuals.openapi.yaml` exactly. Add a `// SOURCE: contracts/actuals.openapi.yaml` comment at the top of the new block. Add a Vitest type-level test in `src/api/__tests__/types.actuals.test.ts` that imports the DTOs and a literal mock built from the OpenAPI examples to fail at compile time on drift (mirrors the 002 T053 pattern).
- [ ] T010 [P] Extend the existing `Task` interface in `src/store/projectStore.ts` with two optional ISO-date fields: `actualStart?: string` and `actualFinish?: string`. Update the snapshot deserializer in `src/store/projectStore.ts` (the `loadProject` action — the same function that already hydrates `progressPct`, `manualStart`, etc. from the snapshot DTO) to pass `actualStart` / `actualFinish` through unchanged when present in the response, and to leave them `undefined` when absent. **No new actions yet** — that's US1.

**Checkpoint**: Migration applied; CHECK constraints fire; `audit()` accepts a payload; zod schema and frontend DTOs compile; `Task` carries the new optional fields. US1–US5 may now proceed in parallel.

---

## Phase 3: User Story 1 — PM records actuals on a task (Priority: P1) 🎯 MVP

**Goal**: A PM can save `% complete`, `actual start`, and `actual finish` on a task. The values persist independently of the planned schedule and any baseline. Every save produces one append-only audit row. The auto-fill rule (FR-017) and the audit retention on task deletion (FR-019) are both wired.

**Independent Test** (from `spec.md` US1): Open a task, enter `progressPct = 50, actualStart = today−7d`, leave actualFinish empty, save. Reload — values persist. Modify the planned start/finish — actuals are unchanged. If the project has a v0 baseline (002), the v0 row remains byte-for-byte unchanged.

### Tests for User Story 1 (write FIRST, ensure they FAIL before implementation)

- [ ] T011 [P] [US1] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts`: `PUT /tasks/:taskId/actuals` with `{ progressPct: 30, actualStart: '2026-05-04' }` returns 200 with the persisted snapshot and a non-null `auditEntryId`; the `schedule_tasks` row has `progress_pct = 30`, `actual_start = '2026-05-04'`, `actual_finish IS NULL`; the row's planned columns (`duration_days`, `manual_start`, `constraint_*`) are unchanged byte-for-byte (FR-001, FR-003). Note: `progress_pct` is intentionally excluded from the unchanged-list because it is one of the three actuals fields (FR-001) — see `spec.md` §"Clarifications" → 2026-05-10 Q6.
- [ ] T011a [P] [US1] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts` — **SC-004 byte-identity**: on a project with a v0 baseline (002) already set, capture `SELECT payload FROM schedule_baselines WHERE id = $v0Id` before and after a successful PUT to actuals on any task. Assert the two JSONB values are deeply equal (no key change, no value change, including the `progressPct` convenience-copy frozen at v0 capture time — it must not retroactively reflect later actuals edits). FR-004 + FR-013 + SC-004.
- [ ] T011b [P] [US1] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts` — **FR-013 baseline scope (defensive)**: with the new actuals fields populated on at least one task (`progress_pct = 60, actual_start = '2026-05-04', actual_finish IS NULL`), call `POST /projects/:projectId/baselines` (the 002 endpoint) and inspect the resulting `schedule_baselines.payload.tasks[]`. Assert that **no task object** contains an `actualStart` or `actualFinish` key — neither as a real value nor as `null`. (`progressPct` IS allowed and expected as a convenience-copy of latest data per `spec.md` §"Clarifications" → 2026-05-10 Q6.) Pin this so a future change to `loadSnapshot()` cannot silently leak the new columns into the baseline payload.
- [ ] T012 [P] [US1] Edge integration test in the same file — auto-fill (FR-017) in both directions:
  - Subtest A: existing row with `progress_pct = 30, actual_finish IS NULL`. PUT body `{ progressPct: 100 }` (no `actualFinish` key). Response has `actualFinish = today` (server-computed), DB row matches. Audit `payload.after.actualFinish` equals today.
  - Subtest B: existing row with `progress_pct = 50, actual_finish IS NULL`. PUT body `{ actualFinish: '2026-05-09' }` (no `progressPct` key). Response has `progressPct = 100`. Audit `payload.after.progressPct = 100`.
  - Subtest C (override-protect): existing row with `progress_pct = 30`. PUT body `{ progressPct: 100, actualFinish: '2026-05-09' }` (both keys explicit). Server stores both as-given (no further auto-bump). Audit reflects the explicit values.
- [ ] T013 [P] [US1] Edge integration test in the same file — audit emission (FR-016): every successful PUT writes exactly one `audit_logs` row in the same transaction with `entityType = 'ScheduleTask'`, `entityId = <taskId>`, `userId = <jwt sub>`, and `payload = { before, after }` where `before` is null on first set and a snapshot otherwise. Action string is `task.actuals.set` (first save), `task.actuals.update` (subsequent), `task.actuals.cleared` (all-NULL transition).
- [ ] T014 [P] [US1] Edge integration test in `supabase/functions/api/__tests__/actuals.delete.test.ts` — task-deletion retention (FR-019): create a task, save actuals (one `set`, one `update` row), then delete the task via the existing `DELETE /tasks/:taskId` route. Assertions:
  - The two prior audit rows still exist with `entityId = <deletedTaskId>`.
  - One new audit row exists with `action = 'task.actuals.deleted'`, `entityType = 'ScheduleTask'`, `entityId = <deletedTaskId>`, `payload.before` carries the last-known snapshot, `payload.after = null`.
  - The `schedule_tasks` row is gone (cascade or the route's own delete).
  - `GET /tasks/:taskId/actuals/audit` still returns all three entries chronologically.
- [ ] T015 [P] [US1] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts` — read scope (FR-018): a user with project-read but NOT task-edit permission can `GET /tasks/:taskId/actuals` and `GET /tasks/:taskId/actuals/audit` (200 in both cases) but receives 403 on PUT. A user without project-read receives 403 on all three. Pair with a positive test using a permitted PM caller.
- [ ] T016 [P] [US1] Client API tests in `src/api/__tests__/client.actuals.test.ts`: `getActuals(taskId)` parses 200 → `ActualsSnapshotDto`; `saveActuals(taskId, partial)` POSTs JSON preserving **key existence** (omitting a field MUST omit the key, not send `null`); response parses to `ActualsSnapshotDto & { auditEntryId }`; `listActualsAudit(taskId, cursor?, limit?)` parses the entries array and `nextCursor` correctly. Errors propagate with the `error` code intact.
- [ ] T017 [P] [US1] Store unit test in `src/store/__tests__/actualsSlice.test.ts`: `updateActuals(taskId, partial)` calls `saveActuals` with the same partial, and on success patches the in-store `Task` (`actualStart`, `actualFinish`, `progressPct`) **including the auto-filled values returned by the server** — i.e., the local task reflects what the server resolved, not what the client sent.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement the route file `supabase/functions/api/routes/actuals.ts` with `GET /tasks/:taskId/actuals`, `PUT /tasks/:taskId/actuals`, and `GET /tasks/:taskId/actuals/audit` per `contracts/actuals.openapi.yaml`. The PUT handler shape (per `quickstart.md §3`):
  1. `await sql.begin(async sql => { ... })` opens the transaction.
  2. `const before = await readActuals(taskId)` — single SELECT.
  3. `const provided = pickProvidedKeys(body)` (from T008's helper).
  4. `const merged = applyAutoFill({ ...before, ...body }, today, provided)` — see T019.
  5. `validateRange(merged)` — throws 400 `progress_pct_range` / `actuals_order` per FR-005 / FR-006 (CHECK constraints are the safety net; this is the friendly error path).
  6. `if (await isSummaryTask(taskId, sql)) throw err422('summary_task_actuals')` (FR-011 / contract 422).
  7. `await sql\`UPDATE schedule_tasks SET progress_pct=${merged.progressPct}, actual_start=${merged.actualStart}, actual_finish=${merged.actualFinish}, updated_at=now() WHERE id=${taskId}\``.
  8. `const auditId = await audit({ userId, action: pickAction(before, merged), entityType: 'ScheduleTask', entityId: taskId, payload: { before, after: merged } }, sql)` — uses T007's extended helper, threaded through the same `sql` instance to stay in-transaction.
- [ ] T019 [P] [US1] Implement `applyAutoFill(input, today, providedKeys)` as a small pure module `supabase/functions/api/lib/actualsAutoFill.ts` per `research.md §R4`:
  - If `merged.progressPct === 100` AND `actualFinish == null` AND `!providedKeys.has('actualFinish')` → set `actualFinish = today` (ISO string).
  - If `merged.actualFinish != null` AND `merged.progressPct < 100` AND `!providedKeys.has('progressPct')` → set `progressPct = 100`.
  - Return the merged snapshot. Pure function, no I/O. Unit test inline beside the file in `actualsAutoFill.test.ts` covering the three FR-017 subtests in T012.
- [ ] T020 [P] [US1] Implement `pickAction(before, after)` in the same `actualsAutoFill.ts` module:
  - `before == null` (no row before) OR `before` is all-default (`progressPct=0, actualStart=null, actualFinish=null`) and `after` is non-default → `'task.actuals.set'`.
  - `after` is all-default and `before` was non-default → `'task.actuals.cleared'`.
  - Otherwise → `'task.actuals.update'`.
  Unit test in the same `*.test.ts`.
- [ ] T021 [US1] Mount the new router from `supabase/functions/api/index.ts`: `app.route('/', actualsRoutes)`; export `actualsRoutes` from `routes/actuals.ts` (depends on T018).
- [ ] T022 [US1] Extend the existing task-delete handler in `supabase/functions/api/routes/tasks.ts` (the `DELETE /tasks/:taskId` route) to emit the FR-019 final audit event before issuing the delete. Inside the same transaction:
  1. `const before = await readActuals(taskId)` (skip if the task has no actuals row at all — i.e., never set).
  2. `await audit({ userId, action: 'task.actuals.deleted', entityType: 'ScheduleTask', entityId: taskId, payload: { before, after: null } }, sql)`.
  3. Then proceed with the existing delete (cascade removes the task row; `audit_logs` rows are not cascaded — `data-model.md §"Relationship to existing models"`).
  Inline comment referencing FR-019.
- [ ] T023 [P] [US1] Implement `getActuals(taskId)`, `saveActuals(taskId, partial)`, and `listActualsAudit(taskId, cursor?, limit?)` in `src/api/client.ts` returning the DTOs from T009. **Critical**: in `saveActuals`, build the JSON body by walking `Object.keys(partial)` so omitted keys are NOT serialized to `null`; only explicit `null` values become JSON `null` (preserves the FR-017 "user provided = key existence" semantics).
- [ ] T024 [US1] Add the actuals slice to `src/store/projectStore.ts`:
  - State: `audit: Map<string, AuditEntry[]>` keyed by `taskId`.
  - Action: `updateActuals(taskId, partial)` — calls `saveActuals`, on success patches the local task in-place (per T017) using Immer, and surfaces validation errors via the existing toast/error channel.
  - Action: `loadActualsAudit(taskId)` — lazy fetch; populates the audit map; memoised (no refetch if already populated for that taskId during the session).
  - Action: `appendAuditEntry(entry)` — called by `updateActuals` **after** `saveActuals` resolves successfully, using the `auditEntryId` returned by the server as the local entry's id. This is post-server-success, NOT optimistic-pre-server: on rejection no entry is appended, and the inspector's inline error is the only user-visible signal. The drawer reflects the edit without a re-fetch.

**Checkpoint US1**: Tests T011–T017 pass; manually walking `quickstart.md §8 US1` succeeds. The MVP demo ("PM saves actuals on a task; values persist; planned + baseline untouched; one audit row written; auto-fill works in both directions; deletion preserves history") is shippable here.

---

## Phase 4: User Story 2 — Inspector placement (Priority: P1)

**Goal**: The three actuals fields appear inside the existing `TaskInspector` panel — same panel as Name/Duration/Progress — with no separate save button. Tab order is uninterrupted. The Save fires from the same atomic save path the inspector already uses.

**Independent Test** (from `spec.md` US2): Open the task inspector on any task; confirm the new "Actuals" section appears immediately below the existing "Start (computed) / Finish (computed)" grid; confirm Tab moves through Name → Duration → Progress → Actuals % → Actual start → Actual finish → Notes without leaving the panel; confirm a single Save commits both task fields and actuals fields.

### Tests for User Story 2

- [ ] T025 [P] [US2] UI test in `src/components/inspector/__tests__/actuals.test.tsx` — placement: rendering the inspector for a leaf task shows an "Actuals" section header **directly below** the "Start (computed) / Finish (computed)" two-col grid (assert by DOM order). The empty state shows three fields labelled "% complete", "Actual start", "Actual finish" with the placeholder text "not yet recorded" on both date inputs (FR-009).
- [ ] T026 [P] [US2] UI test in the same file — Tab order: focusing the Name input then pressing Tab eight times reaches Notes. The intermediate focus order matches: Name → Duration → Progress → Actuals % → Actual start → Actual finish → Notes (FR-002, US2 AS2). Use `userEvent.tab()` from `@testing-library/user-event`.
- [ ] T027 [P] [US2] UI test in the same file — atomic save: typing into both `Name` and `% complete` then pressing the existing Done button or blurring fires **one** `updateTask` call that includes both fields' new values (FR-010, US2 AS3). Assert the call payload using a spy on the store.

### Implementation for User Story 2

- [ ] T028 [P] [US2] Implement `src/components/inspector/ActualsSection.tsx` per `contracts/inspector-ui.contract.md` §3 and matching Figma Scene A (`plan.md §"Design references"`). Props: `{ task, isLeaf, validationErrors, pending, onChange }`. Renders three field rows (% complete full-width, then Actual start | Actual finish in a 2-col grid). Each input uses the existing inspector field treatment (`bg-(--color-surface-2)`, `cornerRadius` 8). The section header has a small green dot and the `ACTUALS` label (Inter Semi Bold 10.5, `text-(--color-bar-actual)`); for summary tasks the label reads `ACTUALS · DERIVED FROM CHILDREN` and the section is read-only (lock icon + History button at 0.4 opacity).
- [ ] T029 [US2] Wire `ActualsSection` into `src/components/inspector/TaskInspector.tsx` immediately after the existing "Start (computed) / Finish (computed)" `<Field>` grid block (around line 152 — see the `if (task.scheduleMode === 'manual'…` boundary and insert above it). The section receives `task`, `isLeaf` (computed from the existing `isSummary` flag), and an empty `validationErrors` for this story (US3 wires the validation). `onChange` calls the existing `updateTask` action with the merged actuals partial — atomic save through the existing path (no new save button).

**Checkpoint US2**: Tests T025–T027 pass; manually walking `quickstart.md §8 US2` succeeds. The new section is visible in the existing panel with no behavioral changes to other fields.

---

## Phase 5: User Story 3 — System rejects nonsensical actuals (Priority: P2)

**Goal**: % complete outside `[0, 100]` and actual finish before actual start are rejected with clear inline messages. Clamping is forbidden — invalid input stays in the field until the user corrects it. SC-005 demands 100% rejection of invalid records.

**Independent Test** (from `spec.md` US3): Try `% = -1`, `% = 150`, and `actualFinish = 2026-04-25` while `actualStart = 2026-05-01`. Confirm each is rejected with a clear inline error, the offending field is highlighted, the typed value remains in the input, and no audit row is written.

### Tests for User Story 3

- [ ] T030 [P] [US3] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts`:
  - PUT `{ progressPct: -1 }` → 400 `{ error: 'progress_pct_range' }`. No DB row mutation, no audit row.
  - PUT `{ progressPct: 150 }` → 400 `{ error: 'progress_pct_range' }`. Same.
  - PUT `{ actualStart: '2026-05-10', actualFinish: '2026-05-04' }` → 400 `{ error: 'actuals_order' }`. Same.
  - PUT `{ actualStart: 'not-a-date' }` → 400 `{ error: 'invalid_date' }` (zod validation).
- [ ] T031 [P] [US3] Edge integration test in the same file — defence-in-depth: bypass the zod schema (e.g., direct SQL via the test fixture) and assert the Postgres CHECK constraints `schedule_tasks_progress_pct_range` and `schedule_tasks_actuals_order` reject the same payloads with their named errors (R5).
- [ ] T032 [P] [US3] UI test in `src/components/inspector/__tests__/actuals.test.tsx`: typing `150` into `% complete` and blurring renders the inline error `% complete must be between 0 and 100` in the danger background, the field's border switches to `--color-danger`, and the typed `150` **remains in the input** (NOT clamped to 100 — FR-005). Save is suppressed. Same flow for `-1`. Same flow for the ordering rule on `actualFinish`.
- [ ] T033 [P] [US3] UI test in the same file — recovery: after the error, correcting the value and blurring fires the save and the inline error disappears.

### Implementation for User Story 3

- [ ] T034 [US3] Implement field-level validation inside `ActualsSection.tsx` (T028): on each input's `onBlur`, run `validateActualsField(value, otherFields)` and surface the error via the `validationErrors` prop. The progress field rejects `< 0`, `> 100`, and non-integer; the finish field rejects values where `parseISO(value) < parseISO(actualStart)`. Errors short-circuit the save: when any field has an error, `onChange` is NOT called.
- [ ] T035 [P] [US3] Implement the `validateActualsField` pure helper in `src/lib/validateActuals.ts`. Unit test in `src/lib/__tests__/validateActuals.test.ts` covering each case in T032 + boundaries (`progressPct = 0`, `progressPct = 100`, `actualFinish === actualStart` all valid).

**Checkpoint US3**: Tests T030–T033 pass. SC-005 holds: zero invalid rows can be persisted by any path (frontend + zod + CHECK).

---

## Phase 6: User Story 4 — PM sees actuals alongside baseline + scheduled (Priority: P2)

**Goal**: The inspector shows three temporal pictures of a task (baseline / scheduled / actual). The Gantt grows a third visual lane (actuals) alongside the existing current bar (since 001) and baseline outline (002). On a 1280px-wide viewport, all three lanes coexist without horizontal overflow (SC-009).

**Independent Test** (from `spec.md` US4): On a task with all three temporal sets distinct, open the inspector — three sets of dates labelled clearly. Open the Gantt — a third actuals bar renders in the same row alongside the baseline outline and current bar. Resize the viewport to 1280 wide — no horizontal scrollbar.

### Tests for User Story 4

- [ ] T036 [P] [US4] UI test in `src/components/inspector/__tests__/actuals.test.tsx` — three-temporal: when the project has a v0 baseline (002) and the selected leaf task has all three sets of dates, the inspector shows a "BASELINE START (V0) / BASELINE FINISH (V0)" row (with the slate baseline outline treatment from 002) above the new "ACTUALS" section. When no baseline exists, the baseline row is omitted (mirrors the 002 FR-014 fallback).
- [ ] T037 [P] [US4] Pure-function test in `src/components/gantt/__tests__/actualsOverlay.test.tsx` — geometry: given `(currentSchedule, actualStart, actualFinish, today, scale)`, `computeActualsRowState(...)` returns:
  - `{ kind: 'no-actuals', bar: null }` when actuals are absent.
  - `{ kind: 'in-progress', bar: { startDate, finishDate: today, ... } }` when `actualStart` is set but `actualFinish` is null.
  - `{ kind: 'finished', bar: { ... }, flag: true }` when both actuals are set.
- [ ] T038 [P] [US4] UI test in `src/components/gantt/__tests__/actualsOverlay.test.tsx` — DOM stability: rows with actuals carry `data-actuals="present"`; rows without carry `data-actuals="absent"`. In-progress rows carry `data-actuals-state="in-progress"`; finished rows carry `data-actuals-state="finished"`. Variant rows (actuals deviates from current by > 1 calendar day) carry `data-actuals-variance="true"` (parallels the 002 `data-variance` for baseline/current).
- [ ] T039 [P] [US4] Smoke test in the same file — fallback: a project with zero actuals on every task renders the Gantt with **no** `ActualsBar` instances anywhere; the output is structurally identical to the pre-feature 002 baseline + current rendering. (FR-015 fallback; mirrors 002 SC-007.)
- [ ] T040 [P] [US4] Performance test in `src/components/gantt/__tests__/actualsOverlay.perf.test.tsx`: 100 generated tasks all with actuals set; mounting the Gantt adds **less than 50 ms** per 100 tasks vs. the 002-only baseline render time (engineering target derived from SC-009; mirrors the 002 T043 perf gate).

### Implementation for User Story 4

- [ ] T041 [P] [US4] Implement `src/components/gantt/ActualsBar.tsx` — a `motion.div` with `layoutId="actuals-${task.id}"` rendered **above** the existing `TaskBar` in the same row (~6 px from top of the row). Geometry props mirror those computed by `computeActualsRowState` (T042). Visual:
  - `kind === 'finished'`: filled `var(--color-bar-actual)` bar from `actualStart` to `actualFinish`, plus a small flag triangle at the right edge.
  - `kind === 'in-progress'`: filled bar from `actualStart` to today, with a hatched right edge (a 14-px wide `var(--color-bar-actual-faint)` ribbon clipped via the existing dash pattern).
  - `kind === 'no-actuals'`: returns `null` (no DOM node).
  Sets the `data-actuals-state` attribute described in T038.
- [ ] T042 [P] [US4] Implement `computeActualsRowState({ task, currentSchedule, today, scale, calendar })` as a pure module `src/components/gantt/actualsOverlay.ts` returning the `ActualsRowState` shape from `contracts/inspector-ui.contract.md §4`. Used by both `ActualsBar` and the unit tests in T037–T039.
- [ ] T043 [US4] Update `src/components/gantt/GanttChart.tsx`: in the row pre-pass that already renders `BaselineBar` (002), additionally render `<ActualsBar>` for each task using `computeActualsRowState`. Pass `data-actuals` and `data-actuals-variance` as row-container attributes. Update the `BaselineBar` lane offsets if needed so the three lanes (actuals top, current middle, baseline bottom) fit inside the existing 28-px row height — `inspector-ui.contract.md §4.1` is the binding spec.
- [ ] T044 [US4] Update `src/components/inspector/TaskInspector.tsx` to render the optional baseline-comparison row above the `ActualsSection` when the project has at least one baseline (`useProjectStore(s => s.baselineHeaders).length > 0`). Reuse the read-only field treatment used in 002's BaselineHistoryPanel for the slate outline. Match Figma Scene E.

**Checkpoint US4**: Tests T036–T040 pass; manually walking `quickstart.md §8 US4` succeeds; visual diff against Figma Scenes E + G shows no regressions.

---

## Phase 7: User Story 5 — Actuals roll up to summary tasks (Priority: P3)

**Goal**: Summary (non-leaf) tasks show derived actuals: duration-weighted `% complete`, earliest actual start across leaf descendants, latest actual finish only when **all** leaves are finished. Direct entry on a summary is rejected by both UI and API.

**Independent Test** (from `spec.md` US5): Build a summary with three leaf children — A (5d / 100% / finished), B (5d / 50% / in-progress), C (10d / 0%). Open the summary's inspector. Expect: rolled-up `% = 38` (`(100·5 + 50·5 + 0·10) / (5+5+10)` rounded), earliest actual start = `min(A.start, B.start)`, latest actual finish = `—` (C still in progress). Try to type into any of the three actuals fields → no effect.

### Tests for User Story 5

- [ ] T045 [P] [US5] Pure-function test in `src/lib/__tests__/progress.actuals.test.ts` — duration-weighted rollup. Cases:
  - All three children leaf, mixed progress (the example above) → `38`.
  - All children at `100%` regardless of duration → `100`.
  - All children at `0%` → `0`.
  - One child is itself a summary (nested two levels): only **leaf descendants** count toward the weighted sum (`R8` excludes summary descendants).
  - Tolerance assertion: rounded result within ±1 percentage point of the exact ratio (SC-008).
- [ ] T046 [P] [US5] Pure-function test in the same file — date rollup:
  - Earliest actual start = `min(child.actualStart)` over children that have one; null if no children have started.
  - Latest actual finish = `max(child.actualFinish)` ONLY IF every leaf descendant has a non-null `actualFinish`; otherwise null (R9).
- [ ] T047 [P] [US5] UI test in `src/components/inspector/__tests__/actuals.test.tsx` — summary read-only: when `isLeaf === false`, the `ActualsSection` renders the rolled-up values with surface-2 backgrounds, no focus rings, a lock icon next to the section header, and the History button at 0.4 opacity. Direct typing into any field has no effect (the input is `readonly`). Match Figma Scene F.
- [ ] T048 [P] [US5] Edge integration test in `supabase/functions/api/__tests__/actuals.test.ts` — backend gate: PUT `/tasks/:summaryTaskId/actuals` with any body → 422 `{ error: 'summary_task_actuals' }`. No DB row mutation, no audit row (FR-011, contract 422).

### Implementation for User Story 5

- [ ] T049 [P] [US5] Implement `computeRolledUpActuals(rootId, tasks)` in `src/lib/progress.ts` (next to the existing `computeSummaryProgress`). Returns `{ rolledUpProgressPct, earliestActualStart, latestActualFinish }`. Walks **leaf descendants only** (skip nested summaries; recurse into them). Duration-weighted average for `%`, with `Math.round`. Min for start, max-if-all-done for finish (R8 + R9).
- [ ] T050 [US5] Update `ActualsSection.tsx` (T028) to consume `computeRolledUpActuals(task.id, useProjectStore(s => s.tasks))` when `isLeaf === false`, render the values read-only, and disable inputs / hide the History button per T047.
- [ ] T051 [US5] Add the summary-task gate inside the PUT handler in `routes/actuals.ts` (T018, step 6): `await isSummaryTask(taskId, sql)` runs `SELECT 1 FROM schedule_tasks WHERE parent_id = $1 LIMIT 1` — if it returns a row, throw `err422('summary_task_actuals')`. Helper lives next to the route file as `lib/isSummaryTask.ts` so US5 doesn't need to touch the schema layer.

**Checkpoint US5**: Tests T045–T048 pass; the summary inspector reflects rolled-up values within ±1pp tolerance (SC-008); the API rejects direct summary writes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Audit drawer (read-side surface for FR-016 + FR-019), latency gate (SC-010), DoD walkthrough.

- [ ] T052 [P] Implement the audit drawer `src/components/inspector/ActualsAuditPanel.tsx` per `contracts/inspector-ui.contract.md §5` and matching Figma Scene H. Slide-in 360-wide drawer; consumes `useProjectStore(s => s.audit.get(taskId))`; renders entries newest-first; each entry shows the action pill (sky-faint for `update`, success-faint for `set`, warning-faint for `cleared`, danger-faint for `deleted`), actor full name, time-ago string with full ISO on hover, and a 2-col before/after diff with changed fields highlighted in `--color-warning-faint`. The deleted-task variant (when the task no longer exists in the store) renders the surface-2 header and the red banner from Scene H. Open trigger: the History button in `ActualsSection`'s header (T028).
- [ ] T053 [P] UI test in `src/components/inspector/__tests__/ActualsAuditPanel.test.tsx`:
  - Newest-first ordering when given three entries with non-monotonic timestamps in the input.
  - The before/after cells in the diff highlight only the fields whose values differ; unchanged fields render in the surface-2 background.
  - Clicking "Load older entries" calls `loadActualsAudit(taskId, cursor)` with the correct `nextCursor`; while loading, the button shows a pending state.
  - The deleted-task variant renders the FR-019 banner when the live task is absent from the store but audit entries exist.
- [ ] T054 [P] Performance test in `supabase/functions/api/__tests__/actuals.perf.test.ts` — SC-010 latency gate: on a project with 500 tasks, 100 sequential PUT calls to random tasks complete with p95 ≤ 500 ms. Use `performance.now()` capture and Vitest's `expect(p95).toBeLessThan(500)`. Pin the Supabase test fixture to the local stack (no network variance).
- [ ] T055 [P] Accessibility / keyboard pass on the new section: confirm the `ActualsSection` inputs are reachable via Tab, the `History` button is focusable with a visible focus ring, the inline error messages set `role="alert"`, and the lock icon on summary tasks has an `aria-label="Read-only — derived from children"`. Mark verification on the PR with a screenshot of axe-core output (no new violations introduced).
- [ ] T056 [P] Update the project's agent-context file (touched by `/speckit.plan`) so subsequent automation knows about the new module boundaries — run `bash .specify/scripts/bash/update-agent-context.sh` if available (mirrors 002 T054). No-op if the script is absent.
- [ ] T057 [P] Tick the FR-001…FR-019 and SC-001…SC-010 checkboxes on the eventual implementation PR description, citing the test or file that satisfies each (DoD per `quickstart.md §9`). For criteria with no automated test, run and record the manual walkthroughs:
  - **SC-001** — time a fresh "open inspector → enter all three actuals fields → Done" loop on a fixture project; record under 15 seconds.
  - **SC-002** — enter actuals on 5 tasks; reload; confirm every value persisted as entered.
  - **SC-006** — UX review with a tester unfamiliar with the project: confirm baseline / scheduled / actual values for one task are identifiable side-by-side within 5 seconds.
  - **SC-007** — track adoption metric (% of in-progress projects with actuals on ≥ 50% of started tasks within 30 days of release). Record an analytics-dashboard query that the team will check at +30 days.
  - **SC-009** — visual diff a project with all-actuals against the pre-feature build at 1280-wide viewport; confirm no horizontal overflow.
- [ ] T058 Run the full quality gates locally: `npm run test:run` (must be green), `npm run build` (must be green), and the SQL smoke in `quickstart.md §2` (CHECK constraint rejection still fires after migration). Confirm the 002 baseline overlay continues to render correctly on the same Gantt row that now also has an actuals lane (no regression on 002 SC-007).

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: T001 must precede T005 (same directory). T002, T003, T004 are independent and run in parallel.
- **Foundational (Phase 2)**: depends on Setup. T005 → T006 are sequential. T007, T008, T009, T010 are independent of each other and of T005/T006, but must complete before any US task that imports them.
- **User Story phases (Phase 3–7)**: all depend on Foundational completion. They are largely independent of each other and may be staffed in parallel, with these explicit couplings:
  - US2 (Phase 4) depends on US1 (Phase 3) for the `updateActuals` action it calls. To ship US2 visibly, ship US1 then US2.
  - US3 (Phase 5) depends on US2 (Phase 4) for the section it renders errors into.
  - US4 (Phase 6) depends on US1 + US2 for the inspector content; the Gantt half of US4 (T041–T043) depends only on Phase 2 and can be authored in parallel with US3 by a different engineer.
  - US5 (Phase 7) depends on US2 for the section that goes read-only; the rollup helper (T049) and backend 422 (T051) can be authored in parallel with US3–US4.
- **Polish (Phase 8)**: depends on US1 (audit drawer reads what US1 writes); T054 perf gate depends on US1 only; T058 depends on every US shipped in the cut.

### User-story dependencies

- **US1 (P1)** — no dependencies on other stories. Delivers the MVP (PM saves actuals; values persist; planned + baseline untouched; one audit row written; auto-fill works; deletion preserves history).
- **US2 (P1)** — depends on US1's `updateActuals` action. Trivial wiring once US1 lands.
- **US3 (P2)** — depends on US2's `ActualsSection` (it adds validation rendering inside).
- **US4 (P2)** — depends on US1 (data) and US2 (inspector placement). Gantt half is independent of US3.
- **US5 (P3)** — depends on US2's `ActualsSection` for the read-only treatment and on US1's PUT handler for the 422 backend gate.

### Within each user story

- Tests are written FIRST and must FAIL before implementation tasks land (per `quickstart.md §7` "red-green").
- Models / DTOs (Phase 2) before services / routes.
- Services / routes before client API bindings.
- Client API bindings before store actions.
- Store actions before UI components that consume them.

### Parallel opportunities

- T002 ∥ T003 ∥ T004 (Phase 1).
- T007 ∥ T008 ∥ T009 ∥ T010 (Phase 2).
- All `[P]` tests within a single story (e.g. T011–T017 for US1, T025–T027 for US2, T030–T033 for US3, T036–T040 for US4, T045–T048 for US5) can run in parallel — they touch independent files.
- Implementation tasks within a story are mostly serial (route depends on schema, store depends on client, UI depends on store), but cross-story implementation can fan out across team members once Phase 2 is checkpointed.
- Phase 8 polish tasks T052–T057 are all `[P]`; only T058 is sequential (final gate).

---

## Parallel Example: User Story 1 — kick-off after Phase 2 checkpoint

```bash
# Round 1 — write all US1 tests in parallel:
Task: T011  "Edge integration test: PUT persists actuals; planned columns byte-unchanged"
Task: T011a "Edge integration test: SC-004 — v0 baseline payload byte-identical after PUT"
Task: T011b "Edge integration test: FR-013 — actualStart/actualFinish never in baseline payload"
Task: T012  "Edge integration test: auto-fill in both directions + override-protect"
Task: T013  "Edge integration test: audit emission, before/after, action discriminator"
Task: T014  "Edge integration test: task deletion preserves audit; emits final task.actuals.deleted"
Task: T015  "Edge integration test: read scope follows project-read; PUT requires task-edit"
Task: T016  "Client API tests: getActuals / saveActuals / listActualsAudit (key-existence semantics)"
Task: T017  "Store unit test: updateActuals patches local task with server-resolved values"

# Round 2 — implement, partially parallel:
Task: T018 "PUT handler in supabase/functions/api/routes/actuals.ts"
Task: T019 "applyAutoFill pure helper + unit tests"
Task: T020 "pickAction pure helper + unit tests"
# Then in parallel after T018:
Task: T023 "client.ts getActuals/saveActuals/listActualsAudit"
# Sequential after T018: T021 (mount router), T022 (delete-path emit), T024 (store slice)
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 → Phase 2 (DB + zod + DTOs + audit helper).
2. Phase 3 (US1): write the 7 tests, then T018–T024.
3. **STOP and validate** with `quickstart.md §8 US1`.
4. Demo: "PM saves actuals; values persist; planned + baseline untouched; audit row + auto-fill + deletion-preserves all working."

### Incremental delivery (recommended)

1. Phase 1 + 2 → Foundation ready.
2. **Cut 1 (MVP)**: US1 → end-to-end actuals capture + audit + auto-fill + delete-preserve. Demo via the API layer (no UI surface yet beyond the existing inspector showing nothing new).
3. **Cut 2**: US1 + US2 → actuals fields visible in the existing inspector. Demo: a PM can record actuals via the GUI.
4. **Cut 3**: + US3 → validation and inline errors. Demo: the system rejects 150% and out-of-order dates with friendly messages.
5. **Cut 4**: + US4 → three-temporal in the inspector AND the third Gantt lane. Demo: plan vs commitment vs delivery at a glance.
6. **Cut 5**: + US5 → summary rollup. Demo: parent rows reflect children's actuals.
7. **Cut 6** (Phase 8): Audit drawer + perf gate + DoD checklist. Ships as the final cut.

### Parallel team strategy

After the Phase 2 checkpoint, three engineers can fan out:

- **Engineer A**: US1 → US3 backend half → US5 backend gate (backend-heavy track — same `routes/actuals.ts` file).
- **Engineer B**: US2 → US3 frontend half → US5 frontend rollup → audit drawer (T052) (frontend-heavy — `ActualsSection`, `ActualsAuditPanel`, summary read-only).
- **Engineer C**: US4 (Gantt third lane) + perf gate (T054) once Engineer A's T024 store slice is in.

The contracts files (`actuals.openapi.yaml`, `inspector-ui.contract.md`) are the synchronisation point — change there triggers re-coordination on both tracks.

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks.
- `[Story]` label maps tasks to spec User Stories for traceability.
- All FR-/SC- citations point back to `spec.md` so reviewers can audit coverage.
- Each user story is independently completable: the test suite for that story is sufficient to verify it without implementing later stories.
- Commit cadence: at minimum one commit per checkpoint (US1, US2, US3, US4, US5, Polish).
- Avoid: cross-story coupling that would force lockstep merges; bypassing the zod boundary or the auto-fill helper; adding write paths that could mutate existing audit rows; persisting the rolled-up summary actuals (always derive at render time).
- 002 coexistence: the actuals lane shares the existing 28-px Gantt row with the 002 baseline outline and current bar. Verify the 002 SC-007 fallback (zero-baselines projects render byte-identically) still holds after T043.
