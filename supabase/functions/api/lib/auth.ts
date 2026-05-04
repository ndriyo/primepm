import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Context, MiddlewareHandler } from 'hono';
import { sql } from './db.ts';

export interface AuthContext {
  userId: string;
  email?: string;
  organizationId: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let _hsKey: Uint8Array | null = null;

function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  if (!url) throw new Error('SUPABASE_URL must be set');
  return url.replace(/\/$/, '');
}

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (_jwks) return _jwks;
  _jwks = createRemoteJWKSet(new URL(`${getSupabaseUrl()}/auth/v1/.well-known/jwks.json`));
  return _jwks;
}

function getHsKey(): Uint8Array | null {
  if (_hsKey) return _hsKey;
  const secret = Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('JWT_SECRET');
  if (!secret) return null;
  _hsKey = new TextEncoder().encode(secret);
  return _hsKey;
}

async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  // Try JWKS (RS256/ES256) first — used by new Supabase publishable-key system.
  try {
    const { payload } = await jwtVerify(token, getJwks());
    return payload as Record<string, unknown>;
  } catch {
    // Fall back to HS256 with shared secret (legacy projects)
    const hs = getHsKey();
    if (!hs) return null;
    try {
      const { payload } = await jwtVerify(token, hs, { algorithms: ['HS256'] });
      return payload as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return c.json({ error: 'missing_token' }, 401);

  const payload = await verifyToken(token);
  if (!payload) return c.json({ error: 'invalid_token' }, 401);

  const userId = (payload.sub as string | undefined) ?? null;
  if (!userId) return c.json({ error: 'invalid_token' }, 401);

  let rows = await sql<{ organization_id: string }[]>`
    SELECT organization_id FROM users WHERE id = ${userId} LIMIT 1
  `;
  if (rows.length === 0) {
    // Auto-provision: create a personal organization + users row.
    const email = (payload.email as string | undefined) ?? `${userId}@unknown`;
    const fullName = email.split('@')[0];
    rows = await sql.begin(async tx => {
      const orgs = await tx<{ id: string }[]>`
        INSERT INTO organizations (name, description)
        VALUES (${`${fullName}'s workspace`}, ${'Auto-created on first login'})
        RETURNING id
      `;
      const orgId = orgs[0].id;
      await tx`
        INSERT INTO users (id, email, full_name, organization_id, roles)
        VALUES (${userId}, ${email}, ${fullName}, ${orgId}, ARRAY[]::text[])
      `;
      await tx`UPDATE organizations SET created_by = ${userId} WHERE id = ${orgId}`;
      return [{ organization_id: orgId }];
    });
  }

  c.set('auth', {
    userId,
    email: payload.email as string | undefined,
    organizationId: rows[0].organization_id,
  });
  await next();
};

export function getAuth(c: Context): AuthContext {
  const auth = c.get('auth');
  if (!auth) throw new Error('auth not set — middleware not applied');
  return auth;
}
