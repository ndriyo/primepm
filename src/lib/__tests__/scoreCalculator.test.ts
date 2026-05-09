import { describe, expect, it } from 'vitest';
import { normalize, computeWeightedScore } from '../scoreCalculator';
import type { Criterion } from '../../api/types';

const mkCriterion = (id: string, weight: number, isInverse = false): Criterion => ({
  id,
  versionId: 'v',
  key: id,
  label: id,
  description: null,
  isInverse,
  isDefault: false,
  weight,
  rubric: {},
});

describe('normalize', () => {
  it('returns 0 when range span is zero', () => {
    expect(normalize(3, mkCriterion('x', 1), { min: 5, max: 5 })).toBe(0);
  });

  it('returns 0 when range span is negative', () => {
    expect(normalize(3, mkCriterion('x', 1), { min: 10, max: 5 })).toBe(0);
  });

  it('linearly normalizes to [0, 1]', () => {
    const c = mkCriterion('x', 1);
    expect(normalize(1, c, { min: 1, max: 5 })).toBe(0);
    expect(normalize(5, c, { min: 1, max: 5 })).toBe(1);
    expect(normalize(3, c, { min: 1, max: 5 })).toBe(0.5);
  });

  it('inverts when criterion.isInverse is true', () => {
    const c = mkCriterion('x', 1, true);
    expect(normalize(1, c, { min: 1, max: 5 })).toBe(1);
    expect(normalize(5, c, { min: 1, max: 5 })).toBe(0);
  });

  it('clamps below-min and above-max', () => {
    const c = mkCriterion('x', 1);
    expect(normalize(-99, c, { min: 1, max: 5 })).toBe(0);
    expect(normalize(99, c, { min: 1, max: 5 })).toBe(1);
  });
});

describe('computeWeightedScore', () => {
  it('returns null with no criteria', () => {
    expect(computeWeightedScore({ a: 3 }, [], { min: 1, max: 5 })).toBe(null);
  });

  it('returns null when no scores supplied for any criterion', () => {
    const cs = [mkCriterion('a', 0.5), mkCriterion('b', 0.5)];
    expect(computeWeightedScore({}, cs, { min: 1, max: 5 })).toBe(null);
  });

  it('skips criteria without a score', () => {
    const cs = [mkCriterion('a', 0.5), mkCriterion('b', 0.5)];
    // a = 5 → normalized 1, b missing
    expect(computeWeightedScore({ a: 5 }, cs, { min: 1, max: 5 })).toBe(0.5);
  });

  it('aggregates across criteria using their weights', () => {
    const cs = [mkCriterion('a', 0.4), mkCriterion('b', 0.6)];
    // a=3 (norm 0.5), b=5 (norm 1) → 0.4*0.5 + 0.6*1 = 0.2 + 0.6 = 0.8
    expect(computeWeightedScore({ a: 3, b: 5 }, cs, { min: 1, max: 5 })).toBeCloseTo(0.8);
  });

  it('honors inverse criteria', () => {
    const cs = [mkCriterion('cost', 1, true)];
    // cost=1 (lowest), inverse → 1
    expect(computeWeightedScore({ cost: 1 }, cs, { min: 1, max: 5 })).toBe(1);
  });

  it('treats null weight as 0', () => {
    const cs: Criterion[] = [{ ...mkCriterion('a', 0), weight: null }];
    expect(computeWeightedScore({ a: 5 }, cs, { min: 1, max: 5 })).toBe(0);
  });
});
