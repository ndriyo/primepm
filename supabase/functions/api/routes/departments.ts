import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';

export const departmentsRoutes = new Hono();

departmentsRoutes.get('/departments', async c => {
  try {
    const auth = getAuth(c);
    const rows = await sql<{ id: string; name: string }[]>`
      SELECT id, name FROM departments
      WHERE organization_id = ${auth.organizationId}
      ORDER BY name
    `;
    return c.json({ departments: rows });
  } catch (err) {
    return handleError(err, c);
  }
});
