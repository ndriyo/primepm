# Implementation Plan: Actuals Capture

**Branch**: `003-actuals-capture` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-actuals-capture/spec.md`

## Summary

Add three per-task fields — integer **percent_complete (0–100)**, **actual_start_date**, **actual_finish_date** — that PMs enter in the existing task inspector and that render as a third bar track on the Gantt alongside baseline and current-schedule bars. Actuals never overwrite planned values or baseline snapshots; deletes cascade with the task; summary tasks display a duration-weighted % complete rollup over leaf descendants.

Technical approach: extend the existing `ScheduleTask` row with three nullable columns (`actual_start_date`, `actual_finish_date`, and a renamed/repurposed `progress_pct` semantics — see "Progress field reuse" below), wire them through the Zod validation schema and snapshot DTO, expose them in `TaskInspector` using the existing parse/format/blur-validate pattern, and add an `ActualsTrack` sub-component to `TaskBar.tsx` that renders below the current bar at half-height. No engine changes; actuals are observational data that does not feed CPM.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), React 19, Deno (Supabase Edge runtime)
**Primary Dependencies**: React 19 + Zustand 5 + Immer 10 (client state), Hono (Edge API), Zod 4 (validation), `postgres` tagged-template SQL, Prisma 7 (schema management only — runtime uses raw SQL), date-fns 4, Motion 12, Tailwind 4
**Storage**: PostgreSQL via Supabase. Prisma `schema.prisma` is source of truth for DDL; runtime queries use the `postgres` driver in `supabase/functions/api/lib/db.ts`.
**Testing**: Vitest 3 + @testing-library/react + JSDOM for client; no separate Edge integration suite — route logic is thin enough that unit-level tests on validation + a smoke test exercising the full snapshot round-trip suffice.
**Target Platform**: Cloudflare Pages (static SPA), Supabase Edge Functions (Deno)
**Project Type**: Web application (frontend SPA + edge API). Single repo, no monorepo.
**Performance Goals**: Inspector save round-trip ≤ 300 ms p95 on a project with 500 tasks; Gantt render at 60 fps when scrolling a 500-task project with three tracks per row.
**Constraints**: Actuals must be additive — zero impact on baseline immutability (FR-004, FR-013) and zero impact on planned values or the CPM engine (FR-003). No new heavy dependencies. Bundle delta target < 5 KB gzipped.
**Scale/Scope**: ~500 tasks per project, ~50 projects per org, ~5 concurrent editors per project (last-write-wins per spec assumption).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repo's `.specify/memory/constitution.md` is still the unfilled template; no ratified principles to check against. Until a constitution is ratified, this plan adopts the de-facto principles already visible in the codebase as advisory gates:

| De-facto principle (from codebase) | This plan's compliance |
|---|---|
| Engine purity — `src/engine/` imports nothing outside itself | ✅ Actuals do not enter the engine. They are stored on `Task` for persistence symmetry but the CPM scheduler never reads them. |
| Zod at the edge — every API body is validated by a schema in `validation.ts` | ✅ `taskUpdateSchema` and `taskSchema` extended; new `actualsRefinement` cross-field check added. |
| Immer + Zustand store with `applyDomain` patches — undo/redo for free | ✅ Actuals updates flow through `updateTask`, picking up undo/redo, debounced persistence, and recalculation skip (no schedule change). |
| Snapshot is the persistence boundary — `saveSnapshot` is the single write path for full-project state | ✅ `Snapshot` DTO + `SerializedTask` extended; round-trip preserves new fields. |
| Tests live next to code in `__tests__/` and use Vitest | ✅ All new logic gets co-located unit tests (`src/lib/__tests__/actuals.test.ts`, store/inspector/TaskBar tests). |

No violations. Complexity Tracking section below remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-actuals-capture/
├── spec.md                # Feature spec (already exists)
├── checklists/
│   └── requirements.md    # Quality checklist (already exists)
├── plan.md                # This file (/speckit.plan output)
├── research.md            # Phase 0 — technical decisions & rationale
├── data-model.md          # Phase 1 — schema, types, validation, rollup formula
├── quickstart.md          # Phase 1 — local dev / acceptance walkthrough
├── contracts/             # Phase 1 — Zod schemas (source-of-truth) + OpenAPI sketch
│   ├── task-actuals.zod.ts
│   ├── snapshot-actuals.zod.ts
│   └── api.md
└── tasks.md               # Phase 2 — produced by /speckit.tasks (NOT in this output)
```

### Source Code (repository root)

primepm is a single-repo web app with a colocated Edge backend. The relevant structure is:

```text
prisma/
├── schema.prisma                              # add 3 fields to ScheduleTask
└── migrations/
    └── 20260509120000_add_task_actuals/       # NEW: ALTER schedule_tasks ADD COLUMN actual_start_date, actual_finish_date
        └── migration.sql

src/
├── engine/
│   ├── types.ts                                # extend Task interface (3 new optional fields)
│   └── __tests__/                              # unchanged — engine ignores actuals
├── lib/
│   ├── progress.ts                             # add computeActualsRollup() — earliest start, latest finish, dur-weighted pct
│   ├── actualsValidation.ts                    # NEW: parseActualDate, validatePair, error messages
│   └── __tests__/
│       ├── progress.test.ts                    # extend with actuals rollup cases
│       └── actualsValidation.test.ts           # NEW
├── store/
│   ├── projectStore.ts                         # updateTask already handles patch; add safety guard "no actuals on summary"
│   └── __tests__/
│       └── projectStore.test.ts                # extend: actuals patches participate in undo, do not call recalculate
├── components/
│   ├── inspector/
│   │   ├── TaskInspector.tsx                   # add 3 fields + baseline/scheduled/actual labelled triplet view
│   │   ├── ActualsFields.tsx                   # NEW: extracted sub-panel (% complete, actual start, actual finish)
│   │   ├── DateField.tsx                       # NEW (or extend existing): blur-validate date input parser
│   │   └── __tests__/
│   │       └── ActualsFields.test.tsx          # NEW
│   └── gantt/
│       ├── TaskBar.tsx                         # add ActualsTrack overlay; baseline track stays as 002 delivers it
│       ├── ActualsTrack.tsx                    # NEW: renders the third bar at row mid-height
│       └── __tests__/
│           └── ActualsTrack.test.tsx           # NEW
└── api/
    └── client.ts                                # no shape change — taskUpdate already accepts a partial; just types extend

supabase/functions/api/
├── lib/
│   └── validation.ts                            # extend taskSchema + taskUpdateSchema, add cross-field refinement
├── routes/
│   └── tasks.ts                                 # PATCH route: 3 new conditional UPDATE statements
└── sql/
    └── snapshot.ts                              # rowToTask() reads new cols; saveSnapshot() inserts them
```

**Structure Decision**: Keep the existing single-repo "frontend + colocated Edge backend" layout. No new top-level dirs. New files cluster in three places: (a) `prisma/migrations/` for the schema bump, (b) `src/lib/` for pure validation/rollup helpers, (c) `src/components/` for the two UI surfaces (inspector fields and Gantt track). Edge route changes are surgical edits within existing files.

### Progress field reuse — one decision flagged for review

The existing `ScheduleTask.progress_pct` column (integer 0–100, present since the initial scheduling migration `20260503090000_add_scheduling_tables`) already stores task progress and is the field the current Gantt fills with the green progress overlay. The spec calls for "actual percent complete" semantically separate from "planned progress."

**Two options:**

- **Option A — Reuse `progress_pct` as "actual" (recommended).** Today the field is conceptually ambiguous; nothing in the planning flow writes a non-zero value automatically. Promoting it to mean "actual % complete" is consistent with how mature PM tools treat the field (MS Project: `% Complete` = actuals). The Gantt's existing green progress overlay becomes the actuals-progress overlay. No new column.
- **Option B — Add `actual_progress_pct` as a separate column, leave `progress_pct` for "planned/intended" progress.** Keeps the door open for a future "planned-S-curve" feature, but introduces a UI ambiguity (which one does the current bar's green fill represent?) and forces a data migration if Option A is later chosen.

This plan recommends **Option A** and writes data-model.md / contracts accordingly. If the reviewer prefers B, the change is local: add one more nullable column and a second progress map in the store. Documented in research.md §3.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

*No violations to track.*
