-- Spec 002 follow-up — fix the immutability trigger from
-- 20260509120000_add_schedule_baselines.
--
-- The original BEFORE DELETE trigger function ended in `RETURN NULL`, which
-- in Postgres CANCELS the underlying row operation. That meant:
--   1. ON DELETE CASCADE from `projects` could not actually remove
--      schedule_baselines child rows, leaving orphans / FK violations.
--   2. The IF EXISTS (SELECT 1 FROM projects …) heuristic also doesn't
--      reliably tell us "we're inside a cascade" at trigger time.
--
-- Fix per data-model.md §"Cascade exception": drop the BEFORE DELETE trigger
-- entirely and rely on the application layer never issuing DELETEs (the
-- baselines route file has no delete path). Cascade-from-project then works
-- unconditionally. UPDATE remains hard-blocked at the DB level.

DROP TRIGGER IF EXISTS schedule_baselines_block_delete ON "schedule_baselines";
DROP TRIGGER IF EXISTS schedule_baselines_block_update ON "schedule_baselines";
DROP FUNCTION IF EXISTS schedule_baselines_no_mutate();

CREATE OR REPLACE FUNCTION schedule_baselines_block_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'schedule_baselines is append-only — UPDATE is not allowed';
END;
$$;

CREATE TRIGGER schedule_baselines_block_update
  BEFORE UPDATE ON "schedule_baselines"
  FOR EACH ROW EXECUTE FUNCTION schedule_baselines_block_update();
