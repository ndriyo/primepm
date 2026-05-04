import { Hono } from 'hono';
import { z } from 'zod';
import { sql } from '../lib/db.ts';
import { getAuth } from '../lib/auth.ts';
import { handleError, notFound } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';

export const criteriaRoutes = new Hono();

interface VersionRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  score_min: number;
  score_max: number;
  created_at: string | null;
}

interface CriterionRow {
  id: string;
  version_id: string;
  key: string;
  label: string;
  description: string | null;
  is_inverse: boolean | null;
  is_default: boolean | null;
  weight: number | null;
  rubric: Record<string, string> | null;
}

const versionCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  scoreMin: z.number().int().optional(),
  scoreMax: z.number().int().optional(),
});

const versionPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  scoreMin: z.number().int().optional(),
  scoreMax: z.number().int().optional(),
});

const criterionCreateSchema = z.object({
  versionId: z.string().uuid(),
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  isInverse: z.boolean().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  rubric: z.record(z.string(), z.string()).optional(),
});

const criterionPatchSchema = z.object({
  key: z.string().min(1).max(50).optional(),
  label: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  isInverse: z.boolean().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  rubric: z.record(z.string(), z.string()).optional(),
});

const pairwiseSchema = z.object({
  comparisons: z.array(z.object({
    criterionAId: z.string().uuid(),
    criterionBId: z.string().uuid(),
    value: z.number().positive(),
  })),
  weights: z.array(z.object({
    criterionId: z.string().uuid(),
    weight: z.number().nonnegative(),
  })),
});

function rowToVersion(r: VersionRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: !!r.is_active,
    scoreMin: r.score_min,
    scoreMax: r.score_max,
    created_at: r.created_at,
  };
}

function rowToCriterion(r: CriterionRow) {
  return {
    id: r.id,
    versionId: r.version_id,
    key: r.key,
    label: r.label,
    description: r.description,
    isInverse: !!r.is_inverse,
    isDefault: !!r.is_default,
    weight: r.weight,
    rubric: r.rubric ?? {},
  };
}

// ----- Versions -----

criteriaRoutes.get('/criteria/versions', async c => {
  try {
    const auth = getAuth(c);
    const rows = await sql<VersionRow[]>`
      SELECT id, name, description, is_active, score_min, score_max, created_at
      FROM criteria_versions
      WHERE organization_id = ${auth.organizationId}
      ORDER BY created_at DESC NULLS LAST
    `;
    return c.json({ versions: rows.map(rowToVersion) });
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.post('/criteria/versions', async c => {
  try {
    const auth = getAuth(c);
    const data = versionCreateSchema.parse(await c.req.json());
    const min = data.scoreMin ?? 0;
    const max = data.scoreMax ?? 5;
    if (min >= max) return c.json({ error: 'invalid_range', message: 'scoreMin must be less than scoreMax' }, 422);
    const result = await sql.begin(async tx => {
      if (data.isActive) {
        await tx`UPDATE criteria_versions SET is_active = false WHERE organization_id = ${auth.organizationId}`;
      }
      const inserted = await tx<{ id: string }[]>`
        INSERT INTO criteria_versions (organization_id, name, description, is_active, score_min, score_max, created_by)
        VALUES (${auth.organizationId}, ${data.name}, ${data.description ?? null}, ${data.isActive ?? false}, ${min}, ${max}, ${auth.userId})
        RETURNING id
      `;
      return inserted;
    });
    await audit(auth.userId, 'create', 'CriteriaVersion', result[0].id);
    return c.json({ id: result[0].id }, 201);
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.patch('/criteria/versions/:id', async c => {
  try {
    const auth = getAuth(c);
    const id = c.req.param('id');
    const data = versionPatchSchema.parse(await c.req.json());
    if (data.scoreMin !== undefined && data.scoreMax !== undefined && data.scoreMin >= data.scoreMax) {
      return c.json({ error: 'invalid_range', message: 'scoreMin must be less than scoreMax' }, 422);
    }
    await sql.begin(async tx => {
      if (data.isActive === true) {
        await tx`UPDATE criteria_versions SET is_active = false WHERE organization_id = ${auth.organizationId} AND id <> ${id}`;
      }
      if (data.name !== undefined)
        await tx`UPDATE criteria_versions SET name = ${data.name} WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
      if (data.description !== undefined)
        await tx`UPDATE criteria_versions SET description = ${data.description ?? null} WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
      if (data.isActive !== undefined)
        await tx`UPDATE criteria_versions SET is_active = ${data.isActive} WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
      if (data.scoreMin !== undefined)
        await tx`UPDATE criteria_versions SET score_min = ${data.scoreMin} WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
      if (data.scoreMax !== undefined)
        await tx`UPDATE criteria_versions SET score_max = ${data.scoreMax} WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
      await tx`UPDATE criteria_versions SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${id} AND organization_id = ${auth.organizationId}`;
    });
    if (data.isActive === true) {
      await audit(auth.userId, 'activate', 'CriteriaVersion', id);
    } else {
      await audit(auth.userId, 'update', 'CriteriaVersion', id);
    }
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.delete('/criteria/versions/:id', async c => {
  try {
    const auth = getAuth(c);
    const id = c.req.param('id');
    const result = await sql<{ id: string }[]>`
      DELETE FROM criteria_versions
      WHERE id = ${id} AND organization_id = ${auth.organizationId}
      RETURNING id
    `;
    if (result.length === 0) throw notFound('version_not_found');
    await audit(auth.userId, 'delete', 'CriteriaVersion', id);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

// ----- Active version (for submission wizard step 2) -----

criteriaRoutes.get('/criteria/active', async c => {
  try {
    const auth = getAuth(c);
    const versions = await sql<VersionRow[]>`
      SELECT id, name, description, is_active, score_min, score_max, created_at
      FROM criteria_versions
      WHERE organization_id = ${auth.organizationId} AND is_active = true
      LIMIT 1
    `;
    if (versions.length === 0) {
      return c.json({ version: null, criteria: [] });
    }
    const version = versions[0];
    const criteria = await sql<CriterionRow[]>`
      SELECT id, version_id, key, label, description, is_inverse, is_default, weight, rubric
      FROM criteria WHERE version_id = ${version.id}
      ORDER BY key
    `;
    return c.json({
      version: rowToVersion(version),
      criteria: criteria.map(rowToCriterion),
    });
  } catch (err) {
    return handleError(err, c);
  }
});

// ----- Criteria CRUD -----

criteriaRoutes.get('/criteria', async c => {
  try {
    const auth = getAuth(c);
    const versionId = c.req.query('versionId');
    if (!versionId) return c.json({ error: 'versionId_required' }, 400);
    const v = await sql<{ id: string }[]>`
      SELECT id FROM criteria_versions WHERE id = ${versionId} AND organization_id = ${auth.organizationId}
    `;
    if (v.length === 0) throw notFound('version_not_found');
    const rows = await sql<CriterionRow[]>`
      SELECT id, version_id, key, label, description, is_inverse, is_default, weight, rubric
      FROM criteria WHERE version_id = ${versionId}
      ORDER BY key
    `;
    return c.json({ criteria: rows.map(rowToCriterion) });
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.post('/criteria', async c => {
  try {
    const auth = getAuth(c);
    const data = criterionCreateSchema.parse(await c.req.json());
    const v = await sql<{ id: string }[]>`
      SELECT id FROM criteria_versions WHERE id = ${data.versionId} AND organization_id = ${auth.organizationId}
    `;
    if (v.length === 0) throw notFound('version_not_found');
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO criteria (
        version_id, key, label, description, is_inverse, weight, rubric, created_by
      ) VALUES (
        ${data.versionId}, ${data.key}, ${data.label}, ${data.description ?? null},
        ${data.isInverse ?? false}, ${data.weight ?? null},
        ${JSON.stringify(data.rubric ?? {})}::jsonb,
        ${auth.userId}
      )
      RETURNING id
    `;
    await audit(auth.userId, 'create', 'Criterion', inserted[0].id);
    return c.json({ id: inserted[0].id }, 201);
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.patch('/criteria/:id', async c => {
  try {
    const auth = getAuth(c);
    const id = c.req.param('id');
    const data = criterionPatchSchema.parse(await c.req.json());
    const owns = await sql<{ id: string }[]>`
      SELECT c.id FROM criteria c
      JOIN criteria_versions v ON v.id = c.version_id
      WHERE c.id = ${id} AND v.organization_id = ${auth.organizationId}
    `;
    if (owns.length === 0) throw notFound('criterion_not_found');
    if (data.key !== undefined)
      await sql`UPDATE criteria SET key = ${data.key} WHERE id = ${id}`;
    if (data.label !== undefined)
      await sql`UPDATE criteria SET label = ${data.label} WHERE id = ${id}`;
    if (data.description !== undefined)
      await sql`UPDATE criteria SET description = ${data.description ?? null} WHERE id = ${id}`;
    if (data.isInverse !== undefined)
      await sql`UPDATE criteria SET is_inverse = ${data.isInverse} WHERE id = ${id}`;
    if (data.weight !== undefined)
      await sql`UPDATE criteria SET weight = ${data.weight ?? null} WHERE id = ${id}`;
    if (data.rubric !== undefined)
      await sql`UPDATE criteria SET rubric = ${JSON.stringify(data.rubric)}::jsonb WHERE id = ${id}`;
    await sql`UPDATE criteria SET updated_by = ${auth.userId}, updated_at = NOW() WHERE id = ${id}`;
    await audit(auth.userId, 'update', 'Criterion', id);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

criteriaRoutes.delete('/criteria/:id', async c => {
  try {
    const auth = getAuth(c);
    const id = c.req.param('id');
    const result = await sql<{ id: string }[]>`
      DELETE FROM criteria
      WHERE id = ${id}
        AND version_id IN (SELECT id FROM criteria_versions WHERE organization_id = ${auth.organizationId})
      RETURNING id
    `;
    if (result.length === 0) throw notFound('criterion_not_found');
    await audit(auth.userId, 'delete', 'Criterion', id);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});

// ----- Pairwise comparisons + weights (AHP) -----

criteriaRoutes.put('/criteria/versions/:id/pairwise', async c => {
  try {
    const auth = getAuth(c);
    const versionId = c.req.param('id');
    const data = pairwiseSchema.parse(await c.req.json());
    const v = await sql<{ id: string }[]>`
      SELECT id FROM criteria_versions WHERE id = ${versionId} AND organization_id = ${auth.organizationId}
    `;
    if (v.length === 0) throw notFound('version_not_found');

    await sql.begin(async tx => {
      await tx`DELETE FROM pairwise_comparisons WHERE version_id = ${versionId}`;
      for (const comp of data.comparisons) {
        await tx`
          INSERT INTO pairwise_comparisons (version_id, criterion_a_id, criterion_b_id, value)
          VALUES (${versionId}, ${comp.criterionAId}, ${comp.criterionBId}, ${comp.value})
        `;
      }
      for (const w of data.weights) {
        await tx`UPDATE criteria SET weight = ${w.weight} WHERE id = ${w.criterionId} AND version_id = ${versionId}`;
      }
    });
    await audit(auth.userId, 'update', 'CriteriaVersion', versionId);
    return c.json({ ok: true });
  } catch (err) {
    return handleError(err, c);
  }
});
