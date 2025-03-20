# Active Development Context

## Current Focus
- Implementing the core project selection and portfolio prioritization features
- Building out the dashboard and project selection interfaces
- Setting up the basic application structure with Next.js

## Recent Changes
- Established Next.js application structure with TypeScript
- Created initial dashboard components (MetricsSummary, RiskQuadrantChart, StatusChart, TopProjects)
- Implemented project selection components
- Set up basic routing between dashboard and project selection screens
- Implemented comprehensive criteria management system with versioning
- Created AHP wizard for criteria weighting with pairwise comparisons
- Added custom confirmation dialogs and warning notifications

## Active Decisions
- Using Next.js for both frontend and backend functionality
- Implementing Tailwind CSS for styling with custom component classes (btn-primary, btn-secondary)
- Organizing components in both app/ and src/ directories
- Using TypeScript for type safety across the application

## Next Steps
- Connect the frontend to Supabase for data persistence
- Implement authentication with NextAuth
- Build out the multi-tenant functionality
- Implement portfolio simulation based on constraints
- Add data export/import functionality
