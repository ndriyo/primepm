# Changelog

This file documents the changes made to the PrimePM application.

## 2025-03-26
### Added
- Committee review interface (initial implementation):
  - Created CommitteeContext provider for state management
  - Implemented API routes for committee sessions, projects, scores, and progress
  - Added CommitteeRepository for database operations
  - Integrated with existing authentication system
  - Implemented project scoring workflow with validation
  - Added progress tracking for committee members

### Changed
- Updated database schema with committee-related tables:
  - Added CommitteeReviewSession model
  - Enhanced CommitteeScore model with status field
  - Added relationships between projects, sessions, and scores
  - Created migration script for database updates

## 2025-03-25
### Added
- New animated UI components:
  - AnimatedGradient component with SVG circle-based animations
  - BentoCard component with framer-motion animations
  - Utility functions for class name merging (cn) and element dimension tracking (useDimensions)

### Changed
- Dashboard metrics visualization:
  - Replaced MetricsSummary with new BentoMetrics component
  - Maintained the same grid layout while enhancing visuals
  - Removed toggle between classic and bento views in favor of the new design
  - Simplified MetricsSummary component to use standard CSS gradients instead of SVG animations

### Enhanced
- Visual presentation of dashboard metrics:
  - Added animated SVG circle-based gradient backgrounds
  - Implemented staggered reveal animations for content
  - Added percentage calculations for approved and pending projects
  - Improved support for both light and dark modes
  - Created compact card design that aligns with the original layout
  - Added subtle backdrop blur effects for improved text readability

### Removed
- Unused components:
  - AnimatedGradientCard component (replaced by BentoCard)
  - AnimatedGradientIcon component (no longer needed)
  - AnimatedGradientDemo component (demo/example component)

## 2025-03-24
### Enhanced
- Dashboard functionality with role-based visualizations:
  - Updated MetricsSummary component to show total projects, approved projects, pending projects, total budget, and total mandays
  - Replaced StatusChart pie chart with treemap visualization for better budget distribution representation
  - Created ScoreQuadrantChart to replace RiskQuadrantChart, showing budget vs score relationship
  - Enhanced TopProjects component to show global ranking relative to all projects in the portfolio
  - Implemented role-based filtering (PM sees department data, PMO sees organization-wide data)
  - Added formatted budget values (K, M, B) for better readability
  - Used database scores with fallback to calculated scores for consistency
  - Added tooltips with detailed information on hover for all visualizations

### Added
- Excel Import Feature
  - Added ability to import projects from Excel files
  - Created new page at `/projects/import` with template download, file upload, and validation
  - Implemented API endpoints for template generation, validation, and project importing
  - Added "Import from Excel" button to Project Search page
  - Created modular component structure for import workflow
  - Implemented role-based validation for imported projects
  - Added support for both new project creation and existing project updates
  - Generated sample JSON file for testing import functionality
### Fixed
- Fixed department name in search result


## 2025-03-23
### Enhanced
- Improved project information search and filter functionality:
  - Implemented combobox with multiple selection for department filtering
  - Updated status filter to use combobox with values: 'initiation' | 'planning' | 'in-progress' | 'completed' | 'on-hold'
  - Replaced number inputs with textboxes supporting thousand separators for budget and resources
  - Fixed search functionality to properly search by name, description, and tags
  - Removed criteria score filtering for better focus on essential filters
  - Added pagination with page numbers for easier navigation through search results
  - Enhanced API filtering with client-side state synchronization

### Changed
- Enhanced navigation between project views:
  - Added Cancel button to project detail page for easier return to search
  - Updated Cancel button in edit form to redirect to search page
  - Removed "New Project" button from detail view to focus on current project
  - Implemented XMarkIcon for Cancel button for visual clarity
  - Created consistent button placement across project views

### Fixed
- Fixed infinite update loops in context providers:
  - Eliminated "Maximum update depth exceeded" error in ProjectContext 
  - Optimized the useEffect implementation in CriteriaContext to prevent unnecessary state updates
  - Implemented deep comparison before updating state to reduce rerenders
  - Fixed weight settings initialization to properly handle dependencies
- Fixed Next.js build errors:
  - Corrected API route type errors by using Promise for route params in all dynamic routes
  - Updated route handlers to properly await param values before use: `const { projectId } = await params`
  - Added Suspense boundaries around components using `useSearchParams()` to fix CSR bailout warnings
  - Implemented consistent pattern for API route parameter handling across the application

### Added
- Added a comprehensive skeleton loading system:
  - Created base skeleton components (SkeletonElement, SkeletonText, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonDashboard, and SkeletonProjectList)
  - Implemented specialized skeleton components for specific views:
    - SkeletonCriteriaVersion for the criteria management interface
    - SkeletonRedirect for transition/redirect pages
  - Implemented LoadingWrapper component for showing skeletons during loading states
  - Added DelayedSkeletonWrapper to prevent flickering for fast loads
  - Added skeleton animation styles to globals.css
  - Integrated skeleton loading into dashboard components (TopProjects, StatusChart, RiskQuadrantChart, MetricsSummary)
  - Enhanced project selection views with appropriate skeleton placeholders
  - Added skeleton loading to criteria management and project details pages
  - Replaced plain loading text with skeleton UI for a more seamless experience

### Added
- SidebarContext for centralized sidebar state management
- CSS variables for sidebar width and transitions in globals.css
- Persistence of sidebar state using localStorage
- Responsive toggle chevron icon for desktop view

### Changed
- Improved PageLayout to use CSS Grid for better content organization
- Enhanced Sidebar component with better mobile compatibility
- Updated mobile menu button positioning to avoid header overlap
- Optimized content area to properly utilize full width when sidebar is collapsed

### Fixed
- Fixed overlap between header and mobile menu button in responsive view
- Resolved issue where content wasn't properly expanding when sidebar was collapsed
- Added proper z-index management for stacked UI elements
- Improved transition animations for smoother UI experience

---

## [2025-03-22]

### Added
- Mock authentication system for development
- AuthContext provider with sample users and organizations
- DevAuthSwitcher component for testing different user roles
- Repository-level Row-Level Security (RLS) support

### Fixed
- TypeScript errors in Prisma client extension for RLS
- Improved type definitions in repositories
- Added proper transaction handling with correct typing

---

## [2025-03-15]

### Added
- Project entry and self-assessment features
- Multi-step form with progress tracking
- Card-based scoring interface for criteria
- Review and submission workflow

### Changed
- Enhanced project information display
- Improved dashboard components
- Added proper data formatting for currency and numeric values

---

## [2025-03-08]

### Added
- Initial Next.js application structure
- Dashboard components with placeholders
- Project selection table interface
- Basic routing between application sections
- Criteria management system with versioning
- AHP wizard for criteria weighting

### Changed
- Implemented Tailwind CSS for styling
- Added custom UI components for consistent design
