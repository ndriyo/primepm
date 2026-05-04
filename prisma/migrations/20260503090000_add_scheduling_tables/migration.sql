-- CreateTable
CREATE TABLE "schedule_tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "duration_days" INTEGER NOT NULL DEFAULT 0,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "schedule_mode" VARCHAR(10) NOT NULL DEFAULT 'auto',
    "manual_start" DATE,
    "constraint_type" VARCHAR(10) NOT NULL DEFAULT 'ASAP',
    "constraint_date" DATE,
    "progress_pct" SMALLINT NOT NULL DEFAULT 0,
    "color" VARCHAR(7),
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "schedule_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_dependencies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "predecessor_id" UUID NOT NULL,
    "successor_id" UUID NOT NULL,
    "type" VARCHAR(2) NOT NULL DEFAULT 'FS',
    "lag_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "schedule_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_resources" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "default_allocation_pct" SMALLINT NOT NULL DEFAULT 100,
    "rate_per_day" DECIMAL(12,2),
    "color" VARCHAR(7),
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "schedule_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "allocation_pct" SMALLINT NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_calendars" (
    "project_id" UUID NOT NULL,
    "working_days_mask" SMALLINT NOT NULL DEFAULT 62,
    "holidays" JSONB NOT NULL DEFAULT '[]',
    "hours_per_day" SMALLINT NOT NULL DEFAULT 8,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_calendars_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "schedule_settings" (
    "project_id" UUID NOT NULL,
    "task_order" JSONB NOT NULL DEFAULT '[]',
    "resource_order" JSONB NOT NULL DEFAULT '[]',
    "collapsed_ids" JSONB NOT NULL DEFAULT '[]',
    "project_start" DATE,
    "project_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_settings_pkey" PRIMARY KEY ("project_id")
);

-- CreateIndex
CREATE INDEX "schedule_tasks_project_id_order_index_idx" ON "schedule_tasks"("project_id", "order_index");

-- CreateIndex
CREATE INDEX "schedule_tasks_parent_id_idx" ON "schedule_tasks"("parent_id");

-- CreateIndex
CREATE INDEX "schedule_dependencies_project_id_idx" ON "schedule_dependencies"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_dependencies_unique" ON "schedule_dependencies"("predecessor_id", "successor_id");

-- CreateIndex
CREATE INDEX "schedule_resources_project_id_order_index_idx" ON "schedule_resources"("project_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_resources_project_code_unique" ON "schedule_resources"("project_id", "code");

-- CreateIndex
CREATE INDEX "schedule_assignments_project_id_idx" ON "schedule_assignments"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_assignments_unique" ON "schedule_assignments"("task_id", "resource_id");

-- AddForeignKey
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "schedule_tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_tasks" ADD CONSTRAINT "schedule_tasks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_dependencies" ADD CONSTRAINT "schedule_dependencies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_dependencies" ADD CONSTRAINT "schedule_dependencies_predecessor_id_fkey" FOREIGN KEY ("predecessor_id") REFERENCES "schedule_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_dependencies" ADD CONSTRAINT "schedule_dependencies_successor_id_fkey" FOREIGN KEY ("successor_id") REFERENCES "schedule_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_dependencies" ADD CONSTRAINT "schedule_dependencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_dependencies" ADD CONSTRAINT "schedule_dependencies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_resources" ADD CONSTRAINT "schedule_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_resources" ADD CONSTRAINT "schedule_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_resources" ADD CONSTRAINT "schedule_resources_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "schedule_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "schedule_resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_calendars" ADD CONSTRAINT "schedule_calendars_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_settings" ADD CONSTRAINT "schedule_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- =====================================================================
-- Row Level Security policies
-- =====================================================================
-- Pattern: a row is visible iff its project belongs to an organization
-- the current authenticated user (auth.uid()) is a member of.

ALTER TABLE "schedule_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_dependencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_calendars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_tasks_org_isolation" ON "schedule_tasks"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );

CREATE POLICY "schedule_dependencies_org_isolation" ON "schedule_dependencies"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );

CREATE POLICY "schedule_resources_org_isolation" ON "schedule_resources"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );

CREATE POLICY "schedule_assignments_org_isolation" ON "schedule_assignments"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );

CREATE POLICY "schedule_calendars_org_isolation" ON "schedule_calendars"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );

CREATE POLICY "schedule_settings_org_isolation" ON "schedule_settings"
  FOR ALL
  USING (
    "project_id" IN (
      SELECT "id" FROM "projects" WHERE "organization_id" IN (
        SELECT "organization_id" FROM "users" WHERE "id" = auth.uid()
      )
    )
  );
