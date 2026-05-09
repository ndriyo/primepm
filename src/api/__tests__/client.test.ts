import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../auth/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'TOKEN' } } })),
    },
  },
}));

import { apiClient, ApiError, isApiConfigured } from '../client';
import { supabase } from '../../auth/supabaseClient';

const mkResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let fetchSpy: ReturnType<typeof vi.fn>;

const lastCall = (): { url: string; init: RequestInit } => {
  const c = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
  return { url: String(c[0]), init: (c[1] as RequestInit) ?? {} };
};

beforeEach(() => {
  fetchSpy = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => mkResponse({ ok: true }));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('isApiConfigured', () => {
  it('reflects whether VITE_API_URL is set', () => {
    expect(typeof isApiConfigured).toBe('boolean');
  });
});

describe('ApiError', () => {
  it('stores status and message', () => {
    const e = new ApiError(404, 'not found');
    expect(e.status).toBe(404);
    expect(e.message).toBe('not found');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('authedFetch behaviour', () => {
  it('throws when there is no session', async () => {
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { session: null },
    });
    await expect(apiClient.listProjects()).rejects.toThrow('not_authenticated');
  });

  it('attaches a Bearer token to outgoing requests', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ projects: [] }));
    await apiClient.listProjects();
    const headers = new Headers(lastCall().init.headers);
    expect(headers.get('Authorization')).toBe('Bearer TOKEN');
  });

  it('sets Content-Type for JSON bodies automatically', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ id: 'p1' }));
    await apiClient.createProject({
      name: 'X',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    const headers = new Headers(lastCall().init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError on non-ok HTTP status', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
    );
    await expect(apiClient.listProjects()).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to statusText when body is empty', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(null, { status: 503, statusText: 'Service Unavailable' }),
    );
    await expect(apiClient.listProjects()).rejects.toMatchObject({
      status: 503,
      message: 'Service Unavailable',
    });
  });
});

describe('apiClient — projects', () => {
  it('listProjects → GET /api/projects', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ projects: [{ id: 'p1' }] }));
    const r = await apiClient.listProjects();
    expect(lastCall().url).toContain('/api/projects');
    expect(r.projects).toHaveLength(1);
  });

  it('createProject sends POST body', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ id: 'new' }));
    await apiClient.createProject({
      name: 'X',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(lastCall().init.method).toBe('POST');
    expect(JSON.parse(lastCall().init.body as string)).toMatchObject({ name: 'X' });
  });

  it('deleteProject hits DELETE /api/projects/:id', async () => {
    await apiClient.deleteProject('p1');
    expect(lastCall().url).toContain('/api/projects/p1');
    expect(lastCall().init.method).toBe('DELETE');
  });

  it('patchProject hits PATCH /api/projects/:id', async () => {
    await apiClient.patchProject('p1', { name: 'Renamed' });
    expect(lastCall().init.method).toBe('PATCH');
  });
});

describe('apiClient — snapshot', () => {
  it('getSnapshot returns parsed body', async () => {
    fetchSpy.mockResolvedValueOnce(
      mkResponse({ project: { id: 'p1', name: 'X', start: '2026-01-01' } }),
    );
    const r = await apiClient.getSnapshot('p1');
    expect(r.project.id).toBe('p1');
  });

  it('putSnapshot sends PUT body', async () => {
    await apiClient.putSnapshot('p1', {
      project: { id: 'p1', name: 'X', start: '2026-01-01' },
      tasks: [],
      taskOrder: [],
      dependencies: [],
      calendar: { workingDaysOfWeek: [1, 2, 3, 4, 5], holidays: [], hoursPerDay: 8 },
    });
    expect(lastCall().init.method).toBe('PUT');
  });
});

describe('apiClient — tasks / dependencies / resources / assignments', () => {
  it('createTask POSTs JSON', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ id: 't1' }));
    await apiClient.createTask('p1', { name: 't' });
    expect(lastCall().url).toContain('/api/projects/p1/tasks');
    expect(lastCall().init.method).toBe('POST');
  });

  it('updateTask PATCHes', async () => {
    await apiClient.updateTask('p1', 't1', { name: 'X' });
    expect(lastCall().init.method).toBe('PATCH');
  });

  it('deleteTask DELETEs', async () => {
    await apiClient.deleteTask('p1', 't1');
    expect(lastCall().init.method).toBe('DELETE');
  });

  it('reorderTasks POSTs reorder body', async () => {
    await apiClient.reorderTasks('p1', [{ id: 't1', orderIndex: 0, parentId: null }]);
    expect(lastCall().url).toContain('/tasks/reorder');
    expect(lastCall().init.method).toBe('POST');
  });

  it('dependency endpoints map onto verbs', async () => {
    await apiClient.createDependency('p1', { type: 'FS' });
    await apiClient.updateDependency('p1', 'd1', { lagDays: 1 });
    await apiClient.deleteDependency('p1', 'd1');
    expect(fetchSpy.mock.calls.map(c => (c[1] as RequestInit).method)).toEqual([
      'POST',
      'PATCH',
      'DELETE',
    ]);
  });

  it('resource endpoints map onto verbs', async () => {
    await apiClient.createResource('p1', { code: 'R1' });
    await apiClient.updateResource('p1', 'r1', { name: 'A' });
    await apiClient.deleteResource('p1', 'r1');
    await apiClient.reorderResources('p1', ['r1']);
    expect(fetchSpy.mock.calls.map(c => (c[1] as RequestInit).method)).toEqual([
      'POST',
      'PATCH',
      'DELETE',
      'POST',
    ]);
  });

  it('assignment endpoints map onto verbs', async () => {
    await apiClient.createAssignment('p1', { allocationPct: 50 });
    await apiClient.updateAssignment('p1', 'a1', { allocationPct: 60 });
    await apiClient.deleteAssignment('p1', 'a1');
    expect(fetchSpy.mock.calls.map(c => (c[1] as RequestInit).method)).toEqual([
      'POST',
      'PATCH',
      'DELETE',
    ]);
  });
});

describe('apiClient — calendar / settings / dashboard / departments', () => {
  it('putCalendar PUTs', async () => {
    await apiClient.putCalendar('p1', { holidays: [] });
    expect(lastCall().init.method).toBe('PUT');
  });

  it('putSettings PUTs', async () => {
    await apiClient.putSettings('p1', { foo: 1 });
    expect(lastCall().init.method).toBe('PUT');
  });

  it('getDashboard hits /api/dashboard', async () => {
    fetchSpy.mockResolvedValueOnce(
      mkResponse({
        counts: { total: 0, approved: 0, pending: 0 },
        totals: { budget: 0, mandays: 0 },
        byStatus: [],
        scoreQuadrant: [],
        topProjects: [],
      }),
    );
    const r = await apiClient.getDashboard();
    expect(r.counts.total).toBe(0);
  });

  it('listDepartments returns the departments array', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ departments: [{ id: 'd', name: 'D' }] }));
    const r = await apiClient.listDepartments();
    expect(r.departments).toHaveLength(1);
  });
});

describe('apiClient — criteria endpoints', () => {
  it('listCriteriaVersions GETs', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ versions: [] }));
    const r = await apiClient.listCriteriaVersions();
    expect(r.versions).toEqual([]);
  });

  it('createCriteriaVersion POSTs', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ id: 'v1' }));
    await apiClient.createCriteriaVersion({ name: 'V' });
    expect(lastCall().init.method).toBe('POST');
  });

  it('patchCriteriaVersion PATCHes', async () => {
    await apiClient.patchCriteriaVersion('v1', { name: 'V2' });
    expect(lastCall().init.method).toBe('PATCH');
  });

  it('deleteCriteriaVersion DELETEs', async () => {
    await apiClient.deleteCriteriaVersion('v1');
    expect(lastCall().init.method).toBe('DELETE');
  });

  it('getActiveCriteria GETs', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ version: null, criteria: [] }));
    const r = await apiClient.getActiveCriteria();
    expect(r.criteria).toEqual([]);
  });

  it('listCriteria URL-encodes the version id', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ criteria: [] }));
    await apiClient.listCriteria('v 1');
    expect(lastCall().url).toContain('versionId=v%201');
  });

  it('createCriterion / updateCriterion / deleteCriterion verbs', async () => {
    await apiClient.createCriterion({ versionId: 'v', key: 'k', label: 'L' });
    await apiClient.updateCriterion('c1', { label: 'L2' });
    await apiClient.deleteCriterion('c1');
    expect(fetchSpy.mock.calls.map(c => (c[1] as RequestInit).method)).toEqual([
      'POST',
      'PATCH',
      'DELETE',
    ]);
  });

  it('putPairwise PUTs the comparison list', async () => {
    await apiClient.putPairwise('v1', { comparisons: [], weights: [] });
    expect(lastCall().url).toContain('/api/criteria/versions/v1/pairwise');
    expect(lastCall().init.method).toBe('PUT');
  });
});

describe('apiClient — submission', () => {
  it('submitProject POSTs', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ id: 'p1' }));
    const r = await apiClient.submitProject({
      name: 'X',
      status: 'planned',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      resources: 0,
      tags: [],
      scores: [],
    });
    expect(r.id).toBe('p1');
  });

  it('getProjectFull GETs', async () => {
    fetchSpy.mockResolvedValueOnce(mkResponse({ project: {}, scores: [] }));
    await apiClient.getProjectFull('p1');
    expect(lastCall().url).toContain('/api/projects/p1/full');
  });

  it('updateProjectFull PUTs', async () => {
    await apiClient.updateProjectFull('p1', {
      name: 'X',
      status: 'planned',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      resources: 0,
      tags: [],
      scores: [],
    });
    expect(lastCall().init.method).toBe('PUT');
  });
});
