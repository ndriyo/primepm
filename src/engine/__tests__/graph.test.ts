import { describe, expect, it } from 'vitest';
import { buildAdjacency, detectCycles, topoSort } from '../graph';
import { mkDep, mkTask, mapOf } from './fixtures';

describe('buildAdjacency', () => {
  it('initializes empty in/out lists for every task', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1)]);
    const adj = buildAdjacency(tasks, new Map());
    expect(adj.out.get('A')).toEqual([]);
    expect(adj.in.get('B')).toEqual([]);
  });

  it('places dep on both endpoints', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1)]);
    const dep = mkDep('d', 'A', 'B', 'FS');
    const adj = buildAdjacency(tasks, mapOf([dep]));
    expect(adj.out.get('A')!).toEqual([dep]);
    expect(adj.in.get('B')!).toEqual([dep]);
  });

  it('drops deps referencing missing endpoints', () => {
    const tasks = mapOf([mkTask('A', 1)]);
    const dep = mkDep('d', 'A', 'GHOST', 'FS');
    const adj = buildAdjacency(tasks, mapOf([dep]));
    expect(adj.out.get('A')).toEqual([]);
  });
});

describe('detectCycles', () => {
  it('returns empty for an acyclic graph', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1), mkTask('C', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'C', 'FS'),
    ]);
    const adj = buildAdjacency(tasks, deps);
    expect(detectCycles(adj)).toEqual([]);
  });

  it('detects a 2-node cycle', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'A', 'FS'),
    ]);
    const adj = buildAdjacency(tasks, deps);
    const cycles = detectCycles(adj);
    expect(cycles).toHaveLength(1);
    expect(new Set(cycles[0])).toEqual(new Set(['A', 'B']));
  });

  it('detects a self-loop', () => {
    const tasks = mapOf([mkTask('A', 1)]);
    const deps = mapOf([mkDep('d1', 'A', 'A', 'FS')]);
    const adj = buildAdjacency(tasks, deps);
    const cycles = detectCycles(adj);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['A']);
  });

  it('detects multiple separate cycles', () => {
    const tasks = mapOf([
      mkTask('A', 1),
      mkTask('B', 1),
      mkTask('C', 1),
      mkTask('D', 1),
    ]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'A', 'FS'),
      mkDep('d3', 'C', 'D', 'FS'),
      mkDep('d4', 'D', 'C', 'FS'),
    ]);
    const adj = buildAdjacency(tasks, deps);
    expect(detectCycles(adj)).toHaveLength(2);
  });
});

describe('topoSort', () => {
  it('orders predecessors before successors', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1), mkTask('C', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'C', 'FS'),
    ]);
    const adj = buildAdjacency(tasks, deps);
    const order = topoSort(tasks, adj, new Set());
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('B')).toBeLessThan(order.indexOf('C'));
  });

  it('skips tasks listed as cycle nodes', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1), mkTask('C', 1)]);
    const deps = mapOf([
      mkDep('d1', 'A', 'B', 'FS'),
      mkDep('d2', 'B', 'A', 'FS'),
    ]);
    const adj = buildAdjacency(tasks, deps);
    const order = topoSort(tasks, adj, new Set(['A', 'B']));
    expect(order).toEqual(['C']);
  });

  it('returns all roots in some valid order for an empty dep set', () => {
    const tasks = mapOf([mkTask('A', 1), mkTask('B', 1)]);
    const adj = buildAdjacency(tasks, new Map());
    const order = topoSort(tasks, adj, new Set());
    expect(new Set(order)).toEqual(new Set(['A', 'B']));
  });
});
