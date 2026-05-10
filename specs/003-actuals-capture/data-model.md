# Phase 1 Data Model: Actuals Capture

**Feature**: 003-actuals-capture
**Date**: 2026-05-10

This document derives the data model from the spec's Functional Requirements
and Key Entities, and grounds it in the existing Postgres / Prisma schema.
See `research.md` for the rationale behind each shape choice.

## Entities

### `ScheduleTask` (existing entity — extended)

Three actuals fields live directly on the existing task row. `progressPct`
already exists; two new nullable date columns are added for the actual
start and finish.

| Field           | Type                | Notes                                                                  |
| --------------- | ------------------- | ---------------------------------------------------------------------- |
| `progressPct`   | smallint (0..100)   | **Existing.** Reused as the actuals "% complete" (FR-001, R1).         |
| `actualStart`   | date (NULL)         | **NEW.** Calendar date the work actually began.                        |
| `actualFinish`  | date (NULL)         | **NEW.** Calendar date the work actually finished. NULL while running. |

**New constraints** (in the same migration):

- `CHECK (progress_pct BETWEEN 0 AND 100)` — promotes implicit smallint
  range to an explicit constraint (FR-005, R5). Renamed
  `schedule_tasks_progress_pct_range`.
- `CHECK (actual_finish IS NULL OR actual_start IS NULL OR actual_finish >= actual_start)` —
  ordering rule (FR-006, R5). Named
  `schedule_tasks_actuals_order`.

**No new constraint on summary tasks** at the DB level. The "summary tasks
do not accept direct edits" rule (FR-011) is enforced in the API and the
inspector — putting it in the DB would require a recursive trigger to
identify summary rows on every write, which is overkill at this scale.

### `AuditLog` (existing entity — extended)

One new nullable JSONB column carries before/after snapshots for
value-changing audit events. The existing identity columns are unchanged.

| Field         | Type           | Notes                                                                                  |
| ------------- | -------------- | -------------------------------------------------------------------------------------- |
| `id`          | uuid           | Existing PK.                                                                           |
| `userId`      | uuid (FK→users)| Existing actor identity.                                                               |
| `action`      | varchar(50)    | Existing. New values reserved by this feature: `task.actuals.set`, `task.actuals.update`, `task.actuals.cleared`, `task.actuals.deleted`. |
| `entityType`  | varchar(50)    | Existing. For actuals events: `'ScheduleTask'`.                                        |
| `entityId`    | uuid           | Existing generic UUID. For actuals events: the `schedule_tasks.id`.                    |
| `createdAt`   | timestamptz    | Existing.                                                                              |
| `payload`     | jsonb (NULL)   | **NEW.** `{ before: ActualsSnapshot \| null, after: ActualsSnapshot \| null }`.        |

```ts
// JSONB shape carried by audit_logs.payload for actuals events:
interface ActualsAuditPayload {
  before: ActualsSnapshot | null;     // null on the very first set
  after: ActualsSnapshot | null;      // null on task.actuals.deleted
}

interface ActualsSnapshot {
  progressPct: number;                // 0..100
  actualStart: string | null;         // ISO date, e.g. '2026-05-04'
  actualFinish: string | null;        // ISO date, e.g. '2026-05-09'
}
```

**No FK on `entity_id`**. This is intentional: it is what makes audit rows
survive the deletion of the entity they describe (R3, FR-019). The
existing audit_logs row already behaves this way for baseline events.

**No UPDATE / DELETE allowed**. FR-016 forbids edits to audit entries.
Enforcement is by absence of write paths in the API; we do not add a
trigger here because the rule already applies to the existing `audit_logs`
table by convention (no UPDATE/DELETE route exists today).

## Relationship to existing models

```
projects                     (existing)
   │
   │ 1 ── N
   ▼
schedule_tasks (extended)    (this feature: +actual_start, +actual_finish)
   │
   │ id is referenced (loose, no FK) by audit_logs.entity_id
   │
   ▼
audit_logs (extended)        (this feature: +payload jsonb)
   │
   │ 'task.actuals.set' / '.update' / '.cleared' / '.deleted' actions
   │ payload = { before, after }
   ▼
(retained on task delete — FR-019)
```

## Prisma model (proposed changes to `prisma/schema.prisma`)

### `ScheduleTask` — add two fields

```prisma
model ScheduleTask {
  // ...existing fields unchanged through orderIndex...
  progressPct     Int                  @default(0) @map("progress_pct") @db.SmallInt
  actualStart     DateTime?            @map("actual_start") @db.Date           // NEW
  actualFinish    DateTime?            @map("actual_finish") @db.Date          // NEW
  color           String?              @db.VarChar(7)
  // ...rest unchanged...
}
```

### `AuditLog` — add `payload` field

```prisma
model AuditLog {
  id         String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  action     String    @db.VarChar(50)
  entityType String    @map("entity_type") @db.VarChar(50)
  entityId   String    @map("entity_id") @db.Uuid
  createdAt  DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  payload    Json?     // NEW — { before, after } for value-changing actions

  user       User      @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([entityType, entityId, createdAt(sort: Desc)], map: "audit_logs_entity_recent_idx")  // NEW
  @@map("audit_logs")
}
```

The new index on `(entity_type, entity_id, created_at DESC)` supports the
audit-history endpoint (R13) without scanning the full table.

## SQL migration outline

The migration will be added under
`prisma/migrations/<timestamp>_add_task_actuals_and_audit_payload/`:

```sql
-- 1. Extend schedule_tasks with the two new actuals date columns
ALTER TABLE schedule_tasks
  ADD COLUMN actual_start  date NULL,
  ADD COLUMN actual_finish date NULL;

-- 2. Constraints (FR-005, FR-006)
ALTER TABLE schedule_tasks
  ADD CONSTRAINT schedule_tasks_progress_pct_range
  CHECK (progress_pct BETWEEN 0 AND 100);

ALTER TABLE schedule_tasks
  ADD CONSTRAINT schedule_tasks_actuals_order
  CHECK (
    actual_finish IS NULL
    OR actual_start IS NULL
    OR actual_finish >= actual_start
  );

-- 3. Extend audit_logs with the payload column for value-changing events
ALTER TABLE audit_logs
  ADD COLUMN payload jsonb NULL;

-- 4. Index for audit-history reads (R13)
CREATE INDEX audit_logs_entity_recent_idx
  ON audit_logs (entity_type, entity_id, created_at DESC);
```

## State transitions

A task's actuals row evolves through the following user-visible states:

```
   ┌──────────────────┐  first set      ┌────────────────────────┐
   │ none-recorded    │ ─────────────►  │ in-progress            │
   │ (all NULL, %=0)  │                 │ (actualStart set,      │
   └──────────────────┘                 │  actualFinish NULL,    │
                                        │  0 < % < 100 typical)  │
                                        └─────────┬──────────────┘
                                                  │ complete
                                                  ▼
                                        ┌────────────────────────┐
                                        │ finished               │
                                        │ (actualStart set,      │
                                        │  actualFinish set,     │
                                        │  % = 100 (auto-filled  │
                                        │  if needed per FR-017))│
                                        └────────────────────────┘
```

Auto-fill (FR-017) is what gates the `in-progress → finished` transition:
saving `% = 100` without `actualFinish` triggers the server to set
`actualFinish = today`; saving `actualFinish` with `% < 100` triggers the
server to bump `% = 100`.

A task may also revert from `finished` to `in-progress` (the PM enters
`% = 80` after seeing the task wasn't really done). Actuals are not
versioned at the row level — only the audit log holds that history.

## Validation rules (re-stated from spec for traceability)

| Rule                                                | Spec source       | Where enforced                                            |
| --------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| `% complete` ∈ [0, 100]                             | FR-005            | Inspector / zod / SQL CHECK `schedule_tasks_progress_pct_range` |
| `actualFinish ≥ actualStart` when both present      | FR-006            | Inspector / zod / SQL CHECK `schedule_tasks_actuals_order`     |
| Auto-fill % = 100 ↔ actualFinish                    | FR-017            | Server (definitive); inspector mirrors for UX             |
| Audit row produced on every actuals write           | FR-016            | Service layer in actuals route (single transaction)       |
| Audit retained on task delete                       | FR-019            | No FK on `entity_id`; deletion handler emits final event  |
| Read scope = project-read                           | FR-018            | Existing RLS on `schedule_tasks`; same join for audit     |
| Summary cannot have actuals entered directly        | FR-011, US5 AS4   | API returns 422 if target is summary; inspector read-only |
| Atomic save with task-edit fields                   | FR-010            | Same UPDATE statement covers actuals + non-actuals fields |
| Cascade delete from task delete                     | FR-012            | Existing FK cascade (Project→ScheduleTask covers it)      |
| Baseline never includes actuals                     | FR-013            | `loadSnapshot` already serializes only baseline columns; we add zero references to `actual_*` from the baseline payload |

## Frontend (Zustand) shape additions

In `src/store/projectStore.ts` we extend the existing task slice; no new
slice is introduced.

```ts
// projectStore.ts — additions to the existing Task state:
interface Task {
  // ...existing fields...
  progressPct: number;
  actualStart?: string;        // ISO date — undefined when NULL
  actualFinish?: string;       // ISO date — undefined when NULL
}

interface AuditEntry {
  id: string;
  taskId: string;
  action: 'task.actuals.set' | 'task.actuals.update' | 'task.actuals.cleared' | 'task.actuals.deleted';
  actor: { id: string; fullName: string };
  createdAt: string;
  before: ActualsSnapshot | null;
  after: ActualsSnapshot | null;
}

// New actions on the project store:
interface ActualsActions {
  updateActuals: (
    taskId: string,
    next: { progressPct?: number; actualStart?: string | null; actualFinish?: string | null }
  ) => Promise<void>;
  // Lazy: only fetched when the user opens the audit panel.
  loadActualsAudit: (taskId: string) => Promise<void>;
  audit: Map<string, AuditEntry[]>;     // keyed by taskId
}
```

The existing `updateTask` continues to handle the rest of the inspector
form. `updateActuals` is a thin wrapper that calls
`PUT /tasks/:taskId/actuals` and patches the local task in-place. It can
be combined with a single `updateTask` call into one outbound request via
the existing snapshot save path — see `quickstart.md` for the wiring.

## Index summary

- **schedule_tasks**: no new indexes. The two new columns are not used as
  query keys; reads always go via the project's task list.
- **audit_logs**: one new composite index on
  `(entity_type, entity_id, created_at DESC)` — supports the audit-history
  endpoint at O(log n + page-size) (R13).
