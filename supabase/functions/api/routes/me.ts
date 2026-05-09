import { Hono } from 'hono';
import { z } from 'zod';
import { sql as defaultSql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';

// Inject sql via a factory so the route can be exercised in unit tests
// without a real Postgres connection. Production wiring (in index.ts) uses
// `meRoutes` which is the default-bound instance.
type SqlLike = typeof defaultSql;
export interface MeRoutesDeps {
  sql?: SqlLike;
}

// avatarUrl semantics (per contracts/me-profile.openapi.yaml):
//   - omitted    → preserve the existing column value
//   - null       → clear the existing value
//   - https URL  → set to the new value
// We keep `optional()` so undefined survives; the handler branches on whether
// the key is present in the parsed body.
const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName must be non-empty').max(255),
  avatarUrl: z
    .union([z.string().url().startsWith('https://').max(2048), z.null()])
    .optional(),
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

export function createMeRoutes(deps: MeRoutesDeps = {}): Hono {
  const sql = deps.sql ?? defaultSql;
  const me = new Hono();

  me.get('/me', async c => {
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

  me.put('/me/profile', async c => {
    try {
      const { userId } = getAuth(c);
      const raw = (await c.req.json()) as Record<string, unknown>;
      const body = profileUpdateSchema.parse(raw);
      const avatarProvided = Object.prototype.hasOwnProperty.call(raw, 'avatarUrl');

      const rows = avatarProvided
        ? await sql<MeRow[]>`
            UPDATE users SET
              full_name = ${body.fullName},
              avatar_url = ${body.avatarUrl ?? null},
              updated_at = NOW()
            WHERE id = ${userId}
            RETURNING id, email, full_name, avatar_url, organization_id, roles
          `
        : await sql<MeRow[]>`
            UPDATE users SET
              full_name = ${body.fullName},
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

  return me;
}

export const meRoutes: Hono = createMeRoutes();
