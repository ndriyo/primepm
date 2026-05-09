# UI Contract: Tracking Gantt Overlay

**Feature**: 002-schedule-baseline-tracking-overlay
**Layer**: React + Zustand client (no server endpoint)
**Consumers**: `GanttChart`, `TaskBar`, baseline-version selector, baseline
history view, "Set baseline" dialog.

This contract describes the deterministic mapping from
`(currentSchedule, activeBaselinePayload)` to the rendered overlay state. Pin
this contract with unit tests in
`src/components/gantt/__tests__/overlay.test.ts(x)`.

## Inputs

```ts
type RenderInputs = {
  currentTasks: Map<string, Task>;            // from useProjectStore
  currentSchedule: ScheduleResult;            // from useProjectStore.schedule
  currentCalendar: Calendar;                  // from useProjectStore.calendar
  activeBaseline?: {
    payload: BaselinePayload;                 // see data-model.md
    versionLabel: string;                     // 'v0' | 'v1' | …
  };
  // 'latest' resolves to the newest baseline header before this point;
  // not part of this contract.
};
```

## Outputs (per task row)

For every row currently rendered in the Gantt (i.e. every entry in
`useProjectStore.state.taskOrder` filtered by `collapsed`), the overlay
produces:

```ts
type RowOverlayState =
  | { kind: 'no-baseline' }                   // no baseline exists for project
  | { kind: 'unchanged'; baselineBar: BarGeometry }
  | { kind: 'variant';
      baselineBar: BarGeometry;
      variance: { startDeltaDays: number; finishDeltaDays: number };
    }
  | { kind: 'added'; baselineBar: null }      // task in current, not in baseline
  | { kind: 'removed'; baselineBar: BarGeometry; phantomCurrentBar: null };
                                              // task in baseline, not in current

type BarGeometry = {
  startDate: Date;                            // baseline computedStart
  finishDate: Date;                           // baseline computedFinish
  pixelX: number;                             // dateToX(startDate, scale)
  pixelWidth: number;                         // dateToX(finish+1) - pixelX
};
```

## State derivation rules (mandatory)

1. **No baseline → no overlay**. If `activeBaseline` is undefined, every
   row's state is `{ kind: 'no-baseline' }` and the renderer must produce
   bytes byte-identical to the pre-feature Gantt (FR-014, SC-007).

2. **Pairing key is task UUID**. Pair `currentTasks.get(id)` with
   `activeBaseline.payload.tasks.find(t => t.id === id)`. Names and parent
   ids are not used for pairing (FR-017, R6).

3. **Variance threshold**:

   ```ts
   const startDeltaDays = diffCalendarDays(currentStart, baselineStart);
   const finishDeltaDays = diffCalendarDays(currentFinish, baselineFinish);
   const isVariant = Math.abs(startDeltaDays) > 1 || Math.abs(finishDeltaDays) > 1;
   ```

   `diffCalendarDays` is calendar-day arithmetic (no time-of-day). Both
   arguments are `@db.Date` values, so this is straightforward (FR-008,
   FR-009, R7).

4. **Added / removed**:

   - In `currentTasks` but not in `activeBaseline.payload.tasks` →
     `{ kind: 'added', baselineBar: null }`. The renderer shows the current
     bar plus a small "+" badge in the row gutter (FR-010).
   - In `activeBaseline.payload.tasks` but not in `currentTasks` →
     `{ kind: 'removed', baselineBar: <baseline geometry>, phantomCurrentBar: null }`.
     The renderer shows a baseline-only bar plus a strike-through or "−"
     badge; **no current bar** is drawn (FR-011).

5. **Calendar isolation**. The baseline bar's geometry is computed using
   the baseline's own calendar. The current bar's geometry uses the
   current calendar. The shared `TimeScale` (date → pixel) does not depend
   on calendar; only working-day shading and milestone snapping do (R8).

6. **Summary tasks**. The overlay applies to leaf tasks only. Summary rows
   continue to render only the current summary bar (no baseline bar);
   variance state for a summary row is not computed in Phase 1.

7. **Milestones**. A milestone task uses the `BaselineTask.computedStart`
   as its baseline diamond position. The variance threshold is checked
   only on `start` (finish == start for milestones).

## Visual rendering rules (advisory — owners: design + frontend)

These map output state to Tailwind / CSS variables. Names are prescriptive
so the test suite can assert on class names without coupling to colour
values.

| State        | Current bar class          | Baseline bar class                | Badge        |
| ------------ | -------------------------- | --------------------------------- | ------------ |
| `unchanged`  | (existing TaskBar styling) | `bg-(--color-bar-baseline)`       | none         |
| `variant`    | `data-variance="true"`     | `bg-(--color-bar-baseline)`       | none         |
| `added`      | `data-baseline="added"`    | (no baseline bar)                 | "+" gutter   |
| `removed`    | (no current bar)           | `bg-(--color-bar-baseline) opacity-80` | "−" gutter |
| `no-baseline`| (existing TaskBar styling) | (no baseline bar)                 | none         |

The current bar in `variant` state may use any visually distinct treatment
(colour, pattern, or marker) — the contract only requires that the
`data-variance` attribute is set so behaviour can be tested deterministically
(FR-008, SC-003).

## Active baseline reference selector (header control)

```ts
type BaselineSelectorProps = {
  headers: BaselineHeader[];                  // newest first
  active: 'latest' | string;                  // baseline id or sentinel
  onChange: (next: 'latest' | string) => void;
};
```

Behaviour:

- Hidden when `headers.length <= 1` (FR-013).
- Default value: `'latest'`. The component never persists user choice across
  sessions; the active value is in the Zustand slice only (R9).
- `'latest'` resolves at render time to the header with the largest
  `versionIndex`.

## "Set baseline" dialog contract

```ts
type SetBaselineDialogProps = {
  open: boolean;
  onConfirm: (rationale: string) => Promise<void>;   // calls POST /baselines
  onCancel: () => void;
};
```

Behaviour:

- The Confirm button is **disabled** while the rationale field is empty or
  whitespace-only (FR-002, spec edge case).
- Pressing Confirm invokes `onConfirm(rationale.trim())` and shows a
  pending state until the promise resolves; the dialog closes on success.
- On error, the dialog stays open with the rationale preserved and an
  inline error message rendered.
- If the project has zero tasks, the "Set baseline" entry point in the
  toolbar is disabled with a tooltip explaining why (spec edge case).

## Performance targets (consumed by tests)

- Switching `activeBaselineRef` between two already-loaded payloads must
  re-render in **< 1 s** for a 100-task project (SC-005).
- Initial overlay render after first payload fetch must add **< 50 ms**
  per 100 tasks to the existing Gantt mount time (engineering target,
  derived from SC-005).

## Non-goals (explicitly NOT covered by this contract)

- Schedule variance metrics (SV/SPI/CV/CPI) — Phase 2.
- Resource-loading variance — out of scope.
- Persisting the active baseline reference per user — out of scope (R9).
- Live-sync of baseline events to other connected clients — Phase 3.
