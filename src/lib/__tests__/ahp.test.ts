import { describe, expect, it } from 'vitest';
import {
  principalEigenvector,
  consistencyRatio,
  buildMatrix,
  deriveAhp,
  geometricMean,
  deriveWeights,
} from '../ahp';

describe('principalEigenvector', () => {
  it('returns empty for an empty matrix', () => {
    const r = principalEigenvector([]);
    expect(r.vector).toEqual([]);
    expect(r.eigenvalue).toBe(0);
  });

  it('produces a normalized vector that sums to 1', () => {
    const M = [
      [1, 2, 3],
      [1 / 2, 1, 2],
      [1 / 3, 1 / 2, 1],
    ];
    const { vector } = principalEigenvector(M);
    const sum = vector.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 9);
  });

  it('recovers the dominant eigenvector for a perfectly consistent matrix', () => {
    // Weights 0.5, 0.3, 0.2 → ratios 5:3:2 between rows.
    const M = [
      [1, 5 / 3, 5 / 2],
      [3 / 5, 1, 3 / 2],
      [2 / 5, 2 / 3, 1],
    ];
    const { vector, eigenvalue } = principalEigenvector(M);
    expect(vector[0]).toBeCloseTo(0.5, 3);
    expect(vector[1]).toBeCloseTo(0.3, 3);
    expect(vector[2]).toBeCloseTo(0.2, 3);
    // For a perfectly consistent reciprocal matrix λmax === n.
    expect(eigenvalue).toBeCloseTo(3, 3);
  });

  it('returns the seed when the matrix is degenerate (all zeros)', () => {
    const M = [
      [0, 0],
      [0, 0],
    ];
    const { vector, eigenvalue } = principalEigenvector(M);
    expect(vector).toEqual([0.5, 0.5]);
    expect(eigenvalue).toBe(2);
  });
});

describe('consistencyRatio', () => {
  it('returns 0 for n <= 2', () => {
    expect(consistencyRatio(1, 1)).toBe(0);
    expect(consistencyRatio(2, 2)).toBe(0);
  });

  it('returns 0 when eigenvalue equals n (perfect consistency)', () => {
    expect(consistencyRatio(3, 3)).toBeCloseTo(0, 9);
  });

  it('produces non-zero CR when there is inconsistency', () => {
    // λmax = 3.1 → CI = 0.05 → CR = 0.05 / 0.58 ≈ 0.086
    expect(consistencyRatio(3, 3.1)).toBeCloseTo(0.05 / 0.58, 6);
  });

  it('falls back to RI for n=15 when n exceeds the table', () => {
    // n=20 not in table, falls back to RI[15] = 1.59
    const cr = consistencyRatio(20, 21);
    // CI = (21 - 20) / 19 ≈ 0.0526, CR = CI/1.59 ≈ 0.033
    expect(cr).toBeCloseTo((1 / 19) / 1.59, 6);
  });
});

describe('buildMatrix', () => {
  it('produces an identity-on-diagonal matrix when no comparisons given', () => {
    const M = buildMatrix(['a', 'b', 'c'], []);
    expect(M).toEqual([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]);
  });

  it('writes reciprocals automatically', () => {
    const M = buildMatrix(['a', 'b'], [{ criterionAId: 'a', criterionBId: 'b', value: 4 }]);
    expect(M[0][1]).toBe(4);
    expect(M[1][0]).toBe(1 / 4);
  });

  it('ignores comparisons with unknown ids', () => {
    const M = buildMatrix(
      ['a', 'b'],
      [{ criterionAId: 'x', criterionBId: 'b', value: 5 }],
    );
    expect(M[0][1]).toBe(1);
  });

  it('ignores self-comparisons', () => {
    const M = buildMatrix(
      ['a', 'b'],
      [{ criterionAId: 'a', criterionBId: 'a', value: 99 }],
    );
    expect(M[0][0]).toBe(1);
  });
});

describe('deriveAhp', () => {
  it('returns weights of 0 when no criterion ids supplied', () => {
    const r = deriveAhp([], []);
    expect(r.weights).toEqual([]);
  });

  it('produces weights, eigenvalue and CR for a 3x3 input', () => {
    const ids = ['a', 'b', 'c'];
    const r = deriveAhp(ids, [
      { criterionAId: 'a', criterionBId: 'b', value: 2 },
      { criterionAId: 'a', criterionBId: 'c', value: 4 },
      { criterionAId: 'b', criterionBId: 'c', value: 2 },
    ]);
    expect(r.weights).toHaveLength(3);
    const sum = r.weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
    // Perfectly consistent: λmax ≈ 3, CR ≈ 0
    expect(r.eigenvalue).toBeCloseTo(3, 3);
    expect(r.cr).toBeLessThan(0.01);
  });
});

describe('geometricMean', () => {
  it('returns 0 for empty input', () => {
    expect(geometricMean([])).toBe(0);
  });

  it('computes geometric mean correctly', () => {
    expect(geometricMean([1, 4])).toBeCloseTo(2, 6);
    expect(geometricMean([2, 8])).toBeCloseTo(4, 6);
  });
});

describe('deriveWeights', () => {
  it('returns the principal eigenvector', () => {
    const M = [
      [1, 2],
      [1 / 2, 1],
    ];
    const w = deriveWeights(M);
    expect(w[0]).toBeGreaterThan(w[1]);
    expect(w[0] + w[1]).toBeCloseTo(1, 6);
  });
});
