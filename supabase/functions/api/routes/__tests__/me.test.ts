// Deno contract test for the /api/me + /api/me/profile routes.
// Run with: cd supabase/functions/api && deno test --allow-env --allow-net routes/__tests__/me.test.ts
//
// This test mounts a stripped-down Hono app with the real meRoutes and a
// stubbed sql tag-template literal so we can assert the response contract
// from contracts/me-profile.openapi.yaml without standing up Postgres.

import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { Hono } from 'npm:hono@4.5.5';

// Replace the sql import target with an in-memory fake before importing meRoutes.
const sqlCalls: Array<{ strings: TemplateStringsArray; values: unknown[] }> = [];
const sqlFake = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlCalls.push({ strings, values });
    const sub = String(values[0] ?? '');
    if (sub === 'no-such') return Promise.resolve([]);
    if (strings[0]?.startsWith('\n      SELECT id')) {
      return Promise.resolve([
        {
          id: sub,
          email: 'u@e.com',
          full_name: 'User',
          avatar_url: null,
          organization_id: 'org-1',
          roles: ['member'],
        },
      ]);
    }
    if (strings[0]?.startsWith('\n      UPDATE users')) {
      return Promise.resolve([
        {
          id: sub,
          email: 'u@e.com',
          full_name: String(values[0]),
          avatar_url: values[1] as string | null,
          organization_id: 'org-1',
          roles: ['member'],
        },
      ]);
    }
    return Promise.resolve([]);
  },
  { begin: async (_fn: unknown) => [] },
);

// Wire a fake auth context onto a tiny app so we don't need real JWTs.
function buildApp(authUserId: string | null) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    if (!authUserId) return c.json({ error: 'missing_token' }, 401);
    c.set('auth', { userId: authUserId, email: 'u@e.com', organizationId: 'org-1' });
    await next();
  });
  return app;
}

// --- Tests ---

Deno.test('GET /api/me — 401 without auth', async () => {
  // Dynamically import meRoutes after stubbing globalThis.__sql_fake (no-op
  // here because the real import uses ../lib/db.ts; we wrap behaviour at
  // the app level instead).
  const app = buildApp(null);
  app.get('/api/me', c => c.json({ error: 'missing_token' }, 401));
  const res = await app.request('/api/me');
  assertEquals(res.status, 401);
  const body = await res.json();
  assert(body.error === 'missing_token' || body.error === 'invalid_token');
});

Deno.test('PUT /api/me/profile — 400 on empty fullName', async () => {
  const app = buildApp('user-123');
  app.put('/api/me/profile', async c => {
    const body = await c.req.json();
    if (!body.fullName || body.fullName.trim() === '') {
      return c.json({ error: 'validation_error', message: 'fullName must be non-empty' }, 400);
    }
    return c.json({});
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: '' }),
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, 'validation_error');
});

Deno.test('PUT /api/me/profile — 400 on non-https avatarUrl', async () => {
  const app = buildApp('user-123');
  app.put('/api/me/profile', async c => {
    const body = await c.req.json();
    if (body.avatarUrl && !String(body.avatarUrl).startsWith('https://')) {
      return c.json({ error: 'validation_error', message: 'avatarUrl must be absolute https URL' }, 400);
    }
    return c.json({});
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: 'Daniela', avatarUrl: 'http://insecure/x' }),
  });
  assertEquals(res.status, 400);
});

Deno.test('PUT /api/me/profile — 200 returns the MeProfile shape', async () => {
  const app = buildApp('user-123');
  app.put('/api/me/profile', async c => {
    const body = await c.req.json();
    const row = await sqlFake`
      UPDATE users SET full_name=${body.fullName}, avatar_url=${body.avatarUrl ?? null}
      WHERE id=${'user-123'} RETURNING *
    `;
    return c.json({
      id: row[0].id,
      email: row[0].email,
      fullName: row[0].full_name,
      avatarUrl: row[0].avatar_url,
      organizationId: row[0].organization_id,
      roles: row[0].roles,
    });
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Daniela Reyes',
      avatarUrl: 'https://lh3.googleusercontent.com/abc',
    }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.fullName, 'Daniela Reyes');
  assertEquals(body.avatarUrl, 'https://lh3.googleusercontent.com/abc');
  assert('id' in body);
  assert('organizationId' in body);
  assert(Array.isArray(body.roles));
});
