import { describe, expect, it } from 'vitest';
import { formatCompact, formatGrouped } from '../formatNumber';

describe('formatCompact', () => {
  it('returns em dash for non-finite values', () => {
    expect(formatCompact(NaN)).toBe('—');
    expect(formatCompact(Infinity)).toBe('—');
    expect(formatCompact(-Infinity)).toBe('—');
  });

  it('formats sub-thousand numbers with grouping (no suffix)', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(950)).toBe('950');
    expect(formatCompact(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompact(1_000)).toBe('1K');
    expect(formatCompact(1_250)).toBe('1.3K'); // default 1 decimal
    expect(formatCompact(12_500)).toBe('12.5K');
    expect(formatCompact(999_999)).toBe('1000K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCompact(1_000_000)).toBe('1M');
    expect(formatCompact(1_500_000)).toBe('1.5M');
  });

  it('formats billions with B suffix', () => {
    expect(formatCompact(1_000_000_000)).toBe('1B');
    expect(formatCompact(2_400_000_000)).toBe('2.4B');
  });

  it('preserves negative sign', () => {
    expect(formatCompact(-1_500)).toBe('-1.5K');
    expect(formatCompact(-2_000_000)).toBe('-2M');
  });

  it('respects custom decimals option', () => {
    expect(formatCompact(1_234, { decimals: 2 })).toBe('1.23K');
    expect(formatCompact(1_234, { decimals: 0 })).toBe('1K');
  });

  it('trims trailing zeros even with custom decimals', () => {
    expect(formatCompact(1_500_000, { decimals: 3 })).toBe('1.5M');
  });
});

describe('formatGrouped', () => {
  it('returns em dash for non-finite values', () => {
    expect(formatGrouped(NaN)).toBe('—');
  });

  it('formats integers with comma separators', () => {
    expect(formatGrouped(0)).toBe('0');
    expect(formatGrouped(1_000)).toBe('1,000');
    expect(formatGrouped(1_234_567)).toBe('1,234,567');
  });

  it('respects max decimals', () => {
    expect(formatGrouped(1234.567, 2)).toBe('1,234.57');
    expect(formatGrouped(1234.5, 0)).toBe('1,235');
  });
});
