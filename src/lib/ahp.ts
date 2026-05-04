/**
 * AHP weight derivation via principal eigenvector + consistency ratio.
 *
 * The pairwise matrix M (n × n) is reciprocal: M[j][i] = 1/M[i][j], M[i][i] = 1.
 * The principal eigenvector of M gives the priority weights.
 *
 * λmax (the principal eigenvalue) is used to compute the consistency index:
 *   CI = (λmax - n) / (n - 1)
 * The consistency ratio is CI normalized by Saaty's Random Index (RI):
 *   CR = CI / RI(n)
 * CR ≤ 0.10 is considered acceptably consistent.
 */

// Saaty's Random Index — average CI for randomly-generated reciprocal matrices.
const RANDOM_INDEX: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.48,
  13: 1.56,
  14: 1.57,
  15: 1.59,
};

/**
 * Power iteration for principal eigenvector. Returns a normalized eigenvector
 * (sums to 1) and an estimate of λmax.
 */
export function principalEigenvector(M: number[][], iterations = 200): { vector: number[]; eigenvalue: number } {
  const n = M.length;
  if (n === 0) return { vector: [], eigenvalue: 0 };

  let v = new Array(n).fill(1 / n);
  for (let iter = 0; iter < iterations; iter++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        next[i] += M[i][j] * v[j];
      }
    }
    const sum = next.reduce((s, x) => s + x, 0);
    if (sum === 0) return { vector: v, eigenvalue: n };
    const normalized = next.map(x => x / sum);
    // Convergence check
    let delta = 0;
    for (let i = 0; i < n; i++) delta += Math.abs(normalized[i] - v[i]);
    v = normalized;
    if (delta < 1e-9) break;
  }

  // Estimate λmax from the Rayleigh-quotient-like average: λ ≈ mean_i (Mv)_i / v_i
  const Mv = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Mv[i] += M[i][j] * v[j];
    }
  }
  let eigenvalue = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (v[i] > 1e-12) {
      eigenvalue += Mv[i] / v[i];
      count++;
    }
  }
  eigenvalue = count > 0 ? eigenvalue / count : n;
  return { vector: v, eigenvalue };
}

/**
 * Consistency Ratio per Saaty.
 * Returns 0 for n ≤ 2 (always consistent) and for matrices where RI is undefined.
 */
export function consistencyRatio(n: number, eigenvalue: number): number {
  if (n <= 2) return 0;
  const ci = (eigenvalue - n) / (n - 1);
  const ri = RANDOM_INDEX[n] ?? RANDOM_INDEX[15];
  if (!ri || ri === 0) return 0;
  return ci / ri;
}

/**
 * Build an n×n reciprocal matrix from sparse pairwise comparisons.
 * Values M[i][j] = how much i is preferred over j.
 * Diagonal = 1; missing pairs default to 1 (equal).
 */
export function buildMatrix(
  criterionIds: string[],
  comparisons: Array<{ criterionAId: string; criterionBId: string; value: number }>,
): number[][] {
  const n = criterionIds.length;
  const idx = new Map(criterionIds.map((id, i) => [id, i]));
  const M: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
  for (const c of comparisons) {
    const i = idx.get(c.criterionAId);
    const j = idx.get(c.criterionBId);
    if (i === undefined || j === undefined || i === j) continue;
    M[i][j] = c.value;
    M[j][i] = 1 / c.value;
  }
  return M;
}

/**
 * Convenience: derive weights + CR + eigenvalue from a comparison list.
 */
export function deriveAhp(
  criterionIds: string[],
  comparisons: Array<{ criterionAId: string; criterionBId: string; value: number }>,
): { weights: Array<{ id: string; weight: number }>; eigenvalue: number; cr: number } {
  const M = buildMatrix(criterionIds, comparisons);
  const { vector, eigenvalue } = principalEigenvector(M);
  const cr = consistencyRatio(criterionIds.length, eigenvalue);
  return {
    weights: criterionIds.map((id, i) => ({ id, weight: vector[i] ?? 0 })),
    eigenvalue,
    cr,
  };
}

// Backwards-compat helpers still exported (geometric mean fallback)
export function geometricMean(row: number[]): number {
  if (row.length === 0) return 0;
  let prod = 1;
  for (const v of row) prod *= v;
  return Math.pow(prod, 1 / row.length);
}

export function deriveWeights(matrix: number[][]): number[] {
  const { vector } = principalEigenvector(matrix);
  return vector;
}
