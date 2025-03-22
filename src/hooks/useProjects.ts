import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectCreateInput, ProjectUpdateInput } from '@/src/repositories/ProjectRepository';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/fetchInterceptor';

// Types for hook parameters and responses
interface ProjectFilters {
  organizationId?: string;
  departmentId?: string;
  status?: string;
}

interface ProjectScore {
  criterionId: string;
  versionId: string;
  score: number;
  comment?: string;
  userId: string;
}

// API Client functions that use auth context
function createProjectsApi(user: any) {
  return {
    async getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.status) params.append('status', filters.status);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetchWithAuth(`/api/projects${queryString}`, {}, user);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    },
    
    async getProject(id: string, includeScores = false, includeCommitteeScores = false): Promise<Project> {
      // Build query string for include options
      const params = new URLSearchParams();
      if (includeScores) params.append('includeScores', 'true');
      if (includeCommitteeScores) params.append('includeCommitteeScores', 'true');
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetchWithAuth(`/api/projects/${id}${queryString}`, {}, user);
      if (!response.ok) {
        throw new Error(`Failed to fetch project ${id}`);
      }
      return response.json();
    },
    
    async createProject(project: ProjectCreateInput): Promise<Project> {
      // Include updatedById and createdById from authenticated user
      const projectWithUserInfo = {
        ...project,
        createdById: user?.id,
        updatedById: user?.id,
        organizationId: user?.organizationId || project.organizationId
      };
      
      const response = await fetchWithAuth('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectWithUserInfo),
      }, user);
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      return response.json();
    },
    
    async updateProject(id: string, project: ProjectUpdateInput): Promise<Project> {
      // Include updatedById from authenticated user
      const projectWithUserInfo = {
        ...project,
        updatedById: user?.id
      };
      
      const response = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectWithUserInfo),
      }, user);
      
      if (!response.ok) {
        throw new Error(`Failed to update project ${id}`);
      }
      return response.json();
    },
    
    async deleteProject(id: string): Promise<void> {
      // userId is now provided via headers from fetchWithAuth
      const response = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'DELETE',
      }, user);
      
      if (!response.ok) {
        throw new Error(`Failed to delete project ${id}`);
      }
    },
    
    async getProjectScores(projectId: string): Promise<any[]> {
      const response = await fetchWithAuth(`/api/projects/${projectId}/scores`, {}, user);
      if (!response.ok) {
        throw new Error(`Failed to fetch scores for project ${projectId}`);
      }
      return response.json();
    },
    
    async updateProjectScore(projectId: string, scoreData: ProjectScore): Promise<any> {
      // Include the userId from the authenticated user if not already present
      const updatedScoreData = {
        ...scoreData,
        userId: scoreData.userId || user?.id
      };
      
      const response = await fetchWithAuth(`/api/projects/${projectId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedScoreData),
      }, user);
      
      if (!response.ok) {
        throw new Error(`Failed to update score for project ${projectId}`);
      }
      return response.json();
    },
  };
}

// Main hook
export function useProjects() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const ProjectsApi = createProjectsApi(user);
  
  // Query for fetching projects with optional filters
  const useProjectsQuery = (filters: ProjectFilters = {}) => {
    return useQuery({
      queryKey: ['projects', filters],
      queryFn: () => ProjectsApi.getProjects(filters),
    });
  };
  
  // Query for fetching a single project
  const useProjectQuery = (
    id: string,
    options: { includeScores?: boolean; includeCommitteeScores?: boolean } = {}
  ) => {
    return useQuery({
      queryKey: ['project', id, options],
      queryFn: () => ProjectsApi.getProject(
        id,
        options.includeScores,
        options.includeCommitteeScores
      ),
      enabled: !!id, // Only run if ID is provided
    });
  };
  
  // Query for project scores
  const useProjectScoresQuery = (projectId: string) => {
    return useQuery({
      queryKey: ['project-scores', projectId],
      queryFn: () => ProjectsApi.getProjectScores(projectId),
      enabled: !!projectId, // Only run if projectId is provided
    });
  };
  
  // Mutation for creating a new project
  const useCreateProject = () => {
    return useMutation({
      mutationFn: (project: ProjectCreateInput) => ProjectsApi.createProject(project),
      onSuccess: () => {
        // Invalidate projects queries to refetch
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  };
  
  // Mutation for updating a project
  const useUpdateProject = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: ProjectUpdateInput }) =>
        ProjectsApi.updateProject(id, data),
      onSuccess: (_, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      },
    });
  };
  
  // Mutation for deleting a project
  const useDeleteProject = () => {
    return useMutation({
      mutationFn: (id: string) => ProjectsApi.deleteProject(id),
      onSuccess: () => {
        // Invalidate projects queries
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  };
  
  // Mutation for updating a project score
  const useUpdateProjectScore = () => {
    return useMutation({
      mutationFn: ({ projectId, scoreData }: { projectId: string; scoreData: ProjectScore }) =>
        ProjectsApi.updateProjectScore(projectId, scoreData),
      onSuccess: (_, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['project-scores', variables.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.projectId, { includeScores: true }] });
      },
    });
  };
  
  // Return all queries and mutations
  return {
    useProjectsQuery,
    useProjectQuery,
    useProjectScoresQuery,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    useUpdateProjectScore,
  };
}
