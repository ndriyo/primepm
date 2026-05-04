import * as chrono from 'chrono-node';
import { addDays, parseISO, startOfDay } from 'date-fns';

/**
 * Parse a free-form date string into a Date.
 * Supports:
 *   - "next Monday", "in 3 weeks", "tomorrow"
 *   - "+5d", "-2w" (relative to `reference`)
 *   - "2026-05-04" / "5/4/2026" / "May 4"
 * Returns null if unparseable.
 */
export function parseSmartDate(input: string, reference: Date = new Date()): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const rel = trimmed.match(/^([+-])\s*(\d+)\s*([dwmy])$/i);
  if (rel) {
    const sign = rel[1] === '-' ? -1 : 1;
    const n = parseInt(rel[2], 10);
    const unit = rel[3].toLowerCase();
    const days = unit === 'd' ? n : unit === 'w' ? n * 7 : unit === 'm' ? n * 30 : n * 365;
    return startOfDay(addDays(reference, sign * days));
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return startOfDay(parseISO(trimmed));
  }

  const result = chrono.parseDate(trimmed, reference, { forwardDate: true });
  return result ? startOfDay(result) : null;
}
