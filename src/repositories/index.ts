// Export all repositories from a single entry point
export * from './BaseRepository';
export * from './ProjectRepository';
export * from './CriteriaRepository';
export * from './PortfolioRepository';
export * from './UserRepository';

// Handle naming conflicts with explicit exports
export { OrganizationRepository } from './OrganizationRepository';
export type { 
  Organization,
  OrganizationCreateInput,
  OrganizationUpdateInput,
} from './OrganizationRepository';

// Export DepartmentRepository with priority
export { DepartmentRepository } from './DepartmentRepository';
export type {
  Department,
  DepartmentCreateInput,
  DepartmentUpdateInput,
} from './DepartmentRepository';
