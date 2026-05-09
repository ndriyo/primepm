# Phase 0 Research — Actuals Capture

**Feature**: 003-actuals-capture
**Date**: 2026-05-09

This document captures the technical decisions made before design starts and the
alternatives that were considered and rejected. It exists so the choices can be
re-litigated by future readers without re-running the analysis.

---

## 1. Where actuals live in the schema

**Decision**: Add two nullable date columns directly on `schedule_tasks`:
`actual_start_date DATE NULL`, `actual_finish_date DATE NULL`. Do not create a
separate `task_actuals` table.

**Reasoning**:

- Cardinality is exactly 1:1 between a task and its actuals (see
  `spec.md` §Key Entities — "Lifecycle is bound to the task: created when first
  entered, deleted when the task is deleted").
- A separate table would require either (a) a JOIN on every task read in
  `loadSnapshot()` — which already does six round-trips per project — or (b) a
  new "upsert actuals on first edit" code path, neither of which buys anything.
- FR-012 ("deleting a task MUST also delete its associated actuals records") is
  trivially satisfied by columns on the parent row.
- Nullable columns honor FR-009 ("not yet recorded" must be visibly distinct
  from "zero"): NULL renders as the empty/"not yet recorded" state; a literal
  `0`/empty string never appears spuriously.

**Alternatives considered**:

- *Separate `task_actuals` table with FK*: rejected — no second use case in
  Phase 1 or Phase 2 for a row-per-actual record (no audit trail of edits, no
  per-period actuals split). Phase 2 EVM consumes the current actual values,
  not their history.
- *JSON column `actuals jsonb`*: rejected — Postgres can already type-check
  three primitive columns; JSON gives up that check for no flexibility we need.

---

## 2. How actuals reach the API

**Decision**: Reuse the existing `PATCH /api/projects/:id/tasks/:taskId` route
in `supabase/functions/api/routes/tasks.ts`. Extend `taskUpdateSchema` (Zod) to
permit `actualStart?: string | null`, `actualFinish?: string | null`,
`progressPct?: number` — already present. Add a Zod cross-field
`.superRefine()` that rejects "actual finish before actual start" and "% complete
out of 0–100." Add three conditional `UPDATE` statements to the handler.

**Reasoning**:

- Spec FR-010 mandates a single atomic save action from the user's perspective
  ("no separate 'save actuals' affordance"). The existing PATCH already accepts
  partial updates and is exactly that endpoint.
- Cross-field validation in Zod (vs. in the SQL layer) keeps the failure as a
  400 with a structured field-level error code, matching the existing error
  contract (`handleError` in `lib/errors.ts`).
- The PATCH handler already issues per-field UPDATE statements; adding three
  more is a one-line pattern repeat — consistent, low-risk.

**Alternatives considered**:

- *New endpoint `PATCH /api/projects/:id/tasks/:taskId/actuals`*: rejected —
  splits the save into two round-trips for users who change name + actuals in
  the same inspector session, undermining FR-010.
- *DB-level `CHECK (actual_finish_date >= actual_start_date)` constraint*: kept
  as a **belt-and-suspenders** guard (see data-model.md), but Zod is the
  primary error surface so users get a useful field-anchored message.

---

## 3. Progress-field semantics — reuse `progress_pct` for actual % complete

**Decision**: Treat the existing `progress_pct` column on `schedule_tasks` as
the single source of truth for **actual** percent complete. Rename usages in
the inspector and TaskBar progress overlay to "Actual %" surface text. No new
column.

**Reasoning**:

- The current scheduler does not derive any planning behavior from
  `progress_pct`. The CPM engine in `src/engine/recalculate.ts` reads
  `durationDays`, dependencies, calendar, constraints, and `manualStart` —
  it never reads `progressPct`. The field is observational already.
- The Gantt's green overlay (`TaskBar.tsx:111-117`) renders `displayProgressPct`
  from `buildProgressMap(tasks)`. With no other writer in the codebase, that
  green bar already represents actual progress whenever a value exists. We are
  just naming it correctly.
- A separate `actual_progress_pct` column would force a UI choice — does the
  green overlay show planned or actual? — that the spec does not call for.
  Keeping one field avoids introducing a distinction users would have to learn.
- Phase 2 (EVM, planned-vs-actual S-curve) needs *Planned Value* derived from
  the schedule, not from a `planned_progress_pct` field. The S-curve's PV line
  is computed from baseline duration × time, not stored as a per-task field.

**Alternatives considered**:

- *Add `actual_progress_pct` separate from `progress_pct`*: rejected. Forces
  the question "does the green bar render planned or actual?" with no spec
  guidance. Doubles the size of the progress map. If a future planned-progress
  S-curve needs a separate planned-progress field, it can be added then.
- *Migrate `progress_pct` → `actual_progress_pct` (rename column)*: rejected —
  pointless churn for downstream code (snapshot serializer, store, Gantt). The
  column name is internal.

**Risk**: a future feature genuinely needs a separate "planned progress"
attribute. Mitigation: that future feature can add a column at that time. We
do not pre-pay the cost now.

---

## 4. Gantt rendering — third track inside `TaskBar.tsx` vs. separate row tier

**Decision**: Render the actuals as a third visual element **inside the same
row** as the current bar — drawn at half-height (11 px) directly below the
current-schedule bar, with a distinct color token (`--color-bar-actuals`) and a
striped fill if the actual is in progress (no actual_finish yet).

**Reasoning**:

- Row height is 34 px (`timeScale.ts:20`). The current bar occupies 22 px; the
  baseline overlay (delivered by 002) is rendered as a 4-px hairline directly
  beneath. An 11-px actuals bar fits in the remaining 8 px below the current
  bar with 1 px of spacing — tight but legible at all four zoom levels.
- Spec FR-015 requires three tracks visible "in the same row" — splitting into
  separate rows would double row count and break the existing row index ↔ task
  mapping used everywhere (`computeVisibleOrder`, drag/drop, dependency layer).
- All three tracks share the same `dateToX` coordinate system, so the `TimeScale`
  primitive is already enough.

**Alternatives considered**:

- *Increase row height to 50 px and stack three bars*: rejected — re-flows the
  entire schedule grid, breaks anyone who has a stored zoom/scroll preference,
  doubles vertical scroll for no information gain.
- *Single bar with progress fill = actuals*: rejected — fails FR-015's explicit
  requirement of a "distinct" actuals track and SC-009's "three distinct visual
  tracks per task."
- *Tooltip/hover-only display of actuals*: rejected — fails the "at a glance"
  requirement in User Story 4.

---

## 5. Date input parsing

**Decision**: Use the existing `chrono-node` dependency (already in
`package.json`) for tolerant date parsing with an ISO fallback. Render dates as
`yyyy-MM-dd` via `date-fns/format`. Reject parse failure with the field-level
error pattern already used by `parseDuration` / `parseProgress`
(`TaskInspector.tsx:440-501`).

**Reasoning**:

- `chrono-node` is already imported in the bundle (search `src/` for usage).
  Free use, no bundle delta.
- ISO format matches every other date persisted by the API (`manual_start`,
  `constraint_date`).

**Alternatives considered**:

- *Native `<input type="date">`*: rejected for one reason — it cannot be cleared
  to NULL on all browsers consistently, and "clear actual finish" is a
  legitimate edit (per Edge Cases, when a PM marked something done by mistake).
  We ship a text input with a calendar-icon button that opens a native picker,
  but the underlying value is a tolerant string parser.

---

## 6. Validation contract — reject vs. clamp

**Decision**: Reject and surface a field-level error. Never silently clamp.

This is fixed by the spec (Clarifications 2026-05-09: "Reject the save with a
clear validation error; do not clamp." FR-005 explicitly disallows clamping).
No alternative — recorded here so it does not get rediscussed in PR review.

The error path uses `ApiError` semantics from
`supabase/functions/api/lib/errors.ts` so the client can surface
`fieldName + message` in the inspector.

---

## 7. Summary task rollup — when does it recompute?

**Decision**: Compute summary actuals **on read** in the client, never persist.
Add `computeActualsRollup(parentId, tasks)` in `src/lib/progress.ts` next to
the existing `computeSummaryProgress`. Call from `buildProgressMap` (renamed or
extended; see data-model.md) once per render, the same as planned progress.

**Reasoning**:

- Persisting summary values invites drift (children change → summary stale).
  The existing planned-progress rollup is computed on read and works at
  500-task scale at 60 fps.
- Direct edit of summary actuals is rejected at the inspector layer
  (FR-011 — "Direct entry of actuals on a summary task MUST be prevented")
  and re-rejected at the API layer for defense in depth.

**Alternatives considered**:

- *Materialized view on summaries*: rejected — premature; see scale numbers
  above. Reconsider if a future EVM rollup at portfolio level is slow.

---

## 8. Test strategy

**Decision**: Three test layers, all in Vitest:

1. **Pure helpers** — `actualsValidation.test.ts` (parse, validate-pair) and
   extended `progress.test.ts` (duration-weighted actuals rollup) — fastest
   feedback loop.
2. **Store** — extended `projectStore.test.ts` cases that assert
   `updateTask({ actualStart: 'x' })` does not invoke `recalculate`, does not
   mutate `manualStart`, and participates in undo/redo.
3. **UI** — new `ActualsFields.test.tsx` covers the field-level error rendering
   (the "User Story 3" scenarios) and `ActualsTrack.test.tsx` asserts the
   actuals bar renders/omits per spec User Story 4 acceptance scenarios.

No end-to-end test (no Playwright in the repo today). The acceptance scenarios
in `spec.md` are reproducible via `quickstart.md` and gated by the unit/UI
tests above.

**Coverage target**: 100% of new lib helpers; UI tests cover one happy path
and each rejected-input branch per FR.

---

## 9. Backwards compatibility

**Decision**: Migration is purely additive (`ALTER TABLE … ADD COLUMN … NULL`).
Snapshot DTO gets two new optional fields. Existing snapshots without those
fields parse as `undefined` (Zod `.optional()`), which serialize back to NULL
on the next save. No data migration needed; no existing project becomes
invalid; no API consumer (the only consumer is the SPA we are shipping)
breaks.

---

## 10. Out-of-scope, deferred to Phase 2

Recorded so they do not creep in:

- **EVM derivations** (PV, EV, AC, SPI, CPI, EAC, ETC, VAC) — explicitly
  Phase 2 per PRD §4.
- **Variance computation** (planned vs. actual deltas) — visible at-a-glance
  via the side-by-side bars; the *number* lives in Phase 2 dashboards.
- **Audit log of actuals edits** — desirable per spec Assumptions but "not
  strictly required for this release."
- **Concurrent-edit conflict detection** — last-write-wins acceptable per
  spec Assumptions.
