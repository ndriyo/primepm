import { describe, expect, it } from 'vitest';
import { recalculate } from '../recalculate';
import { DEFAULT_CALENDAR } from '../types';
import { mkDep, mkTask, mapOf, PROJECT_START } from './fixtures';
import type { Dependency, Task } from '../types';

/**
 * Build a wide schedule resembling the construction-mega template:
 *   - N parallel zones
 *   - Each zone has 7 phases × 15 tasks = 105 tasks
 *   - Phases are FS-chained inside a zone; zones run in parallel via SS+lag
 */
function buildSchedule(zones: number) {
  const tasks: Task[] = [];
  const deps: Dependency[] = [];
  let depCounter = 0;
  const newDep = (from: string, to: string, type: Dependency['type'] = 'FS', lag = 0) =>
    mkDep(`d${depCounter++}`, from, to, type, lag);

  // Pre-construction (sequential)
  for (let i = 0; i < 30; i++) tasks.push(mkTask(`pre_${i}`, 2));
  for (let i = 1; i < 30; i++) deps.push(newDep(`pre_${i - 1}`, `pre_${i}`));

  // Zones
  for (let z = 0; z < zones; z++) {
    const PHASES = 7;
    const PER_PHASE = 15;
    for (let p = 0; p < PHASES; p++) {
      for (let t = 0; t < PER_PHASE; t++) {
        const id = `z${z}_p${p}_t${t}`;
        tasks.push(mkTask(id, 2));
        if (t > 0) {
          deps.push(newDep(`z${z}_p${p}_t${t - 1}`, id));
        } else if (p > 0) {
          deps.push(newDep(`z${z}_p${p - 1}_t${PER_PHASE - 1}`, id));
        }
      }
    }
    if (z === 0) {
      deps.push(newDep('pre_29', `z0_p0_t0`));
    } else {
      deps.push(newDep(`z0_p0_t0`, `z${z}_p0_t0`, 'SS', z * 5));
    }
  }

  return { tasks: mapOf(tasks), deps: mapOf(deps) };
}

describe('Engine perf at scale', () => {
  it('recalculates a ~400-task schedule under 50ms', () => {
    // 30 + 3 zones × 7 phases × 15 = 30 + 315 = 345 tasks. Close to 400.
    const { tasks, deps } = buildSchedule(3);
    const t0 = performance.now();
    const r = recalculate(tasks, deps, DEFAULT_CALENDAR, PROJECT_START);
    const elapsed = performance.now() - t0;
    expect(r.scheduled.size).toBe(tasks.size);
    expect(r.cycles.length).toBe(0);
    expect(elapsed).toBeLessThan(50);
  });

  it('handles ~1000 tasks under 100ms', () => {
    // 30 + 9 zones = 30 + 945 = 975 tasks
    const { tasks, deps } = buildSchedule(9);
    const t0 = performance.now();
    const r = recalculate(tasks, deps, DEFAULT_CALENDAR, PROJECT_START);
    const elapsed = performance.now() - t0;
    expect(r.scheduled.size).toBe(tasks.size);
    expect(elapsed).toBeLessThan(100);
  });

  it('handles ~2000 tasks under 250ms', () => {
    const { tasks, deps } = buildSchedule(19); // 30 + 1995 ≈ 2025
    const t0 = performance.now();
    const r = recalculate(tasks, deps, DEFAULT_CALENDAR, PROJECT_START);
    const elapsed = performance.now() - t0;
    expect(r.scheduled.size).toBe(tasks.size);
    expect(elapsed).toBeLessThan(250);
  });

  it('handles ~4000 tasks under 500ms', () => {
    const { tasks, deps } = buildSchedule(38); // 30 + 3990 ≈ 4020
    const t0 = performance.now();
    const r = recalculate(tasks, deps, DEFAULT_CALENDAR, PROJECT_START);
    const elapsed = performance.now() - t0;
    expect(r.scheduled.size).toBe(tasks.size);
    expect(elapsed).toBeLessThan(500);
  });

  it('handles ~8000 tasks under 1500ms', () => {
    const { tasks, deps } = buildSchedule(76); // 30 + 7980 ≈ 8010
    const t0 = performance.now();
    const r = recalculate(tasks, deps, DEFAULT_CALENDAR, PROJECT_START);
    const elapsed = performance.now() - t0;
    expect(r.scheduled.size).toBe(tasks.size);
    expect(elapsed).toBeLessThan(1500);
  });
});
