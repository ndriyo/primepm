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

## Active Decisions
- Using Next.js for both frontend and backend functionality
- Implementing Tailwind CSS for styling with custom component classes (btn-primary, btn-secondary)
- Organizing components in both app/ and src/ directories
- Using TypeScript for type safety across the application
- Using multi-step forms for complex user inputs
- Implementing a dynamic self-assessment system based on criteria definitions

## Next Steps
- Connect the frontend to Supabase for data persistence
- Implement authentication with NextAuth
- Build out the multi-tenant functionality
- Implement portfolio simulation based on constraints
- Add data export/import functionality
- Deploy the application to production environments
- Add committee review interface for submitted projects

## Deployment Configuration
- Added Netlify deployment configuration with netlify.toml
- Configured to use Next.js build output (.next directory)
- Added @netlify/plugin-nextjs for optimal Next.js deployment
- Updated .gitignore to exclude the legacy dist/ directory
