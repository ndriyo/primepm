import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'TOKEN' } } })),
    },
  },
}));

import { apiClient, ApiError } from '../client';

const mkJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchSpy: ReturnType<typeof vi.fn>;
const lastCall = () => {
  const c = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
  return { url: String(c[0]), init: (c[1] as RequestInit) ?? {} };
};

beforeEach(() => {
  fetchSpy = vi.fn(async () => mkJsonResponse({}));
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('apiClient.setBaseline', () => {
  it('POSTs JSON { rationale } and returns the parsed header DTO', async () => {
    const dto = {
      id: 'b1',
      projectId: 'p1',
      versionLabel: 'v0',
      versionIndex: 0,
      rationale: 'because',
      createdAt: '2026-05-09T09:14:00Z',
      createdBy: { id: 'u1', fullName: 'Andrian' },
    };
    fetchSpy.mockResolvedValueOnce(mkJsonResponse(dto, 201));
    const result = await apiClient.setBaseline('p1', 'because');
    const { url, init } = lastCall();
    expect(url).toContain('/api/projects/p1/baselines');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ rationale: 'because' });
    expect(result).toEqual(dto);
  });

  it('propagates 400 errors as ApiError', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'rationale_required' }), { status: 400 }),
    );
    await expect(apiClient.setBaseline('p1', '')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('apiClient.listBaselines', () => {
  it('GETs and returns the unwrapped baselines array', async () => {
    const headers = [
      {
        id: 'b2',
        projectId: 'p1',
        versionLabel: 'v1',
        versionIndex: 1,
        rationale: 'rebaseline',
        createdAt: '2026-04-12T14:02:00Z',
        createdBy: { id: 'u1', fullName: 'Andrian' },
      },
      {
        id: 'b1',
        projectId: 'p1',
        versionLabel: 'v0',
        versionIndex: 0,
        rationale: 'original',
        createdAt: '2026-03-04T11:30:00Z',
        createdBy: { id: 'u1', fullName: 'Andrian' },
      },
    ];
    fetchSpy.mockResolvedValueOnce(mkJsonResponse({ baselines: headers }));
    const result = await apiClient.listBaselines('p1');
    expect(result).toEqual(headers);
  });

  it('returns [] when the server returns an empty list', async () => {
    fetchSpy.mockResolvedValueOnce(mkJsonResponse({ baselines: [] }));
    const result = await apiClient.listBaselines('p1');
    expect(result).toEqual([]);
  });
});

describe('apiClient.getBaseline', () => {
  it('GETs the full baseline including payload', async () => {
    const full = {
      id: 'b1',
      projectId: 'p1',
      versionLabel: 'v0',
      versionIndex: 0,
      rationale: 'r',
      createdAt: '2026-05-09T09:14:00Z',
      createdBy: { id: 'u1', fullName: 'Andrian' },
      payload: {
        schemaVersion: 1,
        capturedAt: '2026-05-09T09:14:00Z',
        project: { id: 'p1', name: 'P', start: '2026-05-01' },
        tasks: [],
        dependencies: [],
        resources: [],
        assignments: [],
        calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
        settings: { taskOrder: [], resourceOrder: [], collapsedIds: [] },
      },
    };
    fetchSpy.mockResolvedValueOnce(mkJsonResponse(full));
    const result = await apiClient.getBaseline('p1', 'b1');
    expect(result).toEqual(full);
    expect(lastCall().url).toContain('/api/projects/p1/baselines/b1');
  });
});
