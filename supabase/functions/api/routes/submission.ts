import { Hono } from 'hono';
import { z } from 'zod';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, notFound } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';

export const submissionRoutes = new Hono();

const fullCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  status: z.string().default('Initiation'),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().nullable().optional(),
  resources: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
  scores: z.array(z.object({
    criterionId: z.string().uuid(),
    score: z.number(),
    comment: z.string().nullable().optional(),
  })).default([]),
  weightedScore: z.number().nullable().optional(),
});

interface ProjectFullRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  department_id: string | null;
  budget: string | null;
  resources: number;
  tags: string[] | null;
  score: number | null;
}

interface ScoreRow {
  criterion_id: string;
  score: number;
  comment: string | null;
}

submissionRoutes.post('/projects/full', async c => {
  try {
    const auth = getAuth(c);
    const data = fullCreateSchema.parse(await c.req.json());

    const activeVersion = await sql<{ id: string }[]>`
      SELECT id FROM criteria_versions
      WHERE organization_id = ${auth.organizationId} AND is_active = true
      LIMIT 1
    `;
    const versionId = activeVersion[0]?.id ?? null;

    const result = await sql.begin(async tx => {
      const projectRows = await tx<{ id: string }[]>`
        INSERT INTO projects (
          organization_id, department_id, name, description, status,
          start_date, end_date, budget, resources, tags, score, created_by
        ) VALUES (
          ${auth.organizationId}, ${data.departmentId ?? null},
          ${data.name}, ${data.description ?? null}, ${data.status},
          ${data.startDate}::date, ${data.endDate}::date,
          ${data.budget ?? null}, ${data.resources}, ${data.tags}::text[],
          ${data.weightedScore ?? null}, ${auth.userId}
        )
        RETURNING id
      `;
      const projectId = projectRows[0].id;

      if (versionId && data.scores.length > 0) {
        for (const s of data.scores) {
          await tx`
            INSERT INTO project_criteria_scores (
              project_id, criterion_id, version_id, score, comment, created_by
            ) VALUES (
              ${projectId}, ${s.criterionId}, ${versionId}, ${s.score}, ${s.comment ?? null}, ${auth.userId}
            )
          `;
        }
      }

      await tx`
        INSERT INTO schedule_calendars (project_id, working_days_mask, holidays, hours_per_day)
        VALUES (${projectId}, 62, '[]'::jsonb, 8)
        ON CONFLICT (project_id) DO NOTHING
      `;

      return projectRows;
    });

    await audit(auth.userId, 'create', 'Project', result[0].id);
    return c.json({ id: result[0].id }, 201);
  } catch (err) {
    return handleError(err, c);
  }
});

// Fetch a project with its self-assessment scores for the submission edit flow.
submissionRoutes.get('/projects/:id/full', async c => {
  try {
    const auth = getAuth(c);
    const projectId = c.req.param('id');

    const projectRows = await sql<ProjectFullRow[]>`
      SELECT id, name, description, status, start_date, end_date, department_id,
             budget::text AS budget, resources, tags, score
      FROM projects
      WHERE id = ${projectId} AND organization_id = ${auth.organizationId}
      LIMIT 1
    `;
    if (projectRows.length === 0) throw notFound('project_not_found');
    const p = projectRows[0];

    // Use the active version to interpret/return scores. If the project was
    // submitted under a different version, we still surface those scores.
    const scoreRows = await sql<ScoreRow[]>`
      SELECT criterion_id, score, comment
      FROM project_criteria_scores
      WHERE project_id = ${projectId}
    `;

    return c.json({
      project: {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
        departmentId: p.department_id,
        budget: p.budget !== null ? Number(p.budget) : null,
        resources: p.resources,
        tags: p.tags ?? [],
        score: p.score,
      },
      scores: scoreRows.map(r => ({
        criterionId: r.criterion_id,
        score: r.score,
        comment: r.comment,
      })),
    });
  } catch (err) {
    return handleError(err, c);
  }
});

// Update a project + replace its self-assessment scores.
submissionRoutes.put('/projects/:id/full', async c => {
  try {
    const auth = getAuth(c);
    const projectId = c.req.param('id');
    const data = fullCreateSchema.parse(await c.req.json());

    const exists = await sql<{ id: string }[]>`
      SELECT id FROM projects WHERE id = ${projectId} AND organization_id = ${auth.organizationId}
    `;
    if (exists.length === 0) throw notFound('project_not_found');

    const activeVersion = await sql<{ id: string }[]>`
      SELECT id FROM criteria_versions
      WHERE organization_id = ${auth.organizationId} AND is_active = true
      LIMIT 1
    `;
    const versionId = activeVersion[0]?.id ?? null;

    await sql.begin(async tx => {
      await tx`
        UPDATE projects
        SET name = ${data.name},
            description = ${data.description ?? null},
            department_id = ${data.departmentId ?? null},
            status = ${data.status},
            start_date = ${data.startDate}::date,
            end_date = ${data.endDate}::date,
            budget = ${data.budget ?? null},
            resources = ${data.resources},
            tags = ${data.tags}::text[],
            score = ${data.weightedScore ?? null},
            updated_by = ${auth.userId},
            updated_at = NOW()
        WHERE id = ${projectId} AND organization_id = ${auth.organizationId}
      `;

      // Replace scores against the active version.
      await tx`DELETE FROM project_criteria_scores WHERE project_id = ${projectId}`;
      if (versionId && data.scores.length > 0) {
        for (const s of data.scores) {
          await tx`
            INSERT INTO project_criteria_scores (
              project_id, criterion_id, version_id, score, comment, created_by
            ) VALUES (
              ${projectId}, ${s.criterionId}, ${versionId}, ${s.score}, ${s.comment ?? null}, ${auth.userId}
            )
          `;
        }
      }
    });

    await audit(auth.userId, 'update', 'Project', projectId);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
