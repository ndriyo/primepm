# Active Development Context

## Current Focus
- Implementing the Committee Review interface for portfolio selection process
- Enhancing the project selection and portfolio prioritization features
- Building out the dashboard and project selection interfaces
- Setting up the basic application structure with Next.js
- Implementing project entry and self-assessment for Project Managers/Sponsors

## Recent Changes
- Fixed issue with committee API endpoints being called on unrelated pages:
  - Moved CommitteeProvider from root layout to committee-specific layout
  - Created a dedicated layout.tsx in the committee directory
  - Removed redundant CommitteeProvider from committee/project/[projectId]/page.tsx
  - This prevents unnecessary API calls when navigating to non-committee pages

- Fixed Next.js build error related to useSearchParams() and Suspense boundaries:
  - Created a custom not-found.tsx page with proper Suspense boundary
  - Added Suspense boundaries around components using useSearchParams() in:
    - Root layout.tsx for ProjectSearchProvider
    - Committee layout.tsx for CommitteeProvider
    - Projects/new/page.tsx for ProjectEntryForm
  - This resolves the "useSearchParams() should be wrapped in a suspense boundary" error

- Added DevAuthSwitcher component to the application:
  - Imported and added DevAuthSwitcher to the root layout.tsx inside the Providers component
  - Removed environment checks to avoid TypeScript errors
  - Fixed issue with AuthProvider context access
  - This provides a convenient way to switch between users and organizations during development

- Fixed issue with criteria API endpoints being called with hardcoded default IDs:
  - Removed hardcoded default version ID (88888888-8888-8888-8888-888888888888) from CriteriaContext
  - Updated useCriteriaQuery hook to only use actual version IDs from the database
  - Replaced defaultCriteria with dynamically generated sample criteria when needed
  - This prevents unnecessary API calls to non-existent criteria versions

- Implemented initial Committee Review interface:
  - Created CommitteeContext provider for state management
  - Implemented API routes for committee sessions, projects, scores, and progress
  - Added CommitteeRepository for database operations
  - Integrated with existing authentication system
  - Implemented project scoring workflow with validation
  - Added progress tracking for committee members
  - Updated database schema with committee-related tables

- Enhanced dashboard with new Bento-style metrics view:
  - Created reusable AnimatedGradient component with SVG circle-based animations
  - Implemented BentoCard component with framer-motion animations
  - Replaced MetricsSummary with BentoMetrics component in the dashboard
  - Maintained the same grid layout as the original MetricsSummary
  - Added percentage calculations for approved and pending projects
  - Implemented staggered animations for a polished user experience
  - Added support for both light and dark modes
  - Made cards more compact to align with the original design
  - Simplified MetricsSummary component to use standard CSS gradients
  - Removed unused AnimatedGradientCard, AnimatedGradientIcon, and AnimatedGradientDemo components

- Enhanced dashboard visualizations:
  - Implemented multiple animation effects in BentoCard component
  - Improved visual appeal with semi-transparent backgrounds for better contrast
  - Optimized text readability with appropriate contrast on gradient backgrounds
  - Added subtle backdrop blur effects for depth and visual hierarchy

- Enhanced dashboard functionality with role-based visualizations:
  - Updated MetricsSummary to show total projects, approved projects, pending projects, total budget, and total mandays
  - Replaced StatusChart pie chart with treemap visualization for better budget distribution representation
  - Created ScoreQuadrantChart to replace RiskQuadrantChart, showing budget vs score relationship
  - Enhanced TopProjects component to show global ranking relative to all projects in the portfolio
  - Implemented role-based filtering (PM sees department data, PMO sees organization-wide data)
  - Added formatted budget values (K, M, B) for better readability
  - Used database scores with fallback to calculated scores for consistency

- Fixed bug where department data was not showing in ProjectsTable:
  - Modified API route to include departmentName in project data
  - Updated Project type to include departmentName property
  - Updated ProjectsTable component to use departmentName instead of department.name
  - Implemented efficient department lookup using a map to avoid multiple database queries

- Added Excel import functionality for batch project creation:
  - Implemented file upload with drag-and-drop support
  - Created dynamic template generation based on active criteria version
  - Built validation engine with comprehensive error checking
  - Developed modular component architecture for the import workflow
  - Added role-based validation for project managers
  - Implemented progress indicators for better user feedback
  - Added support for both new projects and updates to existing projects
- Enhanced search and filter functionality for project information management:
  - Implemented combobox with multiple selection for department filtering
  - Updated status filter to use combobox with values: 'initiation', 'planning', 'in-progress', 'completed', 'on-hold'
  - Replaced number inputs with textboxes supporting thousand separators for budget and resources
  - Improved search functionality to properly search by name, description, or tags
  - Added filter state synchronization with URL parameters for shareable search results
- Improved navigation between project views:
  - Added Cancel button to the project details page for easier return to search
  - Updated navigation flow for editing project information
  - Created consistent button placement across project views
- Fixed infinite update loop issues in context providers:
  - Eliminated the "Maximum update depth exceeded" error in ProjectContext
  - Optimized context update mechanisms for better performance
  - Implemented deep comparison before state updates to prevent unnecessary renders
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
- Enhanced user experience during data loading:
  - Implemented skeleton loading placeholders throughout the application
  - Created reusable skeleton components (SkeletonElement, SkeletonText, SkeletonCard, etc.)
  - Added smooth pulse animation effect for skeleton elements
  - Built LoadingWrapper and DelayedSkeletonWrapper components for easier implementation
  - Replaced generic loading indicators with content-appropriate skeleton layouts
  - Integrated loading states with React Query for seamless data fetching feedback
- Improved application layout and responsiveness:
  - Enhanced sidebar with toggle functionality for both mobile and desktop
  - Fixed overlap issues between header and mobile menu
  - Implemented CSS Grid layout for better content responsiveness when sidebar is collapsed
  - Added SidebarContext to centrally manage sidebar state across components
  - Implemented localStorage persistence for user sidebar preferences
  - Added smooth transitions for better user experience

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
- Implementing card-based scoring interfaces for both self-assessment and committee review

## Recent Progress
- Implemented initial Committee Review interface:
  - Created API routes for committee sessions, projects, scores, and progress
  - Developed CommitteeRepository for database operations
  - Added CommitteeContext provider for state management
  - Integrated with existing authentication system
  - Implemented project scoring workflow with validation
  - Added progress tracking for committee members
- Implemented a mock authentication system for development purposes:
  - Created AuthContext with mock users and organizations
  - Added authentication headers to API requests
  - Modified repositories to respect Row-Level Security (RLS)
  - Created DevAuthSwitcher component for easy user/role switching
- Fixed TypeScript errors in Prisma client extension for RLS:
  - Updated parameter type definition in $allOperations to make the model parameter optional
  - Implemented focused type assertions for dynamic model access in BaseRepository:
    - Used `(prismaWithRLS as any)[this.model.name]` to create direct model access variables
    - Applied the same approach to transaction objects in CRUD operations
    - Extracted model and auditLog access into variables with proper type assertions
  - Improved code maintainability by using a consistent pattern for Prisma model access
- Resolved additional TypeScript compilation issues:
  - Fixed type mismatch in `src/lib/prisma.ts` to properly handle the parameters in $allOperations
  - Updated repository models (User, Project) to better reflect nullable fields from the database using union types like `string | null` and `Date | null`
  - Refactored transaction handling in repositories to properly return typed results
  - Added proper type casting with `as unknown as User` pattern to ensure consistent typing
  - Added Suspense boundary around components using `useSearchParams()` hook to fix Next.js CSR bailout warnings
- Fixed Next.js API route type errors and build issues:
  - Updated API route handlers to use Promise for route params (e.g., `{ params }: { params: Promise<{ projectId: string }> }`)
  - Added await when accessing route parameters to properly resolve the Promise (e.g., `const { projectId } = await params`)
  - Ensured consistency in API route parameter handling across all dynamic routes
  - Added missing Suspense boundaries around components using `useSearchParams()` hook to prevent CSR bailout errors

## Next Steps
- Complete the Committee Review interface frontend components:
  - Implement CommitteeDashboard component
  - Create ProjectList component for committee members
  - Develop ProjectScoring interface with card-based selection
  - Implement ScoringProgress component for tracking
  - Create ConfirmationDialog for score submission
- Implement portfolio simulation based on constraints
- Complete the real authentication implementation with NextAuth
- Further enhance multi-tenant functionality
- Add data visualization for project comparisons
- Implement additional batch operations for multiple projects
- Add data export functionality
- Deploy the application to production environments

## Deployment Configuration
- Added Netlify deployment configuration with netlify.toml
- Configured to use Next.js build output (.next directory)
- Added @netlify/plugin-nextjs for optimal Next.js deployment
- Updated .gitignore to exclude the legacy dist/ directory
