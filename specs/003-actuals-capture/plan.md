# Implementation Plan: Actuals Capture

**Branch**: `003-actuals-capture` | **Date**: 2026-05-10 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-actuals-capture/spec.md`

> **Note**: This file is filled in by the `/speckit.plan` command. See
> `.specify/templates/plan-template.md` for the execution workflow.

## Design references

The visual reference for this feature lives in the **PrimePM Design System**
Figma file, on a dedicated page mirroring the 002 layout convention:

- **Page** — `Spec 003 • Actuals Capture` —
  <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-2>
- **Full mockup frame (all scenes)** —
  <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-3>

Per-scene deep-links (use these when implementing the matching component):

| Scene                                                              | Implements                                                                                | Link                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A. Inspector — actuals not yet recorded (default leaf state)       | `ActualsSection` empty placeholder, `TaskInspector` placement (FR-001, FR-002, FR-009)    | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-46>                 |
| B. Inspector — in-progress task (actual start, partial %)          | Partial-progress state + audit "History" entry point (FR-007, FR-016)                     | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-104>                |
| C. Inspector — auto-fill UX echo                                   | `data-auto-fill="pending"` UX echo for FR-017                                             | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-162>                |
| D. Inspector — validation errors                                   | Inline error rendering for FR-005 (% range) and FR-006 (finish < start)                   | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-222>                |
| E. Inspector — baseline + scheduled + actual side-by-side          | Three-temporal comparison view (FR-008, US4)                                              | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-284>                |
| F. Inspector — summary task, rolled-up actuals (read-only)         | Duration-weighted rollup display (FR-011, US5)                                            | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=79-347>                |
| G. Tracking Gantt — three-track row (baseline / current / actuals) | `ActualsBar`, lane geometry, in-progress hatch, finished flag (FR-015, SC-009)            | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=82-2>                  |
| H. Audit drawer (live + deleted task variants)                     | `ActualsAuditPanel`, before/after diff, FR-019 deleted-task retention                     | <https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=82-98>                 |

The mockup also ships a **token legend** at the top of the page keyed by
purpose (current bar / actual lane / baseline outline / success / warning /
danger), so the contract names in
[`contracts/inspector-ui.contract.md`](./contracts/inspector-ui.contract.md)
map 1:1 to the visual treatments. Colors come from the existing PrimePM
design tokens used by 002 (`--color-bar`, `--color-bar-baseline`,
`--color-bar-progress`); the actuals lane introduces one new token
`--color-bar-actual` (default violet-600) plus its faint variant.

## Summary

Add per-task actuals capture so a project manager can record what really
happened — `% complete`, `actual start`, `actual finish` — without
disturbing the planned schedule or any committed baseline. Actuals live
on the existing task row (extending `schedule_tasks`) and are entered in
the existing inspector panel; saving any combination of task fields and
actuals fields is a single atomic save (FR-010). The Gantt grows a third
visual lane alongside the existing current bar (since 001) and baseline
overlay (from 002), so PMs can see plan vs. commitment vs. delivery at a
glance. Every actuals edit produces an append-only audit log entry with
before/after values; audit entries survive the deletion of their task,
and the deletion path emits one final `task.actuals.deleted` event.

**Technical approach** (per `research.md`): two new nullable date columns
on `schedule_tasks` (`actual_start`, `actual_finish`); reuse the existing
`progress_pct` smallint as the actuals "% complete" (per spec assumption,
no parallel field). One new `payload jsonb` column on the existing
`audit_logs` table carries `{ before, after }` snapshots — every actuals
write produces exactly one row with action `task.actuals.set | .update |
.cleared | .deleted`. Auto-fill (FR-017) is enforced server-side inside
the same single transaction as the UPDATE; the inspector mirrors the
same rule purely as a UX echo. Validation runs three layers deep:
inspector field-level (immediate), zod at the API boundary, and
Postgres CHECK constraints (`schedule_tasks_progress_pct_range`,
`schedule_tasks_actuals_order`). Read scope follows project-read parity
(FR-018); write scope follows task-edit (FR-001). Server-side latency
target p95 ≤ 500 ms at ≤500 tasks/project (SC-010), met by a single
read-before-write + single UPDATE + single audit INSERT in one
`sql.begin(...)`. Summary rollup is duration-weighted, computed at
render time, never persisted on the summary row.

## Technical Context

**Language/Version**: TypeScript 5.7 across the stack
**Primary Dependencies**:

- Frontend: React 19, Zustand 5 (with Immer), Vite 6, Tailwind 4, motion,
  date-fns
- Backend (Edge): Hono on Deno (Supabase Edge Functions), `postgres`
  driver
- DB tooling: Prisma 7 (schema + migrations), Postgres (Supabase)
- Schema validation: zod 4
- Testing: Vitest 3 + React Testing Library

**Storage**: Postgres (Supabase). Two additive column changes on existing
tables (`schedule_tasks` gains `actual_start`, `actual_finish`;
`audit_logs` gains `payload jsonb` and one composite index). No new
table.

**Testing**: Vitest unit + UI tests under `src/**/__tests__/`; existing
Edge Function integration tests under `supabase/functions/api/__tests__/`.
Coverage target stays consistent with the project baseline (~98%). One
new performance test gates SC-010.

**Target Platform**: Web (modern evergreen browsers); server is Supabase
Edge Functions on Deno.

**Project Type**: Web application — single repo with `src/` (frontend)
and `supabase/functions/api/` (Edge backend), `prisma/` for schema.

**Performance Goals**:

- Inspector save round-trip for actuals: server-side **p95 ≤ 500 ms** at
  projects of ≤500 tasks (SC-010, R12).
- Inspector render with all three actuals fields populated: under one
  60 fps frame (~16 ms).
- Three-lane Gantt row mount: < 50 ms additional per 100 tasks vs. the
  pre-feature two-lane render (engineering target derived from existing
  002 budgets).
- Audit drawer first paint after open with up to 50 entries: < 200 ms.

**Constraints**:

- Actuals are stored separately from baseline (FR-004, FR-013) — the 002
  baseline payload MUST NOT include `actualStart` / `actualFinish` /
  `progressPct`. The existing `loadSnapshot` serializer captures only
  the baseline-relevant columns; this plan adds zero references to the
  new columns from the baseline payload.
- Auto-fill (FR-017) MUST NOT override an explicit user-entered value;
  the request-body convention is "key existence, not value-nullness"
  (research.md R4).
- Last-write-wins concurrency only (R11); no optimistic-concurrency
  token in this release.
- Audit entries are immutable and survive the deletion of their task
  (FR-016, FR-019). The cascade boundary is `Project → ScheduleTask`;
  `audit_logs` has no FK to `schedule_tasks`, so retention is the
  default behaviour and the deletion handler explicitly emits the final
  `task.actuals.deleted` event.

**Scale/Scope**:

- Project sizes today: hundreds of tasks; SC-010 perf gate at 500
  tasks/project.
- Concurrent users per project: low single digits today; spec accepts
  last-writer-wins. The audit log makes "who clobbered whom" visible
  after the fact.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project Constitution at `.specify/memory/constitution.md` is
currently the unmodified template (no specific principles ratified). In
the absence of formal gates, this plan is checked against the **implicit
project guardrails** that already govern PrimePM (mirrors the 002 plan's
gate list):

| Implicit guardrail (from existing codebase practice) | Plan compliance                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Server-side validation with `zod` at API boundary     | PASS — `actualsUpdateSchema` follows the same pattern as `snapshotSchema` / `baselineCreateSchema`.            |
| Postgres-first persistence; migrations via Prisma     | PASS — One additive Prisma migration; uses existing UUID + `@map` PascalCase conventions.                      |
| Audit-log every state-changing action                 | PASS — Four reserved actions cover set / update / cleared / deleted-with-task. Single transaction.             |
| Tests live next to code in `__tests__/`               | PASS — Test inventory in `quickstart.md` follows that pattern; new Vitest perf test for SC-010.                |
| No new top-level dependencies without strong reason   | PASS — No new deps. Reuses motion, date-fns, zod, Hono, postgres driver, Prisma.                               |
| Strict TypeScript, no `any` in API surfaces           | PASS — All new contracts in `contracts/` and store additions explicitly typed.                                 |
| Backward-compatible UX for unaffected projects        | PASS — Projects with zero actuals render the Gantt unchanged (FR-015 fallback, mirrors 002 SC-007).            |
| Defence-in-depth on data validity                     | PASS — Three layers: frontend, zod, Postgres CHECK (R5).                                                       |

**Result**: PASS. No violations to record in Complexity Tracking.

> **Note for the team**: When the Constitution is formally ratified
> (planned via `/speckit.constitution`), re-run this gate against the
> ratified principles and update this section.

### Re-check after Phase 1 design

After producing `data-model.md`, `contracts/`, `quickstart.md`, and the
Figma scenes referenced above, none of the implicit guardrails became
newer or stricter — the design is additive (two columns + one column +
one composite index, three endpoints, a few inspector + Gantt component
additions) with no shared-state changes outside its own surface. One
new visual token (`--color-bar-actual`) is introduced under the
existing `pp-tokens.css` namespace. Re-check **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/003-actuals-capture/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── actuals.openapi.yaml          # REST contract for the actuals endpoints
│   └── inspector-ui.contract.md      # UI / store contract: inspector + Gantt + audit drawer
├── checklists/
│   └── requirements.md  # Spec-quality checklist (already passed)
├── spec.md              # Feature specification (input)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a **web application** monorepo. The chosen layout maps to the
existing `src/` (frontend) and `supabase/functions/api/` (Edge backend)
directories. New files for this feature land as additions; one Prisma
migration extends two existing tables.

```text
prisma/
├── schema.prisma                                                # +ScheduleTask.actualStart/actualFinish; +AuditLog.payload + index
└── migrations/
    └── <timestamp>_add_task_actuals_and_audit_payload/
        └── migration.sql                                        # NEW: ALTERs + CHECK constraints + index

supabase/functions/api/
├── routes/
│   ├── actuals.ts                                               # NEW: GET snapshot / PUT update / GET audit
│   └── tasks.ts                                                 # +emit task.actuals.deleted in delete path (FR-019)
├── lib/
│   ├── audit.ts                                                 # +payload param on the existing audit() helper
│   ├── auth.ts                                                  # reused unchanged
│   ├── db.ts                                                    # reused unchanged
│   ├── errors.ts                                                # reused unchanged
│   └── validation.ts                                            # +actualsUpdateSchema (zod)
├── __tests__/
│   ├── actuals.test.ts                                          # NEW: integration tests
│   ├── actuals.delete.test.ts                                   # NEW: FR-019 retention tests
│   └── actuals.perf.test.ts                                     # NEW: SC-010 latency gate
└── index.ts                                                     # +mount actualsRoutes

src/
├── api/
│   ├── client.ts                                                # +getActuals / +saveActuals / +listActualsAudit
│   ├── types.ts                                                 # +ActualsSnapshotDto / +ActualsAuditEntryDto
│   └── __tests__/
│       └── client.actuals.test.ts                               # NEW
├── store/
│   ├── projectStore.ts                                          # +actualStart/actualFinish on Task; +updateActuals action; +audit map
│   └── __tests__/
│       └── actualsSlice.test.ts                                 # NEW
├── lib/
│   ├── progress.ts                                              # +computeRolledUpActuals (duration-weighted)
│   └── __tests__/
│       └── progress.actuals.test.ts                             # NEW
├── components/
│   ├── inspector/
│   │   ├── TaskInspector.tsx                                    # +ActualsSection placement (mirrors Scenes A–F)
│   │   ├── ActualsSection.tsx                                   # NEW
│   │   ├── ActualsAuditPanel.tsx                                # NEW (mirrors Scene H)
│   │   └── __tests__/
│   │       ├── actuals.test.tsx                                 # NEW
│   │       └── ActualsAuditPanel.test.tsx                       # NEW
│   └── gantt/
│       ├── ActualsBar.tsx                                       # NEW (third lane, mirrors Scene G)
│       ├── GanttChart.tsx                                       # +renders ActualsBar pre-pass alongside BaselineBar
│       └── __tests__/
│           └── actualsOverlay.test.tsx                          # NEW
└── styles/
    └── pp-tokens.css                                            # +--color-bar-actual (and faint variant)
```

**Structure Decision**: Keep the existing single-repo web layout. The
feature touches three layers (DB migration, Edge route, frontend) but
is fully additive — no module re-organisation, no shared utility
extraction, and no new top-level directory. The `contracts/` directory
is the single source of truth for the API and UI shapes; the Edge
Function and the frontend client both bind to the same OpenAPI/contract
document.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Section intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (none)    | —          | —                                    |
