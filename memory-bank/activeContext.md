# Active Development Context

## Current Focus
- Implementing the core project selection and portfolio prioritization features
- Building out the dashboard and project selection interfaces
- Setting up the basic application structure with Next.js
- Implementing project entry and self-assessment for Project Managers/Sponsors

## Recent Changes
- Established Next.js application structure with TypeScript
- Created initial dashboard components (MetricsSummary, RiskQuadrantChart, StatusChart, TopProjects)
- Implemented project selection components
- Set up basic routing between dashboard and project selection screens
- Implemented comprehensive criteria management system with versioning
- Created AHP wizard for criteria weighting with pairwise comparisons
- Added custom confirmation dialogs and warning notifications
- Implemented project entry feature with multi-step form:
  - Basic project information entry (name, description, department, budget, duration, resources, tags)
  - Self-assessment against active criteria with card-based option selection
  - Review and submission workflow with formatted values
  - Added cancel button for easy navigation back to project list
- Connected frontend components to database repositories:
  - Created API routes for all entities (projects, criteria versions, criteria, scores)
  - Implemented React Query hooks for data fetching, caching, and mutations
  - Developed adapter pattern to convert between repository models and UI models
  - Added loading states and error handling to components
  - Implemented optimistic updates for better user experience

## Active Decisions
- Using Next.js for both frontend and backend functionality
- Implementing Tailwind CSS for styling with custom component classes (btn-primary, btn-secondary)
- Organizing components in both app/ and src/ directories
- Using TypeScript for type safety across the application
- Using multi-step forms for complex user inputs
- Implementing a dynamic self-assessment system based on criteria definitions
- Using React Query for server state management
- Implementing the Repository pattern for data access with standardized CRUD operations
- Using adapter pattern to bridge backend and frontend models

## Recent Progress
- Implemented a mock authentication system for development purposes:
  - Created AuthContext with mock users and organizations
  - Added authentication headers to API requests
  - Modified repositories to respect Row-Level Security (RLS)
  - Created DevAuthSwitcher component for easy user/role switching

## Next Steps
- Complete the real authentication implementation with NextAuth
- Implement committee review interface for submitted projects
- Implement portfolio simulation based on constraints
- Further enhance multi-tenant functionality
- Add data export/import functionality
- Deploy the application to production environments

## Deployment Configuration
- Added Netlify deployment configuration with netlify.toml
- Configured to use Next.js build output (.next directory)
- Added @netlify/plugin-nextjs for optimal Next.js deployment
- Updated .gitignore to exclude the legacy dist/ directory
