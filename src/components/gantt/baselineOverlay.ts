// Spec 002 — pure overlay state derivation.
// Contract: specs/002-schedule-baseline-tracking-overlay/contracts/overlay-ui.contract.md
//
// Maps (currentTasks, currentSchedule, activeBaselinePayload) → per-task
// RowOverlayState. Names + shapes pinned by overlay.test.tsx.

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { recalculate, type Calendar, type DayOfWeek, type Dependency, type Task, type ScheduledTask } from '../../engine';
import type { BaselinePayloadDto } from '../../api/types';

export type RowOverlayKind = 'no-baseline' | 'unchanged' | 'variant' | 'added' | 'removed';

export interface BarGeometry {
  startDate: Date;
  finishDate: Date;
}

export type RowOverlayState =
  | { kind: 'no-baseline' }
  | { kind: 'unchanged'; baselineBar: BarGeometry }
  | {
      kind: 'variant';
      baselineBar: BarGeometry;
      variance: { startDeltaDays: number; finishDeltaDays: number };
    }
  | { kind: 'added'; baselineBar: null }
  | { kind: 'removed'; baselineBar: BarGeometry; phantomCurrentBar: null };

export interface OverlayInputs {
  currentTasks: Map<string, Task>;
  currentSchedule: Map<string, ScheduledTask>;
  activeBaselinePayload?: BaselinePayloadDto;
  /** Ids of tasks that are summaries in the CURRENT schedule. The overlay
   * skips these (per overlay-ui.contract.md §6 — Phase 1 scope). */
  summaryIds?: ReadonlySet<string>;
}

/**
 * Threshold = strictly more than 1 calendar day on EITHER start or finish in
 * either direction (FR-008 / FR-009). The boundary `delta === ±1` is NOT
 * variant.
 */
const VARIANCE_THRESHOLD_DAYS = 1;

/**
 * Run the real scheduling engine against the FROZEN baseline payload and
 * return per-task (start, finish) Dates. This honours dependencies, working
 * days, holidays, and constraints — exactly what the user saw at capture
 * time, recovered deterministically because the calendar is frozen inside
 * the snapshot.
 *
 * If the server happens to ship `computedStart` / `computedFinish` (future
 * enhancement), those are used directly and the engine is skipped.
 *
 * Memoised by payload identity at the call site (computeRowOverlayStates).
 */
function recomputeBaselineSchedule(
  payload: BaselinePayloadDto,
): Map<string, { start: Date; finish: Date }> {
  // Fast path — server-precomputed dates.
  const allPrecomputed =
    payload.tasks.length > 0 &&
    payload.tasks.every(t => t.computedStart && t.computedFinish);
  if (allPrecomputed) {
    const out = new Map<string, { start: Date; finish: Date }>();
    for (const t of payload.tasks) {
      out.set(t.id, {
        start: parseISO(t.computedStart as string),
        finish: parseISO(t.computedFinish as string),
      });
    }
    return out;
  }

  // Convert payload → engine inputs.
  const tasks = new Map<string, Task>();
  for (const t of payload.tasks) {
    const constraint =
      t.constraint.kind === 'ASAP'
        ? { kind: 'ASAP' as const }
        : { kind: t.constraint.kind, date: parseISO(t.constraint.date) };
    tasks.set(t.id, {
      id: t.id,
      name: t.name,
      durationDays: t.durationDays,
      scheduleMode: t.scheduleMode,
      manualStart: t.manualStart ? parseISO(t.manualStart) : undefined,
      constraint,
      progressPct: t.progressPct,
      isMilestone: t.isMilestone,
      parentId: t.parentId ?? undefined,
      color: t.color ?? undefined,
      notes: t.notes ?? undefined,
    });
  }

  const deps = new Map<string, Dependency>();
  for (const d of payload.dependencies) {
    deps.set(d.id, {
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type,
      lagDays: d.lagDays,
    });
  }

  const calendar: Calendar = {
    workingDaysOfWeek: new Set<DayOfWeek>(payload.calendar.workingDaysOfWeek as DayOfWeek[]),
    holidays: new Set<string>(payload.calendar.holidays),
    hoursPerDay: payload.calendar.hoursPerDay,
  };

  const projectStart = parseISO(payload.project.start);
  const result = recalculate(tasks, deps, calendar, projectStart);

  const out = new Map<string, { start: Date; finish: Date }>();
  for (const [id, sched] of result.scheduled) {
    out.set(id, { start: sched.start, finish: sched.finish });
  }
  return out;
}

export function computeRowOverlayStates(inputs: OverlayInputs): Map<string, RowOverlayState> {
  const result = new Map<string, RowOverlayState>();
  const { currentTasks, currentSchedule, activeBaselinePayload, summaryIds } = inputs;
  const isSummary = (id: string) => summaryIds?.has(id) === true;

  // 1. No baseline → all rows are no-baseline (FR-014, SC-007).
  if (!activeBaselinePayload) {
    for (const id of currentTasks.keys()) result.set(id, { kind: 'no-baseline' });
    return result;
  }

  // Index baseline tasks by UUID (R6 — pairing key is task UUID).
  const baselineById = new Map<string, BaselinePayloadDto['tasks'][number]>();
  for (const t of activeBaselinePayload.tasks) baselineById.set(t.id, t);

  // Recompute the baseline's full schedule from the frozen payload via the
  // engine, honouring dependencies / working-day calendar / constraints.
  const baselineSched = recomputeBaselineSchedule(activeBaselinePayload);

  // Precompute the set of baseline-side summary ids in a single pass over
  // the payload — every id that appears as a parentId is a summary. Used to
  // skip baseline-only summaries from `removed` rows (overlay-ui.contract.md
  // §6 — overlay applies to leaf tasks only in Phase 1).
  const baselineSummaryIds = new Set<string>();
  for (const t of activeBaselinePayload.tasks) {
    if (t.parentId) baselineSummaryIds.add(t.parentId);
  }

  // 2. Walk current tasks first.
  for (const [id, _task] of currentTasks) {
    // Per overlay-ui.contract.md §6 — overlay applies to leaf tasks only.
    // Summary rows continue to render only the current summary bar.
    if (isSummary(id)) {
      result.set(id, { kind: 'no-baseline' });
      continue;
    }

    const baseline = baselineById.get(id);
    const sched = currentSchedule.get(id);
    if (!baseline) {
      result.set(id, { kind: 'added', baselineBar: null });
      continue;
    }

    const baselineDates =
      baselineSched.get(id) ??
      // Fallback if the engine did not produce a schedule entry (e.g. cycle).
      // Prefer manualStart / constraint date / project.start, no engine math.
      (() => {
        let start: Date;
        if (baseline.scheduleMode === 'manual' && baseline.manualStart) {
          start = parseISO(baseline.manualStart);
        } else if (baseline.constraint.kind !== 'ASAP') {
          start = parseISO(baseline.constraint.date);
        } else {
          start = parseISO(activeBaselinePayload.project.start);
        }
        const finish = new Date(start);
        finish.setDate(finish.getDate() + Math.max(0, baseline.durationDays - 1));
        return { start, finish };
      })();
    const baselineStart = baselineDates.start;
    const baselineFinish = baselineDates.finish;

    // If we have no current schedule entry yet, treat as unchanged at the
    // baseline geometry (best-effort; render layer can elide).
    if (!sched) {
      result.set(id, {
        kind: 'unchanged',
        baselineBar: { startDate: baselineStart, finishDate: baselineFinish },
      });
      continue;
    }

    const startDeltaDays = differenceInCalendarDays(sched.start, baselineStart);
    const finishDeltaDays = differenceInCalendarDays(sched.finish, baselineFinish);
    const isVariant =
      Math.abs(startDeltaDays) > VARIANCE_THRESHOLD_DAYS ||
      Math.abs(finishDeltaDays) > VARIANCE_THRESHOLD_DAYS;

    if (isVariant) {
      result.set(id, {
        kind: 'variant',
        baselineBar: { startDate: baselineStart, finishDate: baselineFinish },
        variance: { startDeltaDays, finishDeltaDays },
      });
    } else {
      result.set(id, {
        kind: 'unchanged',
        baselineBar: { startDate: baselineStart, finishDate: baselineFinish },
      });
    }
  }

  // 3. Walk baseline tasks for those missing from current → removed.
  for (const t of activeBaselinePayload.tasks) {
    if (currentTasks.has(t.id)) continue;
    // Skip baseline-only summary rows at any depth (Phase 1 scope —
    // overlay applies to leaf tasks only). Uses the precomputed
    // baselineSummaryIds set so this is O(1) per task.
    if (baselineSummaryIds.has(t.id)) continue;
    const dates = baselineSched.get(t.id);
    const baselineStart = dates?.start ?? parseISO(activeBaselinePayload.project.start);
    const baselineFinish = dates?.finish ?? baselineStart;
    result.set(t.id, {
      kind: 'removed',
      baselineBar: { startDate: baselineStart, finishDate: baselineFinish },
      phantomCurrentBar: null,
    });
  }

  return result;
}
