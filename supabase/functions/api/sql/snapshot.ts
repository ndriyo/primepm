import { sql } from '../lib/db.ts';
import { maskToWorkingDays, workingDaysToMask } from '../lib/validation.ts';

interface DbTask {
  id: string;
  parent_id: string | null;
  name: string;
  notes: string | null;
  duration_days: number;
  is_milestone: boolean;
  schedule_mode: string;
  manual_start: string | null;
  constraint_type: string;
  constraint_date: string | null;
  progress_pct: number;
  color: string | null;
  order_index: number;
}

interface DbDep {
  id: string;
  predecessor_id: string;
  successor_id: string;
  type: string;
  lag_days: number;
}

interface DbResource {
  id: string;
  code: string;
  name: string;
  default_allocation_pct: number;
  rate_per_day: string | null;
  color: string | null;
  notes: string | null;
  order_index: number;
}

interface DbAssignment {
  id: string;
  task_id: string;
  resource_id: string;
  allocation_pct: number;
}

interface DbCalendar {
  working_days_mask: number;
  holidays: string[];
  hours_per_day: number;
}

interface DbSettings {
  task_order: string[];
  resource_order: string[];
  collapsed_ids: string[];
  project_start: string | null;
  project_name: string | null;
}

interface DbProject {
  id: string;
  name: string;
  start_date: string;
}

export interface Snapshot {
  project: { id: string; name: string; start: string };
  tasks: Array<[string, SerializedTask]>;
  taskOrder: string[];
  dependencies: Array<[string, SerializedDep]>;
  calendar: { workingDaysOfWeek: number[]; holidays: string[]; hoursPerDay: number };
  resources?: Array<[string, SerializedResource]>;
  resourceOrder?: string[];
  assignments?: Array<[string, SerializedAssignment]>;
  collapsedIds?: string[];
  savedAt: number;
}

interface SerializedTask {
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

interface SerializedDep {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

interface SerializedResource {
  id: string;
  code: string;
  name: string;
  defaultAllocationPct: number;
  ratePerDay?: number;
  color?: string;
  notes?: string;
}

interface SerializedAssignment {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPct: number;
}

function rowToTask(r: DbTask): SerializedTask {
  const t: SerializedTask = {
    id: r.id,
    name: r.name,
    durationDays: r.duration_days,
    isMilestone: r.is_milestone,
    scheduleMode: r.schedule_mode === 'manual' ? 'manual' : 'auto',
    progressPct: r.progress_pct,
    constraint:
      r.constraint_type === 'ASAP' || !r.constraint_date
        ? { kind: 'ASAP' }
        : {
            kind: r.constraint_type as 'SNET' | 'FNET' | 'MSO' | 'MFO',
            date: new Date(r.constraint_date).toISOString(),
          },
  };
  if (r.notes != null) t.notes = r.notes;
  if (r.color != null) t.color = r.color;
  if (r.parent_id != null) t.parentId = r.parent_id;
  if (r.manual_start != null) t.manualStart = new Date(r.manual_start).toISOString();
  return t;
}

function rowToResource(r: DbResource): SerializedResource {
  const out: SerializedResource = {
    id: r.id,
    code: r.code,
    name: r.name,
    defaultAllocationPct: r.default_allocation_pct,
  };
  if (r.rate_per_day != null) out.ratePerDay = Number(r.rate_per_day);
  if (r.color != null) out.color = r.color;
  if (r.notes != null) out.notes = r.notes;
  return out;
}

/**
 * Read every schedule_* table for a project into a tuple-encoded Snapshot.
 *
 * The optional `client` parameter lets callers pass a transaction handle (the
 * `tx` from `sql.begin(async tx => …)`) so all reads happen on the same
 * connection as a surrounding INSERT — important for the baselines route,
 * which needs all reads + the insert to be in one consistent transaction
 * (Spec 002 FR-018, R3).
 */
export async function loadSnapshot(
  projectId: string,
  client: typeof sql = sql,
): Promise<Snapshot | null> {
  const projectRows = await client<DbProject[]>`
    SELECT id, name, start_date FROM projects WHERE id = ${projectId} LIMIT 1
  `;
  if (projectRows.length === 0) return null;
  const project = projectRows[0];

  const [taskRows, depRows, resourceRows, assignmentRows, calendarRows, settingsRows] =
    await Promise.all([
      client<DbTask[]>`
        SELECT id, parent_id, name, notes, duration_days, is_milestone, schedule_mode,
               manual_start, constraint_type, constraint_date, progress_pct, color, order_index
        FROM schedule_tasks WHERE project_id = ${projectId} ORDER BY order_index
      `,
      client<DbDep[]>`
        SELECT id, predecessor_id, successor_id, type, lag_days
        FROM schedule_dependencies WHERE project_id = ${projectId}
      `,
      client<DbResource[]>`
        SELECT id, code, name, default_allocation_pct, rate_per_day, color, notes, order_index
        FROM schedule_resources WHERE project_id = ${projectId} ORDER BY order_index
      `,
      client<DbAssignment[]>`
        SELECT id, task_id, resource_id, allocation_pct
        FROM schedule_assignments WHERE project_id = ${projectId}
      `,
      client<DbCalendar[]>`
        SELECT working_days_mask, holidays, hours_per_day
        FROM schedule_calendars WHERE project_id = ${projectId} LIMIT 1
      `,
      client<DbSettings[]>`
        SELECT task_order, resource_order, collapsed_ids, project_start, project_name
        FROM schedule_settings WHERE project_id = ${projectId} LIMIT 1
      `,
    ]);

  const calendar = calendarRows[0] ?? { working_days_mask: 62, holidays: [], hours_per_day: 8 };
  const settings = settingsRows[0];

  const taskOrder: string[] =
    Array.isArray(settings?.task_order) && settings.task_order.length > 0
      ? settings.task_order
      : taskRows.map(t => t.id);
  const resourceOrder: string[] =
    Array.isArray(settings?.resource_order) && settings.resource_order.length > 0
      ? settings.resource_order
      : resourceRows.map(r => r.id);

  const start = settings?.project_start
    ? new Date(settings.project_start).toISOString()
    : new Date(project.start_date).toISOString();

  const name = settings?.project_name ?? project.name;

  return {
    project: { id: project.id, name, start },
    tasks: taskRows.map(t => [t.id, rowToTask(t)]),
    taskOrder,
    dependencies: depRows.map(d => [
      d.id,
      {
        id: d.id,
        predecessorId: d.predecessor_id,
        successorId: d.successor_id,
        type: d.type as 'FS' | 'SS' | 'FF' | 'SF',
        lagDays: d.lag_days,
      },
    ]),
    calendar: {
      workingDaysOfWeek: maskToWorkingDays(calendar.working_days_mask),
      holidays: calendar.holidays ?? [],
      hoursPerDay: calendar.hours_per_day,
    },
    resources: resourceRows.map(r => [r.id, rowToResource(r)]),
    resourceOrder,
    assignments: assignmentRows.map(a => [
      a.id,
      {
        id: a.id,
        taskId: a.task_id,
        resourceId: a.resource_id,
        allocationPct: a.allocation_pct,
      },
    ]),
    collapsedIds: Array.isArray(settings?.collapsed_ids) ? settings.collapsed_ids : [],
    savedAt: Date.now(),
  };
}

export async function saveSnapshot(
  projectId: string,
  userId: string,
  snap: Snapshot,
): Promise<void> {
  await sql.begin(async tx => {
    // Wipe existing data for this project (cascade FK = simplest correctness)
    await tx`DELETE FROM schedule_assignments WHERE project_id = ${projectId}`;
    await tx`DELETE FROM schedule_dependencies WHERE project_id = ${projectId}`;
    await tx`DELETE FROM schedule_tasks WHERE project_id = ${projectId}`;
    await tx`DELETE FROM schedule_resources WHERE project_id = ${projectId}`;

    // Tasks: two-pass insert so parent_ids resolve.
    const orderIndex = new Map(snap.taskOrder.map((id, i) => [id, i]));
    // Pass 1: insert without parent_id
    for (const [, t] of snap.tasks) {
      const constraintType = t.constraint.kind;
      const constraintDate =
        t.constraint.kind !== 'ASAP' ? t.constraint.date.slice(0, 10) : null;
      const manualStart = t.manualStart ? t.manualStart.slice(0, 10) : null;
      const idx = orderIndex.get(t.id) ?? 0;
      await tx`
        INSERT INTO schedule_tasks (
          id, project_id, parent_id, name, notes, duration_days, is_milestone,
          schedule_mode, manual_start, constraint_type, constraint_date,
          progress_pct, color, order_index, created_by
        ) VALUES (
          ${t.id}, ${projectId}, NULL, ${t.name}, ${t.notes ?? null},
          ${t.durationDays}, ${t.isMilestone}, ${t.scheduleMode},
          ${manualStart}::date, ${constraintType}, ${constraintDate}::date,
          ${t.progressPct}, ${t.color ?? null}, ${idx}, ${userId}
        )
      `;
    }
    // Pass 2: set parent_id where applicable
    for (const [, t] of snap.tasks) {
      if (t.parentId) {
        await tx`UPDATE schedule_tasks SET parent_id = ${t.parentId} WHERE id = ${t.id}`;
      }
    }

    // Resources
    const resOrderIdx = new Map((snap.resourceOrder ?? []).map((id, i) => [id, i]));
    for (const [, r] of snap.resources ?? []) {
      const idx = resOrderIdx.get(r.id) ?? 0;
      await tx`
        INSERT INTO schedule_resources (
          id, project_id, code, name, default_allocation_pct, rate_per_day,
          color, notes, order_index, created_by
        ) VALUES (
          ${r.id}, ${projectId}, ${r.code}, ${r.name}, ${r.defaultAllocationPct},
          ${r.ratePerDay ?? null}, ${r.color ?? null}, ${r.notes ?? null},
          ${idx}, ${userId}
        )
      `;
    }

    // Dependencies
    for (const [, d] of snap.dependencies) {
      await tx`
        INSERT INTO schedule_dependencies (
          id, project_id, predecessor_id, successor_id, type, lag_days, created_by
        ) VALUES (
          ${d.id}, ${projectId}, ${d.predecessorId}, ${d.successorId},
          ${d.type}, ${d.lagDays}, ${userId}
        )
      `;
    }

    // Assignments
    for (const [, a] of snap.assignments ?? []) {
      await tx`
        INSERT INTO schedule_assignments (
          id, project_id, task_id, resource_id, allocation_pct, created_by
        ) VALUES (
          ${a.id}, ${projectId}, ${a.taskId}, ${a.resourceId},
          ${a.allocationPct}, ${userId}
        )
      `;
    }

    // Calendar (upsert)
    const mask = workingDaysToMask(snap.calendar.workingDaysOfWeek);
    await tx`
      INSERT INTO schedule_calendars (project_id, working_days_mask, holidays, hours_per_day)
      VALUES (${projectId}, ${mask}, ${JSON.stringify(snap.calendar.holidays)}::jsonb, ${snap.calendar.hoursPerDay})
      ON CONFLICT (project_id) DO UPDATE SET
        working_days_mask = EXCLUDED.working_days_mask,
        holidays = EXCLUDED.holidays,
        hours_per_day = EXCLUDED.hours_per_day,
        updated_at = NOW()
    `;

    // Settings (upsert)
    await tx`
      INSERT INTO schedule_settings (
        project_id, task_order, resource_order, collapsed_ids, project_start, project_name
      ) VALUES (
        ${projectId},
        ${JSON.stringify(snap.taskOrder)}::jsonb,
        ${JSON.stringify(snap.resourceOrder ?? [])}::jsonb,
        ${JSON.stringify(snap.collapsedIds ?? [])}::jsonb,
        ${snap.project.start.slice(0, 10)}::date,
        ${snap.project.name}
      )
      ON CONFLICT (project_id) DO UPDATE SET
        task_order = EXCLUDED.task_order,
        resource_order = EXCLUDED.resource_order,
        collapsed_ids = EXCLUDED.collapsed_ids,
        project_start = EXCLUDED.project_start,
        project_name = EXCLUDED.project_name,
        updated_at = NOW()
    `;
  });
}
