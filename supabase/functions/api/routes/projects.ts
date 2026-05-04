import { Hono } from 'hono';
import { z } from 'zod';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, notFound } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';

export const projectsRoutes = new Hono();

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  startDate: z.string().min(1), // ISO yyyy-mm-dd
  endDate: z.string().min(1),
  status: z.string().default('active'),
  departmentId: z.string().uuid().nullable().optional(),
});

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  department_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  task_count: number;
  budget: string | null;
  resources: number;
  score: number | null;
  tags: string[] | null;
}

projectsRoutes.get('/projects', async c => {
  try {
    const auth = getAuth(c);
    const rows = await sql<ProjectRow[]>`
      SELECT
        p.id, p.name, p.description, p.status, p.start_date, p.end_date,
        p.department_id, p.created_at, p.updated_at,
        p.budget::text AS budget, p.resources, p.score, p.tags,
        COALESCE((SELECT COUNT(*)::int FROM schedule_tasks t WHERE t.project_id = p.id), 0) AS task_count
      FROM projects p
      WHERE p.organization_id = ${auth.organizationId}
      ORDER BY p.score DESC NULLS LAST, p.updated_at DESC NULLS LAST, p.created_at DESC NULLS LAST
    `;
    return c.json({
      projects: rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        startDate: r.start_date,
        endDate: r.end_date,
        departmentId: r.department_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        taskCount: r.task_count,
        budget: r.budget !== null ? Number(r.budget) : null,
        resources: r.resources,
        score: r.score,
        tags: r.tags ?? [],
      })),
    });
  } catch (err) {
    return handleError(err, c);
  }
});

projectsRoutes.post('/projects', async c => {
  try {
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = createProjectSchema.parse(body);

    const inserted = await sql<{ id: string }[]>`
      INSERT INTO projects (
        organization_id, department_id, name, description, status,
        start_date, end_date, resources, tags, created_by
      ) VALUES (
        ${auth.organizationId}, ${data.departmentId ?? null},
        ${data.name}, ${data.description ?? null}, ${data.status},
        ${data.startDate}::date, ${data.endDate}::date,
        0, ARRAY[]::text[], ${auth.userId}
      )
      RETURNING id
    `;
    const id = inserted[0].id;

    // Seed a default calendar so the scheduler has something to work with.
    await sql`
      INSERT INTO schedule_calendars (project_id, working_days_mask, holidays, hours_per_day)
      VALUES (${id}, 62, '[]'::jsonb, 8)
      ON CONFLICT (project_id) DO NOTHING
    `;

    await audit(auth.userId, 'create', 'Project', id);
    return c.json({ id }, 201);
  } catch (err) {
    return handleError(err, c);
  }
});

projectsRoutes.delete('/projects/:id', async c => {
  try {
    const auth = getAuth(c);
    const projectId = c.req.param('id');
    // RLS would also block this, but defense in depth: scope by org
    const rows = await sql<{ id: string }[]>`
      DELETE FROM projects
      WHERE id = ${projectId} AND organization_id = ${auth.organizationId}
      RETURNING id
    `;
    if (rows.length === 0) throw notFound('project_not_found');
    await audit(auth.userId, 'delete', 'Project', projectId);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
