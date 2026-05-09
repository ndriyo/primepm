import { describe, expect, it } from 'vitest';
import { computeRowOverlayStates } from '../baselineOverlay';
import type { Task, ScheduledTask } from '../../../engine';
import type { BaselinePayloadDto } from '../../../api/types';

function makeTask(id: string, name: string, parentId?: string): Task {
  return {
    id,
    name,
    durationDays: 3,
    scheduleMode: 'auto',
    constraint: { kind: 'ASAP' },
    progressPct: 0,
    isMilestone: false,
    parentId,
  };
}

function makeScheduled(id: string, start: Date, finish: Date): ScheduledTask {
  return { id, start, finish, slack: 0, isCritical: false, inCycle: false };
}

function makeBaselineTask(
  id: string,
  name: string,
  start: string,
  durationDays = 3,
): BaselinePayloadDto['tasks'][number] {
  return {
    id,
    name,
    durationDays,
    isMilestone: false,
    scheduleMode: 'manual',
    manualStart: start,
    constraint: { kind: 'ASAP' },
    progressPct: 0,
    orderIndex: 0,
  };
}

function makePayload(tasks: BaselinePayloadDto['tasks']): BaselinePayloadDto {
  return {
    schemaVersion: 1,
    capturedAt: '2026-05-09T09:00:00Z',
    project: { id: 'p1', name: 'P', start: '2026-05-04' },
    tasks,
    dependencies: [],
    resources: [],
    assignments: [],
    calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
    settings: { taskOrder: tasks.map(t => t.id), resourceOrder: [], collapsedIds: [] },
  };
}

describe('computeRowOverlayStates — pairing & no-baseline (T021, FR-014)', () => {
  it('returns kind: "no-baseline" for every row when no baseline is supplied', () => {
    const currentTasks = new Map([['t1', makeTask('t1', 'A')]]);
    const currentSchedule = new Map([
      ['t1', makeScheduled('t1', new Date('2026-05-04'), new Date('2026-05-06'))],
    ]);
    const states = computeRowOverlayStates({ currentTasks, currentSchedule });
    expect(states.get('t1')).toEqual({ kind: 'no-baseline' });
  });

  it('pairs current and baseline tasks by UUID even when name changes (FR-017, R6)', () => {
    const currentTasks = new Map([['t1', makeTask('t1', 'Renamed')]]);
    const currentSchedule = new Map([
      ['t1', makeScheduled('t1', new Date('2026-05-04'), new Date('2026-05-06'))],
    ]);
    const payload = makePayload([makeBaselineTask('t1', 'Original Name', '2026-05-04')]);
    const states = computeRowOverlayStates({
      currentTasks,
      currentSchedule,
      activeBaselinePayload: payload,
    });
    expect(states.get('t1')?.kind).toBe('unchanged');
  });
});

describe('Variance threshold > 1 calendar day (T022, FR-008/FR-009)', () => {
  // Boundary cases pin the contract
  const cases: Array<{ delta: number; expected: 'unchanged' | 'variant' }> = [
    { delta: 0, expected: 'unchanged' },
    { delta: 1, expected: 'unchanged' },
    { delta: -1, expected: 'unchanged' },
    { delta: 2, expected: 'variant' },
    { delta: -2, expected: 'variant' },
  ];
  for (const { delta, expected } of cases) {
    it(`start delta ${delta}d → ${expected}`, () => {
      const baselineDate = new Date('2026-05-04');
      const currentDate = new Date('2026-05-04');
      currentDate.setDate(currentDate.getDate() + delta);
      const finishOffset = 2; // duration 3 → finish = start + 2
      const baselineFinish = new Date('2026-05-06');
      const currentFinish = new Date(currentDate);
      currentFinish.setDate(currentFinish.getDate() + finishOffset);

      const currentTasks = new Map([['t1', makeTask('t1', 'A')]]);
      const currentSchedule = new Map([
        ['t1', makeScheduled('t1', currentDate, currentFinish)],
      ]);
      const payload = makePayload([makeBaselineTask('t1', 'A', '2026-05-04', 3)]);
      const states = computeRowOverlayStates({
        currentTasks,
        currentSchedule,
        activeBaselinePayload: payload,
      });
      expect(states.get('t1')?.kind).toBe(expected);
      void baselineDate; void baselineFinish;
    });
  }
});

describe('Added / removed (T023, FR-010/FR-011)', () => {
  it('current-only task → kind: "added" with baselineBar=null', () => {
    const currentTasks = new Map([['t-new', makeTask('t-new', 'Soil stabilisation')]]);
    const currentSchedule = new Map([
      ['t-new', makeScheduled('t-new', new Date('2026-06-01'), new Date('2026-06-03'))],
    ]);
    const payload = makePayload([]);
    const states = computeRowOverlayStates({
      currentTasks,
      currentSchedule,
      activeBaselinePayload: payload,
    });
    const s = states.get('t-new');
    expect(s?.kind).toBe('added');
    expect(s && 'baselineBar' in s ? s.baselineBar : 'never').toBeNull();
  });

  it('baseline-only task → kind: "removed" with phantomCurrentBar=null', () => {
    const currentTasks = new Map<string, Task>();
    const currentSchedule = new Map<string, ScheduledTask>();
    const payload = makePayload([makeBaselineTask('t-old', 'Temporary fence', '2026-05-04')]);
    const states = computeRowOverlayStates({
      currentTasks,
      currentSchedule,
      activeBaselinePayload: payload,
    });
    const s = states.get('t-old');
    expect(s?.kind).toBe('removed');
    if (s && s.kind === 'removed') {
      expect(s.baselineBar).toBeTruthy();
      expect(s.phantomCurrentBar).toBeNull();
    }
  });
});

describe('Calendar isolation (T024, R8)', () => {
  it('start delta entirely within ±1 day → unchanged regardless of holiday calendar', () => {
    const currentTasks = new Map([['t1', makeTask('t1', 'A')]]);
    const currentSchedule = new Map([
      ['t1', makeScheduled('t1', new Date('2026-05-04'), new Date('2026-05-06'))],
    ]);
    // Baseline calendar with extra holiday — but we measure variance on
    // computed dates which are within the threshold, so still unchanged.
    const payload: BaselinePayloadDto = {
      ...makePayload([makeBaselineTask('t1', 'A', '2026-05-04', 3)]),
      calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: ['2026-05-05'], hoursPerDay: 8 },
    };
    const states = computeRowOverlayStates({
      currentTasks,
      currentSchedule,
      activeBaselinePayload: payload,
    });
    expect(states.get('t1')?.kind).toBe('unchanged');
  });
});

describe('Visual contract (T025)', () => {
  it('every variant row will be tagged with data-variance via TaskBar (sanity check)', () => {
    const currentTasks = new Map([['t1', makeTask('t1', 'A')]]);
    const currentSchedule = new Map([
      ['t1', makeScheduled('t1', new Date('2026-05-10'), new Date('2026-05-12'))],
    ]);
    const payload = makePayload([makeBaselineTask('t1', 'A', '2026-05-04', 3)]);
    const states = computeRowOverlayStates({
      currentTasks,
      currentSchedule,
      activeBaselinePayload: payload,
    });
    expect(states.get('t1')?.kind).toBe('variant');
  });
});
