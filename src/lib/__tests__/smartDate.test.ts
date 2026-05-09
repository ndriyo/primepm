import { describe, expect, it } from 'vitest';
import { parseSmartDate } from '../smartDate';

const REF = new Date(2026, 4, 4); // Monday May 4, 2026 (local)

describe('parseSmartDate', () => {
  it('returns null for empty input', () => {
    expect(parseSmartDate('', REF)).toBe(null);
    expect(parseSmartDate('  ', REF)).toBe(null);
  });

  it('parses ISO yyyy-MM-dd', () => {
    const r = parseSmartDate('2026-05-11', REF);
    expect(r).toBeInstanceOf(Date);
    expect(r!.getFullYear()).toBe(2026);
    expect(r!.getMonth()).toBe(4);
    expect(r!.getDate()).toBe(11);
  });

  it('parses relative day deltas', () => {
    const r = parseSmartDate('+5d', REF);
    expect(r!.getDate()).toBe(9); // Mon 5/4 + 5 days = Sat 5/9
  });

  it('parses negative relative days', () => {
    const r = parseSmartDate('-2d', REF);
    expect(r!.getDate()).toBe(2); // Mon 5/4 - 2 = Sat 5/2
  });

  it('parses week / month / year deltas', () => {
    const w = parseSmartDate('+2w', REF);
    expect(w!.getDate()).toBe(18); // 5/4 + 14 days

    const m = parseSmartDate('+1m', REF);
    expect(m!.getMonth()).toBeGreaterThanOrEqual(5); // shifted by 30 days

    const y = parseSmartDate('+1y', REF);
    expect(y!.getFullYear()).toBe(2027);
  });

  it('parses natural language via chrono', () => {
    const r = parseSmartDate('next Monday', REF);
    expect(r).toBeInstanceOf(Date);
    expect(r!.getDay()).toBe(1);
  });

  it('returns null for completely unparseable text', () => {
    expect(parseSmartDate('not a date at all xyz', REF)).toBe(null);
  });
});
