import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { handleError } from '../lib/errors.ts';
import { settingsSchema } from '../lib/validation.ts';

export const settingsRoutes = new Hono();

settingsRoutes.put('/projects/:id/settings', async c => {
  try {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const data = settingsSchema.parse(body);

    await sql`
      INSERT INTO schedule_settings (project_id, task_order, resource_order, collapsed_ids)
      VALUES (
        ${projectId},
        ${JSON.stringify(data.taskOrder ?? [])}::jsonb,
        ${JSON.stringify(data.resourceOrder ?? [])}::jsonb,
        ${JSON.stringify(data.collapsedIds ?? [])}::jsonb
      )
      ON CONFLICT (project_id) DO UPDATE SET
        task_order = COALESCE(${data.taskOrder ? sql`${JSON.stringify(data.taskOrder)}::jsonb` : sql`schedule_settings.task_order`}, schedule_settings.task_order),
        resource_order = COALESCE(${data.resourceOrder ? sql`${JSON.stringify(data.resourceOrder)}::jsonb` : sql`schedule_settings.resource_order`}, schedule_settings.resource_order),
        collapsed_ids = COALESCE(${data.collapsedIds ? sql`${JSON.stringify(data.collapsedIds)}::jsonb` : sql`schedule_settings.collapsed_ids`}, schedule_settings.collapsed_ids),
        updated_at = NOW()
    `;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
