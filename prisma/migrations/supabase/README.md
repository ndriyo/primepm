# PrimePM Supabase Migration Guide

This directory contains migration scripts specifically adapted for Supabase. The key difference from the standard PostgreSQL migrations is the use of Supabase's `auth.uid()` function for Row Level Security (RLS) policies instead of a custom `current_user_id()` function.

## Prerequisites

- A Supabase account and project
- The Supabase CLI installed (`npm install -g supabase`)
- PostgreSQL client (psql) or Supabase's SQL Editor

## Setting Up Your Supabase Project

1. Create a new Supabase project from the [Supabase dashboard](https://app.supabase.com)
2. Note your project's connection details:
   - Database connection string
   - API URL
   - API Key (anon and service_role)

## Running the Migration

### Option 1: Using the SQL Editor in Supabase Dashboard

1. Navigate to the SQL Editor in your Supabase dashboard
2. Open the `migration.sql` file in this directory
3. Copy and paste its contents into the SQL Editor
4. Execute the SQL script
5. Repeat for the `seed.sql` file if you want to populate the database with sample data

### Option 2: Using psql

1. Connect to your Supabase PostgreSQL database:
   ```
   psql "postgres://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].supabase.co:5432/postgres"
   ```
2. Run the migration script:
   ```
   \i path/to/migration.sql
   ```
3. Optionally run the seed script:
   ```
   \i path/to/seed.sql
   ```

## Configuring Your Application

1. Create a `.env` file (or update your existing one) with your Supabase connection details:
   ```
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
   ```

2. Update `src/lib/prisma.ts` to include the PostgreSQL connection string:
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });

   export default prisma;
   ```

## Authentication Integration

To integrate with Supabase Auth:

1. Install the Supabase client libraries:
   ```
   npm install @supabase/supabase-js
   ```

2. Create a Supabase client:
   ```typescript
   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. Implement authentication with Supabase and ensure user IDs match between Supabase Auth and your application's users table.

## RLS Policy Explanation

The migration script sets up Row Level Security (RLS) policies that use Supabase's `auth.uid()` function to get the current authenticated user's ID. This ensures data is properly isolated between different organizations and users.

For example, the policy for accessing organization data looks like:

```sql
CREATE POLICY organization_access ON organizations
  USING (id IN (SELECT organization_id FROM users WHERE users.id = auth.uid()));
```

This policy ensures that a user can only access organization data for their own organization.

## Troubleshooting

- **RLS Problems**: If you're having trouble accessing data, ensure the authenticated user's ID exists in the `users` table and has the correct `organization_id`.
- **Function Not Found**: If you encounter `function auth.uid() does not exist`, make sure you're using the Supabase migration script, not the standard PostgreSQL one.
- **Connection Issues**: Check that your DATABASE_URL is correctly formatted and includes the right credentials.
