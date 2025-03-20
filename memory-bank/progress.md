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
- Deployment configuration:
  - Netlify deployment setup with netlify.toml
  - Next.js build output configuration

## In Progress
- Entry basic project info & self assessment

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
