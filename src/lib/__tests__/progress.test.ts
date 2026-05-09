import { describe, expect, it } from 'vitest';
import {
  parseProgress,
  formatProgress,
  computeSummaryProgress,
  summaryProgressWithIndex,
  buildProgressMap,
} from '../progress';
import type { Task } from '../../engine';

const mkTask = (id: string, durationDays: number, progressPct: number, parentId?: string): Task => ({
  id,
  name: id,
  durationDays,
  scheduleMode: 'auto',
  constraint: { kind: 'ASAP' },
  isMilestone: durationDays === 0,
  progressPct,
  parentId,
});

const mapOf = (ts: Task[]) => new Map(ts.map(t => [t.id, t]));

describe('parseProgress', () => {
  it('returns null for empty / unparseable input', () => {
    expect(parseProgress('')).toBe(null);
    expect(parseProgress('   ')).toBe(null);
    expect(parseProgress('abc')).toBe(null);
    expect(parseProgress('NaN')).toBe(null);
  });

  it('parses an integer percentage', () => {
    expect(parseProgress('75')).toBe(75);
    expect(parseProgress('100')).toBe(100);
  });

  it('strips trailing percent sign', () => {
    expect(parseProgress('50%')).toBe(50);
    expect(parseProgress('  100%  ')).toBe(100);
  });

  it('treats decimals between 0 and 1 as fractions', () => {
    expect(parseProgress('0.5')).toBe(50);
    expect(parseProgress('0.75')).toBe(75);
  });

  it('clamps to 0..100', () => {
    expect(parseProgress('-10')).toBe(0);
    expect(parseProgress('150')).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(parseProgress('33.4')).toBe(33);
    expect(parseProgress('33.6')).toBe(34);
  });
});

describe('formatProgress', () => {
  it('renders integer + percent sign', () => {
    expect(formatProgress(0)).toBe('0%');
    expect(formatProgress(50)).toBe('50%');
    expect(formatProgress(33.7)).toBe('34%');
  });
});

describe('computeSummaryProgress', () => {
  it('returns 0 when parent has no descendants', () => {
    const tasks = mapOf([mkTask('P', 0, 0)]);
    expect(computeSummaryProgress('P', tasks)).toBe(0);
  });

  it('computes duration-weighted average from leaf children', () => {
    // child A: 5 days @ 80% → 4
    // child B: 5 days @ 0%  → 0
    // total work = 10, done = 4, summary = 40%
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('A', 5, 80, 'P'),
      mkTask('B', 5, 0, 'P'),
    ]);
    expect(computeSummaryProgress('P', tasks)).toBe(40);
  });

  it('treats milestone leaves as weight 1', () => {
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('M', 0, 100, 'P'), // milestone done
      mkTask('M2', 0, 0, 'P'), // milestone not done
    ]);
    expect(computeSummaryProgress('P', tasks)).toBe(50);
  });

  it('walks deep nesting through to leaves', () => {
    // P
    //  └─ Mid
    //       ├─ L1: 5d @ 100%
    //       └─ L2: 5d @ 0%
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('Mid', 0, 0, 'P'),
      mkTask('L1', 5, 100, 'Mid'),
      mkTask('L2', 5, 0, 'Mid'),
    ]);
    expect(computeSummaryProgress('P', tasks)).toBe(50);
  });

  it('clamps progress per leaf', () => {
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('A', 5, 200, 'P'),
    ]);
    expect(computeSummaryProgress('P', tasks)).toBe(100);
  });
});

describe('summaryProgressWithIndex', () => {
  it('matches computeSummaryProgress when given a fresh index', () => {
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('A', 4, 50, 'P'),
      mkTask('B', 4, 50, 'P'),
    ]);
    const childrenOf = new Map([['P', ['A', 'B']]]);
    expect(summaryProgressWithIndex('P', tasks, childrenOf)).toBe(50);
  });

  it('skips missing leaf entries gracefully', () => {
    const tasks = mapOf([mkTask('P', 0, 0)]);
    // Index points at a phantom child.
    const childrenOf = new Map([['P', ['ghost']]]);
    expect(summaryProgressWithIndex('P', tasks, childrenOf)).toBe(0);
  });
});

describe('buildProgressMap', () => {
  it('uses leaf progressPct directly for childless tasks', () => {
    const tasks = mapOf([mkTask('A', 3, 42)]);
    const m = buildProgressMap(tasks);
    expect(m.get('A')).toBe(42);
  });

  it('clamps leaf progress', () => {
    const tasks = mapOf([mkTask('A', 3, 250)]);
    expect(buildProgressMap(tasks).get('A')).toBe(100);
  });

  it('rolls up parents and uses leaves directly in the same pass', () => {
    const tasks = mapOf([
      mkTask('P', 0, 0),
      mkTask('A', 5, 100, 'P'),
      mkTask('B', 5, 0, 'P'),
      mkTask('Standalone', 4, 25),
    ]);
    const m = buildProgressMap(tasks);
    expect(m.get('P')).toBe(50);
    expect(m.get('A')).toBe(100);
    expect(m.get('B')).toBe(0);
    expect(m.get('Standalone')).toBe(25);
  });
});
