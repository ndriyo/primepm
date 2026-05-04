import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';
import {
  resourceCreateSchema,
  resourceUpdateSchema,
  resourceReorderSchema,
} from '../lib/validation.ts';

export const resourcesRoutes = new Hono();

resourcesRoutes.post('/projects/:id/resources', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = resourceCreateSchema.parse(body);

    let orderIndex = data.orderIndex;
    if (orderIndex == null) {
      const rows = await sql<{ max: number | null }[]>`
        SELECT COALESCE(MAX(order_index), -1) AS max FROM schedule_resources WHERE project_id = ${projectId}
      `;
      orderIndex = (rows[0]?.max ?? -1) + 1;
    }

    const inserted = await sql<{ id: string }[]>`
      INSERT INTO schedule_resources (
        ${data.id ? sql`id,` : sql``}
        project_id, code, name, default_allocation_pct, rate_per_day, color, notes, order_index, created_by
      ) VALUES (
        ${data.id ? sql`${data.id},` : sql``}
        ${projectId}, ${data.code ?? 'RES'}, ${data.name ?? 'Resource'},
        ${data.defaultAllocationPct ?? 100}, ${data.ratePerDay ?? null},
        ${data.color ?? null}, ${data.notes ?? null}, ${orderIndex}, ${auth.userId}
      )
      RETURNING id
    `;
    return c.json({ id: inserted[0].id });
  } catch (err) {
    return handleError(err, c);
  }
});

resourcesRoutes.patch('/projects/:id/resources/:resId', async c => {
  try {
    const projectId = c.req.param('id');
    const resId = c.req.param('resId');
    const auth = getAuth(c);
    const body = await c.req.json();
    const patch = resourceUpdateSchema.parse(body);

    if (patch.code !== undefined)
      await sql`UPDATE schedule_resources SET code = ${patch.code} WHERE id = ${resId} AND project_id = ${projectId}`;
    if (patch.name !== undefined)
      await sql`UPDATE schedule_resources SET name = ${patch.name} WHERE id = ${resId} AND project_id = ${projectId}`;
    if (patch.defaultAllocationPct !== undefined)
      await sql`UPDATE schedule_resources SET default_allocation_pct = ${patch.defaultAllocationPct} WHERE id = ${resId} AND project_id = ${projectId}`;
    if (patch.ratePerDay !== undefined)
      await sql`UPDATE schedule_resources SET rate_per_day = ${patch.ratePerDay ?? null} WHERE id = ${resId} AND project_id = ${projectId}`;
    if (patch.color !== undefined)
      await sql`UPDATE schedule_resources SET color = ${patch.color ?? null} WHERE id = ${resId} AND project_id = ${projectId}`;
    if (patch.notes !== undefined)
      await sql`UPDATE schedule_resources SET notes = ${patch.notes ?? null} WHERE id = ${resId} AND project_id = ${projectId}`;

    await sql`UPDATE schedule_resources SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${resId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

resourcesRoutes.delete('/projects/:id/resources/:resId', async c => {
  try {
    const projectId = c.req.param('id');
    const resId = c.req.param('resId');
    await sql`DELETE FROM schedule_resources WHERE id = ${resId} AND project_id = ${projectId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

resourcesRoutes.post('/projects/:id/resources/reorder', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = resourceReorderSchema.parse(body);

    await sql.begin(async tx => {
      for (let i = 0; i < data.ids.length; i++) {
        await tx`
          UPDATE schedule_resources
          SET order_index = ${i}, updated_by = ${auth.userId}, updated_at = NOW()
          WHERE id = ${data.ids[i]} AND project_id = ${projectId}
        `;
      }
    });
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
