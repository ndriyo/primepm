import { describe, expect, it } from 'vitest';
import { parseDuration, formatDuration } from '../durationFormat';

describe('parseDuration', () => {
  it('returns null for empty/whitespace input', () => {
    expect(parseDuration('')).toBe(null);
    expect(parseDuration('   ')).toBe(null);
  });

  it('returns 0 for the literal "0"', () => {
    expect(parseDuration('0')).toBe(0);
  });

  it('parses bare numbers as days', () => {
    expect(parseDuration('3')).toBe(3);
    expect(parseDuration('15')).toBe(15);
  });

  it('parses days suffix', () => {
    expect(parseDuration('3d')).toBe(3);
    expect(parseDuration('10D')).toBe(10);
  });

  it('parses weeks (5 working days each)', () => {
    expect(parseDuration('2w')).toBe(10);
    expect(parseDuration('1W')).toBe(5);
  });

  it('parses months (22 working days each)', () => {
    expect(parseDuration('1mo')).toBe(22);
    expect(parseDuration('2MO')).toBe(44);
  });

  it('parses quarters (66 working days each)', () => {
    expect(parseDuration('1q')).toBe(66);
  });

  it('parses years (261 working days each)', () => {
    expect(parseDuration('1y')).toBe(261);
  });

  it('combines multiple units', () => {
    expect(parseDuration('3w 2d')).toBe(17);
    expect(parseDuration('1mo 1w')).toBe(27);
  });

  it('rounds fractional values', () => {
    expect(parseDuration('1.5w')).toBe(8); // 7.5 rounds to 8
  });

  it('returns null for unparseable input', () => {
    expect(parseDuration('abc')).toBe(null);
    expect(parseDuration('xyz')).toBe(null);
  });

  it('tolerates whitespace', () => {
    expect(parseDuration('  3w  ')).toBe(15);
  });
});

describe('formatDuration', () => {
  it('reports milestone for zero', () => {
    expect(formatDuration(0)).toBe('Milestone');
  });

  it('formats multiples of 5 as weeks', () => {
    expect(formatDuration(5)).toBe('1w');
    expect(formatDuration(10)).toBe('2w');
    expect(formatDuration(15)).toBe('3w');
  });

  it('formats sub-week durations as days', () => {
    expect(formatDuration(1)).toBe('1d');
    expect(formatDuration(3)).toBe('3d');
    expect(formatDuration(4)).toBe('4d');
  });

  it('formats non-multiples of 5 as days', () => {
    expect(formatDuration(7)).toBe('7d');
    expect(formatDuration(11)).toBe('11d');
  });
});
