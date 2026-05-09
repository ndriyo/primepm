# Phase 1 Data Model — Actuals Capture

**Feature**: 003-actuals-capture
**Date**: 2026-05-09

This document is the source of truth for entity shape, field semantics, validation, and rollup arithmetic. All implementation files (Prisma schema, Zod schemas, TS types, snapshot DTO, SQL writes/reads) MUST conform to what is written here.

---

## 1. Persisted entity — `schedule_tasks` (extended)

Three columns are added to the existing `schedule_tasks` table. No new table.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `progress_pct` | `SMALLINT` | NOT NULL | `0` | **Existing column.** Repurposed semantically as **actual percent complete** (0–100). The CPM engine does not read this field. |
| `actual_start_date` | `DATE` | NULL | NULL | NEW. NULL = "not yet recorded". Calendar date, no time-of-day. |
| `actual_finish_date` | `DATE` | NULL | NULL | NEW. NULL = "not yet recorded". Must be ≥ `actual_start_date` when both are set. |

**DDL (additive, no data migration):**

```sql
ALTER TABLE schedule_tasks
  ADD COLUMN actual_start_date  DATE NULL,
  ADD COLUMN actual_finish_date DATE NULL,
  ADD CONSTRAINT schedule_tasks_actuals_dates_chk
    CHECK (actual_finish_date IS NULL
           OR actual_start_date IS NULL
           OR actual_finish_date >= actual_start_date);
```

The `CHECK` constraint is a defense-in-depth guard. The primary error surface
is Zod at the API layer; the DB constraint exists so a buggy client cannot
poison data.

**Prisma schema delta** (`prisma/schema.prisma`, model `ScheduleTask` lines 391–423):

```prisma
model ScheduleTask {
  // ... existing fields ...
  progressPct        Int       @default(0) @map("progress_pct") @db.SmallInt
  actualStartDate    DateTime? @map("actual_start_date")  @db.Date
  actualFinishDate   DateTime? @map("actual_finish_date") @db.Date
  // ... existing fields ...
}
```

No new index — actuals are not queried by themselves; they are always loaded
alongside the parent task row.

---

## 2. Engine TS type — `Task` (extended)

`src/engine/types.ts:24-39`. The engine does not consume actuals, but the
domain `Task` shape is the canonical representation everywhere outside the DB,
so the fields live here.

```typescript
export interface Task {
  id: string;
  name: string;
  durationDays: number;
  manualStart?: Date;
  scheduleMode: ScheduleMode;
  constraint: Constraint;
  parentId?: string;
  isMilestone: boolean;
  /** Actual percent complete, 0..100 inclusive integer. */
  progressPct: number;
  /** Actual start date — calendar day, no time. NULL = not yet recorded. */
  actualStart?: Date;
  /** Actual finish date — calendar day, no time. NULL = not yet recorded. */
  actualFinish?: Date;
  color?: string;
  notes?: string;
}
```

Doc-comment on `progressPct` is updated to declare its actual-progress
semantics (research.md §3).

---

## 3. Validation rules

These rules are enforced in this order at the API layer (`taskUpdateSchema` in
`supabase/functions/api/lib/validation.ts`) and mirrored at the inspector field
layer:

| Rule | Field(s) | Error code | Message (user-facing) | Spec ref |
|---|---|---|---|---|
| **R-1** | `progressPct` | `progress_out_of_range` | "% complete must be between 0 and 100" | FR-005 |
| **R-2** | `progressPct` | `progress_not_integer` | "% complete must be a whole number" | FR-001 (integer 0–100) |
| **R-3** | `actualStart`, `actualFinish` | `actual_finish_before_start` | "Actual finish cannot be earlier than actual start" | FR-006 |
| **R-4** | `actualStart`, `actualFinish` | `actual_invalid_date` | "Date is not valid" | derived |
| **R-5** | (parent task) | `summary_actuals_readonly` | "Actuals on a summary task are derived; edit children instead" | FR-011 |

**Clamping is explicitly disallowed** (Clarifications 2026-05-09): a value of
`-1` or `150` triggers R-1 and produces a 400; it is never silently coerced
into the 0–100 range.

R-3 fires when **both** dates are present. A NULL `actualFinish` while
`actualStart` is set is the legitimate in-progress state (FR-007).

R-5 fires when the patch contains any of `progressPct`, `actualStart`,
`actualFinish` AND the row's `parent_id` is non-null and the row has children
(detect cheaply with a single `SELECT EXISTS (… WHERE parent_id = $1)`). The
inspector also disables the fields when the selected task is a summary, but
the API enforces it independently for defense in depth.

Future-date warning (Edge Cases §2) is a **client-side soft warning**, not a
rejection — the API accepts a future `actualStart` because PMs may legitimately
record planned-cutover dates this way.

---

## 4. Snapshot DTO extension

`supabase/functions/api/sql/snapshot.ts`:

```typescript
interface SerializedTask {
  id: string;
  name: string;
  notes?: string;
  durationDays: number;
  isMilestone: boolean;
  scheduleMode: 'auto' | 'manual';
  manualStart?: string;        // ISO 8601 date-time string
  constraint:
    | { kind: 'ASAP' }
    | { kind: 'SNET' | 'FNET' | 'MSO' | 'MFO'; date: string };
  progressPct: number;          // 0..100, semantics now "actual"
  actualStart?: string;         // NEW — ISO 8601 date string. Omitted if NULL.
  actualFinish?: string;        // NEW — ISO 8601 date string. Omitted if NULL.
  color?: string;
  parentId?: string;
}
```

`rowToTask()` (existing, lines 120-141) is extended to populate `actualStart`
and `actualFinish` from the new DB columns when non-null. `saveSnapshot()`
two-pass insert (lines 250-284) appends the two columns to the INSERT
statement.

**Backwards compatibility**: existing serialized snapshots without these keys
parse cleanly because both fields are `.optional()` in
`serializedTaskSchema`. On next save, the values become NULL in the DB.

---

## 5. Summary rollup — `computeActualsRollup`

A new pure function in `src/lib/progress.ts`, alongside the existing
`computeSummaryProgress` and `buildProgressMap`.

### Signature

```typescript
export interface ActualsRollup {
  actualStart: Date | null;     // earliest actual_start across all leaf descendants; null if none have it
  actualFinish: Date | null;    // latest actual_finish across all leaf descendants ONLY IF every leaf has it; else null
  progressPct: number;          // duration-weighted, see formula below; 0 if no descendants
}

export function computeActualsRollup(
  parentId: string,
  tasks: Map<string, Task>,
): ActualsRollup;

export function actualsRollupWithIndex(
  parentId: string,
  tasks: Map<string, Task>,
  childrenOf: Map<string, string[]>,
): ActualsRollup;
```

### Formula (FR-011 + Clarifications 2026-05-09)

Walk every leaf descendant of `parentId`.

```
Let L = { leaf descendants of parentId }
Let w(t) = max(t.durationDays, 1)               // milestone weight = 1
totalWork = Σ_{t ∈ L} w(t)
doneWork  = Σ_{t ∈ L} w(t) × clamp(t.progressPct, 0, 100) / 100

progressPct  = round(doneWork / totalWork × 100)         // 0 if totalWork == 0

actualStart  = min({ t.actualStart : t ∈ L, t.actualStart != null })
                or null if none exist

actualFinish = max({ t.actualFinish : t ∈ L })
                ONLY IF every t ∈ L has t.actualFinish set,
                else null
```

The `progressPct` rollup formula matches the existing planned-progress rollup
(`progress.ts:51-75`) bit-for-bit — that function already does
duration-weighted aggregation and now serves both purposes since
`progress_pct` *is* the actuals progress (research.md §3). **Therefore the
existing `summaryProgressWithIndex` is reused unchanged for actuals
progressPct rollup.** The only new logic is the date aggregation.

### Worked example

| Task | type | duration | actualStart | actualFinish | progressPct |
|---|---|---|---|---|---|
| `S` | summary | — | — | — | (derived) |
| ↳ `A` | leaf | 4 | 2026-05-01 | 2026-05-04 | 100 |
| ↳ `B` | leaf | 6 | 2026-05-05 | NULL | 50 |
| ↳ `C` | leaf | 2 | NULL | NULL | 0 |

```
totalWork = 4 + 6 + 2 = 12
doneWork  = 4×1.00 + 6×0.50 + 2×0.00 = 7
progressPct = round(7/12 × 100) = 58

actualStart  = min(2026-05-01, 2026-05-05) = 2026-05-01
actualFinish = NULL  (because B and C have no actual_finish)
```

This matches the spec User Story 5 acceptance scenarios exactly.

### Edit prevention on summaries

Direct edit of `progressPct`, `actualStart`, or `actualFinish` on a summary
task is rejected with R-5 above and disabled in the UI (the three fields
become read-only labels showing the rollup result).

---

## 6. Identity, lifecycle, deletion

- **Creation**: actuals "exist" the moment a user enters any of the three
  values for a leaf task. There is no separate `actuals_id` — they are
  columns of the task row, so they are created when the row is created
  (NULL by default) and persisted when the user saves a non-NULL value.
- **Update**: any subsequent edit overwrites the previous value. No
  versioning (spec Assumptions §10).
- **Deletion**: handled by the existing `DELETE FROM schedule_tasks` cascade.
  No orphaned actuals possible (FR-012 satisfied trivially).
- **Baseline interaction**: actuals columns are explicitly excluded from any
  baseline snapshot (FR-013). The baseline feature (002) defines its own
  snapshot table and only copies the columns it needs (`name`, dates,
  durations, dependencies, costs); we add nothing to its column list.

---

## 7. Read paths

| Caller | Reads | Notes |
|---|---|---|
| `loadSnapshot()` initial project load | `progress_pct`, `actual_start_date`, `actual_finish_date` | Existing SELECT extended by two columns. |
| `TaskInspector` open | All three fields from store (already loaded) | No new fetch. |
| `TaskBar` (Gantt) per-row render | All three fields + rolled-up values from `buildActualsMap()` | Same render-pass map pattern as existing `buildProgressMap`. |
| Phase 2 EVM (out of scope here) | All three fields | Mentioned for forward-compatibility only; no code in this feature. |

---

## 8. Write paths

| Caller | Writes | Notes |
|---|---|---|
| `PATCH /api/projects/:id/tasks/:taskId` | Up to three columns conditionally | Existing handler pattern; one UPDATE per provided field. |
| `PUT /api/projects/:id` (full snapshot) | All three columns inside `INSERT INTO schedule_tasks` | `saveSnapshot` rewrites the project; new columns appended to INSERT. |
| Local store debounced sync | Triggers the PATCH endpoint above | No new code path; the store's existing debounced patch carries the new keys. |

There is no separate "save actuals" endpoint and no separate save action in
the inspector (FR-010). All three values flow through the same PATCH the
inspector already calls when the user changes any other field.
