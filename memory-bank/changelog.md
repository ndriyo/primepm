# Changelog

This file documents the changes made to the PrimePM application.

## [Unreleased]

## 2025-03-23
### Fixed
- Fixed infinite update loops in context providers:
  - Eliminated "Maximum update depth exceeded" error in ProjectContext 
  - Optimized the useEffect implementation in CriteriaContext to prevent unnecessary state updates
  - Implemented deep comparison before updating state to reduce rerenders
  - Fixed weight settings initialization to properly handle dependencies

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
