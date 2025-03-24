# Project Scripts

This directory contains utility scripts for the project.

## update-project-scores.cjs

This script updates all existing projects with calculated scores based on their criteria scores. It should be run after applying the migration to add the `score` field to the `projects` table.

### How to Run

```bash
# Step 1: Make sure you have applied the migration first
npx prisma migrate dev --name add_score_field

# Step 2: Regenerate the Prisma client to include the new score field
npx prisma generate

# Step 3: Set the DATABASE_URL environment variable (choose one method):
# Method 1: Create a .env file with DATABASE_URL and install dotenv
npm install dotenv

# Method 2: Set it directly when running the script
DATABASE_URL=postgresql://user:password@localhost:5432/dbname node scripts/update-project-scores.cjs

# Method 3: Set it in your shell
export DATABASE_URL=postgresql://user:password@localhost:5432/dbname
node scripts/update-project-scores.cjs
```

### What it Does

1. Processes projects by organization
2. For each organization, finds the active criteria version
3. Gets all criteria for the active version to ensure correct weights
4. For each project in the organization:
   - Normalizes scores based on each criterion's scale
   - Applies inverse calculation for inverse criteria
   - Calculates the weighted score using the weights from the active version
   - Updates the project record with the calculated score

### When to Run

Run this script:
- After applying the migration to add the `score` field
- If you want to recalculate all project scores (e.g., after updating criteria weights)
- After making changes to criteria weights or scales
