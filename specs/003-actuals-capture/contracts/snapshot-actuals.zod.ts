/**
 * Contract: full-project snapshot — actuals additions
 *
 * Implementation must extend
 *   - SerializedTask in supabase/functions/api/sql/snapshot.ts
 *   - serializedTaskSchema in supabase/functions/api/lib/validation.ts
 * to add the two new optional date fields and re-use taskActualsPatch's
 * `progressPct` for actual progress semantics.
 *
 * Spec: specs/003-actuals-capture/spec.md (FR-013, FR-014, US1.AS3)
 */

import { z } from 'zod';
import { taskActualsPatch } from './task-actuals.zod';

/**
 * Per-task fields contributed by this feature to the snapshot DTO. Both date
 * fields are optional / omittable. When omitted, the persisted column is NULL
 * (= "not yet recorded"). progressPct stays required and integer 0..100,
 * matching the existing snapshot contract.
 */
export const snapshotTaskActualsExtension = z.object({
  progressPct: taskActualsPatch.shape.progressPct.unwrap(), // strip .optional() — required in snapshot
  actualStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, { message: 'date is not valid' })
    .optional(),
  actualFinish: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, { message: 'date is not valid' })
    .optional(),
});

/**
 * Backwards compatibility:
 *
 * Existing snapshots persisted before this feature shipped do NOT carry
 * `actualStart` or `actualFinish`. Because both fields are `.optional()`,
 * they parse as `undefined` and the snapshot loader leaves the DB columns
 * NULL. No data migration is required.
 *
 * Forward compatibility:
 *
 * The snapshot writer (saveSnapshot in
 * supabase/functions/api/sql/snapshot.ts) MUST always include the two
 * columns in its INSERT, with NULL for tasks that have no actuals. This
 * way, a snapshot round-trip is lossless.
 */

/**
 * Baseline isolation guarantee (FR-013):
 *
 * The baseline feature (002) defines its own snapshot table that copies
 * a fixed list of task columns. This file reminds implementers:
 *
 *   - actualStart, actualFinish, and progressPct columns
 *     MUST NOT appear in the baseline column list, ever.
 *   - When 002 ships, its column list must explicitly enumerate the
 *     copied columns rather than `SELECT *` so this guarantee is
 *     auditable.
 *
 * No code in this feature; recorded as a cross-feature contract.
 */
