-- Spec 002 — Schedule Baseline & Tracking Gantt Overlay
-- Adds the `schedule_baselines` table per data-model.md (FR-005, FR-006, FR-018, R3, R4, R5).
-- Append-only by both convention (no API write paths) AND DB trigger (defense in depth).

-- CreateTable
CREATE TABLE "schedule_baselines" (
    "id"            UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "project_id"    UUID           NOT NULL,
    "version_label" VARCHAR(16)    NOT NULL,
    "version_index" INTEGER        NOT NULL,
    "rationale"     TEXT           NOT NULL,
    "payload"       JSONB          NOT NULL,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by"    UUID           NOT NULL,

    CONSTRAINT "schedule_baselines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "schedule_baselines_rationale_nonempty" CHECK (length("rationale") >= 1),
    CONSTRAINT "schedule_baselines_project_version_label_unique" UNIQUE ("project_id", "version_label"),
    CONSTRAINT "schedule_baselines_project_version_index_unique" UNIQUE ("project_id", "version_index")
);

-- CreateIndex
CREATE INDEX "schedule_baselines_project_version_idx"
  ON "schedule_baselines" ("project_id", "version_index" DESC);

-- AddForeignKey
ALTER TABLE "schedule_baselines"
  ADD CONSTRAINT "schedule_baselines_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "schedule_baselines"
  ADD CONSTRAINT "schedule_baselines_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Immutability trigger (FR-005). UPDATE is always rejected; DELETE of an
-- individual row is rejected, but the project-cascade delete (which sets
-- TG_OP='DELETE' on this row WHILE CASCADE-ing) is allowed. We detect cascade
-- by checking if the parent project still exists at trigger time.
CREATE OR REPLACE FUNCTION schedule_baselines_no_mutate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'schedule_baselines is append-only — UPDATE is not allowed';
  END IF;

  -- DELETE branch: allow only if the parent project is itself being deleted
  -- (cascade). At trigger time during a cascade, the project row is already
  -- gone, so a SELECT against it returns no rows.
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM "projects" WHERE id = OLD.project_id) THEN
      RAISE EXCEPTION 'schedule_baselines is append-only — UPDATE/DELETE on individual rows is not allowed';
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER schedule_baselines_block_update
  BEFORE UPDATE ON "schedule_baselines"
  FOR EACH ROW EXECUTE FUNCTION schedule_baselines_no_mutate();

CREATE TRIGGER schedule_baselines_block_delete
  BEFORE DELETE ON "schedule_baselines"
  FOR EACH ROW EXECUTE FUNCTION schedule_baselines_no_mutate();
