import { describe, expect, it } from 'vitest';
import { computeRowOverlayStates } from '../baselineOverlay';
import type { Task, ScheduledTask } from '../../../engine';

/**
 * T051 — When the project has zero baselines, the overlay must contribute
 * nothing renderable (no BaselineBar nodes, no data-variance / data-baseline
 * attributes). This guards SC-007: byte-identical Gantt for unaffected
 * projects.
 */
describe('No-baseline render parity (T051, FR-014, SC-007)', () => {
  it('every row state is "no-baseline" when activeBaselinePayload is undefined', () => {
    const tasks = new Map<string, Task>();
    const schedule = new Map<string, ScheduledTask>();
    for (let i = 0; i < 25; i++) {
      const id = `t${i}`;
      tasks.set(id, {
        id,
        name: `T${i}`,
        durationDays: 1,
        scheduleMode: 'auto',
        constraint: { kind: 'ASAP' },
        progressPct: 0,
        isMilestone: false,
      });
      schedule.set(id, {
        id,
        start: new Date('2026-05-04'),
        finish: new Date('2026-05-04'),
        slack: 0,
        isCritical: false,
        inCycle: false,
      });
    }
    const states = computeRowOverlayStates({
      currentTasks: tasks,
      currentSchedule: schedule,
    });
    expect(states.size).toBe(25);
    for (const s of states.values()) {
      expect(s.kind).toBe('no-baseline');
    }
  });
});
