import { Project as RepoProject } from '@/app/_repositories/ProjectRepository';
import { Project as DataProject } from '@/src/data/projects';

/**
 * Converts a repository project model to a frontend project model
 */
export function adaptRepositoryProject(repoProject: RepoProject): DataProject {
  // Extract any existing project scores and convert to criteria format
  const criteria: Record<string, number> = {};
  
  // If projectScores exists and is an array, process them
  if (repoProject.projectScores && Array.isArray(repoProject.projectScores)) {
    repoProject.projectScores.forEach(score => {
      if (score.criterion && score.criterion.key) {
        criteria[score.criterion.key] = score.score;
      }
    });
  }
  
  // For the department name, we would ideally fetch it from the department repository
  // For now, use a generic name based on departmentId
  const departmentName = repoProject.departmentId ? `Department ${repoProject.departmentId}` : "Unknown";
  
  // Create team array - this would ideally come from another repository
  // For now, we'll use a placeholder
  const team: string[] = [];
  
  return {
    id: repoProject.id,
    organizationId: repoProject.organizationId,
    name: repoProject.name,
    description: repoProject.description || '',
    resources: repoProject.resources || 0,
    status: repoProject.status as 'initiation' | 'planning' | 'in-progress' | 'completed' | 'on-hold',
    criteria: criteria,
    startDate: repoProject.startDate instanceof Date 
      ? repoProject.startDate.toISOString().split('T')[0] 
      : String(repoProject.startDate).split('T')[0],
    endDate: repoProject.endDate instanceof Date 
      ? repoProject.endDate.toISOString().split('T')[0] 
      : String(repoProject.endDate).split('T')[0],
    department: departmentName,
    tags: Array.isArray(repoProject.tags) ? repoProject.tags : [],
    budget: repoProject.budget || undefined,
  };
}

/**
 * Batch convert repository projects to frontend projects
 */
export function adaptRepositoryProjects(repoProjects: RepoProject[]): DataProject[] {
  return repoProjects.map(project => adaptRepositoryProject(project));
}
