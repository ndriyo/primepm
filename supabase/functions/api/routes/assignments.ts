import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';
import {
  assignmentCreateSchema,
  assignmentUpdateSchema,
} from '../lib/validation.ts';

export const assignmentsRoutes = new Hono();

assignmentsRoutes.post('/projects/:id/assignments', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = assignmentCreateSchema.parse(body);

    const inserted = await sql<{ id: string }[]>`
      INSERT INTO schedule_assignments (
        ${data.id ? sql`id,` : sql``}
        project_id, task_id, resource_id, allocation_pct, created_by
      ) VALUES (
        ${data.id ? sql`${data.id},` : sql``}
        ${projectId}, ${data.taskId}, ${data.resourceId},
        ${data.allocationPct}, ${auth.userId}
      )
      RETURNING id
    `;
    return c.json({ id: inserted[0].id });
  } catch (err) {
    return handleError(err, c);
  }
});

assignmentsRoutes.patch('/projects/:id/assignments/:asnId', async c => {
  try {
    const projectId = c.req.param('id');
    const asnId = c.req.param('asnId');
    const auth = getAuth(c);
    const body = await c.req.json();
    const patch = assignmentUpdateSchema.parse(body);

    await sql`
      UPDATE schedule_assignments
      SET allocation_pct = ${patch.allocationPct},
          updated_by = ${auth.userId},
          updated_at = NOW()
      WHERE id = ${asnId} AND project_id = ${projectId}
    `;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

assignmentsRoutes.delete('/projects/:id/assignments/:asnId', async c => {
  try {
    const projectId = c.req.param('id');
    const asnId = c.req.param('asnId');
    await sql`DELETE FROM schedule_assignments WHERE id = ${asnId} AND project_id = ${projectId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
