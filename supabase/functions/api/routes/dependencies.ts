import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';
import {
  dependencyCreateSchema,
  dependencyUpdateSchema,
} from '../lib/validation.ts';

export const dependenciesRoutes = new Hono();

dependenciesRoutes.post('/projects/:id/dependencies', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = dependencyCreateSchema.parse(body);

    const inserted = await sql<{ id: string }[]>`
      INSERT INTO schedule_dependencies (
        ${data.id ? sql`id,` : sql``}
        project_id, predecessor_id, successor_id, type, lag_days, created_by
      ) VALUES (
        ${data.id ? sql`${data.id},` : sql``}
        ${projectId}, ${data.predecessorId}, ${data.successorId},
        ${data.type}, ${data.lagDays}, ${auth.userId}
      )
      RETURNING id
    `;
    return c.json({ id: inserted[0].id });
  } catch (err) {
    return handleError(err, c);
  }
});

dependenciesRoutes.patch('/projects/:id/dependencies/:depId', async c => {
  try {
    const projectId = c.req.param('id');
    const depId = c.req.param('depId');
    const auth = getAuth(c);
    const body = await c.req.json();
    const patch = dependencyUpdateSchema.parse(body);

    if (patch.type !== undefined)
      await sql`UPDATE schedule_dependencies SET type = ${patch.type} WHERE id = ${depId} AND project_id = ${projectId}`;
    if (patch.lagDays !== undefined)
      await sql`UPDATE schedule_dependencies SET lag_days = ${patch.lagDays} WHERE id = ${depId} AND project_id = ${projectId}`;

    await sql`UPDATE schedule_dependencies SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${depId} AND project_id = ${projectId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

dependenciesRoutes.delete('/projects/:id/dependencies/:depId', async c => {
  try {
    const projectId = c.req.param('id');
    const depId = c.req.param('depId');
    await sql`DELETE FROM schedule_dependencies WHERE id = ${depId} AND project_id = ${projectId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
