/**
 * Contract: PATCH /api/projects/:projectId/tasks/:taskId — actuals fields
 *
 * Source of truth for request validation in
 * `supabase/functions/api/lib/validation.ts` and the inspector form.
 * Implementation files MUST import or re-derive these schemas, not redefine them.
 *
 * Spec: specs/003-actuals-capture/spec.md (FR-001, FR-005, FR-006, FR-007, FR-011)
 */

import { z } from 'zod';

/**
 * Calendar date in `YYYY-MM-DD` form. Empty string and `null` both mean "not
 * recorded"; the API converts both to NULL on the way to the DB.
 */
export const actualDate = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date is not valid' }),
    z.literal(''),
    z.null(),
  ])
  .transform(v => (v === '' ? null : v));

/**
 * The three actuals fields, all optional in a partial PATCH body. None of them
 * is required; an empty patch is a no-op for actuals.
 */
export const taskActualsPatch = z.object({
  /**
   * Actual percent complete. Integer 0..100 inclusive. Reject (do NOT clamp)
   * on out-of-range or non-integer per FR-005 + Clarifications 2026-05-09.
   */
  progressPct: z
    .number({ invalid_type_error: '% complete must be a whole number' })
    .int({ message: '% complete must be a whole number' })
    .min(0, { message: '% complete must be between 0 and 100' })
    .max(100, { message: '% complete must be between 0 and 100' })
    .optional(),

  actualStart: actualDate.optional(),
  actualFinish: actualDate.optional(),
});

/**
 * Cross-field check: actual_finish >= actual_start when both present.
 * Use as `.superRefine()` on the merged update schema.
 *
 * Note: this only validates the patch in isolation. If a user PATCHes only
 * `actualFinish` and the existing row has an `actualStart` later than the
 * new value, that combined-state check is the route handler's job — the
 * handler must SELECT the current row and compose with the patch before
 * writing.
 */
export function actualsPairRefinement(
  patch: { actualStart?: string | null; actualFinish?: string | null },
  ctx: z.RefinementCtx,
) {
  const start = patch.actualStart;
  const finish = patch.actualFinish;
  if (start && finish && finish < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual finish cannot be earlier than actual start',
      path: ['actualFinish'],
    });
  }
}

/**
 * Composed schema actually used by the route. The existing taskUpdateSchema
 * (in supabase/functions/api/lib/validation.ts) is extended like this:
 *
 *   export const taskUpdateSchema = taskSchema
 *     .partial()
 *     .omit({ id: true })
 *     .extend({
 *       actualStart:  actualDate.optional(),
 *       actualFinish: actualDate.optional(),
 *     })
 *     .superRefine(actualsPairRefinement);
 */

/**
 * Error response shape (matches existing API error contract from
 * supabase/functions/api/lib/errors.ts). Documented here so the inspector
 * knows what shape to render.
 *
 * Status: 400 Bad Request
 * Body:
 *   {
 *     error: 'validation_error',
 *     issues: [
 *       { path: ['actualFinish'], message: 'Actual finish cannot be earlier than actual start' },
 *       { path: ['progressPct'],  message: '% complete must be between 0 and 100' }
 *     ]
 *   }
 */

/**
 * Summary-task guard. The route handler runs this AFTER Zod parse but BEFORE
 * any UPDATE statement when the patch touches any of the three actuals fields.
 *
 *   const patchTouchesActuals =
 *     'progressPct' in patch || 'actualStart' in patch || 'actualFinish' in patch;
 *   if (patchTouchesActuals) {
 *     const isSummary = await sql`SELECT EXISTS (
 *         SELECT 1 FROM schedule_tasks WHERE parent_id = ${taskId}
 *       ) AS has_children`;
 *     if (isSummary[0].has_children) {
 *       throw new ApiError(409, 'summary_actuals_readonly',
 *         'Actuals on a summary task are derived; edit children instead');
 *     }
 *   }
 */
