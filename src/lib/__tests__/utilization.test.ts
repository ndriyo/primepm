import { describe, expect, it } from 'vitest';
import { computeResourceUtilization, computeAllUtilization } from '../utilization';
import { DEFAULT_CALENDAR, type ScheduleResult, type Task } from '../../engine';
import type { Assignment, Resource } from '../../store/projectStore';

const PROJECT_START = new Date(2026, 4, 4); // Mon 5/4

const mkTask = (id: string, durationDays: number, parentId?: string): Task => ({
  id,
  name: id,
  durationDays,
  scheduleMode: 'auto',
  constraint: { kind: 'ASAP' },
  isMilestone: durationDays === 0,
  progressPct: 0,
  parentId,
});

const mkAssignment = (
  id: string,
  taskId: string,
  resourceId: string,
  allocationPct: number,
): Assignment => ({ id, taskId, resourceId, allocationPct });

const mkResource = (id: string): Resource => ({
  id,
  code: id,
  name: id,
  defaultAllocationPct: 100,
});

const mkSchedule = (
  scheduledEntries: Array<{ id: string; start: Date; finish: Date; inCycle?: boolean }>,
  projectFinish: Date,
): ScheduleResult => ({
  scheduled: new Map(
    scheduledEntries.map(e => [
      e.id,
      {
        id: e.id,
        start: e.start,
        finish: e.finish,
        slack: 0,
        isCritical: false,
        inCycle: e.inCycle ?? false,
      },
    ]),
  ),
  cycles: [],
  criticalPath: new Set(),
  projectStart: PROJECT_START,
  projectFinish,
});

describe('computeResourceUtilization', () => {
  it('returns zero utilization when the resource has no assignments', () => {
    const tasks = new Map<string, Task>([['A', mkTask('A', 5)]]);
    const schedule = mkSchedule(
      [{ id: 'A', start: PROJECT_START, finish: new Date(2026, 4, 8) }],
      new Date(2026, 4, 8),
    );
    const u = computeResourceUtilization(
      'r1',
      new Map(),
      tasks,
      schedule,
      DEFAULT_CALENDAR,
    );
    expect(u.peakPct).toBe(0);
    expect(u.overAllocDays).toBe(0);
    expect(u.totalBookedDays).toBe(0);
    expect(u.byDay).toHaveLength(5);
  });

  it('sums allocation percentages across overlapping tasks', () => {
    // r1 assigned to two tasks running in parallel — both 50% — peak 100% on Mon
    const tasks = new Map<string, Task>([
      ['A', mkTask('A', 1)],
      ['B', mkTask('B', 1)],
    ]);
    const day = PROJECT_START;
    const schedule = mkSchedule(
      [
        { id: 'A', start: day, finish: day },
        { id: 'B', start: day, finish: day },
      ],
      day,
    );
    const assignments = new Map<string, Assignment>([
      ['a1', mkAssignment('a1', 'A', 'r1', 50)],
      ['a2', mkAssignment('a2', 'B', 'r1', 50)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(u.peakPct).toBe(100);
    expect(u.byDay[0].pct).toBe(100);
    expect(u.totalBookedDays).toBeCloseTo(1, 6); // 1*0.5 + 1*0.5
  });

  it('flags over-allocation days (working days only)', () => {
    const tasks = new Map<string, Task>([
      ['A', mkTask('A', 1)],
      ['B', mkTask('B', 1)],
    ]);
    const day = PROJECT_START;
    const schedule = mkSchedule(
      [
        { id: 'A', start: day, finish: day },
        { id: 'B', start: day, finish: day },
      ],
      day,
    );
    const assignments = new Map<string, Assignment>([
      ['a1', mkAssignment('a1', 'A', 'r1', 80)],
      ['a2', mkAssignment('a2', 'B', 'r1', 80)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(u.peakPct).toBe(160);
    expect(u.overAllocDays).toBe(1);
  });

  it('skips assignments to summary tasks', () => {
    // Parent P with one child A. Assignment to P (a summary) is ignored.
    const tasks = new Map<string, Task>([
      ['P', mkTask('P', 0)],
      ['A', mkTask('A', 1, 'P')],
    ]);
    const day = PROJECT_START;
    const schedule = mkSchedule(
      [
        { id: 'P', start: day, finish: day },
        { id: 'A', start: day, finish: day },
      ],
      day,
    );
    const assignments = new Map<string, Assignment>([
      ['a1', mkAssignment('a1', 'P', 'r1', 100)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(u.peakPct).toBe(0);
    expect(u.totalBookedDays).toBe(0);
  });

  it('skips assignments referencing missing tasks or cycle tasks', () => {
    const tasks = new Map<string, Task>([
      ['A', mkTask('A', 1)],
    ]);
    const day = PROJECT_START;
    const schedule = mkSchedule(
      [
        { id: 'A', start: day, finish: day, inCycle: true },
      ],
      day,
    );
    const assignments = new Map<string, Assignment>([
      ['a1', mkAssignment('a1', 'A', 'r1', 100)],
      ['a2', mkAssignment('a2', 'GHOST', 'r1', 100)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(u.peakPct).toBe(0);
  });

  it('zeroes out non-working days in peak/byDay percentages', () => {
    // Task spans Mon..next Mon (8 calendar days incl. weekend)
    const tasks = new Map<string, Task>([['A', mkTask('A', 6)]]);
    const start = PROJECT_START; // Mon 5/4
    const finish = new Date(2026, 4, 11); // Mon 5/11 (6 working days)
    const schedule = mkSchedule(
      [{ id: 'A', start, finish }],
      finish,
    );
    const assignments = new Map<string, Assignment>([
      ['a', mkAssignment('a', 'A', 'r1', 100)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    // Saturday and Sunday = day index 5 and 6
    const sat = u.byDay[5];
    const sun = u.byDay[6];
    expect(sat.isWorkingDay).toBe(false);
    expect(sun.isWorkingDay).toBe(false);
    expect(sat.pct).toBe(0);
    expect(sun.pct).toBe(0);
  });

  it('treats milestone duration as 1 working day for booking math', () => {
    const tasks = new Map<string, Task>([['M', mkTask('M', 0)]]);
    const day = PROJECT_START;
    const schedule = mkSchedule([{ id: 'M', start: day, finish: day }], day);
    const assignments = new Map<string, Assignment>([
      ['a', mkAssignment('a', 'M', 'r1', 50)],
    ]);
    const u = computeResourceUtilization('r1', assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(u.totalBookedDays).toBeCloseTo(0.5, 6); // 1 day × 50%
  });
});

describe('computeAllUtilization', () => {
  it('returns one entry per resource', () => {
    const resources = new Map<string, Resource>([
      ['r1', mkResource('r1')],
      ['r2', mkResource('r2')],
    ]);
    const tasks = new Map<string, Task>([['A', mkTask('A', 1)]]);
    const day = PROJECT_START;
    const schedule = mkSchedule([{ id: 'A', start: day, finish: day }], day);
    const assignments = new Map<string, Assignment>([
      ['a', mkAssignment('a', 'A', 'r1', 100)],
    ]);
    const all = computeAllUtilization(resources, assignments, tasks, schedule, DEFAULT_CALENDAR);
    expect(all.size).toBe(2);
    expect(all.get('r1')!.peakPct).toBe(100);
    expect(all.get('r2')!.peakPct).toBe(0);
  });
});
