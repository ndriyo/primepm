# Add Score Field Migration

This migration adds a `score` field to the `projects` table to store the overall project score based on criteria and project_criteria_scores.

## Changes

1. Added `score` field to the `projects` table in the Prisma schema
2. Updated the `calculateOverallScore` method in `ProjectRepository.ts` to dynamically use weights from the active criteria version and update the project record with the calculated score
3. Updated the API routes to calculate and update the project score when scores are updated
4. Updated the UI components to display the overall project score

## How to Apply

To apply this migration, you need to run the following command:

```bash
npx prisma migrate dev --name add_score_field
```

This will create a new migration file and apply it to the database.

## Manual SQL (if needed)

If you need to apply this migration manually, you can run the following SQL:

```sql
ALTER TABLE "projects" ADD COLUMN "score" DOUBLE PRECISION;
```
