import { Hono } from 'hono';
import { z } from 'zod';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';

export const meRoutes = new Hono();

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName must be non-empty').max(255),
  avatarUrl: z
    .union([z.string().url().startsWith('https://').max(2048), z.null()])
    .optional()
    .transform(v => (v === undefined ? null : v)),
});

interface MeRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  organization_id: string;
  roles: string[];
}

function shapeProfile(row: MeRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    organizationId: row.organization_id,
    roles: row.roles,
  };
}

meRoutes.get('/me', async c => {
  try {
    const { userId } = getAuth(c);
    const rows = await sql<MeRow[]>`
      SELECT id, email, full_name, avatar_url, organization_id, roles
      FROM users WHERE id = ${userId} LIMIT 1
    `;
    if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
    return c.json(shapeProfile(rows[0]));
  } catch (err) {
    return handleError(err, c);
  }
});

meRoutes.put('/me/profile', async c => {
  try {
    const { userId } = getAuth(c);
    const body = profileUpdateSchema.parse(await c.req.json());

    const rows = await sql<MeRow[]>`
      UPDATE users SET
        full_name = ${body.fullName},
        avatar_url = ${body.avatarUrl},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, full_name, avatar_url, organization_id, roles
    `;
    if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
    return c.json(shapeProfile(rows[0]));
  } catch (err) {
    return handleError(err, c);
  }
});
