---
description: "Task list for feature 002 — schedule baseline & tracking Gantt overlay"
---

# Tasks: Schedule Baseline & Tracking Gantt Overlay

**Input**: Design documents from `/specs/002-schedule-baseline-tracking-overlay/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/baselines.openapi.yaml`, `contracts/overlay-ui.contract.md`

**Tests**: Test tasks **are included**. The spec's User Stories define acceptance scenarios that must be observable, and `quickstart.md §7` explicitly enumerates a red-green test suite (overlay unit, store unit, Edge integration, client API integration, dialog UI, overlay performance). Independence of each user story is verified by these tests.

> **Revision log** — 2026-05-09: applied remediation from `/speckit.analyze` round 1.
> - **C1** (HIGH): added T039a (test) + T039b (impl) for the BaselineHistoryPanel so FR-016 + SC-006 are covered.
> - **C2** (HIGH): T008 now asserts the full `BaselinePayload` shape, not just non-emptiness.
> - **C3** (MED): added T014a — 403 path for callers without edit-schedule permission.
> - **C4** (MED): added T014b — atomic-or-nothing under simulated mid-transaction failure (FR-018 / SC-008).
> - **C5** (MED): added T014c — Toolbar disabled-with-tooltip UI test for the zero-task edge case.
> - **I1** (MED): User-story dependencies section now declares US2 → US3 runtime coupling explicitly.
> - **U1** (MED): T020 host file pinned to `src/components/layout/Toolbar.tsx`.
> - **U2 / U3** (MED): T055 now records SC-001 / SC-003 / SC-006 / SC-007 manual walkthroughs.
> - **L1** (LOW): T012 wording clarified to be non-overlapping with T048.
> - **L2** (LOW): T029 implements the final resolution rule once; T047 is a pure consumer-side change.
> - **L3** (LOW): T053 pins hand-mirroring (no new dep) + a type-level drift test.

**Organization**: Tasks are grouped by user story (US1–US5) so each story can be implemented and verified independently. Each phase ends with a checkpoint that maps directly to the spec's "Independent Test" criterion for that story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- All file paths are absolute under the repo root.

## Path conventions (from `plan.md`)

- Backend (Edge): `supabase/functions/api/**`
- Frontend: `src/**` (Vite + React 19 + Zustand 5)
- Database: `prisma/schema.prisma` + `prisma/migrations/<timestamp>_add_schedule_baselines/`
- Tests live next to code under `__tests__/` (project convention).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding that does not by itself enable a user story but is required before anyone touches DB or backend.

- [ ] T001 Create migration directory `prisma/migrations/<timestamp>_add_schedule_baselines/` and an empty `migration.sql` placeholder for Phase 2 to populate (`quickstart.md §2`).
- [ ] T002 [P] Add `ScheduleBaseline` Prisma model to `prisma/schema.prisma` (UUID `@db.Uuid`, `@map` PascalCase → `schedule_baselines`, two `@@unique` constraints, `@@index([projectId, versionIndex(sort: Desc)])`) per `data-model.md` §"Prisma model". Also add the back-relations `scheduleBaselines` on `Project` and `createdScheduleBaselines` on `User`.
- [ ] T003 [P] Run `npm run db:generate` so the regenerated Prisma client is picked up by tests in later phases (no code change yet — this is a workflow checkpoint).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB table + immutability + zod boundary. Until this phase is complete, no user story work can run end-to-end.

**⚠️ CRITICAL**: No US1–US5 task may start until Phase 2 is checkpointed.

- [ ] T004 Populate `prisma/migrations/<timestamp>_add_schedule_baselines/migration.sql` with the SQL from `data-model.md` §"SQL migration outline": `CREATE TABLE schedule_baselines`, `CHECK (length(rationale) >= 1)`, two `UNIQUE` constraints, the `(project_id, version_index DESC)` index, and the `schedule_baselines_no_mutate()` function + `BEFORE UPDATE` trigger (FR-005, R4).
- [ ] T005 Apply the migration locally with `npm run db:migrate:dev` and run the smoke SQL from `quickstart.md §2` (one INSERT succeeds; one UPDATE is rejected with `schedule_baselines is append-only`).
- [ ] T006 [P] Add `baselineCreateSchema` (zod) to `supabase/functions/api/lib/validation.ts` — single field `rationale: z.string().trim().min(1).max(2000)` (FR-002, contract `POST /baselines` requestBody).
- [ ] T007 [P] Add DTO types `BaselineHeaderDto` and `BaselinePayloadDto` to `src/api/types.ts` matching the schemas in `contracts/baselines.openapi.yaml` (mirror `data-model.md` §"BaselinePayload" exactly).

**Checkpoint**: DB table exists with the immutability trigger; zod schema and frontend DTOs compile. US1–US5 may now proceed in parallel.

---

## Phase 3: User Story 1 — Set the original baseline v0 (Priority: P1) 🎯 MVP

**Goal**: A PM can click "Set baseline" on a project, enter a required rationale, and a frozen v0 snapshot is committed atomically with an audit-log entry.

**Independent Test** (from `spec.md` US1): Open a project with a planned schedule; click "Set baseline"; verify Confirm is disabled until the rationale text is non-empty; on confirm, a row appears in `schedule_baselines` with `version_label = 'v0'` and `rationale` matching what was entered. Modify the schedule afterward and confirm v0 is byte-for-byte unchanged.

### Tests for User Story 1 (write FIRST, ensure they FAIL before implementation)

- [ ] T008 [P] [US1] Edge integration test in `supabase/functions/api/__tests__/baselines.test.ts`: `POST /projects/:projectId/baselines` with non-empty rationale returns 201 and inserts exactly one row with `versionLabel === 'v0'`, `versionIndex === 0`, `rationale` round-tripped, and a JSONB `payload` whose top-level shape **matches `BaselinePayload`** from `data-model.md` — assert presence of every required key (`schemaVersion === 1`, `capturedAt`, `project.{id,name,start}`, `tasks[]`, `dependencies[]`, `resources[]`, `assignments[]`, `calendar.{workingDaysOfWeek,holidays,hoursPerDay}`, `settings.{taskOrder,resourceOrder,collapsedIds}`) and that `tasks.length` matches the source project's task count, with each task carrying `id`, `name`, `durationDays`, `isMilestone`, `scheduleMode`, `constraint`, `progressPct`, `orderIndex`, `computedStart`, and `computedFinish` (FR-002, FR-003, FR-004, FR-018, contract `BaselinePayload`/`BaselineTask` schemas).
- [ ] T009 [P] [US1] Edge integration test in the same file asserting that an empty/whitespace `rationale` returns 400 with `error: 'rationale_required'` and writes no DB row (FR-002).
- [ ] T010 [P] [US1] Edge integration test in the same file asserting that a project with zero tasks rejects POST with 400 (spec edge case "If the project has zero tasks, the toolbar entry is disabled").
- [ ] T011 [P] [US1] DB-level test in the same file: after the POST, attempting `UPDATE schedule_baselines …` raises the immutability exception (FR-005).
- [ ] T012 [P] [US1] Edge integration test in the same file: a single POST writes one `audit_logs` row with `action='baseline.set'`, `entityType='ScheduleBaseline'`, `entityId=<insertedId>`, in the same transaction as the insert (FR-015 + R11). The two-row chronology case is covered separately by T048 and is intentionally non-overlapping.
- [ ] T013 [P] [US1] Client API test in `src/api/__tests__/client.baselines.test.ts`: `setBaseline(projectId, rationale)` POSTs JSON `{ rationale }`, parses 201 → `BaselineHeaderDto`, and propagates 400 errors with the error code intact.
- [ ] T014 [P] [US1] UI test in `src/components/gantt/__tests__/SetBaselineDialog.test.tsx`: Confirm button is disabled when the rationale field is empty or whitespace; typing a non-empty value enables it; clicking Confirm calls `onConfirm(rationale.trim())` exactly once with the trimmed value; the dialog stays open with rationale preserved when `onConfirm` rejects (`overlay-ui.contract.md` §"Set baseline dialog").
- [ ] T014a [P] [US1] Edge integration test in `supabase/functions/api/__tests__/baselines.test.ts`: a caller authenticated but lacking `edit_schedule` permission on the project receives **403** with `error: 'forbidden'` and **no row** is written to `schedule_baselines` or `audit_logs` (FR-001, contract `403` response). Pair this with a positive test using a permitted caller to guard against permission-check regressions.
- [ ] T014b [P] [US1] Edge integration test in `supabase/functions/api/__tests__/baselines.test.ts`: simulate a mid-transaction failure by stubbing the INSERT (or the audit insert) to throw **after** `loadSnapshot` succeeds. Assert that **zero** rows exist in `schedule_baselines` for the project AND **zero** new rows in `audit_logs` with `entityType='ScheduleBaseline'` (FR-018, SC-008). This pins atomic-or-nothing under failure.
- [ ] T014c [P] [US1] UI test in `src/components/layout/__tests__/Toolbar.test.tsx` (new file if absent): when the active project has `taskOrder.length === 0`, the "Set baseline" toolbar entry is rendered with `disabled` and a tooltip whose text begins with "Add at least one task" (or the final copy chosen during implementation). When `taskOrder.length > 0`, the entry is enabled and the tooltip is absent (spec edge case "If the project has zero tasks, the entry point is disabled with a tooltip").

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement `loadSnapshot(projectId)` reuse and the route file `supabase/functions/api/routes/baselines.ts` with `POST /projects/:projectId/baselines`: open `sql.begin()`, compute `versionIndex` as `(SELECT COUNT(*) FROM schedule_baselines WHERE project_id = $1)`, build `BaselinePayload` via the existing `loadSnapshot`, INSERT, then write the audit row — all in one transaction (FR-003, FR-018, R3).
- [ ] T016 [US1] Mount the new router from `supabase/functions/api/index.ts` (`app.route('/', baselineRoutes)`); export `baselineRoutes` from the route file (depends on T015).
- [ ] T017 [P] [US1] Implement `setBaseline(projectId, rationale)` in `src/api/client.ts` returning `BaselineHeaderDto` (depends on T007 DTOs from Phase 2).
- [ ] T018 [P] [US1] Add the `setBaseline` action to the new `BaselineSlice` in `src/store/projectStore.ts` (just this action plus the empty `baselineHeaders: []` / `baselinePayloads: new Map()` / `activeBaselineRef: 'latest'` state; the load/get actions land in US4) — wires to T017.
- [ ] T019 [P] [US1] Implement `src/components/gantt/SetBaselineDialog.tsx` per `overlay-ui.contract.md` §"Set baseline dialog": props `{ open, onConfirm, onCancel }`, Confirm disabled while rationale is empty/whitespace, pending state during submit, inline error preserves rationale on rejection (no styling decisions beyond design-token classes).
- [ ] T020 [US1] Wire the existing schedule toolbar to mount `SetBaselineDialog` and call `setBaseline` from the store; disable the toolbar entry with a tooltip when `taskOrder.length === 0` (spec edge case). Host file is `src/components/layout/Toolbar.tsx` (the Schedule view's toolbar — confirmed by `src/App.tsx` import; the page wrappers under `src/pages/ongoing/*` only link out to `/p/:projectId` and do not own a toolbar). Add the new control next to the existing Critical-path / Today buttons.

**Checkpoint US1**: Tests T008–T014 pass; manually walking through `quickstart.md §8 US1` succeeds. The MVP demo ("v0 captured, immutable, audit-logged") is shippable here.

---

## Phase 4: User Story 2 — Tracking overlay against active baseline (Priority: P1)

**Goal**: With at least one baseline set, the Gantt draws baseline bars in-row alongside current bars; tasks whose start OR finish drift > 1 calendar day get a visual variance indicator; added/removed tasks are marked.

**Independent Test** (from `spec.md` US2): With a project that has v0 set, modify several tasks (push dates, change durations); open the Gantt; verify both baseline bars and current bars render in the same row per task; verify ±1 calendar day tasks show no variance indicator while > 1 day drift shows one; verify added tasks show "+" with no baseline bar and removed tasks show only baseline bar with "−" treatment.

### Tests for User Story 2

- [ ] T021 [P] [US2] Pairing test in `src/components/gantt/__tests__/overlay.test.tsx`: tasks are paired by UUID; renaming a task does NOT break pairing (FR-017, R6).
- [ ] T022 [P] [US2] Variance threshold tests in the same file — exact boundary cases that pin the contract:
  - start delta `0d` → not variant
  - start delta `1d` → not variant (FR-009)
  - start delta `2d` → variant (FR-008)
  - finish delta `−2d` → variant (FR-008, "earlier or later")
  - both deltas inside ±1 → not variant (FR-009)
- [ ] T023 [P] [US2] Added/removed tests in the same file: a task in `currentTasks` only → `{ kind: 'added', baselineBar: null }` plus `data-baseline="added"` on the row; a task in `payload.tasks` only → `{ kind: 'removed' }` with a baseline-only bar and no current bar (FR-010, FR-011).
- [ ] T024 [P] [US2] Calendar isolation test in the same file: a holiday added to the current calendar but not to the baseline calendar must not by itself produce a variance unless it shifts the computed start/finish by > 1 calendar day (R8).
- [ ] T025 [P] [US2] Snapshot/visual test in the same file: every variant row sets `data-variance="true"`, every added row sets `data-baseline="added"`, removed rows omit the current bar (table at `overlay-ui.contract.md` §"Visual rendering rules").

### Implementation for User Story 2

- [ ] T026 [P] [US2] Implement `src/components/gantt/BaselineBar.tsx` — a `motion.div` with `layoutId="baseline-${task.id}"` rendered behind the current bar (own `z-index` lane); props mirror geometry computed from `(scheduled, scale, calendar)` (R12, plan §"Project Structure").
- [ ] T027 [US2] Update `src/components/gantt/GanttChart.tsx` to render a baseline pre-pass: for each task in `taskOrder` (filtered by `collapsed`) compute `RowOverlayState` per `overlay-ui.contract.md` §"State derivation rules" and render a `BaselineBar` ahead of the existing `TaskBar` (depends on T026).
- [ ] T028 [P] [US2] Update `src/components/gantt/TaskBar.tsx` to attach `data-variance` (when `kind === 'variant'`) and `data-baseline="added"` (when `kind === 'added'`) attributes, and to render the `+` gutter badge for added rows; remove the current bar entirely for removed rows (`overlay-ui.contract.md` Visual rendering table).
- [ ] T029 [US2] Add a derived selector `useActiveBaselinePayload()` in `src/store/projectStore.ts` that returns `{ payload, versionLabel } | undefined` from `(baselineHeaders, baselinePayloads, activeBaselineRef)` and is consumed by `GanttChart` (R13). Implement the **final** resolution rule once: `activeBaselineRef === 'latest'` → header with the largest `versionIndex`; otherwise the header whose `id` equals `activeBaselineRef`. If the resolved header's payload is not yet in `baselinePayloads`, return `undefined` (US3 wires the fetch). T047 in US4 is therefore a pure consumer-side change, not a rework.
- [ ] T030 [P] [US2] Implement the deterministic mapping function in a small pure module `src/components/gantt/baselineOverlay.ts` exporting `computeRowOverlayStates({ currentTasks, currentSchedule, currentCalendar, activeBaseline })` returning the `RowOverlayState[]` exactly as spec'd in `overlay-ui.contract.md` §"Outputs" — referenced from both `GanttChart` and the unit tests in T021–T025.

**Checkpoint US2**: Tests T021–T025 pass against the new pure function and the rendered Gantt; manually walking `quickstart.md §8 US2` succeeds. With v0 set, drift becomes visible at a glance.

---

## Phase 5: User Story 3 — Rebaseline (Priority: P2)

**Goal**: A second invocation of "Set baseline" creates v1 alongside v0; both versions are retrievable; v0 is byte-for-byte unchanged.

**Independent Test** (from `spec.md` US3): Set v0; modify schedule; set v1 with rationale; confirm both v0 and v1 are retrievable and immutable; confirm v1 is treated as the default reference ("latest").

### Tests for User Story 3

- [ ] T031 [P] [US3] Edge integration test in `supabase/functions/api/__tests__/baselines.test.ts`: a second POST returns `versionLabel: 'v1', versionIndex: 1`; v0 row in `schedule_baselines` is unchanged byte-for-byte (FR-006, SC-002, SC-004).
- [ ] T032 [P] [US3] Concurrency test in the same file: two POSTs racing on the same project — one wins, one returns 409 with `error: 'baseline_version_conflict'`; the unique constraint guarantees no two rows share `(projectId, versionIndex)` (R5, R14, contract `409` response).
- [ ] T033 [P] [US3] Edge integration test in the same file: `GET /projects/:projectId/baselines` returns headers newest-first and excludes `payload`; `GET /projects/:projectId/baselines/:baselineId` returns the full payload for any version including v0.
- [ ] T034 [P] [US3] Client API tests in `src/api/__tests__/client.baselines.test.ts`: `listBaselines` parses an empty array, a one-element array, and a multi-element array correctly; `getBaseline` returns the header merged with `payload`.

### Implementation for User Story 3

- [ ] T035 [US3] Extend `supabase/functions/api/routes/baselines.ts` with `GET /projects/:projectId/baselines` (headers, newest first) and `GET /projects/:projectId/baselines/:baselineId` (header + payload); both 401/403/404 paths match `contracts/baselines.openapi.yaml` (depends on T015).
- [ ] T036 [US3] Make the `versionIndex` calculation in the POST handler robust to the race: catch the unique-constraint violation and return 409 with `error: 'baseline_version_conflict'` so the client can retry (R5).
- [ ] T037 [P] [US3] Implement `listBaselines(projectId)` and `getBaseline(projectId, baselineId)` in `src/api/client.ts` (depends on T007 DTOs).
- [ ] T038 [US3] Add `loadBaselineHeaders(projectId)` and `loadBaselinePayload(baselineId)` actions to the `BaselineSlice` in `src/store/projectStore.ts`. `loadBaselinePayload` is **memoised** by `baselineId` (do not re-fetch if the payload is already in `baselinePayloads`) (R13).
- [ ] T039 [US3] In the existing `loadProject` flow, call `loadBaselineHeaders(projectId)` unconditionally (the API returns `[]` when none exist — `quickstart.md §5`). After Gantt mount, lazily call `loadBaselinePayload(activeHeader.id)` for the resolved active reference only.
- [ ] T039a [P] [US3] UI test in `src/components/gantt/__tests__/BaselineHistoryPanel.test.tsx`: with three headers (`v0`, `v1`, `v2` ordered newest-first), the panel renders all three in chronological order with version label, ISO timestamp, creator full name, rationale, and an "Immutable" cue per row (FR-016); with zero headers, the panel renders an empty state and no row controls. Match the visual structure of Figma Scene E (linked from `plan.md §"Design references"`).
- [ ] T039b [US3] Implement `src/components/gantt/BaselineHistoryPanel.tsx` rendering the headers from `useProjectStore(s => s.baselineHeaders)`, ordered newest-first, with a "View snapshot" affordance per row that calls `loadBaselinePayload(headerId)` (memoised — T038). No edit/delete affordances, ever (FR-005). The panel reads from the store only; it owns no fetch lifecycle. Wire its mount-point in the Gantt view per the design mockup (linked Scene E in `plan.md`).

**Checkpoint US3**: Tests T031–T034 + T039a pass; v0 still returns byte-identical bytes on `GET /baselines/:v0Id` after v1 is created (SC-002, SC-004); the history panel lists all baselines chronologically (FR-016) and unblocks the SC-006 manual checklist in Phase 8.

---

## Phase 6: User Story 4 — Switch baseline reference (Priority: P2)

**Goal**: With ≥ 2 baselines on a project, the user can switch which baseline the overlay compares against; the selector is hidden when ≤ 1 baseline exists; the selection is session-scoped only.

**Independent Test** (from `spec.md` US4): With v0, v1, v2 set, open the Gantt; toggle the selector between `latest`, `v0`, `v1`, `v2`; verify the overlay re-renders against the chosen baseline within the typical Gantt re-render time and reflects the right deltas.

### Tests for User Story 4

- [ ] T040 [P] [US4] Store unit test in `src/store/__tests__/baselineSlice.test.ts`: `activeBaselineRef = 'latest'` resolves at render time to the header with the largest `versionIndex`; switching to a specific baseline id resolves to that header; `setActiveBaselineRef` is **not** persisted across reloads (`overlay-ui.contract.md` §"Active baseline reference selector", R9).
- [ ] T041 [P] [US4] Store unit test in the same file: `loadBaselinePayload` is called at most once per `baselineId` even across many `setActiveBaselineRef` cycles (memoisation, R13).
- [ ] T042 [P] [US4] UI test in `src/components/gantt/__tests__/overlay.test.tsx` (or a new `BaselineVersionSelector.test.tsx`): the selector is hidden when `headers.length <= 1` (FR-013); rendered with `headers.length >= 2`; default option is `'latest'`; `onChange` is called with the correct baseline id when an item is picked.
- [ ] T043 [P] [US4] Performance test in `src/components/gantt/__tests__/overlay.perf.test.tsx`: 100 generated tasks with two pre-loaded payloads; switching `activeBaselineRef` between them re-renders the Gantt in under 1000 ms (SC-005). Use Vitest's `expect(elapsed).toBeLessThan(1000)` and a fake timer-free `performance.now()` capture.

### Implementation for User Story 4

- [ ] T044 [US4] Add the `setActiveBaselineRef(ref)` reducer to `BaselineSlice` (session-scoped only — must NOT be added to the persistence allowlist in `src/store/persistence.ts`).
- [ ] T045 [P] [US4] Implement `src/components/gantt/BaselineVersionSelector.tsx` per `overlay-ui.contract.md` §"Active baseline reference selector (header control)": props `{ headers, active, onChange }`, hidden when `headers.length <= 1`, default value `'latest'`. Newest-first ordering, with the version label and short metadata per the design mockup (Scene C in `plan.md` §"Design references").
- [ ] T046 [US4] Mount `BaselineVersionSelector` in the existing Gantt header (`GanttChart.tsx` or its toolbar parent); subscribe via `useProjectStore(s => ({ headers: s.baselineHeaders, active: s.activeBaselineRef }))` and dispatch `setActiveBaselineRef`.
- [ ] T047 [US4] In the Gantt mount/effect that consumes `useActiveBaselinePayload()`, register a side-effect that calls `loadBaselinePayload(resolvedHeaderId)` whenever the resolved header changes and its payload is not yet cached (R13). The selector itself is unchanged — this task only adds the lazy-fetch trigger now that the user can switch references.

**Checkpoint US4**: Tests T040–T043 pass; the perf test holds at 100 tasks (SC-005). The mockup's "Scene C" interaction matches behaviour.

---

## Phase 7: User Story 5 — Audit-log of baseline events (Priority: P3)

**Goal**: Every baseline-set action is observable in the existing `audit_logs` table with version, user, timestamp, and rationale, so a PMO reviewer can produce a chronological list of baseline events for any project.

**Independent Test** (from `spec.md` US5): Set v0, set v1; query `audit_logs WHERE entity_type='ScheduleBaseline' AND project_id = ?`; confirm two rows with `action='baseline.set'`, distinct entity ids, correct user, correct timestamps, and the rationale persisted (rationale is on the baseline row referenced by entity id).

### Tests for User Story 5

- [ ] T048 [P] [US5] Edge integration test in `supabase/functions/api/__tests__/baselines.test.ts`: after two POSTs on the same project, `audit_logs` contains exactly two rows with `action='baseline.set'`, `entityType='ScheduleBaseline'`, distinct `entityId`s, monotonically increasing `createdAt`, and `userId` matching the JWT subject (FR-015, R11). (Note: T012 already covers v0; T048 covers v0 + v1 listed together to satisfy SC-006 chronology.)
- [ ] T049 [P] [US5] Smoke query in `quickstart.md §8 US5` runs against the local stack and returns the expected two rows (manual step, recorded as a checkbox; no separate test file).

### Implementation for User Story 5

- [ ] T050 [US5] No new code — verify that the audit-row write inside the POST transaction (T015) is gated so it ONLY commits when the INSERT succeeds. If the existing `lib/audit.ts` helper is not already in-transaction-aware, refactor the call inside the route to share the same `sql` connection (R11). Add an inline comment in `routes/baselines.ts` referencing FR-015.

**Checkpoint US5**: T048 passes; the manual smoke in T049 is checked off (SC-006).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Engineering targets, byte-identical fallback, type generation, doc closure.

- [ ] T051 [P] Add a smoke test in `src/components/gantt/__tests__/overlay.test.tsx` asserting that with `headers.length === 0` and `activeBaseline === undefined`, **no** `BaselineBar` is rendered and the `BaselineVersionSelector` is not in the DOM (FR-014, SC-007). The DOM after this render must equal a snapshot of the pre-feature Gantt for the same project fixture.
- [ ] T052 [P] Add a "tasks with no baseline coverage" guard in `BaselineBar.tsx` to skip rendering for `kind === 'no-baseline'` early — a render-cost regression here would defeat SC-007.
- [ ] T053 [P] Hand-mirror `BaselineHeaderDto` and `BaselinePayloadDto` (and their nested types `BaselineTask` / `BaselineDependency` / `BaselineResource` / `BaselineAssignment` / `BaselineCalendar` / `BaselineSettings`) into `src/api/types.ts`, matching the existing convention used by neighbouring DTOs in that file (no `openapi-typescript` dependency added). Add a `// SOURCE: contracts/baselines.openapi.yaml` comment at the top of the new block, and a Vitest type-level test in `src/api/__tests__/types.baselines.test.ts` that imports both the DTO and a literal mock built from the OpenAPI examples to fail at compile time on drift. Strict TypeScript only — no `any` in API surfaces.
- [ ] T054 [P] Update the project's agent-context file (touched by `/speckit.plan`) so subsequent automation knows about the new module boundaries — run `bash .specify/scripts/bash/update-agent-context.sh` if available.
- [ ] T055 [P] Tick the FR-001…FR-018 and SC-001…SC-008 checkboxes on the eventual implementation PR description, citing the test or file that satisfies each (DoD per `quickstart.md §9`). For criteria with no automated test, run and record the manual walkthroughs:
  - **SC-001** — time a fresh "open project → Set baseline → enter rationale → confirm → see row" loop on a fixture project; record the elapsed time and confirm it is under 30 s.
  - **SC-003** — UX review with a tester unfamiliar with the project: confirm slipped tasks can be identified within 5 s without reading dates (purely from the variance treatment).
  - **SC-006** — using the BaselineHistoryPanel from T039b, confirm a PMO reviewer can produce a chronological listing (version, timestamp, creator, rationale) of every baseline event for the test project in under 1 minute.
  - **SC-007** — visual diff a project with zero baselines against the pre-feature build to confirm the Gantt is indistinguishable.
- [ ] T056 Run the full quality gates locally: `npm run test:run` (must be green), `npm run build` (must be green), and the SQL smoke in `quickstart.md §2` (UPDATE rejection still fires after migration).

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: T001 must precede T004 (same directory). T002 and T003 are independent and run in parallel.
- **Foundational (Phase 2)**: depends on Setup. T004 → T005 are sequential. T006 and T007 are independent of each other and of T004/T005, but must complete before any US task that imports them.
- **User Story phases (Phase 3–7)**: all depend on Foundational completion. They are independent of each other and may be staffed in parallel.
- **Polish (Phase 8)**: depends on all the user stories you intend to ship in the cut.

### User-story dependencies

- **US1 (P1)** has no dependencies on other stories (delivers MVP — captures v0 + audit + dialog).
- **US2 (P1)** code can be authored after Phase 2, but US2 has a **runtime dependency on US3**: nothing in US2 fetches the baseline payload from the server, so until US3's `loadBaselineHeaders` (T038) and `loadBaselinePayload` (T038) actions and the `loadProject` integration (T039) land, the overlay derived in T029 / T030 has no payload to render against. To ship US2 visibly, ship **US1 + US3 (T035, T037, T038, T039) + US2** as one increment, OR move T038's `loadBaselineHeaders` + a "latest-only" payload fetch into US2. The chosen path must be recorded in the implementation PR.
- **US3 (P2)** depends on US1 endpoints existing (T015) — extends them. It does **not** depend on US2 at the code level.
- **US4 (P2)** depends on US3's `loadBaselinePayload` action (T038); the selector is meaningless without ≥ 2 headers, but the code can be unit-tested with fixtures.
- **US5 (P3)** depends on US1's POST handler (T015) only — it's a verification/refactor pass on the same transaction.

### Within each user story

- Tests are written FIRST and must FAIL before implementation tasks land (per `quickstart.md §7` "red-green").
- Models / DTOs (Phase 2) before services / routes.
- Services / routes before client API bindings.
- Client API bindings before store actions.
- Store actions before UI components that consume them.

### Parallel opportunities

- T002 ∥ T003 (Phase 1).
- T006 ∥ T007 (Phase 2).
- All `[P]` tests within a single story (e.g. T008–T014 for US1, T021–T025 for US2, T031–T034 for US3, T040–T043 for US4) can run in parallel — they touch independent files.
- Implementation tasks within a story are mostly serial (route depends on schema, store depends on client, UI depends on store), but cross-story implementation can fan out across team members once Phase 2 is checkpointed.
- Phase 8 polish tasks T051–T055 are all `[P]`.

---

## Parallel Example: User Story 1 — kick-off after Phase 2 checkpoint

```bash
# Round 1 — write all US1 tests in parallel:
Task: T008 "Edge integration test: POST creates v0 row with full payload shape"
Task: T009 "Edge integration test: empty rationale → 400"
Task: T010 "Edge integration test: zero-task project → 400"
Task: T011 "DB-level test: UPDATE on schedule_baselines fails"
Task: T012 "Edge integration test: audit_logs row written in same transaction"
Task: T013 "Client API test: setBaseline in src/api/__tests__/client.baselines.test.ts"
Task: T014 "UI test: SetBaselineDialog disabled until rationale"
Task: T014a "Edge integration test: caller without edit_schedule → 403"
Task: T014b "Edge integration test: mid-transaction failure → no rows committed"
Task: T014c "UI test: Toolbar Set-baseline disabled with tooltip when zero tasks"

# Round 2 — implement, partially parallel:
Task: T015 "POST handler in supabase/functions/api/routes/baselines.ts"
# Then in parallel after T015:
Task: T017 "client.ts setBaseline binding"
Task: T019 "SetBaselineDialog.tsx component"
# Sequential after T015: T016 (mount router), T018 (store action), T020 (toolbar wire-up)
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 → Phase 2 (DB + zod + DTOs).
2. Phase 3 (US1): write the 7 tests, then T015–T020.
3. **STOP and validate** with `quickstart.md §8 US1`.
4. Demo: "v0 captured, immutable, audited."

### Incremental delivery (recommended)

1. Phase 1 + 2 → Foundation ready.
2. **Cut 1 (MVP)**: US1 → end-to-end set baseline + audit. Demo.
3. **Cut 2**: US2 → tracking overlay visible against v0. Demo.
4. **Cut 3**: US3 → rebaseline (v1) + history listing endpoint.
5. **Cut 4**: US4 → version selector with `'latest'` sentinel + perf assertion (SC-005).
6. **Cut 5**: US5 → audit-log smoke + DoD checklist (FR-001…FR-018 / SC-001…SC-008 ticked).
7. Phase 8 polish lands as part of, or right after, Cut 5.

### Parallel team strategy

After the Phase 2 checkpoint, three engineers can fan out:

- **Engineer A**: US1 → US3 → US5 (backend-heavy track — same `routes/baselines.ts` file).
- **Engineer B**: US2 (frontend-heavy — `BaselineBar`, overlay state derivation, `TaskBar` updates).
- **Engineer C**: US4 (selector + perf test) once Engineer A's T038 is in.

The contracts file (`baselines.openapi.yaml`) is the synchronisation point — change there triggers re-coordination on both tracks.

---

## Notes

- `[P]` = different files, no dependency on incomplete tasks.
- `[Story]` label maps tasks to spec User Stories for traceability.
- All FR-/SC- citations point back to `spec.md` so reviewers can audit coverage.
- Each user story is independently completable: the test suite for that story is sufficient to verify it without implementing later stories.
- Commit cadence: at minimum one commit per checkpoint (US1, US2, US3, US4, US5, Polish).
- Avoid: cross-story coupling that would force lockstep merges; bypassing the zod boundary; adding write paths that could mutate existing baseline rows.
