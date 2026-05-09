import { describe, expect, it } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('joins string class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('respects conditional object form', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', { c: true }], 'd'])).toBe('a b c d');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    // tailwind-merge dedupes p-2 + p-4 → p-4
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
