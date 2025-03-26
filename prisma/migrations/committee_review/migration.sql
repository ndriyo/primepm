-- CreateTable
CREATE TABLE "committee_review_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "portfolio_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "committee_review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_session_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_session_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_simulations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "portfolio_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "constraints" JSONB,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "portfolio_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_simulation_projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "simulation_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_simulation_projects_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "committee_scores" ADD COLUMN "status" VARCHAR(50),
                               ADD COLUMN "session_id" UUID;

-- AlterTable
ALTER TABLE "portfolio_selections" ADD COLUMN "start_date" DATE,
                                   ADD COLUMN "submission_deadline" DATE,
                                   ADD COLUMN "scoring_deadline" DATE,
                                   ADD COLUMN "year" INTEGER;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "portfolio_status" VARCHAR(50),
                       ADD COLUMN "portfolio_selection_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "committee_session_members_unique" ON "committee_session_members"("session_id", "user_id");

-- AddForeignKey
ALTER TABLE "committee_review_sessions" ADD CONSTRAINT "committee_review_sessions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio_selections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_review_sessions" ADD CONSTRAINT "committee_review_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "committee_review_sessions" ADD CONSTRAINT "committee_review_sessions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "committee_session_members" ADD CONSTRAINT "committee_session_members_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "committee_review_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "committee_session_members" ADD CONSTRAINT "committee_session_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "committee_scores" ADD CONSTRAINT "committee_scores_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "committee_review_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_simulations" ADD CONSTRAINT "portfolio_simulations_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio_selections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_simulations" ADD CONSTRAINT "portfolio_simulations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_simulations" ADD CONSTRAINT "portfolio_simulations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_simulation_projects" ADD CONSTRAINT "portfolio_simulation_projects_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "portfolio_simulations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portfolio_simulation_projects" ADD CONSTRAINT "portfolio_simulation_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_portfolio_selection_id_fkey" FOREIGN KEY ("portfolio_selection_id") REFERENCES "portfolio_selections"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
