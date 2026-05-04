import { addDays, differenceInCalendarDays, startOfMonth, startOfQuarter, startOfWeek } from 'date-fns';
import type { ZoomLevel } from '../../store/projectStore';

export interface TimeScale {
  zoom: ZoomLevel;
  /** Start of the rendered window — a calendar day. */
  origin: Date;
  /** Pixels per calendar day. */
  pxPerDay: number;
}

/** Default px-per-day for each zoom level. Tuned for readability + density. */
export const PX_PER_DAY: Record<ZoomLevel, number> = {
  day: 36,
  week: 18,
  month: 6,
  quarter: 2.5,
};

export const ROW_HEIGHT = 34;
export const HEADER_HEIGHT = 56;

export function dateToX(date: Date, scale: TimeScale): number {
  return differenceInCalendarDays(date, scale.origin) * scale.pxPerDay;
}

export function xToDate(x: number, scale: TimeScale): Date {
  return addDays(scale.origin, Math.round(x / scale.pxPerDay));
}

/** Snap a pixel offset to the nearest day (returns offset in days). */
export function pxToDays(px: number, scale: TimeScale): number {
  return Math.round(px / scale.pxPerDay);
}

export interface GridTick {
  date: Date;
  x: number;
  major: boolean;
  label: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function generateTicks(scale: TimeScale, totalDays: number): { major: GridTick[]; minor: GridTick[] } {
  const major: GridTick[] = [];
  const minor: GridTick[] = [];

  if (scale.zoom === 'day') {
    for (let i = 0; i <= totalDays; i++) {
      const d = addDays(scale.origin, i);
      const isWeekStart = d.getDay() === 1;
      const x = i * scale.pxPerDay;
      if (isWeekStart || i === 0) {
        major.push({ date: d, x, major: true, label: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` });
      } else {
        minor.push({ date: d, x, major: false, label: `${d.getDate()}` });
      }
    }
  } else if (scale.zoom === 'week') {
    const firstWeek = startOfWeek(scale.origin, { weekStartsOn: 1 });
    let d = firstWeek;
    while (d <= addDays(scale.origin, totalDays)) {
      const x = differenceInCalendarDays(d, scale.origin) * scale.pxPerDay;
      const isMonthStart = d.getDate() <= 7;
      if (isMonthStart) {
        major.push({ date: d, x, major: true, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
      } else {
        minor.push({ date: d, x, major: false, label: `${d.getDate()}` });
      }
      d = addDays(d, 7);
    }
  } else if (scale.zoom === 'month') {
    let d = startOfMonth(scale.origin);
    while (d <= addDays(scale.origin, totalDays)) {
      const x = differenceInCalendarDays(d, scale.origin) * scale.pxPerDay;
      const isQuarter = d.getMonth() % 3 === 0;
      if (isQuarter) {
        major.push({ date: d, x, major: true, label: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}` });
      } else {
        minor.push({ date: d, x, major: false, label: MONTH_NAMES[d.getMonth()] });
      }
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  } else {
    let d = startOfQuarter(scale.origin);
    while (d <= addDays(scale.origin, totalDays)) {
      const x = differenceInCalendarDays(d, scale.origin) * scale.pxPerDay;
      major.push({
        date: d,
        x,
        major: true,
        label: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
      });
      d = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    }
  }
  return { major, minor };
}
