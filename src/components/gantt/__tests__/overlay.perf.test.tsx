import { describe, expect, it } from 'vitest';
import { computeRowOverlayStates } from '../baselineOverlay';
import type { Task, ScheduledTask } from '../../../engine';
import type { BaselinePayloadDto } from '../../../api/types';

function makeFixture(taskCount: number): {
  currentTasks: Map<string, Task>;
  currentSchedule: Map<string, ScheduledTask>;
  baselineA: BaselinePayloadDto;
  baselineB: BaselinePayloadDto;
} {
  const tasks = new Map<string, Task>();
  const schedule = new Map<string, ScheduledTask>();
  const baselineTasksA: BaselinePayloadDto['tasks'] = [];
  const baselineTasksB: BaselinePayloadDto['tasks'] = [];

  for (let i = 0; i < taskCount; i++) {
    const id = `t${i.toString().padStart(3, '0')}`;
    tasks.set(id, {
      id,
      name: `Task ${i}`,
      durationDays: 3,
      scheduleMode: 'auto',
      constraint: { kind: 'ASAP' },
      progressPct: 0,
      isMilestone: false,
    });
    schedule.set(id, {
      id,
      start: new Date(2026, 4, 4 + (i % 30)),
      finish: new Date(2026, 4, 6 + (i % 30)),
      slack: 0,
      isCritical: false,
      inCycle: false,
    });
    baselineTasksA.push({
      id,
      name: `Task ${i}`,
      durationDays: 3,
      isMilestone: false,
      scheduleMode: 'manual',
      manualStart: `2026-05-${String(4 + (i % 30)).padStart(2, '0')}`,
      constraint: { kind: 'ASAP' },
      progressPct: 0,
      orderIndex: i,
    });
    baselineTasksB.push({
      id,
      name: `Task ${i}`,
      durationDays: 3,
      isMilestone: false,
      scheduleMode: 'manual',
      manualStart: `2026-05-${String(5 + (i % 25)).padStart(2, '0')}`,
      constraint: { kind: 'ASAP' },
      progressPct: 0,
      orderIndex: i,
    });
  }

  const baseline = (taskList: BaselinePayloadDto['tasks']): BaselinePayloadDto => ({
    schemaVersion: 1,
    capturedAt: '2026-05-09T09:00:00Z',
    project: { id: 'p1', name: 'Perf', start: '2026-05-01' },
    tasks: taskList,
    dependencies: [],
    resources: [],
    assignments: [],
    calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
    settings: { taskOrder: taskList.map(t => t.id), resourceOrder: [], collapsedIds: [] },
  });

  return {
    currentTasks: tasks,
    currentSchedule: schedule,
    baselineA: baseline(baselineTasksA),
    baselineB: baseline(baselineTasksB),
  };
}

describe('overlay performance (T043, SC-005)', () => {
  it('switching active baseline payload between two cached payloads recomputes in < 1 s for 100 tasks', () => {
    const { currentTasks, currentSchedule, baselineA, baselineB } = makeFixture(100);

    // Warm-up
    computeRowOverlayStates({ currentTasks, currentSchedule, activeBaselinePayload: baselineA });

    const t0 = performance.now();
    // Simulate 5 switch cycles to amplify any allocation/GC issues; the budget
    // is still 1 s (well above 5× the realistic single-switch cost).
    for (let i = 0; i < 5; i++) {
      const ref = i % 2 === 0 ? baselineA : baselineB;
      const states = computeRowOverlayStates({
        currentTasks,
        currentSchedule,
        activeBaselinePayload: ref,
      });
      expect(states.size).toBe(100);
    }
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(1000);
  });
});
