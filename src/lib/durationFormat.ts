/**
 * Convert a friendly duration string into working days.
 *
 * Examples:
 *   "3"      → 3
 *   "3d"     → 3
 *   "2w"     → 10  (2 weeks × 5 working days)
 *   "1mo"    → 22  (1 month ≈ 22 working days)
 *   "1q"     → 66
 *   "0"      → 0   (milestone)
 *   "3w 2d"  → 17
 *
 * Returns null if unparseable.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed === '0') return 0;

  const re = /(\d+(?:\.\d+)?)\s*(mo|q|d|w|y)?/gi;
  let total = 0;
  let matched = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed))) {
    const n = parseFloat(m[1]);
    const u = (m[2] ?? 'd').toLowerCase();
    matched += m[0].length;
    switch (u) {
      case 'd':
        total += n;
        break;
      case 'w':
        total += n * 5;
        break;
      case 'mo':
        total += n * 22;
        break;
      case 'q':
        total += n * 66;
        break;
      case 'y':
        total += n * 261;
        break;
    }
  }
  if (matched === 0) return null;
  return Math.round(total);
}

/** Render a working-day count back into a friendly label, e.g. 10 → "2w". */
export function formatDuration(days: number): string {
  if (days === 0) return 'Milestone';
  if (days % 5 === 0 && days >= 5) return `${days / 5}w`;
  return `${days}d`;
}
