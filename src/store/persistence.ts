import { useEffect, useState } from 'react';
import { useProjectStore, type Assignment, type Resource } from './projectStore';
import type { Calendar, Dependency, Task } from '../engine';
import { apiClient, isApiConfigured, ApiError } from '../api/client';
import type { SnapshotDto } from '../api/types';

const STORAGE_KEY = 'prime-schedule:v1';
const DEBOUNCE_MS = 500;

interface Snapshot {
  project: { id: string; name: string; start: string };
  tasks: Array<[string, SerializedTask]>;
  taskOrder: string[];
  dependencies: Array<[string, SerializedDep]>;
  calendar: SerializedCalendar;
  resources?: Array<[string, Resource]>;
  resourceOrder?: string[];
  assignments?: Array<[string, Assignment]>;
  collapsedIds?: string[];
  savedAt: number;
}

interface SerializedTask extends Omit<Task, 'manualStart' | 'constraint'> {
  manualStart?: string;
  constraint:
    | { kind: 'ASAP' }
    | { kind: 'SNET' | 'FNET' | 'MSO' | 'MFO'; date: string };
}

type SerializedDep = Dependency;

interface SerializedCalendar {
  workingDaysOfWeek: number[];
  holidays: string[];
  hoursPerDay: number;
}

function serialize(state: ReturnType<typeof useProjectStore.getState>): Snapshot {
  const tasks: Array<[string, SerializedTask]> = [];
  for (const [id, t] of state.tasks) {
    tasks.push([
      id,
      {
        ...t,
        manualStart: t.manualStart ? t.manualStart.toISOString() : undefined,
        constraint:
          t.constraint.kind === 'ASAP'
            ? { kind: 'ASAP' }
            : { kind: t.constraint.kind, date: t.constraint.date.toISOString() },
      },
    ]);
  }
  const deps: Array<[string, SerializedDep]> = [];
  for (const [id, d] of state.dependencies) deps.push([id, d]);

  return {
    project: { ...state.project, start: state.project.start.toISOString() },
    tasks,
    taskOrder: state.taskOrder,
    dependencies: deps,
    calendar: {
      workingDaysOfWeek: [...state.calendar.workingDaysOfWeek],
      holidays: [...state.calendar.holidays],
      hoursPerDay: state.calendar.hoursPerDay,
    },
    resources: [...state.resources],
    resourceOrder: state.resourceOrder,
    assignments: [...state.assignments],
    collapsedIds: [...state.collapsed],
    savedAt: Date.now(),
  };
}

function deserialize(snap: Snapshot) {
  const tasks = new Map<string, Task>();
  for (const [id, t] of snap.tasks) {
    tasks.set(id, {
      ...t,
      manualStart: t.manualStart ? new Date(t.manualStart) : undefined,
      constraint:
        t.constraint.kind === 'ASAP'
          ? { kind: 'ASAP' }
          : { kind: t.constraint.kind, date: new Date(t.constraint.date) },
    });
  }
  const dependencies = new Map<string, Dependency>(snap.dependencies);
  const calendar: Calendar = {
    workingDaysOfWeek: new Set(snap.calendar.workingDaysOfWeek as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>),
    holidays: new Set(snap.calendar.holidays),
    hoursPerDay: snap.calendar.hoursPerDay,
  };
  const resources = new Map<string, Resource>(snap.resources ?? []);
  const resourceOrder = snap.resourceOrder ?? [];
  const assignments = new Map<string, Assignment>(snap.assignments ?? []);
  return {
    project: { ...snap.project, start: new Date(snap.project.start) },
    tasks,
    taskOrder: snap.taskOrder,
    dependencies,
    calendar,
    resources,
    resourceOrder,
    assignments,
    collapsed: new Set(snap.collapsedIds ?? []),
  };
}

export function loadFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw) as Snapshot;
    const state = deserialize(snap);
    useProjectStore.getState().loadProject(state);
    return true;
  } catch {
    return false;
  }
}

export async function loadFromApi(projectId: string): Promise<boolean> {
  try {
    const dto = await apiClient.getSnapshot(projectId);
    const state = deserialize(dto as Snapshot);
    useProjectStore.getState().loadProject(state);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

interface PersistenceOptions {
  mode?: 'local' | 'api';
  projectId?: string;
}

export function usePersistence(opts: PersistenceOptions = {}) {
  const mode = opts.mode ?? (isApiConfigured && opts.projectId ? 'api' : 'local');
  const projectId = opts.projectId;
  const [savedAgo, setSavedAgo] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = useProjectStore.subscribe(state => {
      if (state.tasks.size === 0 && state.taskOrder.length === 0) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const snap = serialize(state);
          if (mode === 'api' && projectId) {
            // Server-side save expects the project ID from the URL/path
            const dto: SnapshotDto = { ...snap, project: { ...snap.project, id: projectId } };
            await apiClient.putSnapshot(projectId, dto);
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
          }
          setSavedAgo(0);
          setSyncError(null);
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'sync_error');
        }
      }, DEBOUNCE_MS);
    });
    return unsub;
  }, [mode, projectId]);

  useEffect(() => {
    if (savedAgo === null) return;
    const id = setInterval(() => setSavedAgo(s => (s === null ? null : s + 1)), 1000);
    return () => clearInterval(id);
  }, [savedAgo]);

  return { savedAgo, syncError, mode };
}
