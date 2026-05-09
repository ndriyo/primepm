// Spec 002 — Schedule Baseline & Tracking Gantt Overlay
// REST surface defined in specs/002-schedule-baseline-tracking-overlay/contracts/baselines.openapi.yaml

import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, badRequest, forbidden, notFound, HttpError } from '../lib/errors.ts';
import { baselineCreateSchema } from '../lib/validation.ts';
import { loadSnapshot } from '../sql/snapshot.ts';
import { audit } from '../lib/audit.ts';

export const baselineRoutes = new Hono();

interface BaselineRow {
  id: string;
  project_id: string;
  version_label: string;
  version_index: number;
  rationale: string;
  created_at: string;
  created_by: string;
  full_name: string;
  payload?: unknown;
}

function rowToHeader(r: BaselineRow) {
  return {
    id: r.id,
    projectId: r.project_id,
    versionLabel: r.version_label,
    versionIndex: r.version_index,
    rationale: r.rationale,
    createdAt: new Date(r.created_at).toISOString(),
    createdBy: { id: r.created_by, fullName: r.full_name },
  };
}

/**
 * Convert the existing snapshot (tuple-encoded) into the BaselinePayload
 * shape required by the OpenAPI contract.
 */
function snapshotToBaselinePayload(snap: Awaited<ReturnType<typeof loadSnapshot>>): unknown {
  if (!snap) throw new Error('snapshot_not_found');
  // taskOrder gives us each task's orderIndex (its position in the array).
  const orderIndexById = new Map<string, number>();
  snap.taskOrder.forEach((id, idx) => orderIndexById.set(id, idx));

  const tasks = snap.tasks.map(([id, t]) => ({
    id,
    parentId: t.parentId ?? null,
    name: t.name,
    notes: t.notes ?? null,
    durationDays: t.durationDays,
    isMilestone: t.isMilestone,
    scheduleMode: t.scheduleMode,
    manualStart: t.manualStart ?? null,
    constraint: t.constraint,
    progressPct: t.progressPct,
    color: t.color ?? null,
    orderIndex: orderIndexById.get(id) ?? 0,
    // computedStart/computedFinish intentionally omitted; client recomputes.
  }));

  const dependencies = snap.dependencies.map(([_id, d]) => ({
    id: d.id,
    predecessorId: d.predecessorId,
    successorId: d.successorId,
    type: d.type,
    lagDays: d.lagDays,
  }));

  const resources = (snap.resources ?? []).map(([id, r]) => ({
    id,
    code: r.code,
    name: r.name,
    defaultAllocationPct: r.defaultAllocationPct,
    ratePerDay: r.ratePerDay ?? null,
    color: r.color ?? null,
    notes: r.notes ?? null,
    orderIndex: (snap.resourceOrder ?? []).indexOf(id),
  }));

  const assignments = (snap.assignments ?? []).map(([_id, a]) => ({
    id: a.id,
    taskId: a.taskId,
    resourceId: a.resourceId,
    allocationPct: a.allocationPct,
  }));

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    project: {
      id: snap.project.id,
      name: snap.project.name,
      start: snap.project.start.slice(0, 10),
    },
    tasks,
    dependencies,
    resources,
    assignments,
    calendar: snap.calendar,
    settings: {
      taskOrder: snap.taskOrder,
      resourceOrder: snap.resourceOrder ?? [],
      collapsedIds: snap.collapsedIds ?? [],
    },
  };
}

/**
 * Verify the caller has permission to *edit* the project's schedule (FR-001).
 * In the current PrimePM model, edit-permission == project membership in the
 * caller's organization. We check organizationId match here; downstream RLS
 * provides the same guarantee at the row level.
 */
async function assertProjectEditAccess(projectId: string, organizationId: string): Promise<void> {
  const rows = await sql<{ organization_id: string }[]>`
    SELECT organization_id FROM projects WHERE id = ${projectId} LIMIT 1
  `;
  if (rows.length === 0) throw notFound('project_not_found');
  if (rows[0].organization_id !== organizationId) {
    throw forbidden('forbidden');
  }
}

// GET /projects/:projectId/baselines — newest-first headers, no payload
baselineRoutes.get('/projects/:projectId/baselines', async c => {
  try {
    const projectId = c.req.param('projectId');
    const auth = getAuth(c);
    await assertProjectEditAccess(projectId, auth.organizationId);

    const rows = await sql<BaselineRow[]>`
      SELECT b.id, b.project_id, b.version_label, b.version_index, b.rationale,
             b.created_at, b.created_by, u.full_name
      FROM schedule_baselines b
      JOIN users u ON u.id = b.created_by
      WHERE b.project_id = ${projectId}
      ORDER BY b.version_index DESC
    `;
    return c.json({ baselines: rows.map(rowToHeader) });
  } catch (err) {
    return handleError(err, c);
  }
});

// GET /projects/:projectId/baselines/:baselineId — full payload included
baselineRoutes.get('/projects/:projectId/baselines/:baselineId', async c => {
  try {
    const projectId = c.req.param('projectId');
    const baselineId = c.req.param('baselineId');
    const auth = getAuth(c);
    await assertProjectEditAccess(projectId, auth.organizationId);

    const rows = await sql<BaselineRow[]>`
      SELECT b.id, b.project_id, b.version_label, b.version_index, b.rationale,
             b.created_at, b.created_by, u.full_name, b.payload
      FROM schedule_baselines b
      JOIN users u ON u.id = b.created_by
      WHERE b.project_id = ${projectId} AND b.id = ${baselineId}
      LIMIT 1
    `;
    if (rows.length === 0) throw notFound('baseline_not_found');
    return c.json({ ...rowToHeader(rows[0]), payload: rows[0].payload });
  } catch (err) {
    return handleError(err, c);
  }
});

// POST /projects/:projectId/baselines — capture a new baseline atomically
baselineRoutes.post('/projects/:projectId/baselines', async c => {
  try {
    const projectId = c.req.param('projectId');
    const auth = getAuth(c);
    await assertProjectEditAccess(projectId, auth.organizationId);

    const body = await c.req.json();
    const parsed = baselineCreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'rationale_required' }, 400);
    }
    const rationale = parsed.data.rationale;

    // Validate the project actually has tasks before capturing (spec edge case).
    const taskCount = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM schedule_tasks WHERE project_id = ${projectId}
    `;
    if ((taskCount[0]?.count ?? 0) === 0) {
      return c.json({ error: 'project_has_no_tasks' }, 400);
    }

    // Single transaction: load snapshot → compute version → insert → audit.
    const inserted = await sql.begin(async tx => {
      // Per-project sequence — hold the count under the transaction lock.
      const countRows = await tx<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM schedule_baselines WHERE project_id = ${projectId}
      `;
      const versionIndex = countRows[0]?.count ?? 0;
      const versionLabel = `v${versionIndex}`;

      const snap = await loadSnapshot(projectId);
      if (!snap) throw notFound('project_not_found');
      const payload = snapshotToBaselinePayload(snap);

      const insertRows = await tx<BaselineRow[]>`
        INSERT INTO schedule_baselines (
          project_id, version_label, version_index, rationale, payload, created_by
        )
        VALUES (
          ${projectId}, ${versionLabel}, ${versionIndex}, ${rationale},
          ${JSON.stringify(payload)}::jsonb, ${auth.userId}
        )
        RETURNING id, project_id, version_label, version_index, rationale, created_at, created_by
      `;
      const row = insertRows[0];

      // Audit row in the same transaction (FR-015, R11).
      await tx`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
        VALUES (${auth.userId}, ${'baseline.set'}, ${'ScheduleBaseline'}, ${row.id})
      `;

      // Resolve full_name for the response.
      const userRows = await tx<{ full_name: string }[]>`
        SELECT full_name FROM users WHERE id = ${auth.userId} LIMIT 1
      `;
      return { ...row, full_name: userRows[0]?.full_name ?? '' } as BaselineRow;
    });

    return c.json(rowToHeader(inserted), 201);
  } catch (err) {
    if (err instanceof HttpError) return handleError(err, c);
    // Postgres error code 23505 = unique_violation. Surface as 409 per contract.
    const code = (err as { code?: string }).code;
    if (code === '23505') {
      return c.json({ error: 'baseline_version_conflict' }, 409);
    }
    return handleError(err, c);
  }
});

// Best-effort fallback for unused imports under strict TS.
void badRequest;
