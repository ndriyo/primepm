import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { handleError } from '../lib/errors.ts';
import { calendarSchema, workingDaysToMask } from '../lib/validation.ts';

export const calendarRoutes = new Hono();

calendarRoutes.put('/projects/:id/calendar', async c => {
  try {
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const data = calendarSchema.parse(body);
    const mask = workingDaysToMask(data.workingDaysOfWeek);

    await sql`
      INSERT INTO schedule_calendars (project_id, working_days_mask, holidays, hours_per_day)
      VALUES (
        ${projectId}, ${mask},
        ${JSON.stringify(data.holidays)}::jsonb,
        ${data.hoursPerDay}
      )
      ON CONFLICT (project_id) DO UPDATE SET
        working_days_mask = EXCLUDED.working_days_mask,
        holidays = EXCLUDED.holidays,
        hours_per_day = EXCLUDED.hours_per_day,
        updated_at = NOW()
    `;
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
