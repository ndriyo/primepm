import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'TOKEN' } } })),
    },
  },
}));

import { useProjectStore, useActiveBaselinePayload } from '../projectStore';
import { renderHook } from '@testing-library/react';
import { apiClient } from '../../api/client';
import type { BaselineHeaderDto, BaselinePayloadDto } from '../../api/types';

const get = () => useProjectStore.getState();

const headerFor = (idx: number, id?: string): BaselineHeaderDto => ({
  id: id ?? `b${idx}`,
  projectId: 'p1',
  versionLabel: `v${idx}`,
  versionIndex: idx,
  rationale: `r${idx}`,
  createdAt: `2026-05-${10 - idx}T09:00:00Z`,
  createdBy: { id: 'u1', fullName: 'Andrian' },
});

const payloadFor = (id: string): BaselinePayloadDto => ({
  schemaVersion: 1,
  capturedAt: '2026-05-09T09:00:00Z',
  project: { id: 'p1', name: 'P', start: '2026-05-04' },
  tasks: [],
  dependencies: [],
  resources: [],
  assignments: [],
  calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
  settings: { taskOrder: [], resourceOrder: [], collapsedIds: [] },
});

beforeEach(() => {
  useProjectStore.getState().reset();
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('BaselineSlice — activeBaselineRef resolution (T040)', () => {
  it("'latest' resolves to the header with the highest versionIndex", () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0, 'b-old'), headerFor(2, 'b-new'), headerFor(1, 'b-mid')],
      baselinePayloads: new Map([['b-new', payloadFor('b-new')]]),
      activeBaselineRef: 'latest',
    });
    const { result } = renderHook(() => useActiveBaselinePayload());
    expect(result.current?.versionLabel).toBe('v2');
  });

  it('a specific id resolves to that header even when not the latest', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0, 'b-orig'), headerFor(1, 'b-rebase')],
      baselinePayloads: new Map([['b-orig', payloadFor('b-orig')]]),
      activeBaselineRef: 'b-orig',
    });
    const { result } = renderHook(() => useActiveBaselinePayload());
    expect(result.current?.versionLabel).toBe('v0');
  });

  it('returns undefined when there are no baselines (FR-014)', () => {
    const { result } = renderHook(() => useActiveBaselinePayload());
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the resolved header has no cached payload', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0, 'b-empty')],
      activeBaselineRef: 'latest',
    });
    const { result } = renderHook(() => useActiveBaselinePayload());
    expect(result.current).toBeUndefined();
  });

  it('setActiveBaselineRef is session-scoped (NOT in persistence allowlist)', () => {
    useProjectStore.setState({
      baselineHeaders: [headerFor(0, 'a'), headerFor(1, 'b')],
      activeBaselineRef: 'latest',
    });
    get().setActiveBaselineRef('a');
    expect(get().activeBaselineRef).toBe('a');
    // After reset (the only persistence boundary), back to 'latest' default.
    get().reset();
    expect(get().activeBaselineRef).toBe('latest');
  });
});

describe('BaselineSlice — loadBaselinePayload memoisation (T041)', () => {
  it('only fetches each baselineId once across many switch cycles', async () => {
    const spy = vi.spyOn(apiClient, 'getBaseline').mockResolvedValue({
      ...headerFor(0, 'b-x'),
      payload: payloadFor('b-x'),
    });
    await get().loadBaselinePayload('p1', 'b-x');
    await get().loadBaselinePayload('p1', 'b-x');
    await get().loadBaselinePayload('p1', 'b-x');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('BaselineSlice — loadBaselineHeaders + setBaseline + history insertion (US3)', () => {
  it('loadBaselineHeaders sorts by versionIndex DESC defensively', async () => {
    vi.spyOn(apiClient, 'listBaselines').mockResolvedValue([
      headerFor(0, 'a'),
      headerFor(2, 'c'),
      headerFor(1, 'b'),
    ]);
    await get().loadBaselineHeaders('p1');
    expect(get().baselineHeaders.map(h => h.versionIndex)).toEqual([2, 1, 0]);
  });

  it('setBaseline prepends the new header (newest-first invariant)', async () => {
    vi.spyOn(apiClient, 'setBaseline').mockResolvedValue(headerFor(2, 'c'));
    useProjectStore.setState({
      baselineHeaders: [headerFor(1, 'b'), headerFor(0, 'a')],
    });
    await get().setBaseline('rebaseline reason');
    expect(get().baselineHeaders[0].versionLabel).toBe('v2');
  });
});
