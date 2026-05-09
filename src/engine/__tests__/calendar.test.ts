import { describe, expect, it } from 'vitest';
import {
  isoDate,
  isWorkingDay,
  nextWorkingDay,
  prevWorkingDay,
  addWorkingDays,
  workingDaysBetween,
  computeFinish,
  computeStartFromFinish,
} from '../calendar';
import { DEFAULT_CALENDAR, type Calendar } from '../types';

const MON = new Date(2026, 4, 4); // Monday May 4
const TUE = new Date(2026, 4, 5);
const FRI = new Date(2026, 4, 8);
const SAT = new Date(2026, 4, 9);
const SUN = new Date(2026, 4, 10);
const NEXT_MON = new Date(2026, 4, 11);

describe('isoDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(isoDate(MON)).toBe('2026-05-04');
    expect(isoDate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});

describe('isWorkingDay', () => {
  it('treats Mon..Fri as working with the default calendar', () => {
    expect(isWorkingDay(MON, DEFAULT_CALENDAR)).toBe(true);
    expect(isWorkingDay(FRI, DEFAULT_CALENDAR)).toBe(true);
  });

  it('treats Sat and Sun as non-working', () => {
    expect(isWorkingDay(SAT, DEFAULT_CALENDAR)).toBe(false);
    expect(isWorkingDay(SUN, DEFAULT_CALENDAR)).toBe(false);
  });

  it('respects holidays', () => {
    const cal: Calendar = {
      ...DEFAULT_CALENDAR,
      holidays: new Set(['2026-05-04']),
    };
    expect(isWorkingDay(MON, cal)).toBe(false);
  });

  it('honors custom workingDaysOfWeek', () => {
    const cal: Calendar = {
      workingDaysOfWeek: new Set([1, 2, 3]), // Mon-Wed only
      holidays: new Set(),
      hoursPerDay: 8,
    };
    expect(isWorkingDay(MON, cal)).toBe(true);
    expect(isWorkingDay(new Date(2026, 4, 7), cal)).toBe(false); // Thursday
  });
});

describe('nextWorkingDay', () => {
  it('returns the same day if it is a working day', () => {
    expect(isoDate(nextWorkingDay(MON, DEFAULT_CALENDAR))).toBe('2026-05-04');
  });

  it('skips weekends', () => {
    expect(isoDate(nextWorkingDay(SAT, DEFAULT_CALENDAR))).toBe('2026-05-11');
    expect(isoDate(nextWorkingDay(SUN, DEFAULT_CALENDAR))).toBe('2026-05-11');
  });

  it('skips holidays as well as weekends', () => {
    const cal: Calendar = {
      ...DEFAULT_CALENDAR,
      holidays: new Set(['2026-05-11']),
    };
    expect(isoDate(nextWorkingDay(SAT, cal))).toBe('2026-05-12');
  });
});

describe('prevWorkingDay', () => {
  it('returns the same day if it is a working day', () => {
    expect(isoDate(prevWorkingDay(FRI, DEFAULT_CALENDAR))).toBe('2026-05-08');
  });

  it('walks backwards over a weekend', () => {
    expect(isoDate(prevWorkingDay(SUN, DEFAULT_CALENDAR))).toBe('2026-05-08');
    expect(isoDate(prevWorkingDay(SAT, DEFAULT_CALENDAR))).toBe('2026-05-08');
  });
});

describe('addWorkingDays', () => {
  it('returns next working day for delta=0', () => {
    expect(isoDate(addWorkingDays(SAT, 0, DEFAULT_CALENDAR))).toBe('2026-05-11');
    expect(isoDate(addWorkingDays(MON, 0, DEFAULT_CALENDAR))).toBe('2026-05-04');
  });

  it('adds positive days, skipping weekends', () => {
    expect(isoDate(addWorkingDays(MON, 4, DEFAULT_CALENDAR))).toBe('2026-05-08');
    expect(isoDate(addWorkingDays(MON, 5, DEFAULT_CALENDAR))).toBe('2026-05-11');
  });

  it('subtracts working days', () => {
    expect(isoDate(addWorkingDays(NEXT_MON, -1, DEFAULT_CALENDAR))).toBe('2026-05-08');
    expect(isoDate(addWorkingDays(NEXT_MON, -5, DEFAULT_CALENDAR))).toBe('2026-05-04');
  });

  it('lands on a working day starting from a non-working day', () => {
    // Saturday + 1 working day → Tue 5/12 (Sat → Mon, then +1 → Tue)
    expect(isoDate(addWorkingDays(SAT, 1, DEFAULT_CALENDAR))).toBe('2026-05-12');
  });
});

describe('workingDaysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(workingDaysBetween(MON, MON, DEFAULT_CALENDAR)).toBe(0);
  });

  it('counts working days from earlier to later (exclusive of `to`)', () => {
    // Mon..Fri exclusive end → 4 working days (Mon, Tue, Wed, Thu)
    expect(workingDaysBetween(MON, FRI, DEFAULT_CALENDAR)).toBe(4);
  });

  it('skips weekends', () => {
    // Mon..NextMon exclusive end → 5 working days
    expect(workingDaysBetween(MON, NEXT_MON, DEFAULT_CALENDAR)).toBe(5);
  });

  it('returns negative when from > to', () => {
    expect(workingDaysBetween(NEXT_MON, MON, DEFAULT_CALENDAR)).toBe(-5);
  });
});

describe('computeFinish', () => {
  it('returns start for milestone (duration = 0)', () => {
    expect(computeFinish(MON, 0, DEFAULT_CALENDAR)).toEqual(MON);
  });

  it('returns start for negative duration', () => {
    expect(computeFinish(MON, -3, DEFAULT_CALENDAR)).toEqual(MON);
  });

  it('treats duration 1 as start === finish', () => {
    expect(isoDate(computeFinish(MON, 1, DEFAULT_CALENDAR))).toBe('2026-05-04');
  });

  it('rolls over weekends correctly', () => {
    // 5 working days from Mon = Fri
    expect(isoDate(computeFinish(MON, 5, DEFAULT_CALENDAR))).toBe('2026-05-08');
    // 6 working days = Mon next week
    expect(isoDate(computeFinish(MON, 6, DEFAULT_CALENDAR))).toBe('2026-05-11');
  });
});

describe('computeStartFromFinish', () => {
  it('returns finish for milestone', () => {
    expect(computeStartFromFinish(MON, 0, DEFAULT_CALENDAR)).toEqual(MON);
  });

  it('inverts computeFinish', () => {
    // 5 days, finish Fri → start Mon
    expect(isoDate(computeStartFromFinish(FRI, 5, DEFAULT_CALENDAR))).toBe('2026-05-04');
    // 6 days, finish Mon next week → start Mon
    expect(isoDate(computeStartFromFinish(NEXT_MON, 6, DEFAULT_CALENDAR))).toBe('2026-05-04');
  });
});

describe('Calendar boundary conditions', () => {
  it('addWorkingDays past a holiday week skips correctly', () => {
    const cal: Calendar = {
      ...DEFAULT_CALENDAR,
      holidays: new Set(['2026-05-05']),
    };
    // Mon + 1 with Tue as a holiday → Wed
    expect(isoDate(addWorkingDays(MON, 1, cal))).toBe('2026-05-06');
  });

  it('isWorkingDay rejects empty workingDaysOfWeek', () => {
    const cal: Calendar = {
      workingDaysOfWeek: new Set(),
      holidays: new Set(),
      hoursPerDay: 8,
    };
    expect(isWorkingDay(MON, cal)).toBe(false);
    expect(isWorkingDay(TUE, cal)).toBe(false);
  });
});
