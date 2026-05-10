# UI Contract: Actuals — Task Inspector & Tracking Gantt

**Feature**: 003-actuals-capture
**Layer**: React + Zustand client
**Consumers**: `TaskInspector`, `GanttChart`, `TaskBar`, `BaselineBar` (002),
new `ActualsBar`, new `ActualsAuditPanel`.

This contract describes the deterministic mapping from
`(task, schedule, actualsState, auditEntries)` to the rendered inspector
fields, three-track Gantt, and audit panel. Pin this contract with unit
tests in `src/components/inspector/__tests__/actuals.test.tsx` and
`src/components/gantt/__tests__/actualsOverlay.test.tsx`.

## 1. Inputs

```ts
type InspectorActualsInputs = {
  task: Task;                        // Includes new actualStart, actualFinish; existing progressPct
  isLeaf: boolean;                   // false for summary tasks
  childActuals: ChildActualsRollup;  // computed from descendants when isLeaf === false; otherwise unused
  validationErrors: ValidationErrors;// { progressPct?: string; actualStart?: string; actualFinish?: string }
  pending: boolean;                  // true while a save is in flight
};

type ChildActualsRollup = {
  rolledUpProgressPct: number | null;       // duration-weighted, 0..100, null if no leaf children have progress
  earliestActualStart: string | null;       // ISO date or null
  latestActualFinish: string | null;        // ISO date or null — only non-null when ALL leaves finished
};
```

## 2. Outputs (per task)

For every task selected in the inspector:

```ts
type InspectorActualsState =
  | { kind: 'leaf-empty';     editable: true;  showRolledUp: false; values: ActualsSnapshot /*all-null*/ }
  | { kind: 'leaf-progress';  editable: true;  showRolledUp: false; values: ActualsSnapshot /*partial*/ }
  | { kind: 'leaf-finished';  editable: true;  showRolledUp: false; values: ActualsSnapshot /*all set*/ }
  | { kind: 'summary-rolled'; editable: false; showRolledUp: true;  rollup: ChildActualsRollup };
```

## 3. Inspector layout rules (mandatory)

1. **Section placement.** The "Actuals" section MUST appear **directly
   below** the existing "Start (computed) / Finish (computed)" two-column
   grid in `TaskInspector.tsx`. It uses the same `<Field label="…">` block
   used by the rest of the inspector.

2. **Field order.** Within the Actuals section the visual order is:
   `% complete` (full-width) → `actual start | actual finish` (2-column
   grid). Tab order matches visual order.

3. **Empty-state placeholder.** When `task.actualStart` and
   `task.actualFinish` are null, the date inputs render the placeholder
   text `not yet recorded` (FR-009). The progress field still shows the
   numeric `progressPct` (typically 0 in this state).

4. **Summary task handling.** When `isLeaf === false`:
   - All three fields are read-only (FR-011, US5 AS4).
   - Each field displays the rolled-up value from `childActuals`. The
     `% complete` shows `rolledUpProgressPct ?? '—'`; dates show
     `earliestActualStart ?? '—'` and `latestActualFinish ?? '—'`.
   - A small lock icon + tooltip "derived from children" appears in the
     section header.
   - Editing affordances (focus rings, hover backgrounds) are removed.

5. **Validation rendering.**
   - Inline error message renders directly beneath the offending field in
     `bg-(--color-danger-faint) text-(--color-danger)`, with the field's
     border switched to `--color-danger`.
   - The Save button (the existing "Done" footer button on the inspector)
     stays enabled — the existing inspector saves on field blur, not on a
     submit click. Validation errors are surfaced **at blur time** and
     prevent the field's value from being committed to the store. The
     full atomic save (FR-010) only fires once all fields validate.
   - Specific errors:
     - `progress_pct_range`: "% complete must be between 0 and 100"
       (FR-005). The field MUST NOT clamp; the entered text remains in
       the input until corrected.
     - `actuals_order`: "Actual finish cannot be earlier than actual
       start" (FR-006). Highlighted on the `actualFinish` field.
     - `invalid_date`: "Enter a valid date (YYYY-MM-DD)".

6. **Auto-fill UX echo (FR-017).**
   - When the user types `100` into `% complete` and blurs, the
     `actualFinish` field's placeholder changes from `not yet recorded`
     to `today (auto)` until the save completes; once the server confirms,
     the placeholder is replaced by today's date as the actual value.
   - When the user types a date into `actualFinish` and blurs while
     `% complete < 100`, the `% complete` field shows `100` immediately
     (matching the server-side rule). The transient pre-server change is
     marked via `data-auto-fill="pending"` so tests can observe it.
   - If the user explicitly types both fields, neither auto-fill applies
     (matches FR-017's "MUST NOT override an explicit user-entered value").
     The contract: a field is "user provided" iff its onChange handler
     fired during the current edit session (tracked locally in the
     inspector by a `Set<string>` of touched fields).

7. **Atomic save (FR-010).** The existing inspector save path already
   issues a single `updateTask` Zustand action which routes through the
   project save endpoint. The actuals fields piggy-back on that same
   call by being included in the same payload — there is no separate
   "save actuals" button.

## 4. Tracking Gantt — three-track row

The 002 contract already pins two-bar rendering. This feature adds a
third lane.

```ts
type ActualsRowState =
  | { kind: 'no-actuals'; bar: null }                            // task has none of progressPct>0/actualStart/actualFinish
  | { kind: 'in-progress'; bar: ActualsBarGeometry }             // actualStart set, actualFinish null
  | { kind: 'finished';   bar: ActualsBarGeometry; flag: true }; // actualStart set, actualFinish set, % = 100

type ActualsBarGeometry = {
  startDate: Date;        // actualStart (or, if absent but progressPct > 0, the planned start)
  finishDate: Date;       // actualFinish (or 'today' clipped to the visible range)
  pixelX: number;
  pixelWidth: number;
  // For `in-progress` rows the renderer adds a hatched right edge to
  // signal "still running"; this is purely a CSS treatment driven by
  // the data-actuals attribute below.
};
```

### 4.1 Rendering rules

1. **Lane layout.** Within a row of height `ROW_HEIGHT` (28 px):
   - Current bar: 22 px tall, centered in row (existing).
   - Baseline bar: 6 px tall (variant) or 10 px (unchanged), 6–16 px
     below current bar (existing — see 002 R12).
   - Actuals bar: 6 px tall, **above** the current bar by 6 px from its
     top edge.
   This satisfies SC-009 (three distinct tracks without horizontal
   overflow on a 1280px viewport).

2. **No-actuals → no bar.** If `kind === 'no-actuals'`, the actuals lane
   renders nothing for that row (the row continues to show baseline +
   current bars normally — FR-015 fallback).

3. **Coexistence with baseline overlay.** When both 002 baseline overlay
   and 003 actuals are active on the same row:
   - The row renders three lanes (baseline, current, actuals) per the
     above measurements.
   - The 002 `data-variance="true"` attribute keeps its meaning
     (baseline ↔ current). A new attribute `data-actuals-variance="true"`
     is set when the actuals start or finish differs from the current
     planned values by more than 1 calendar day, parallel to the 002
     rule but on the actuals-vs-current pair.

4. **Summary row behavior.** Summary rows render only the current
   summary bar; no baseline bar (existing 002 rule), no actuals bar. The
   inspector still shows rolled-up actuals values; the Gantt does not
   need a third visual axis on summaries.

5. **Milestones.** A milestone task with an `actualFinish` recorded gets
   a small filled diamond at the actualFinish position rendered in the
   actuals lane (no "bar"). With `actualStart` only, the actuals lane is
   empty for milestones.

### 4.2 `data-*` attributes (test-stable)

| Attribute                         | Set on             | Values                         | Purpose                                                                             |
| --------------------------------- | ------------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| `data-actuals`                    | row container      | `present` / `absent`           | Test gate for "this row has any actuals state"                                      |
| `data-actuals-state`              | actuals bar (when present) | `in-progress` / `finished` | Lets tests assert progress vs done without coupling to colours                     |
| `data-actuals-variance`           | row container      | `true` (when applicable)       | Like 002's `data-variance` but for the actuals-vs-current pair                      |

## 5. Audit panel contract

A small overlay panel that opens from a "history" button in the Actuals
section header. Lives at
`src/components/inspector/ActualsAuditPanel.tsx`.

```ts
type AuditPanelProps = {
  taskId: string;
  open: boolean;
  onClose: () => void;
};

type AuditEntryRowProps = {
  entry: AuditEntry;          // see data-model.md
};
```

### 5.1 Behavior

1. The panel is a slide-in drawer from the right (matching the inspector
   pattern), 360 px wide, with the same `motion.aside` style. It does not
   replace the inspector — both are open side-by-side when the user opts
   to see history.

2. Entries are rendered newest-first. Each entry shows:
   - Action label: "Started", "Updated", "Cleared", "Deleted with task"
     mapped from the `action` field.
   - Actor full name and time-ago string ("3h ago"), plus exact ISO
     timestamp on hover (`title` attribute).
   - A two-column diff: `before` on the left, `after` on the right, with
     differing fields highlighted in `bg-(--color-warning-faint)`.

3. Pagination: the panel calls `loadActualsAudit(taskId, cursor)` per
   spec; the `nextCursor` cursor surfaces a "Load more" button at the
   bottom when present.

4. **Deleted-task entries** (FR-019). When the task no longer exists in
   the live store (the user opens audit from a project-history view, not
   the inspector), the panel still renders the audit rows: the `taskId`
   in the audit row remains the source of truth. The panel header reads
   "Task deleted" with a muted treatment.

5. The audit panel is **read-only**. There is no UI affordance to edit
   or delete an entry (FR-016).

## 6. Performance targets (consumed by tests)

- The actuals inspector save round-trip: server p95 ≤ 500 ms (SC-010).
- Inspector render for a task with all three fields populated: < 16 ms
  (one frame at 60 fps).
- Gantt row render with three lanes: < 50 ms additional per 100 tasks
  versus the pre-feature two-lane render (engineering target derived
  from existing 002 budgets).
- Audit panel first paint after open: < 200 ms with up to 50 entries.

## 7. Non-goals (explicitly NOT covered by this contract)

- EVM derivations (PV, EV, AC, SPI, CPI) — Phase 2.
- Live-sync of actuals to other connected clients — Phase 3.
- Conflict-detection on concurrent saves — out of scope (last-write-wins
  per spec assumption).
- Auto-derivation of `% complete` from time logs — out of scope.
- Editing or deleting audit entries — explicitly forbidden by FR-016.

## 8. Rendering test matrix (advisory)

| Scenario                                                                       | Inspector state                | Gantt row state                | Audit panel state         |
| ------------------------------------------------------------------------------ | ------------------------------ | ------------------------------ | ------------------------- |
| Task created, no actuals saved yet                                             | `leaf-empty`, all placeholders | `no-actuals` (no third lane)   | empty (no entries)        |
| `% = 30, actualStart = today-7d, actualFinish = null`                          | `leaf-progress`                | `in-progress`, hatched right   | one `task.actuals.set`    |
| `% = 100` saved, server auto-fills `actualFinish = today`                      | `leaf-finished`                | `finished` + flag at edge      | one `task.actuals.update` with after.actualFinish auto-filled |
| `actualFinish = today` saved while `% = 50` → server auto-bumps `% = 100`      | `leaf-finished`                | `finished` + flag              | one `task.actuals.update` with after.progressPct = 100 |
| `% = 50` saved with `actualFinish < actualStart`                               | error inline on `actualFinish` | unchanged (save rejected)      | no new entry              |
| `% = 150` saved                                                                | error inline on `% complete`   | unchanged (save rejected)      | no new entry              |
| Summary task selected with three children of progress 100/50/0 and equal duration | `summary-rolled`, `% = 50`     | (summary bar only)             | (panel disabled — not a leaf) |
| Task deleted; audit panel reopened from project history                        | (panel-only, no inspector)     | (no row)                       | trailing `task.actuals.deleted` event preserved |
