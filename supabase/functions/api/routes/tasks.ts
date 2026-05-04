import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, notFound } from '../lib/errors.ts';
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskReorderSchema,
} from '../lib/validation.ts';

export const tasksRoutes = new Hono();

tasksRoutes.post('/projects/:id/tasks', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = taskCreateSchema.parse(body);

    let orderIndex = data.orderIndex;
    if (orderIndex == null) {
      const rows = await sql<{ max: number | null }[]>`
        SELECT COALESCE(MAX(order_index), -1) AS max FROM schedule_tasks WHERE project_id = ${projectId}
      `;
      orderIndex = (rows[0]?.max ?? -1) + 1;
    }

    const constraintType = data.constraint?.kind ?? 'ASAP';
    const constraintDate =
      data.constraint && data.constraint.kind !== 'ASAP'
        ? data.constraint.date.slice(0, 10)
        : null;
    const manualStart = data.manualStart ? data.manualStart.slice(0, 10) : null;

    const inserted = await sql<{ id: string }[]>`
      INSERT INTO schedule_tasks (
        ${data.id ? sql`id,` : sql``}
        project_id, parent_id, name, notes, duration_days, is_milestone,
        schedule_mode, manual_start, constraint_type, constraint_date,
        progress_pct, color, order_index, created_by
      ) VALUES (
        ${data.id ? sql`${data.id},` : sql``}
        ${projectId}, ${data.parentId ?? null}, ${data.name ?? 'New task'},
        ${data.notes ?? null}, ${data.durationDays ?? 1}, ${data.isMilestone ?? false},
        ${data.scheduleMode ?? 'auto'}, ${manualStart}::date,
        ${constraintType}, ${constraintDate}::date,
        ${data.progressPct ?? 0}, ${data.color ?? null}, ${orderIndex}, ${auth.userId}
      )
      RETURNING id
    `;
    return c.json({ id: inserted[0].id });
  } catch (err) {
    return handleError(err, c);
  }
});

tasksRoutes.patch('/projects/:id/tasks/:taskId', async c => {
  try {
    const projectId = c.req.param('id');
    const taskId = c.req.param('taskId');
    const auth = getAuth(c);
    const body = await c.req.json();
    const patch = taskUpdateSchema.parse(body);

    const rows = await sql<{ id: string }[]>`
      SELECT id FROM schedule_tasks WHERE id = ${taskId} AND project_id = ${projectId} LIMIT 1
    `;
    if (rows.length === 0) throw notFound('task_not_found');

    // Build dynamic SET clause via individual statements (postgres-js doesn't have a built-in helper)
    if (patch.name !== undefined)
      await sql`UPDATE schedule_tasks SET name = ${patch.name} WHERE id = ${taskId}`;
    if (patch.notes !== undefined)
      await sql`UPDATE schedule_tasks SET notes = ${patch.notes ?? null} WHERE id = ${taskId}`;
    if (patch.durationDays !== undefined)
      await sql`UPDATE schedule_tasks SET duration_days = ${patch.durationDays} WHERE id = ${taskId}`;
    if (patch.isMilestone !== undefined)
      await sql`UPDATE schedule_tasks SET is_milestone = ${patch.isMilestone} WHERE id = ${taskId}`;
    if (patch.scheduleMode !== undefined)
      await sql`UPDATE schedule_tasks SET schedule_mode = ${patch.scheduleMode} WHERE id = ${taskId}`;
    if (patch.manualStart !== undefined) {
      const ms = patch.manualStart ? patch.manualStart.slice(0, 10) : null;
      await sql`UPDATE schedule_tasks SET manual_start = ${ms}::date WHERE id = ${taskId}`;
    }
    if (patch.constraint !== undefined) {
      const cType = patch.constraint.kind;
      const cDate = patch.constraint.kind !== 'ASAP' ? patch.constraint.date.slice(0, 10) : null;
      await sql`UPDATE schedule_tasks SET constraint_type = ${cType}, constraint_date = ${cDate}::date WHERE id = ${taskId}`;
    }
    if (patch.progressPct !== undefined)
      await sql`UPDATE schedule_tasks SET progress_pct = ${patch.progressPct} WHERE id = ${taskId}`;
    if (patch.color !== undefined)
      await sql`UPDATE schedule_tasks SET color = ${patch.color ?? null} WHERE id = ${taskId}`;
    if (patch.parentId !== undefined)
      await sql`UPDATE schedule_tasks SET parent_id = ${patch.parentId ?? null} WHERE id = ${taskId}`;

    await sql`UPDATE schedule_tasks SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${taskId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

tasksRoutes.delete('/projects/:id/tasks/:taskId', async c => {
  try {
    const projectId = c.req.param('id');
    const taskId = c.req.param('taskId');
    await sql`DELETE FROM schedule_tasks WHERE id = ${taskId} AND project_id = ${projectId}`;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

tasksRoutes.post('/projects/:id/tasks/reorder', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const data = taskReorderSchema.parse(body);

    await sql.begin(async tx => {
      for (const item of data.items) {
        await tx`
          UPDATE schedule_tasks
          SET order_index = ${item.orderIndex},
              parent_id = ${item.parentId ?? null},
              updated_by = ${auth.userId},
              updated_at = NOW()
          WHERE id = ${item.id} AND project_id = ${projectId}
        `;
      }
    });
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
