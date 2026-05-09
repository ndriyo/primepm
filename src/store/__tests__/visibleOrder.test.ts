import { describe, expect, it } from 'vitest';
import { computeVisibleOrder } from '../visibleOrder';
import type { Task } from '../../engine';

const mk = (id: string, parentId?: string): Task => ({
  id,
  name: id,
  durationDays: 1,
  scheduleMode: 'auto',
  constraint: { kind: 'ASAP' },
  isMilestone: false,
  progressPct: 0,
  parentId,
});

describe('computeVisibleOrder', () => {
  it('returns the input order as-is when nothing is collapsed', () => {
    const tasks = new Map<string, Task>([
      ['A', mk('A')],
      ['B', mk('B')],
    ]);
    const taskOrder = ['A', 'B'];
    const out = computeVisibleOrder(taskOrder, tasks, new Set());
    expect(out).toBe(taskOrder); // identity (early return)
  });

  it('hides children of a collapsed summary', () => {
    const tasks = new Map<string, Task>([
      ['P', mk('P')],
      ['C1', mk('C1', 'P')],
      ['C2', mk('C2', 'P')],
      ['X', mk('X')],
    ]);
    const out = computeVisibleOrder(['P', 'C1', 'C2', 'X'], tasks, new Set(['P']));
    expect(out).toEqual(['P', 'X']);
  });

  it('still hides grandchildren when an ancestor is collapsed', () => {
    const tasks = new Map<string, Task>([
      ['GP', mk('GP')],
      ['Mid', mk('Mid', 'GP')],
      ['Leaf', mk('Leaf', 'Mid')],
      ['Other', mk('Other')],
    ]);
    const out = computeVisibleOrder(['GP', 'Mid', 'Leaf', 'Other'], tasks, new Set(['GP']));
    expect(out).toEqual(['GP', 'Other']);
  });

  it('keeps the collapsed summary itself visible', () => {
    const tasks = new Map<string, Task>([
      ['P', mk('P')],
      ['C', mk('C', 'P')],
    ]);
    const out = computeVisibleOrder(['P', 'C'], tasks, new Set(['P']));
    expect(out).toContain('P');
    expect(out).not.toContain('C');
  });

  it('does not hide tasks whose parent is not in the collapsed set', () => {
    const tasks = new Map<string, Task>([
      ['A', mk('A')],
      ['B', mk('B', 'A')],
    ]);
    // Different summary collapsed
    const out = computeVisibleOrder(['A', 'B'], tasks, new Set(['unrelated']));
    expect(out).toEqual(['A', 'B']);
  });

  it('handles tasks whose parent reference points at a missing task', () => {
    const tasks = new Map<string, Task>([['A', mk('A', 'GHOST')]]);
    const out = computeVisibleOrder(['A'], tasks, new Set(['GHOST']));
    expect(out).toEqual([]); // hidden because parent ref matches collapsed id
  });
});
