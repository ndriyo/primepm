import { describe, expect, it } from 'vitest';
import {
  dateToX,
  xToDate,
  pxToDays,
  generateTicks,
  PX_PER_DAY,
  ROW_HEIGHT,
  HEADER_HEIGHT,
  type TimeScale,
} from '../timeScale';

const ORIGIN = new Date(2026, 4, 4); // Mon May 4

const scale = (zoom: TimeScale['zoom']): TimeScale => ({
  zoom,
  origin: ORIGIN,
  pxPerDay: PX_PER_DAY[zoom],
});

describe('px-per-day constants', () => {
  it('exports tuned values for each zoom', () => {
    expect(PX_PER_DAY.day).toBe(36);
    expect(PX_PER_DAY.week).toBe(18);
    expect(PX_PER_DAY.month).toBe(6);
    expect(PX_PER_DAY.quarter).toBe(2.5);
  });

  it('exports row and header heights', () => {
    expect(ROW_HEIGHT).toBeGreaterThan(0);
    expect(HEADER_HEIGHT).toBeGreaterThan(ROW_HEIGHT);
  });
});

describe('dateToX', () => {
  it('returns 0 for the origin date', () => {
    expect(dateToX(ORIGIN, scale('day'))).toBe(0);
  });

  it('multiplies day delta by pxPerDay', () => {
    const next = new Date(2026, 4, 5);
    expect(dateToX(next, scale('day'))).toBe(PX_PER_DAY.day);
  });

  it('returns negative offset for dates before origin', () => {
    expect(dateToX(new Date(2026, 4, 3), scale('day'))).toBe(-PX_PER_DAY.day);
  });
});

describe('xToDate', () => {
  it('returns origin for x=0', () => {
    const r = xToDate(0, scale('day'));
    expect(r.getDate()).toBe(4);
  });

  it('rounds to nearest day', () => {
    const halfDay = PX_PER_DAY.day / 2 + 1;
    const r = xToDate(halfDay, scale('day'));
    expect(r.getDate()).toBe(5); // rounds up
  });

  it('is the inverse of dateToX', () => {
    const target = new Date(2026, 4, 11);
    const x = dateToX(target, scale('week'));
    const r = xToDate(x, scale('week'));
    expect(r.getDate()).toBe(11);
  });
});

describe('pxToDays', () => {
  it('returns 0 for zero pixels', () => {
    expect(pxToDays(0, scale('day'))).toBe(0);
  });

  it('rounds to nearest day', () => {
    expect(pxToDays(PX_PER_DAY.day * 3 + 1, scale('day'))).toBe(3);
    expect(pxToDays(PX_PER_DAY.day * 3 + PX_PER_DAY.day / 2 + 1, scale('day'))).toBe(4);
  });

  it('handles negative pixel offsets', () => {
    expect(pxToDays(-PX_PER_DAY.day * 2, scale('day'))).toBe(-2);
  });
});

describe('generateTicks — day zoom', () => {
  it('produces a major tick at every Monday and at index 0', () => {
    const { major, minor } = generateTicks(scale('day'), 14);
    // First major is at index 0
    expect(major[0].x).toBe(0);
    // Subsequent major ticks fall on Mondays
    for (const m of major.slice(1)) {
      expect(m.date.getDay()).toBe(1);
    }
    expect(minor.length).toBeGreaterThan(0);
  });

  it('formats major labels as "MMM D"', () => {
    const { major } = generateTicks(scale('day'), 0);
    expect(major[0].label).toMatch(/^[A-Za-z]{3} \d+$/);
  });
});

describe('generateTicks — week zoom', () => {
  it('emits at least one major tick at the start of a month', () => {
    const { major, minor } = generateTicks(scale('week'), 90);
    expect(major.length).toBeGreaterThan(0);
    expect(major[0].label).toMatch(/^[A-Za-z]{3} \d{4}$/);
    expect(minor.length).toBeGreaterThan(0);
  });
});

describe('generateTicks — month zoom', () => {
  it('emits a major tick at quarter starts', () => {
    const { major } = generateTicks(scale('month'), 365);
    // At least Q1, Q2, Q3, Q4 should appear
    expect(major.some(m => m.label.startsWith('Q1'))).toBe(true);
    expect(major.some(m => m.label.startsWith('Q3'))).toBe(true);
  });

  it('non-quarter months become minor ticks', () => {
    const { minor } = generateTicks(scale('month'), 365);
    // Some minor ticks exist (non-quarter months)
    expect(minor.length).toBeGreaterThan(0);
  });
});

describe('generateTicks — quarter zoom', () => {
  it('emits a major tick at every quarter', () => {
    const { major } = generateTicks(scale('quarter'), 365);
    expect(major.length).toBeGreaterThanOrEqual(4);
    for (const m of major) {
      expect(m.label).toMatch(/^Q\d \d{4}$/);
    }
  });
});
