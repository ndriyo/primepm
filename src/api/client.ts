import { supabase } from '../auth/supabaseClient';
import type {
  CreateCriterionInput,
  CreateProjectInput,
  Criterion,
  CriteriaVersion,
  DashboardData,
  Department,
  ProjectFullResponse,
  ProjectSummary,
  SnapshotDto,
  SubmissionInput,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const isApiConfigured = Boolean(API_BASE);

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('not_authenticated');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }
  return res;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function json<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export const apiClient = {
  // Projects
  listProjects: () =>
    authedFetch(`/api/projects`).then(r => json<{ projects: ProjectSummary[] }>(r)),

  createProject: (data: CreateProjectInput) =>
    authedFetch(`/api/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  deleteProject: (projectId: string) =>
    authedFetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  // Snapshot
  getSnapshot: (projectId: string) =>
    authedFetch(`/api/projects/${projectId}`).then(r => json<SnapshotDto>(r)),

  putSnapshot: (projectId: string, snap: SnapshotDto) =>
    authedFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(snap),
    }).then(r => json<{ ok: true }>(r)),

  patchProject: (projectId: string, patch: { name?: string; start?: string }) =>
    authedFetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  // Tasks
  createTask: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  updateTask: (projectId: string, taskId: string, patch: object) =>
    authedFetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteTask: (projectId: string, taskId: string) =>
    authedFetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  reorderTasks: (
    projectId: string,
    items: Array<{ id: string; orderIndex: number; parentId: string | null }>,
  ) =>
    authedFetch(`/api/projects/${projectId}/tasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }).then(r => json<{ ok: true }>(r)),

  // Dependencies
  createDependency: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  updateDependency: (projectId: string, depId: string, patch: object) =>
    authedFetch(`/api/projects/${projectId}/dependencies/${depId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteDependency: (projectId: string, depId: string) =>
    authedFetch(`/api/projects/${projectId}/dependencies/${depId}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  // Resources
  createResource: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  updateResource: (projectId: string, resId: string, patch: object) =>
    authedFetch(`/api/projects/${projectId}/resources/${resId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteResource: (projectId: string, resId: string) =>
    authedFetch(`/api/projects/${projectId}/resources/${resId}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  reorderResources: (projectId: string, ids: string[]) =>
    authedFetch(`/api/projects/${projectId}/resources/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }).then(r => json<{ ok: true }>(r)),

  // Assignments
  createAssignment: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  updateAssignment: (projectId: string, asnId: string, patch: object) =>
    authedFetch(`/api/projects/${projectId}/assignments/${asnId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteAssignment: (projectId: string, asnId: string) =>
    authedFetch(`/api/projects/${projectId}/assignments/${asnId}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  // Calendar
  putCalendar: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/calendar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(r => json<{ ok: true }>(r)),

  // Settings
  putSettings: (projectId: string, data: object) =>
    authedFetch(`/api/projects/${projectId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(r => json<{ ok: true }>(r)),

  // Dashboard
  getDashboard: () => authedFetch(`/api/dashboard`).then(r => json<DashboardData>(r)),

  // Departments
  listDepartments: () =>
    authedFetch(`/api/departments`).then(r => json<{ departments: Department[] }>(r)),

  // Criteria — versions
  listCriteriaVersions: () =>
    authedFetch(`/api/criteria/versions`).then(r => json<{ versions: CriteriaVersion[] }>(r)),

  createCriteriaVersion: (data: {
    name: string;
    description?: string | null;
    isActive?: boolean;
    scoreMin?: number;
    scoreMax?: number;
  }) =>
    authedFetch(`/api/criteria/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  patchCriteriaVersion: (
    id: string,
    patch: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
      scoreMin?: number;
      scoreMax?: number;
    },
  ) =>
    authedFetch(`/api/criteria/versions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteCriteriaVersion: (id: string) =>
    authedFetch(`/api/criteria/versions/${id}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  // Criteria — active version (for submission wizard)
  getActiveCriteria: () =>
    authedFetch(`/api/criteria/active`).then(r =>
      json<{ version: CriteriaVersion | null; criteria: Criterion[] }>(r),
    ),

  // Criteria — CRUD
  listCriteria: (versionId: string) =>
    authedFetch(`/api/criteria?versionId=${encodeURIComponent(versionId)}`).then(r =>
      json<{ criteria: Criterion[] }>(r),
    ),

  createCriterion: (data: CreateCriterionInput) =>
    authedFetch(`/api/criteria`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  updateCriterion: (id: string, patch: Partial<CreateCriterionInput>) =>
    authedFetch(`/api/criteria/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then(r => json<{ ok: true }>(r)),

  deleteCriterion: (id: string) =>
    authedFetch(`/api/criteria/${id}`, {
      method: 'DELETE',
    }).then(r => json<{ ok: true }>(r)),

  putPairwise: (
    versionId: string,
    data: {
      comparisons: Array<{ criterionAId: string; criterionBId: string; value: number }>;
      weights: Array<{ criterionId: string; weight: number }>;
    },
  ) =>
    authedFetch(`/api/criteria/versions/${versionId}/pairwise`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(r => json<{ ok: true }>(r)),

  // Submission (full create with scores)
  submitProject: (data: SubmissionInput) =>
    authedFetch(`/api/projects/full`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => json<{ id: string }>(r)),

  getProjectFull: (projectId: string) =>
    authedFetch(`/api/projects/${projectId}/full`).then(r => json<ProjectFullResponse>(r)),

  updateProjectFull: (projectId: string, data: SubmissionInput) =>
    authedFetch(`/api/projects/${projectId}/full`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(r => json<{ ok: true }>(r)),
};

export type ApiClient = typeof apiClient;
