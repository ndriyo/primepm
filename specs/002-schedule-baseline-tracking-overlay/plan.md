# Implementation Plan: Schedule Baseline & Tracking Gantt Overlay

**Branch**: `002-schedule-baseline-tracking-overlay` | **Date**: 2026-05-09 | **Spec**: [./spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-schedule-baseline-tracking-overlay/spec.md`

> **Note**: This file is filled in by the `/speckit.plan` command. See
> `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add immutable, versioned schedule baselines and a tracking Gantt overlay so a
project manager can freeze the plan at a point in time and visually compare
the current schedule against any prior baseline. v0 is captured by clicking
"Set baseline" and entering a mandatory rationale; later rebaselines (v1,
v2, …) are server-numbered and never overwrite earlier ones. The Gantt draws
a baseline bar in the same row as each current bar, marks tasks whose start
or finish has drifted more than 1 calendar day with a clear variance
indicator, and shows added / removed tasks since baseline. A header selector
lets the user switch which baseline version is the comparison reference. All
baseline events are recorded in the existing audit log.

**Technical approach** (per `research.md`): one new append-only Postgres
table `schedule_baselines` storing a JSONB snapshot of the entire schedule
(reusing the existing `loadSnapshot` serialiser). Capture is server-side in
a single transaction for atomicity. Immutability is enforced by both the
absence of write paths and a DB trigger. Active baseline reference is
session-scoped client state (Zustand). Overlay is a second `motion.div` bar
keyed `baseline-${task.id}` rendered behind the existing `TaskBar`.

## Technical Context

**Language/Version**: TypeScript 5.7 across the stack
**Primary Dependencies**:

- Frontend: React 19, Zustand 5 (with Immer), Vite 6, Tailwind 4, motion,
  date-fns
- Backend (Edge): Hono on Deno (Supabase Edge Functions), `postgres` driver
- DB tooling: Prisma 7 (schema + migrations), Postgres (Supabase)
- Schema validation: zod 4
- Testing: Vitest 3 + React Testing Library

**Storage**: Postgres (Supabase). New table `schedule_baselines` (header
columns + JSONB `payload`) plus reuse of `audit_logs`. No object-store
dependency.

**Testing**: Vitest unit + UI tests under `src/**/__tests__/`; existing
Edge Function integration tests under `supabase/functions/api/__tests__/`.
Coverage target stays consistent with the project baseline (~98%).

**Target Platform**: Web (modern evergreen browsers); server is Supabase
Edge Functions on Deno.

**Project Type**: Web application — single repo with `src/` (frontend) and
`supabase/functions/api/` (Edge backend), `prisma/` for schema.

**Performance Goals**:

- Switching the active baseline reference re-renders within 1 s on a
  100-task project (spec SC-005).
- Initial overlay render adds < 50 ms per 100 tasks to the existing Gantt
  mount time (engineering target derived from SC-005).
- Capturing a baseline completes in under 30 s end-to-end for the user
  (spec SC-001) — server work itself is a single transaction, well under
  500 ms for typical projects.

**Constraints**:

- Baselines must be immutable (FR-005); enforced both in app and DB.
- Capture must be atomic (FR-018); single-transaction boundary.
- Variance threshold is exactly "> 1 calendar day" (clarification);
  off-by-one boundary is part of the test contract.
- For projects with zero baselines, the Gantt must be byte-identical to
  the current Gantt (FR-014, SC-007).

**Scale/Scope**:

- Project sizes today: hundreds of tasks; payload up to ~200 KB per
  baseline. Baselines per project: unbounded over time.
- Concurrent users per project: low single digits today; spec accepts
  last-writer-wins on schedule edits, server transaction isolates the
  baseline capture.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project Constitution at `.specify/memory/constitution.md` is currently
the unmodified template (no specific principles ratified). In the absence
of formal gates, this plan is checked against the **implicit project
guardrails** that already govern PrimePM:

| Implicit guardrail (from existing codebase practice) | Plan compliance                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Server-side validation with `zod` at API boundary     | PASS — `rationale` validated by zod schema; same pattern as existing `snapshotSchema` / `projectMetaSchema`. |
| Postgres-first persistence; migrations via Prisma     | PASS — One additive Prisma migration; uses existing UUID + `@map` PascalCase conventions.                    |
| Audit-log every state-changing action                 | PASS — `baseline.set` audit event written in the same transaction as the insert.                             |
| Tests live next to code in `__tests__/`               | PASS — Test inventory in `quickstart.md` follows that pattern.                                               |
| No new top-level dependencies without strong reason   | PASS — No new dependencies introduced; feature uses existing libs.                                           |
| Strict TypeScript, no `any` in API surfaces           | PASS — All new contracts in `contracts/` and store slice are explicitly typed.                               |
| Backward-compatible UX for unaffected projects        | PASS — Projects with no baselines render the Gantt unchanged (FR-014, SC-007).                               |

**Result**: PASS. No violations to record in Complexity Tracking.

> **Note for the team**: When the Constitution is formally ratified
> (planned via `/speckit.constitution`), re-run this gate against the
> ratified principles and update this section.

### Re-check after Phase 1 design

After producing `data-model.md`, `contracts/`, and `quickstart.md`, none
of the implicit guardrails above became newer or stricter — the design is
additive (one table, three endpoints, one Zustand slice, three components)
with no shared-state changes outside its own slice. Re-check **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/002-schedule-baseline-tracking-overlay/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── baselines.openapi.yaml      # REST contract for the Edge Function
│   └── overlay-ui.contract.md      # UI / store contract for the Gantt overlay
├── checklists/
│   └── requirements.md  # Spec-quality checklist (already passed)
├── spec.md              # Feature specification (input)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a **web application** monorepo. The chosen layout maps to the
existing `src/` (frontend) and `supabase/functions/api/` (Edge backend)
directories. New files for this feature land as additions; one Prisma
schema entry and one migration directory are added.

```text
prisma/
├── schema.prisma                                                # +ScheduleBaseline model
└── migrations/
    └── <timestamp>_add_schedule_baselines/
        └── migration.sql                                        # NEW: table + immutability trigger

supabase/functions/api/
├── routes/
│   └── baselines.ts                                             # NEW: GET list / POST set / GET payload
├── sql/
│   └── snapshot.ts                                              # reused unchanged for capture
├── lib/
│   ├── audit.ts                                                 # reused unchanged
│   ├── auth.ts                                                  # reused unchanged
│   ├── db.ts                                                    # reused unchanged
│   ├── errors.ts                                                # reused unchanged
│   └── validation.ts                                            # +baselineCreateSchema (zod)
├── __tests__/
│   └── baselines.test.ts                                        # NEW: integration tests
└── index.ts                                                     # +mount baselineRoutes

src/
├── api/
│   ├── client.ts                                                # +listBaselines / +getBaseline / +setBaseline
│   ├── types.ts                                                 # +BaselineHeaderDto / +BaselinePayloadDto
│   └── __tests__/
│       └── client.baselines.test.ts                             # NEW
├── store/
│   ├── projectStore.ts                                          # +baseline slice (headers, payloads, activeRef)
│   └── __tests__/
│       └── baselineSlice.test.ts                                # NEW
├── components/
│   └── gantt/
│       ├── BaselineBar.tsx                                      # NEW: secondary bar in row
│       ├── BaselineVersionSelector.tsx                          # NEW: header dropdown
│       ├── SetBaselineDialog.tsx                                # NEW: rationale capture + Confirm
│       ├── GanttChart.tsx                                       # +renders BaselineBar pre-pass
│       ├── TaskBar.tsx                                          # +data-variance attribute, +/- badges
│       └── __tests__/
│           ├── overlay.test.tsx                                 # NEW
│           ├── overlay.perf.test.tsx                            # NEW
│           └── SetBaselineDialog.test.tsx                       # NEW
└── pages/
    └── (existing project / Gantt page imports the new components)
```

**Structure Decision**: Keep the existing single-repo web layout. The
feature touches three layers (DB migration, Edge route, frontend) but is
fully additive — no module re-organisation, no shared utility extraction,
and no new top-level directory. The `contracts/` directory is the single
source of truth for the API and UI shapes; the Edge Function and the
frontend client both bind to the same OpenAPI/contract document.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Section intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (none)    | —          | —                                    |
