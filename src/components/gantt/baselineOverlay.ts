// Spec 002 — pure overlay state derivation.
// Contract: specs/002-schedule-baseline-tracking-overlay/contracts/overlay-ui.contract.md
//
// Maps (currentTasks, currentSchedule, activeBaselinePayload) → per-task
// RowOverlayState. Names + shapes pinned by overlay.test.tsx.

import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Task, ScheduledTask } from '../../engine';
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
}

/**
 * Threshold = strictly more than 1 calendar day on EITHER start or finish in
 * either direction (FR-008 / FR-009). The boundary `delta === ±1` is NOT
 * variant.
 */
const VARIANCE_THRESHOLD_DAYS = 1;

/**
 * Compute fallback computedStart/computedFinish from the persisted snapshot.
 * Server doesn't pre-compute (see contract note); client reads
 *   - manualStart for scheduleMode='manual'
 *   - constraint.date for SNET/FNET/MSO/MFO
 *   - else project.start (same convention the engine uses)
 *
 * For the variance check this is sufficient because we only need a stable
 * date to subtract from the current scheduled date. A full forward-pass would
 * use dependency lag — we accept the simpler heuristic since the spec's
 * variance threshold is calendar days at the leaf level.
 */
function deriveBaselineDate(
  task: BaselinePayloadDto['tasks'][number],
  payload: BaselinePayloadDto,
  which: 'start' | 'finish',
): Date {
  // If the server happens to ship the precomputed dates (future enhancement),
  // honour them.
  const precomputed = which === 'start' ? task.computedStart : task.computedFinish;
  if (precomputed) return parseISO(precomputed);

  let start: Date;
  if (task.scheduleMode === 'manual' && task.manualStart) {
    start = parseISO(task.manualStart);
  } else if (task.constraint.kind !== 'ASAP') {
    start = parseISO(task.constraint.date);
  } else {
    start = parseISO(payload.project.start);
  }

  if (which === 'start') return start;
  // Finish = start + (durationDays - 1) calendar days. (We approximate
  // working-day arithmetic with calendar-day arithmetic for the purposes of
  // the > 1 calendar-day variance check; the exact engine result is recovered
  // when computedStart/Finish are present.)
  const finish = new Date(start);
  finish.setDate(finish.getDate() + Math.max(0, task.durationDays - 1));
  return finish;
}

export function computeRowOverlayStates(inputs: OverlayInputs): Map<string, RowOverlayState> {
  const result = new Map<string, RowOverlayState>();
  const { currentTasks, currentSchedule, activeBaselinePayload } = inputs;

  // 1. No baseline → all rows are no-baseline (FR-014, SC-007).
  if (!activeBaselinePayload) {
    for (const id of currentTasks.keys()) result.set(id, { kind: 'no-baseline' });
    return result;
  }

  // Index baseline tasks by UUID (R6 — pairing key is task UUID).
  const baselineById = new Map<string, BaselinePayloadDto['tasks'][number]>();
  for (const t of activeBaselinePayload.tasks) baselineById.set(t.id, t);

  // 2. Walk current tasks first.
  for (const [id, _task] of currentTasks) {
    const baseline = baselineById.get(id);
    const sched = currentSchedule.get(id);
    if (!baseline) {
      result.set(id, { kind: 'added', baselineBar: null });
      continue;
    }

    const baselineStart = deriveBaselineDate(baseline, activeBaselinePayload, 'start');
    const baselineFinish = deriveBaselineDate(baseline, activeBaselinePayload, 'finish');

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
    const baselineStart = deriveBaselineDate(t, activeBaselinePayload, 'start');
    const baselineFinish = deriveBaselineDate(t, activeBaselinePayload, 'finish');
    result.set(t.id, {
      kind: 'removed',
      baselineBar: { startDate: baselineStart, finishDate: baselineFinish },
      phantomCurrentBar: null,
    });
  }

  return result;
}
