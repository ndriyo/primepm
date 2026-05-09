import { describe, expect, it } from 'vitest';
import { newId } from '../ids';

describe('newId', () => {
  it('returns a UUID v4 string', () => {
    const id = newId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
  });

  it('ignores the prefix argument (returns plain UUID)', () => {
    const id = newId('tsk');
    expect(id.startsWith('tsk')).toBe(false);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
