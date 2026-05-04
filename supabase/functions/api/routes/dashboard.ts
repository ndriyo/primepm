import { Hono } from 'hono';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError } from '../lib/errors.ts';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/dashboard', async c => {
  try {
    const auth = getAuth(c);
    const orgId = auth.organizationId;

    const [counts, totals, byStatus, scoreQuadrant, topProjects] = await Promise.all([
      sql<{ total: number; approved: number; pending: number }[]>`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('approved','active','in progress','in_progress'))::int AS approved,
          COUNT(*) FILTER (WHERE LOWER(status) IN ('pending','submitted','draft','initiation','planning'))::int AS pending
        FROM projects WHERE organization_id = ${orgId}
      `,
      sql<{ budget: string | null; mandays: string | null }[]>`
        SELECT COALESCE(SUM(budget),0)::text AS budget, COALESCE(SUM(resources),0)::text AS mandays
        FROM projects WHERE organization_id = ${orgId}
      `,
      sql<{ status: string; count: number; budget: string }[]>`
        SELECT status, COUNT(*)::int AS count, COALESCE(SUM(budget),0)::text AS budget
        FROM projects WHERE organization_id = ${orgId}
        GROUP BY status ORDER BY count DESC
      `,
      sql<{ id: string; name: string; budget: string | null; score: number | null }[]>`
        SELECT id, name, budget::text AS budget, score
        FROM projects
        WHERE organization_id = ${orgId} AND budget IS NOT NULL
        LIMIT 200
      `,
      sql<{ id: string; name: string; score: number | null; budget: string | null; status: string }[]>`
        SELECT id, name, score, budget::text AS budget, status
        FROM projects
        WHERE organization_id = ${orgId} AND score IS NOT NULL
        ORDER BY score DESC NULLS LAST
        LIMIT 5
      `,
    ]);

    return c.json({
      counts: counts[0],
      totals: {
        budget: Number(totals[0]?.budget ?? 0),
        mandays: Number(totals[0]?.mandays ?? 0),
      },
      byStatus: byStatus.map(r => ({ status: r.status, count: r.count, budget: Number(r.budget) })),
      scoreQuadrant: scoreQuadrant.map(r => ({
        id: r.id, name: r.name, budget: Number(r.budget ?? 0), score: r.score ?? 0,
      })),
      topProjects: topProjects.map(r => ({
        id: r.id, name: r.name, score: r.score ?? 0, budget: Number(r.budget ?? 0), status: r.status,
      })),
    });
  } catch (err) {
    return handleError(err, c);
  }
});
