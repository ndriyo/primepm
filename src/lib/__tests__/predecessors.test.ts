import { describe, expect, it } from 'vitest';
import { parsePredecessors } from '../predecessors';

describe('parsePredecessors', () => {
  it('parses a bare row index as FS with zero lag', () => {
    expect(parsePredecessors('5')).toEqual([{ rowIndex: 4, type: 'FS', lagDays: 0 }]);
  });

  it('parses explicit type without lag', () => {
    expect(parsePredecessors('5SS')).toEqual([{ rowIndex: 4, type: 'SS', lagDays: 0 }]);
    expect(parsePredecessors('5FF')).toEqual([{ rowIndex: 4, type: 'FF', lagDays: 0 }]);
    expect(parsePredecessors('5SF')).toEqual([{ rowIndex: 4, type: 'SF', lagDays: 0 }]);
  });

  it('parses positive lag with d suffix', () => {
    expect(parsePredecessors('5FS+2d')).toEqual([{ rowIndex: 4, type: 'FS', lagDays: 2 }]);
  });

  it('parses negative lag', () => {
    expect(parsePredecessors('5FS-1')).toEqual([{ rowIndex: 4, type: 'FS', lagDays: -1 }]);
  });

  it('parses multiple comma-separated predecessors', () => {
    expect(parsePredecessors('5, 8FF')).toEqual([
      { rowIndex: 4, type: 'FS', lagDays: 0 },
      { rowIndex: 7, type: 'FF', lagDays: 0 },
    ]);
  });

  it('parses semicolon-separated predecessors', () => {
    expect(parsePredecessors('1; 2')).toEqual([
      { rowIndex: 0, type: 'FS', lagDays: 0 },
      { rowIndex: 1, type: 'FS', lagDays: 0 },
    ]);
  });

  it('parses mixed types and lags', () => {
    expect(parsePredecessors('5SS+2d, 8FF, 12')).toEqual([
      { rowIndex: 4, type: 'SS', lagDays: 2 },
      { rowIndex: 7, type: 'FF', lagDays: 0 },
      { rowIndex: 11, type: 'FS', lagDays: 0 },
    ]);
  });

  it('is case-insensitive for type', () => {
    expect(parsePredecessors('5fs+1')).toEqual([{ rowIndex: 4, type: 'FS', lagDays: 1 }]);
  });

  it('skips garbage tokens', () => {
    expect(parsePredecessors('foo, 5, bar')).toEqual([{ rowIndex: 4, type: 'FS', lagDays: 0 }]);
  });

  it('returns empty array on completely invalid input', () => {
    expect(parsePredecessors('')).toEqual([]);
    expect(parsePredecessors('abc')).toEqual([]);
  });

  it('drops zero/negative row indexes', () => {
    expect(parsePredecessors('0')).toEqual([]);
  });
});
