# Phase 1 Data Model: Schedule Baseline & Tracking Gantt Overlay

**Feature**: 002-schedule-baseline-tracking-overlay
**Date**: 2026-05-09

This document derives the data model from the spec's Functional Requirements
and Key Entities, and grounds it in the existing Postgres / Prisma schema.
See `research.md` for the rationale behind each shape choice.

## Entities

### `ScheduleBaseline` (new persisted entity)

A frozen, immutable record of a project's schedule at a point in time.

| Field           | Type                | Notes                                                                                |
| --------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `id`            | uuid (PK)           | Server-generated.                                                                    |
| `projectId`     | uuid (FK → projects) | `ON DELETE CASCADE` — when a project is deleted, its baselines go too.              |
| `versionLabel`  | string              | `v0`, `v1`, … Server-derived sequence per project (R5).                              |
| `versionIndex`  | int                 | Numeric form of label (0, 1, 2, …) for sorting and the unique constraint.            |
| `rationale`     | text (NOT NULL, len ≥ 1) | Required free text — the "why" behind the baseline (FR-002, FR-004).            |
| `payload`       | jsonb (NOT NULL)    | The full schedule snapshot — see `BaselinePayload` below.                            |
| `createdById`   | uuid (FK → users)   | Identity of the user who clicked "Set baseline".                                     |
| `createdAt`     | timestamptz         | Server-set at insert; never updated.                                                 |

**Constraints**:

- `UNIQUE (projectId, versionLabel)` — guards against the race where two
  callers compute the same version (R5).
- `UNIQUE (projectId, versionIndex)` — same guard, numerical form.
- `CHECK (length(rationale) >= 1)` — rationale is required (FR-002).
- **No UPDATE / DELETE allowed**: enforced by an `AFTER UPDATE OR DELETE`
  trigger that raises `EXCEPTION 'baselines are immutable'` (R4, FR-005). A
  project-cascade delete is allowed (it removes the project entirely, not the
  baseline alone).

**Indexes**:

- `(projectId, versionIndex DESC)` — list baselines newest-first for the
  history view and "latest" lookup.

### `BaselinePayload` (JSONB shape — not a table)

The snapshot stored in `ScheduleBaseline.payload`. Mirrors the existing
`SnapshotDto` consumed by `loadSnapshot()` / `saveSnapshot()` so the same
serialiser can be reused (R1, R2).

```ts
interface BaselinePayload {
  schemaVersion: 1;                       // bump if shape evolves; readers gate on this
  capturedAt: string;                     // ISO timestamp; redundant with createdAt for self-containment
  project: {
    id: string;
    name: string;
    start: string;                        // ISO date
  };
  tasks: BaselineTask[];
  dependencies: BaselineDependency[];
  resources: BaselineResource[];
  assignments: BaselineAssignment[];
  calendar: BaselineCalendar;
  settings: BaselineSettings;
}

interface BaselineTask {
  id: string;                             // schedule_tasks.id (reused — R6)
  parentId?: string;
  name: string;
  notes?: string;
  durationDays: number;
  isMilestone: boolean;
  scheduleMode: 'auto' | 'manual';
  manualStart?: string;                   // ISO date
  constraint:
    | { kind: 'ASAP' }
    | { kind: 'SNET' | 'FNET' | 'MSO' | 'MFO'; date: string };
  progressPct: number;
  color?: string;
  orderIndex: number;
  // Computed dates from the schedule engine, captured for variance comparison:
  computedStart: string;                  // ISO date
  computedFinish: string;                 // ISO date
}

interface BaselineDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

interface BaselineResource {
  id: string;
  code: string;
  name: string;
  defaultAllocationPct: number;
  ratePerDay?: number;
  color?: string;
  notes?: string;
  orderIndex: number;
}

interface BaselineAssignment {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPct: number;
}

interface BaselineCalendar {
  workingDaysOfWeek: number[];            // 0..6
  holidays: string[];                     // ISO dates
  hoursPerDay: number;
}

interface BaselineSettings {
  taskOrder: string[];                    // ordered task ids
  resourceOrder: string[];
  collapsedIds: string[];
}
```

**Why include `computedStart` / `computedFinish`?** The variance overlay
(FR-008/-009) compares baseline start/finish against current start/finish.
The current values are recomputed by the engine on the client; baseline
values must be pre-computed _at the moment of capture_, otherwise re-running
the engine over the baseline payload at a different "today" could produce
slightly different results (e.g. dependency lag interacting with a holiday
that was added after the baseline). Persisting the computed dates makes the
baseline truly frozen.

## Relationship to existing models

```
projects                       (existing)
   │
   │ 1 ───── N
   │
   ▼
schedule_baselines (new)       (this feature)
   │
   │ payload jsonb references the live (not the historical) schedule_tasks
   │ via task uuids that are stable across renames/reparenting (R6)
   ▼
schedule_tasks                 (existing — read-only at snapshot time)
schedule_dependencies          (existing — read-only at snapshot time)
schedule_resources             (existing — read-only at snapshot time)
schedule_assignments           (existing — read-only at snapshot time)
schedule_calendar              (existing — read-only at snapshot time)
schedule_settings              (existing — read-only at snapshot time)

audit_logs                     (existing — append-only)
   ◀───── 'baseline.set' event written by the same transaction
```

## Prisma model (proposed addition to `prisma/schema.prisma`)

```prisma
model ScheduleBaseline {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  projectId     String   @map("project_id") @db.Uuid
  versionLabel  String   @map("version_label") @db.VarChar(16)
  versionIndex  Int      @map("version_index")
  rationale     String   // required NOT NULL; CHECK (length >= 1) at SQL level
  payload       Json
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  createdById   String   @map("created_by") @db.Uuid

  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  createdBy     User     @relation("ScheduleBaselineCreatedBy", fields: [createdById], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([projectId, versionLabel], map: "schedule_baselines_project_version_label_unique")
  @@unique([projectId, versionIndex], map: "schedule_baselines_project_version_index_unique")
  @@index([projectId, versionIndex(sort: Desc)])
  @@map("schedule_baselines")
}
```

Plus back-relations on `Project` and `User` (`scheduleBaselines` and
`createdScheduleBaselines` respectively).

## SQL migration outline

The migration will be added under
`prisma/migrations/<timestamp>_add_schedule_baselines/`:

```sql
CREATE TABLE schedule_baselines (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_label varchar(16) NOT NULL,
  version_index integer NOT NULL,
  rationale     text NOT NULL,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid NOT NULL REFERENCES users(id),

  CONSTRAINT schedule_baselines_rationale_nonempty CHECK (length(rationale) >= 1),
  CONSTRAINT schedule_baselines_project_version_label_unique UNIQUE (project_id, version_label),
  CONSTRAINT schedule_baselines_project_version_index_unique UNIQUE (project_id, version_index)
);

CREATE INDEX schedule_baselines_project_version_idx
  ON schedule_baselines (project_id, version_index DESC);

-- Immutability trigger
CREATE OR REPLACE FUNCTION schedule_baselines_no_mutate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'schedule_baselines is append-only — UPDATE/DELETE on individual rows is not allowed';
END;
$$;

CREATE TRIGGER schedule_baselines_block_update
  BEFORE UPDATE ON schedule_baselines
  FOR EACH ROW EXECUTE FUNCTION schedule_baselines_no_mutate();

CREATE TRIGGER schedule_baselines_block_delete
  BEFORE DELETE ON schedule_baselines
  FOR EACH ROW
  WHEN (NEW IS NULL)            -- cascade-from-project deletes are allowed via TG_OP filter below
  EXECUTE FUNCTION schedule_baselines_no_mutate();
```

> **Cascade exception**: We allow row deletes that originate from a project
> cascade. If RLS / trigger interaction makes that hard to express precisely,
> the practical alternative is to drop the BEFORE DELETE trigger entirely and
> rely solely on the application layer never issuing a DELETE — the project
> cascade then works unconditionally. The final form is decided in the
> migration PR.

## State transitions

A baseline has a single state: **created**. There is no edit, archive, or
delete state. The only "transition" relevant to the feature is the
project-level state of "has at least one baseline" vs. "has no baselines",
which gates whether the Gantt overlay renders (FR-007, FR-014).

## Validation rules (re-stated from spec for traceability)

| Rule                                      | Spec source | Where enforced                                     |
| ----------------------------------------- | ----------- | -------------------------------------------------- |
| Rationale required and non-empty          | FR-002, FR-004 | Client (Confirm button), API zod, SQL CHECK       |
| Snapshot is complete & atomic             | FR-003, FR-018 | Single transaction in `POST /baselines`           |
| Versions are unique per project           | FR-006, R5  | UNIQUE constraints on `(project_id, version_*)`    |
| Baselines are immutable                   | FR-005      | DB trigger + no write paths in API                 |
| Variance threshold > 1 day                | FR-008, FR-009 | Client overlay computation                       |
| Stable task identity                      | FR-017      | Reuse of `schedule_tasks.id` UUID inside payload   |
| Audit event on every set                  | FR-015      | Same transaction inserts `audit_logs` row          |

## Frontend (Zustand) shape additions

In `src/store/projectStore.ts` we add a new slice:

```ts
interface BaselineHeader {
  id: string;
  versionLabel: string;          // 'v0' | 'v1' | …
  versionIndex: number;
  rationale: string;
  createdAt: string;             // ISO timestamp
  createdBy: { id: string; fullName: string };
}

interface BaselineSlice {
  // Header list — fetched on project open if project has any baselines.
  baselineHeaders: BaselineHeader[];

  // Payloads keyed by baseline id. Loaded lazily when the user
  // opens the Gantt or switches the active reference (R13).
  baselinePayloads: Map<string, BaselinePayload>;

  // The baseline the overlay is currently comparing against.
  // 'latest' means the most-recent header; otherwise a baseline id.
  activeBaselineRef: 'latest' | string;
}

interface BaselineActions {
  setBaseline: (rationale: string) => Promise<void>;          // POST /baselines
  loadBaselineHeaders: (projectId: string) => Promise<void>;
  loadBaselinePayload: (baselineId: string) => Promise<void>; // memoised
  setActiveBaselineRef: (ref: 'latest' | string) => void;     // session-scoped
}
```

The **derived** "active baseline payload" is computed from
`baselineHeaders` + `baselinePayloads` + `activeBaselineRef` and is what the
Gantt overlay consumes.
