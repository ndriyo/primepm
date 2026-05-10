// Deno contract test for the /api/me + /api/me/profile routes.
// Run with: cd supabase/functions/api && deno test --allow-env --allow-net routes/__tests__/me.test.ts
//
// Mounts the *real* meRoutes via the createMeRoutes factory and injects an
// in-memory sql tag-template fake so the test doesn't require Postgres.
// Auth is provided via custom middleware that sets c.var.auth — the same
// shape requireAuth would set in production.

import { assert, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { Hono } from 'npm:hono@4.5.5';

import { createMeRoutes } from '../me.ts';

interface SqlInvocation {
  sql: string;
  values: unknown[];
}
const sqlCalls: SqlInvocation[] = [];

// Minimal sql tag-template fake. Routes parameterise by `${userId}`,
// `${fullName}`, `${avatarUrl}` so we look at strings + values to decide
// the response.
function makeSqlFake(rowFor: (values: unknown[]) => Record<string, unknown> | null) {
  const fake = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlCalls.push({ sql: strings.join('?'), values });
    const row = rowFor(values);
    return Promise.resolve(row ? [row] : []);
  }) as unknown as ReturnType<typeof Object>;
  // Provide .begin for parity with postgres' transaction API; unused by meRoutes
  // but keeps the type compatible.
  (fake as { begin: (fn: unknown) => Promise<unknown[]> }).begin = async () => [];
  return fake as unknown as Parameters<typeof createMeRoutes>[0]['sql'];
}

function buildApp(opts: { userId: string | null; sql: ReturnType<typeof makeSqlFake> }) {
  const app = new Hono();
  if (opts.userId) {
    app.use('*', async (c, next) => {
      c.set('auth', {
        userId: opts.userId!,
        email: 'u@e.com',
        organizationId: 'org-1',
      });
      await next();
    });
  }
  app.route('/api', createMeRoutes({ sql: opts.sql }));
  return app;
}

const baseRow = (sub: string, fullName = 'User', avatarUrl: string | null = null) => ({
  id: sub,
  email: 'u@e.com',
  full_name: fullName,
  avatar_url: avatarUrl,
  organization_id: 'org-1',
  roles: ['member'],
});

Deno.test('GET /api/me — 200 returns the MeProfile shape', async () => {
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => baseRow(String(values[0]), 'Daniela', 'https://x/avatar.png')),
  });
  const res = await app.request('/api/me');
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, 'sub-1');
  assertEquals(body.email, 'u@e.com');
  assertEquals(body.fullName, 'Daniela');
  assertEquals(body.avatarUrl, 'https://x/avatar.png');
  assertEquals(body.organizationId, 'org-1');
  assert(Array.isArray(body.roles));
});

Deno.test('GET /api/me — 404 when user row is missing', async () => {
  const app = buildApp({ userId: 'sub-1', sql: makeSqlFake(() => null) });
  const res = await app.request('/api/me');
  assertEquals(res.status, 404);
});

Deno.test('PUT /api/me/profile — 422 on empty fullName (Zod via handleError)', async () => {
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => baseRow('sub-1', String(values[0]), values[1] as string | null)),
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: '' }),
  });
  assertEquals(res.status, 422);
  const body = await res.json();
  assertEquals(body.error, 'validation_error');
});

Deno.test('PUT /api/me/profile — 422 on non-https avatarUrl', async () => {
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => baseRow('sub-1', String(values[0]), values[1] as string | null)),
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: 'Daniela', avatarUrl: 'http://insecure/x' }),
  });
  assertEquals(res.status, 422);
});

Deno.test('PUT /api/me/profile — 200 sets fullName + avatarUrl when both provided', async () => {
  let lastValues: unknown[] = [];
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => {
      lastValues = values;
      return baseRow('sub-1', values[0] as string, values[1] as string | null);
    }),
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
  // Verify both columns were on the UPDATE statement
  assertEquals(lastValues[0], 'Daniela Reyes');
  assertEquals(lastValues[1], 'https://lh3.googleusercontent.com/abc');
});

Deno.test('PUT /api/me/profile — null avatarUrl explicitly clears the avatar', async () => {
  let lastValues: unknown[] = [];
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => {
      lastValues = values;
      return baseRow('sub-1', values[0] as string, values[1] as string | null);
    }),
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: 'Daniela', avatarUrl: null }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.avatarUrl, null);
  assertEquals(lastValues[1], null);
});

Deno.test('PUT /api/me/profile — omitted avatarUrl preserves existing column (no avatar_url in UPDATE)', async () => {
  // Capture the SQL string fragments so we can assert the omitted-branch
  // UPDATE does NOT include `avatar_url =`.
  sqlCalls.length = 0;
  const app = buildApp({
    userId: 'sub-1',
    sql: makeSqlFake(values => baseRow('sub-1', values[0] as string, 'https://existing/keep')),
  });
  const res = await app.request('/api/me/profile', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: 'Daniela' }), // avatarUrl omitted
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.avatarUrl, 'https://existing/keep');
  // The captured SQL must not contain the avatar_url assignment fragment
  const lastUpdate = sqlCalls[sqlCalls.length - 1];
  assertExists(lastUpdate);
  assert(!lastUpdate.sql.includes('avatar_url ='),
    `omitted-avatar branch should not write avatar_url; got: ${lastUpdate.sql}`);
});
