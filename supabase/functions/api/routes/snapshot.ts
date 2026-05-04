import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, notFound } from '../lib/errors.ts';
import { snapshotSchema, projectMetaSchema } from '../lib/validation.ts';
import { loadSnapshot, saveSnapshot } from '../sql/snapshot.ts';
import { audit } from '../lib/audit.ts';

export const snapshotRoutes = new Hono();

snapshotRoutes.get('/projects/:id', async c => {
  try {
    const projectId = c.req.param('id');
    const snap = await loadSnapshot(projectId);
    if (!snap) throw notFound('project_not_found');
    return c.json(snap);
  } catch (err) {
    return handleError(err, c);
  }
});

snapshotRoutes.put('/projects/:id', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const snap = snapshotSchema.parse(body);
    if (snap.project.id !== projectId) {
      return c.json({ error: 'project_id_mismatch' }, 400);
    }
    await saveSnapshot(projectId, auth.userId, snap as Parameters<typeof saveSnapshot>[2]);
    await audit(auth.userId, 'update', 'ProjectSnapshot', projectId);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

snapshotRoutes.patch('/projects/:id', async c => {
  try {
    const projectId = c.req.param('id');
    const auth = getAuth(c);
    const body = await c.req.json();
    const patch = projectMetaSchema.parse(body);

    if (patch.name !== undefined || patch.start !== undefined) {
      const startDate = patch.start ? patch.start.slice(0, 10) : null;
      await sql`
        INSERT INTO schedule_settings (project_id, project_name, project_start)
        VALUES (
          ${projectId},
          ${patch.name ?? null},
          ${startDate}::date
        )
        ON CONFLICT (project_id) DO UPDATE SET
          project_name = COALESCE(EXCLUDED.project_name, schedule_settings.project_name),
          project_start = COALESCE(EXCLUDED.project_start, schedule_settings.project_start),
          updated_at = NOW()
      `;
      // Mark updated_by on the underlying project too
      await sql`UPDATE projects SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${projectId}`;
    }
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
