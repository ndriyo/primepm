import { describe, expect, it } from 'vitest';
import { recalculate } from '../recalculate';
import { isoDate } from '../calendar';
import { DEFAULT_CALENDAR } from '../types';
import { PROJECT_START, cal, mapOf, mkDep, mkTask } from './fixtures';

const iso = (d: Date) => isoDate(d);

describe('recalculate — empty project', () => {
  it('returns an empty schedule with projectFinish = projectStart', () => {
    const r = recalculate(new Map(), new Map(), cal, PROJECT_START);
    expect(r.scheduled.size).toBe(0);
    expect(r.cycles).toEqual([]);
    expect(r.criticalPath.size).toBe(0);
    expect(iso(r.projectFinish)).toBe(iso(PROJECT_START));
  });

  it('handles a single task with no deps', () => {
    const tasks = mapOf([mkTask('A', 3)]);
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    expect(r.scheduled.size).toBe(1);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-06');
  });
});

describe('recalculate — milestone tasks', () => {
  it('treats duration 0 as a same-day milestone', () => {
    const tasks = mapOf([mkTask('M', 0)]);
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    const m = r.scheduled.get('M')!;
    expect(iso(m.start)).toBe('2026-05-04');
    expect(iso(m.finish)).toBe('2026-05-04');
  });
});

describe('recalculate — constraint kinds', () => {
  it('FNET pushes finish no earlier than the constraint date', () => {
    const tasks = mapOf([mkTask('A', 2)]);
    tasks.get('A')!.constraint = { kind: 'FNET', date: new Date(2026, 4, 12) };
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    // Finish must be >= 5/12 → with 2-day duration, start = 5/11
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-11');
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-12');
  });

  it('MFO pins finish to the specified date', () => {
    const tasks = mapOf([mkTask('A', 3)]);
    tasks.get('A')!.constraint = { kind: 'MFO', date: new Date(2026, 4, 15) };
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-15');
    // 3 working days backward from Fri 5/15 → Wed 5/13
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-13');
  });

  it('SNET on a non-working day rolls forward to next working day', () => {
    const tasks = mapOf([mkTask('A', 2)]);
    // 5/9 is a Saturday
    tasks.get('A')!.constraint = { kind: 'SNET', date: new Date(2026, 4, 9) };
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-11');
  });
});

describe('recalculate — slack and critical path', () => {
  it('records slack > 0 for non-critical parallel branch', () => {
    // A(5) and B(1) both feed into C(1). A is critical, B has 4 working days slack.
    const tasks = mapOf([mkTask('A', 5), mkTask('B', 1), mkTask('C', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'C', 'FS'),
      mkDep('d2', 'B', 'C', 'FS'),
    ]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(r.scheduled.get('A')!.slack).toBe(0);
    expect(r.scheduled.get('B')!.slack).toBe(4);
    expect(r.scheduled.get('C')!.slack).toBe(0);
    expect(r.criticalPath.has('A')).toBe(true);
    expect(r.criticalPath.has('B')).toBe(false);
  });
});

describe('recalculate — cycle handling', () => {
  it('flags cycle tasks and excludes them from the critical path', () => {
    const tasks = mapOf([
      mkTask('A', 2),
      mkTask('B', 2),
      mkTask('C', 1),
    ]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'A', 'FS'),
    ]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    expect(r.cycles.length).toBeGreaterThan(0);
    expect(r.scheduled.get('A')!.inCycle).toBe(true);
    expect(r.scheduled.get('B')!.inCycle).toBe(true);
    expect(r.scheduled.get('C')!.inCycle).toBe(false);
    // Critical path should not include cycle tasks
    expect(r.criticalPath.has('A')).toBe(false);
    expect(r.criticalPath.has('B')).toBe(false);
  });
});

describe('recalculate — manual mode', () => {
  it('rolls a manual start on a weekend forward to next working day', () => {
    const tasks = mapOf([mkTask('A', 2)]);
    tasks.get('A')!.scheduleMode = 'manual';
    // Saturday 5/9
    tasks.get('A')!.manualStart = new Date(2026, 4, 9);
    const r = recalculate(tasks, new Map(), cal, PROJECT_START);
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-11');
  });
});

describe('recalculate — summary depth ordering', () => {
  it('rolls deeper summaries up first so grandparents see updated child spans', () => {
    // GP → Mid → A(3), B(2)
    const tasks = mapOf([
      mkTask('GP', 0),
      mkTask('Mid', 0),
      mkTask('A', 3),
      mkTask('B', 2),
    ]);
    tasks.get('Mid')!.parentId = 'GP';
    tasks.get('A')!.parentId = 'Mid';
    tasks.get('B')!.parentId = 'Mid';
    const deps = mapOf([mkDep('d1', 'A', 'B', 'FS')]);
    const r = recalculate(tasks, deps, cal, PROJECT_START);
    // A: 5/4..5/6, B: 5/7..5/8 → Mid 5/4..5/8 → GP 5/4..5/8
    expect(iso(r.scheduled.get('Mid')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('Mid')!.finish)).toBe('2026-05-08');
    expect(iso(r.scheduled.get('GP')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('GP')!.finish)).toBe('2026-05-08');
  });
});

describe('recalculate — calendar variations', () => {
  it('honors a custom holiday calendar', () => {
    const customCal = { ...DEFAULT_CALENDAR, holidays: new Set(['2026-05-05']) };
    const tasks = mapOf([mkTask('A', 3)]);
    const r = recalculate(tasks, new Map(), customCal, PROJECT_START);
    // Mon 5/4, holiday 5/5, Wed 5/6, Thu 5/7 → 3 working days = finish Thu 5/7
    expect(iso(r.scheduled.get('A')!.start)).toBe('2026-05-04');
    expect(iso(r.scheduled.get('A')!.finish)).toBe('2026-05-07');
  });
});
