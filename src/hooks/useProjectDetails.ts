import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/fetchInterceptor';
import { Project } from '@/src/repositories/ProjectRepository';

// Enhanced project interface with all the related data
export interface ProjectWithDetails extends Project {
  department: {
    id: string;
    name: string;
    [key: string]: any;
  };
  criteria: Record<string, number>;
}

export function useProjectDetails(projectId: string | undefined) {
  const { user } = useAuth();
  
  // Get complete project details from our new optimized endpoint
  return useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async (): Promise<ProjectWithDetails> => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      // Use the new aggregated endpoint we created
      const response = await fetchWithAuth(`/api/projects/${projectId}/details`, {}, user);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project details for ${projectId}`);
      }
      
      return response.json();
    },
    enabled: !!projectId && !!user,
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Additional hook for prefetching a project's details
export function usePrefetchProjectDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return {
    prefetchProjectDetails: async (projectId: string) => {
      if (!projectId || !user) return;
      
      await queryClient.prefetchQuery({
        queryKey: ['project-details', projectId],
        queryFn: async () => {
          const response = await fetchWithAuth(`/api/projects/${projectId}/details`, {}, user);
          
          if (!response.ok) {
            throw new Error(`Failed to prefetch project details for ${projectId}`);
          }
          
          return response.json();
        },
        staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
      });
    }
  };
}
