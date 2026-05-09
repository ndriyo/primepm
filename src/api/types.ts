// Wire types — match the Edge Function's snapshotSchema.

export interface SerializedSnapshotTask {
  id: string;
  name: string;
  notes?: string;
  durationDays: number;
  isMilestone: boolean;
  scheduleMode: 'auto' | 'manual';
  manualStart?: string;
  constraint:
    | { kind: 'ASAP' }
    | { kind: 'SNET' | 'FNET' | 'MSO' | 'MFO'; date: string };
  progressPct: number;
  color?: string;
  parentId?: string;
}

export interface SerializedSnapshotDep {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

export interface SerializedSnapshotResource {
  id: string;
  code: string;
  name: string;
  defaultAllocationPct: number;
  ratePerDay?: number;
  color?: string;
  notes?: string;
}

export interface SerializedSnapshotAssignment {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPct: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  departmentId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  taskCount: number;
  budget: number | null;
  resources: number;
  score: number | null;
  tags: string[];
}

export interface ProjectFull {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  departmentId: string | null;
  budget: number | null;
  resources: number;
  tags: string[];
  score: number | null;
}

export interface ProjectFullResponse {
  project: ProjectFull;
  scores: Array<{ criterionId: string; score: number; comment: string | null }>;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  departmentId?: string | null;
}

export interface SnapshotDto {
  project: { id: string; name: string; start: string };
  tasks: Array<[string, SerializedSnapshotTask]>;
  taskOrder: string[];
  dependencies: Array<[string, SerializedSnapshotDep]>;
  calendar: { workingDaysOfWeek: number[]; holidays: string[]; hoursPerDay: number };
  resources?: Array<[string, SerializedSnapshotResource]>;
  resourceOrder?: string[];
  assignments?: Array<[string, SerializedSnapshotAssignment]>;
  collapsedIds?: string[];
  savedAt?: number;
}

// ---- Dashboard ----

export interface DashboardData {
  counts: { total: number; approved: number; pending: number };
  totals: { budget: number; mandays: number };
  byStatus: Array<{ status: string; count: number; budget: number }>;
  scoreQuadrant: Array<{ id: string; name: string; budget: number; score: number }>;
  topProjects: Array<{ id: string; name: string; score: number; budget: number; status: string }>;
}

// ---- Departments ----

export interface Department {
  id: string;
  name: string;
}

// ---- Criteria ----

export interface CriteriaVersion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  scoreMin: number;
  scoreMax: number;
  created_at?: string | null;
}

export interface Criterion {
  id: string;
  versionId: string;
  key: string;
  label: string;
  description: string | null;
  isInverse: boolean;
  isDefault: boolean;
  weight: number | null;
  rubric: Record<string, string>;
}

export interface CreateCriterionInput {
  versionId: string;
  key: string;
  label: string;
  description?: string | null;
  isInverse?: boolean;
  weight?: number | null;
  rubric?: Record<string, string>;
}

// ---- Submission ----

export interface SubmissionInput {
  name: string;
  description?: string | null;
  departmentId?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  budget?: number | null;
  resources: number;
  tags: string[];
  scores: Array<{ criterionId: string; score: number; comment?: string | null }>;
  weightedScore?: number | null;
}

// ============================================================================
// Spec 002 — Schedule Baseline & Tracking Gantt Overlay
// SOURCE: specs/002-schedule-baseline-tracking-overlay/contracts/baselines.openapi.yaml
// Mirrored by hand (no openapi-typescript dep). Drift is guarded by the
// type-level test in src/api/__tests__/types.baselines.test.ts.
// ============================================================================

export interface BaselineHeaderDto {
  id: string;
  projectId: string;
  versionLabel: string;          // 'v0' | 'v1' | …
  versionIndex: number;
  rationale: string;
  createdAt: string;             // ISO timestamp
  createdBy: { id: string; fullName: string };
}

export interface BaselineTaskDto {
  id: string;
  parentId?: string | null;
  name: string;
  notes?: string | null;
  durationDays: number;
  isMilestone: boolean;
  scheduleMode: 'auto' | 'manual';
  manualStart?: string | null;
  constraint:
    | { kind: 'ASAP' }
    | { kind: 'SNET' | 'FNET' | 'MSO' | 'MFO'; date: string };
  progressPct: number;
  color?: string | null;
  orderIndex: number;
  // Optional — see contracts/baselines.openapi.yaml note. Server omits these;
  // client recomputes from the frozen snapshot at render time.
  computedStart?: string;         // ISO date
  computedFinish?: string;        // ISO date
}

export interface BaselineDependencyDto {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

export interface BaselineResourceDto {
  id: string;
  code: string;
  name: string;
  defaultAllocationPct: number;
  ratePerDay?: number | null;
  color?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export interface BaselineAssignmentDto {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPct: number;
}

export interface BaselineCalendarDto {
  workingDaysOfWeek: number[];   // 0..6
  holidays: string[];            // ISO dates
  hoursPerDay: number;
}

export interface BaselineSettingsDto {
  taskOrder: string[];           // ordered task ids
  resourceOrder: string[];
  collapsedIds: string[];
}

export interface BaselinePayloadDto {
  schemaVersion: 1;
  capturedAt: string;            // ISO timestamp
  project: {
    id: string;
    name: string;
    start: string;               // ISO date
  };
  tasks: BaselineTaskDto[];
  dependencies: BaselineDependencyDto[];
  resources: BaselineResourceDto[];
  assignments: BaselineAssignmentDto[];
  calendar: BaselineCalendarDto;
  settings: BaselineSettingsDto;
}

export type BaselineWithPayloadDto = BaselineHeaderDto & { payload: BaselinePayloadDto };
