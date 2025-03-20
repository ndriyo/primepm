# Project Progress Tracker

## What Works
- Basic application structure and routing
- Dashboard UI with placeholder components:
  - Metrics summary cards
  - Status distribution chart
  - Risk quadrant visualization
  - Top projects listing
- Project data model with sample projects
- Project selection table view
- Navigation between main application sections
- Criteria management interface with versioning:
  - Create, edit, and delete criteria versions
  - Set active version for project scoring
  - Add, edit, and delete criteria with detailed properties
  - Define scale and rubric for each criterion
- AHP wizard for criteria weighting:
  - Pairwise comparisons between criteria
  - Automatic weight calculation based on AHP algorithm
  - Progress tracking and navigation
- Custom UI components:
  - Confirmation dialogs with improved UX
  - Warning notifications for incomplete weights
- Project entry and self-assessment:
  - Multi-step form with progress tracking
  - Basic information entry (name, description, department, budget, duration, resources, tags) with proper formatting
  - Self-assessment using card-based option selection with descriptions for each score
  - Project review and submission workflow with formatted values
  - Cancel button for easy navigation back to project list
- Project information display:
  - Clean presentation of project details
  - Resources display with thousand separator formatting
  - Criteria analysis with visual indicators
- Deployment configuration:
  - Netlify deployment setup with netlify.toml
  - Next.js build output configuration

## In Progress
- Connecting to database for project persistence
- Committee review interface

## Not Started
- Supabase integration
- Authentication system
- User role management
- Multi-tenant functionality
- Portfolio simulation based on constraints
- Data export/import functionality

## Known Issues
- Using placeholder data instead of actual database
- Missing authentication and authorization
- Project selection algorithm not fully implemented
- No data persistence between sessions
- Criteria weights need to be recalculated when criteria are added or removed
- Form data is not persisted if user navigates away
