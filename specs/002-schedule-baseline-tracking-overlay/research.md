# Phase 0 Research: Schedule Baseline & Tracking Gantt Overlay

**Feature**: 002-schedule-baseline-tracking-overlay
**Date**: 2026-05-09
**Spec**: ./spec.md

This document records the technical decisions taken to plan the feature, the
rationale for each choice, and the alternatives that were considered and rejected.
The Technical Context in `plan.md` references these decisions.

## Decision summary table

| ID  | Topic                                          | Decision                                                                     |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| R1  | Snapshot persistence shape                     | Single JSONB blob per baseline + denormalised header columns                 |
| R2  | Snapshot capture path                          | Server-side from canonical schedule tables, not client-uploaded payload      |
| R3  | Atomicity                                      | One Postgres transaction; insert header + payload together                   |
| R4  | Immutability                                   | DB triggers + lack of UPDATE/DELETE routes; row-level rule                   |
| R5  | Version label generation                       | Server assigns `v0`, `v1`, …; sequence is per-project                        |
| R6  | Identity preservation across versions          | Reuse `schedule_tasks.id` (UUID) as `taskExternalId` inside the snapshot     |
| R7  | Variance threshold                             | `> 1` calendar day on start OR finish; ties (`<= 1`) are not-variant         |
| R8  | Calendar handling for baseline render          | Each bar uses its own snapshot's calendar (baseline vs. current)             |
| R9  | Active-baseline selection scope                | Per-user-session via Zustand store; not persisted server-side                |
| R10 | Permission model                               | Inherits `edit project schedule`; no new role this release                   |
| R11 | Audit log channel                              | Reuse existing `audit_logs` with `action = 'baseline.set'`                  |
| R12 | Overlay rendering strategy                     | Second SVG/DOM bar layer behind current bar in same row                      |
| R13 | Lazy load of baseline payload on Gantt open    | Header-only on project load; full payload fetched when overlay first shown   |
| R14 | Concurrency & in-flight edits                  | Snapshot reads canonical tables inside the txn; uncommitted UI edits ignored |

## R1 — Snapshot persistence shape

**Decision**: Store each baseline as one row in a new `schedule_baselines` table.
The row carries denormalised header columns (`project_id`, `version_label`,
`created_by`, `created_at`, `rationale`) plus a JSONB column `payload` that
holds the full schedule snapshot (tasks, dependencies, resources, assignments,
calendar, settings).

**Rationale**:

- The current Edge Function already serializes a full schedule via
  `loadSnapshot()` (`supabase/functions/api/sql/snapshot.ts`) producing a single
  JSON shape. Storing baselines as JSONB lets us reuse that exact shape — round
  trip is `loadSnapshot` → JSONB → return; no parallel ORM mapping needed.
- A baseline is an **opaque historical record** read in full or not at all.
  Splitting it across normalised tables (`schedule_baseline_tasks`,
  `schedule_baseline_deps`, …) buys nothing here — we never query "all tasks
  whose baseline-finish is in May" — and triples migration complexity.
- JSONB indexing (`-> 'tasks'`) is available if we ever need it, but not
  required for the Phase 1 read patterns.

**Alternatives considered**:

1. _Mirror tables_ (`schedule_baseline_tasks`, `_dependencies`, `_resources`,
   `_assignments`, `_calendar`, `_settings`) joined by `baseline_id`. Rejected:
   schema drift risk — every change to a live table needs a parallel change to
   the baseline table; migration weight is high; nothing in Phase 1 uses the
   shape relationally. Reconsider in Phase 2 when SV/SPI metrics may want to
   query baseline tasks individually.
2. _External object store_ (S3 / Supabase Storage) for the JSON. Rejected: adds
   a new failure mode for atomicity (the row exists but the file does not, or
   vice versa). Postgres JSONB is plenty for project-sized payloads — the
   largest existing project in the test seed serialises to <200 KB.
3. _CDC log of every schedule change_ (replay to reconstruct any prior state).
   Rejected: belongs to Phase 3 / event sourcing; out of scope.

## R2 — Snapshot capture path

**Decision**: The "Set baseline" action calls a server endpoint with only the
project id and rationale. The server **reads the canonical schedule tables**
(`schedule_tasks`, `schedule_dependencies`, `schedule_resources`,
`schedule_assignments`, `schedule_calendar`, `schedule_settings`) inside a
single transaction and writes the JSONB into `schedule_baselines.payload`.

**Rationale**:

- Trusting the client to upload the snapshot creates a TOCTOU bug: the user
  could have unsaved/partially-saved local edits, and the snapshot would not
  match what other users see.
- Spec FR-018 ("Setting a baseline MUST be atomic") is naturally satisfied by
  a server-side `BEGIN; … INSERT; COMMIT;` wrapped around the read+write.
- The client `loadSnapshot()` shape and the server `loadSnapshot()` shape are
  already kept in sync by the existing snapshot endpoint — one canonical
  serialiser is reused.

**Alternatives considered**:

1. _Client-supplied payload_ (PUT with full JSON body). Rejected for the
   reasons above.
2. _DB-side stored procedure_ that does the snapshot fully in PL/pgSQL.
   Rejected: harder to test, harder to evolve, and our existing Edge Function
   layer already owns this serialisation.

## R3 — Atomicity guarantee

**Decision**: Implement the snapshot capture inside a single Postgres
transaction. The header row insert and the `payload` JSON construction happen
together; on any failure the transaction rolls back leaving zero trace.

**Rationale**: Spec FR-018 + SC-008. Postgres gives us this for free with the
existing `sql.begin(...)` helper used elsewhere in the Edge Function.

**Alternatives considered**: Two-phase commit / saga across mirror tables
(rejected with R1).

## R4 — Immutability enforcement

**Decision**: Two-layer enforcement.

1. **No write paths exist.** The only write endpoint creates a baseline; there
   is no UPDATE or DELETE route. The Prisma model is generated as `@@map` only
   to read — service code never calls `prisma.scheduleBaseline.update()`.
2. **DB trigger** (`AFTER UPDATE OR DELETE ON schedule_baselines`) raises an
   exception, so even raw SQL or future maintenance scripts cannot silently
   mutate a baseline.

**Rationale**: Spec FR-005. Application-only enforcement is brittle — a future
admin script or migration could violate it; the trigger is a belt-and-braces
guarantee suited to "evidence" data.

**Alternatives considered**:

1. _Foreign-data-only (read-only Postgres role)_. Rejected: too coarse — the
   service role legitimately INSERTs new baselines.
2. _Append-only event sourcing_. Rejected: see R1 alt 3.

## R5 — Version label generation

**Decision**: The server computes `version_label = 'v' || (count of existing
baselines for this project)` inside the same transaction that inserts the new
row. Sequence starts at `v0`. A unique constraint
`(project_id, version_label)` prevents duplicates if two writers race.

**Rationale**:

- Users should never type "v3" themselves — it is a derived label, and the
  spec assumption explicitly rules out user-named baselines.
- Computing inside the transaction (with `SELECT … FOR UPDATE` on a per-project
  guard row, _or_ relying on the unique-constraint retry path) closes the
  race window.

**Alternatives considered**:

1. _Postgres SEQUENCE per project_. Rejected: per-project sequences require
   dynamic SQL; not worth the complexity at this scale.
2. _Client-generated label_. Rejected per spec assumption.

## R6 — Identity preservation across versions

**Decision**: Inside the JSONB payload, every task is keyed by its
`schedule_tasks.id` (UUID). The overlay pairs `currentTask.id` with
`baselineTask.id`. Renames and reparenting do not break the pairing because
the UUID is independent of name and tree position.

**Rationale**: Spec FR-017. The schedule already uses UUIDs as the primary key
for tasks; we just keep using them.

**Alternatives considered**: Hash of `(name + parentId)` (rejected: not
stable; rename breaks pairing — exactly the spec scenario).

## R7 — Variance threshold semantics

**Decision**: A task is variant when `abs(currentStart - baselineStart) > 1
day` **OR** `abs(currentFinish - baselineFinish) > 1 day`. Both starts and
finishes are compared as calendar dates (no time-of-day component); the
schedule already stores them as `@db.Date`.

**Rationale**: Spec clarification 2026-05-09 + FR-008/FR-009. The asymmetric
"1 day" tolerance covers timezone artefacts and same-day adjustments without
flagging noise.

**Edge case**: A task that exists in current but not baseline is "added" (not
"variant"); a task that exists in baseline but not current is "removed". These
are separate visual states (FR-010, FR-011), not variant states.

## R8 — Calendar handling for baseline render

**Decision**: When drawing the baseline bar, use the baseline's own calendar
(stored in the snapshot payload). When drawing the current bar, use the
current calendar. The Gantt timeScale (pixel/date conversion) uses a single
shared timeline, but working-day shading and milestone snapping respect the
respective calendar.

**Rationale**: Spec edge case "the current calendar differs from the baseline
calendar". Pretending the calendars are identical would be a silent lie.

**Implementation note**: `engine/calendar.ts` exports a `Calendar` type already
holding `workingDaysOfWeek`, `holidays`, `hoursPerDay`. Snapshot payload
already carries the same structure. We instantiate two `Calendar` objects on
overlay open.

## R9 — Active-baseline selection scope

**Decision**: The active baseline reference (the version the overlay compares
against) is held in the Zustand `projectStore` slice and is **session-scoped**.
It is **not** persisted server-side and is **not** stored in `localStorage`.
Default value: "latest".

**Rationale**:

- Spec assumption: "Selected per-user-session via the Gantt header control".
- Persisting it would create cross-user surprise (PMO opens project → sees
  someone else's selection from yesterday). Defaulting to "latest" is
  predictable.
- A future "remember my last view" feature can layer on top by storing the
  user's preference under their own user id — out of scope here.

## R10 — Permission model

**Decision**: A user can call "Set baseline" iff they have `edit project
schedule` permission on that project. No new role/scope is introduced.

**Rationale**: Spec clarification 2026-05-09 ("Anyone with permission to edit
the project schedule"). Phase 3 will introduce the change-request workflow
that gates rebaselines; do not pre-build that.

**Implementation note**: The existing Edge Function `getAuth(c)` returns the
authenticated user; the route will reuse the same permission check the
existing `PUT /projects/:id` snapshot route uses (today both routes are
authenticated; project-scoped permission is enforced by RLS on
`schedule_tasks` and friends).

## R11 — Audit log channel

**Decision**: Reuse the existing `audit_logs` table. New action string:
`baseline.set`. `entity_type = 'ScheduleBaseline'`, `entity_id = <baseline
id>`. The rationale and version label are duplicated in the baseline row
itself, so the audit log only needs to record _that_ the event happened.

**Rationale**: Spec FR-015 + assumption "audit log facility already exists and
accepts arbitrary event types".

## R12 — Overlay rendering strategy

**Decision**: Render baseline bars as a thinner secondary bar **behind and
slightly offset from** the current bar in the same row. Variance state drives
the colour of the current bar; the baseline bar is a constant neutral shade
(e.g. `--color-bar-baseline`). Added tasks have no baseline bar (and a small
"+" badge). Removed tasks have only a baseline bar (and a strike-through or
"–" badge).

**Rationale**:

- Existing `TaskBar` (`src/components/gantt/TaskBar.tsx`) renders one bar per
  row using `motion.div` and absolute positioning. Adding a second motion
  element keyed `baseline-${task.id}` slots cleanly into the same row.
- Two-bar layouts (current top / baseline bottom) are the established Gantt
  convention (MS Project tracking Gantt; Smartsheet baseline view).

**Alternatives considered**:

1. _Single bar with a "ghost" outline_. Rejected: harder to read variance at
   high zoom levels.
2. _Toggleable overlay_. Rejected: spec FR-007 says overlay is automatic
   whenever any baseline exists; toggling adds a click without value.

## R13 — Lazy load of baseline payload

**Decision**: On project load, fetch only the **list of baseline headers**
(version, timestamp, creator, rationale, id). Fetch the **full payload** of
the active baseline only when (a) the user opens the Gantt view _and_ (b) at
least one baseline exists. Cache the loaded payload in the Zustand store keyed
by baseline id, so switching the active reference between already-loaded
versions is instantaneous.

**Rationale**: Spec SC-005 ("re-render the overlay against the chosen version
within 1 second on a project of 100 tasks"). A 100-task project's payload is
~50 KB; fetching on demand is well under 1 s on a typical connection.
Pre-fetching every payload at project load would inflate the initial
project-page bundle for users who never look at the Gantt.

**Alternatives considered**: Eager-load the latest payload at project load
(rejected: wastes bandwidth for users who never open the Gantt).

## R14 — Concurrency & in-flight edits

**Decision**: The "Set baseline" endpoint reads the canonical schedule tables
inside the same transaction it writes the baseline. Edits made by other users
that have **not** been committed (e.g. drag-in-progress in another browser)
are by definition not in those tables, so they are correctly excluded.

**Rationale**: Spec edge case ("two users modify the schedule concurrently and
one of them sets a baseline mid-edit"). Postgres transaction isolation gives
us this for free; no additional locking is needed because the snapshot read
takes a `REPEATABLE READ` (or `READ COMMITTED` with single-statement reads —
both are fine since we capture the row state at the moment of read).

**Implementation note**: We do **not** broadcast a "baseline taken" event to
other connected clients in Phase 1. They will see the new baseline on the next
project load or refresh. Live-sync of baselines is out of scope.

## Open questions deferred to Phase 2 / Phase 3

The following are explicitly **not** decided here because the spec scopes them
out:

- **Variance metrics (SV, SPI, CV, CPI)** — Phase 2 will derive these from the
  baseline payload; the data is sufficient.
- **Change-request workflow** that gates rebaselines — Phase 3.
- **Portfolio-level baseline rollups** — out of scope.
- **Actuals capture** (% complete, actual start/finish) — covered by spec
  003-actuals-capture, not here.
- **Live-sync of baselines** to connected clients — Phase 3.

## Outstanding NEEDS CLARIFICATION

None. The spec's three Q/A clarifications (variance threshold, mandatory
rationale, permission inheritance) are covered above by R7, R5/R3, and R10
respectively. All other technical unknowns are resolved by R1–R14.
