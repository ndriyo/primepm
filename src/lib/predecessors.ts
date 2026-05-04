import type { DepType } from '../engine';

export interface ParsedPredecessor {
  rowIndex: number; // 0-based absolute index into taskOrder
  type: DepType;
  lagDays: number;
}

/**
 * Parse a free-form predecessor string into a list of references.
 *
 * Examples (rowIndex shown as 1-based for legibility):
 *   "5"          → row 5, FS, lag 0
 *   "5FS"        → row 5, FS, lag 0
 *   "5SS"        → row 5, SS, lag 0
 *   "5FS+2d"     → row 5, FS, lag +2
 *   "5FS-1"      → row 5, FS, lag -1
 *   "5, 8FF"     → two predecessors
 *   "5SS+2d, 8FF, 12"
 *
 * Whitespace and casing are tolerant. Garbage tokens are skipped.
 */
export function parsePredecessors(input: string): ParsedPredecessor[] {
  const out: ParsedPredecessor[] = [];
  const tokens = input.split(/[,;]/).map(t => t.trim()).filter(Boolean);
  for (const token of tokens) {
    const m = token.match(/^(\d+)\s*(FS|SS|FF|SF)?\s*([+-]?\s*\d+)?\s*d?$/i);
    if (!m) continue;
    const rowIndex = parseInt(m[1], 10) - 1;
    if (rowIndex < 0) continue;
    const type = (m[2]?.toUpperCase() ?? 'FS') as DepType;
    const lag = m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0;
    if (Number.isNaN(rowIndex) || Number.isNaN(lag)) continue;
    out.push({ rowIndex, type, lagDays: lag });
  }
  return out;
}
