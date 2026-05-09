import { z } from 'zod';

export const uuid = z.string().uuid();

export const constraintSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ASAP') }),
  z.object({ kind: z.literal('SNET'), date: z.string() }),
  z.object({ kind: z.literal('FNET'), date: z.string() }),
  z.object({ kind: z.literal('MSO'), date: z.string() }),
  z.object({ kind: z.literal('MFO'), date: z.string() }),
]);

export const taskSchema = z.object({
  id: uuid,
  name: z.string().min(1).max(500),
  notes: z.string().nullable().optional(),
  durationDays: z.number().int().min(0),
  isMilestone: z.boolean(),
  scheduleMode: z.enum(['auto', 'manual']),
  manualStart: z.string().nullable().optional(),
  constraint: constraintSchema,
  progressPct: z.number().int().min(0).max(100),
  color: z.string().nullable().optional(),
  parentId: uuid.nullable().optional(),
});

export const taskCreateSchema = taskSchema.partial({ id: true }).extend({
  orderIndex: z.number().int().optional(),
});

export const taskUpdateSchema = taskSchema.partial().omit({ id: true });

export const taskReorderSchema = z.object({
  items: z.array(
    z.object({
      id: uuid,
      orderIndex: z.number().int(),
      parentId: uuid.nullable(),
    }),
  ),
});

export const dependencyCreateSchema = z.object({
  id: uuid.optional(),
  predecessorId: uuid,
  successorId: uuid,
  type: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
  lagDays: z.number().int().default(0),
});

export const dependencyUpdateSchema = z.object({
  type: z.enum(['FS', 'SS', 'FF', 'SF']).optional(),
  lagDays: z.number().int().optional(),
});

export const resourceSchema = z.object({
  id: uuid,
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  defaultAllocationPct: z.number().int().min(0).max(100),
  ratePerDay: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const resourceCreateSchema = resourceSchema.partial({ id: true }).extend({
  orderIndex: z.number().int().optional(),
});
export const resourceUpdateSchema = resourceSchema.partial().omit({ id: true });

export const resourceReorderSchema = z.object({
  ids: z.array(uuid),
});

export const assignmentCreateSchema = z.object({
  id: uuid.optional(),
  taskId: uuid,
  resourceId: uuid,
  allocationPct: z.number().int().min(0).max(100).default(100),
});

export const assignmentUpdateSchema = z.object({
  allocationPct: z.number().int().min(0).max(100),
});

export const calendarSchema = z.object({
  workingDaysOfWeek: z.array(z.number().int().min(0).max(6)),
  holidays: z.array(z.string()),
  hoursPerDay: z.number().int().min(1).max(24),
});

export const projectMetaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  start: z.string().optional(),
});

export const settingsSchema = z.object({
  taskOrder: z.array(uuid).optional(),
  resourceOrder: z.array(uuid).optional(),
  collapsedIds: z.array(uuid).optional(),
});

const serializedTaskSchema = taskSchema.extend({ orderIndex: z.number().int().optional() });

export const snapshotSchema = z.object({
  project: z.object({
    id: uuid,
    name: z.string(),
    start: z.string(),
  }),
  tasks: z.array(z.tuple([uuid, serializedTaskSchema])),
  taskOrder: z.array(uuid),
  dependencies: z.array(z.tuple([uuid, dependencyCreateSchema.required({ id: true })])),
  calendar: calendarSchema,
  resources: z.array(z.tuple([uuid, resourceSchema])).optional(),
  resourceOrder: z.array(uuid).optional(),
  assignments: z.array(z.tuple([uuid, assignmentCreateSchema.required({ id: true })])).optional(),
  collapsedIds: z.array(uuid).optional(),
  savedAt: z.number().optional(),
});

// Spec 002 — baseline create body. Server only accepts the rationale; the
// snapshot is captured server-side by re-using `loadSnapshot` (FR-002, FR-003,
// FR-018, contract POST /baselines requestBody).
export const baselineCreateSchema = z.object({
  rationale: z.string().trim().min(1).max(2000),
});

// Helper: convert calendar days-of-week array → bitmap (bit 0 = Sunday)
export function workingDaysToMask(days: number[]): number {
  let mask = 0;
  for (const d of days) mask |= 1 << d;
  return mask;
}

export function maskToWorkingDays(mask: number): number[] {
  const out: number[] = [];
  for (let d = 0; d < 7; d++) if (mask & (1 << d)) out.push(d);
  return out;
}
