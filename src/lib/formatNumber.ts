/**
 * Format a number with thousand separators and K/M/B suffix once it crosses
 * the corresponding threshold. Designed for KPI tiles.
 *
 *   formatCompact(950)        → "950"
 *   formatCompact(1_250)      → "1.25K"
 *   formatCompact(12_500)     → "12.5K"
 *   formatCompact(1_500_000)  → "1.5M"
 *   formatCompact(2_400_000_000) → "2.4B"
 */
export function formatCompact(value: number, opts: { decimals?: number } = {}): string {
  const { decimals = 1 } = opts;
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000) return `${sign}${trim((abs / 1_000_000_000).toFixed(decimals))}B`;
  if (abs >= 1_000_000) return `${sign}${trim((abs / 1_000_000).toFixed(decimals))}M`;
  if (abs >= 1_000) return `${sign}${trim((abs / 1_000).toFixed(decimals))}K`;

  // Below 1K — use thousand separator (always integer for this band).
  return `${sign}${formatGrouped(abs, decimals)}`;
}

/** Format an integer-ish number with thousand separators only (no K/M/B). */
export function formatGrouped(value: number, maxDecimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
}

/** Strip trailing ".0" from formatted numbers like "1.0" → "1". */
function trim(s: string): string {
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}
