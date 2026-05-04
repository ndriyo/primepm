import type { Criterion } from '../api/types';

/**
 * Normalize a raw score against a [min, max] range, accounting for inverse criteria.
 * Output is in [0, 1].
 */
export function normalize(raw: number, criterion: Criterion, range: { min: number; max: number }): number {
  const min = range.min;
  const max = range.max;
  const span = max - min;
  if (span <= 0) return 0;
  const clamped = Math.max(min, Math.min(max, raw));
  const n = (clamped - min) / span;
  return criterion.isInverse ? 1 - n : n;
}

/**
 * Compute weighted overall score for a project.
 *   score = Σ normalized(score_i) × weight_i
 * The version-level [min, max] range is applied uniformly across all criteria.
 */
export function computeWeightedScore(
  scores: Record<string, number>,
  criteria: Criterion[],
  range: { min: number; max: number },
): number | null {
  if (criteria.length === 0) return null;
  let total = 0;
  let any = false;
  for (const c of criteria) {
    if (scores[c.id] === undefined) continue;
    any = true;
    const n = normalize(scores[c.id], c, range);
    const w = c.weight ?? 0;
    total += n * w;
  }
  return any ? total : null;
}
