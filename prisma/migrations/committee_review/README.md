# Committee Review Migration

This migration adds the necessary database schema changes to support the Committee Review functionality in PrimePM.

## Changes

### New Tables

1. **committee_review_sessions**
   - Represents a review session for committee members to score projects
   - Linked to a portfolio selection
   - Contains session metadata like name, dates, and status

2. **committee_session_members**
   - Junction table linking users to review sessions
   - Tracks which committee members are part of which sessions

3. **portfolio_simulations**
   - Represents a portfolio simulation scenario
   - Contains simulation metadata and constraints
   - Can be marked as selected to apply to the actual portfolio

4. **portfolio_simulation_projects**
   - Junction table linking projects to simulations
   - Tracks which projects are included in which simulations
   - Includes a flag to indicate if the project is selected in the simulation

### Table Modifications

1. **committee_scores**
   - Added `status` column to track score status (DRAFT, SUBMITTED, APPROVED)
   - Added `session_id` column to link scores to review sessions

2. **portfolio_selections**
   - Added date fields for portfolio cycle management:
     - `start_date`: When the portfolio cycle begins
     - `submission_deadline`: Deadline for project submissions
     - `scoring_deadline`: Deadline for committee scoring
   - Added `year` column for annual portfolio cycles

3. **projects**
   - Added `portfolio_status` column to track project status in the portfolio selection process
     - Possible values: PROPOSED, SELECTED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED
   - Added `portfolio_selection_id` column to link projects to a specific portfolio selection cycle

## Foreign Keys

- All appropriate foreign keys have been added with proper cascade behavior
- Session deletion cascades to session members
- Portfolio selection deletion cascades to review sessions
- Simulation deletion cascades to simulation projects

## Indexes

- Created a unique index on committee_session_members to prevent duplicate memberships

## Usage

This migration should be applied to enable the Committee Review functionality in the application.

```bash
npx prisma migrate dev --name committee_review
