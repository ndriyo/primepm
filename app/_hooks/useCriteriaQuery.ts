import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/_contexts/AuthContext';
import { fetchWithAuth } from '@/app/_lib/fetchInterceptor';

export interface Criterion {
  id: string;
  key: string;
  label: string;
  description?: string;
  isInverse?: boolean;
  scale?: {
    min: string | number;
    max: string | number;
  };
  versionId: string;
}

export function useCriteriaQuery() {
  const { user } = useAuth();
  
  // Fetch criteria versions first
  const versionsQuery = useQuery({
    queryKey: ['criteria-versions'],
    queryFn: async () => {
      // Include organizationId as a query parameter, just like in CriteriaContext
      const response = await fetchWithAuth(
        `/api/criteria/versions?organizationId=${user?.organizationId || ''}`, 
        {}, 
        user
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch criteria versions');
      }
      
      return response.json();
    },
    enabled: !!user && !!user.organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - versions change rarely
  });
  
  // Get active version ID from the versions query
  const activeVersionId = versionsQuery.data?.find((v: any) => v.isActive)?.id;
  // Only use the active version ID, no default fallback
  const effectiveVersionId = activeVersionId;
  
  // Fetch criteria for the active version
  const criteriaQuery = useQuery({
    queryKey: ['criteria', effectiveVersionId],
    queryFn: async () => {
      if (!effectiveVersionId) {
        throw new Error('No active criteria version found');
      }
      
      // Include same headers as used in CriteriaContext 
      const response = await fetchWithAuth(
        `/api/criteria/versions/${effectiveVersionId}/criteria`, 
        {}, 
        user
      );
      
      if (!response.ok) {
        // Add more detailed error handling matching CriteriaContext
        const errorText = await response.text();
        console.error(`Failed to fetch criteria: ${errorText}`);
        throw new Error(`Failed to fetch criteria for version ${effectiveVersionId}: ${response.status}`);
      }
      
      const criteriaData = await response.json();
      
      // Transform criteria to match expected format, similar to CriteriaContext
      return criteriaData.map((criterion: any) => ({
        ...criterion,
        isDefault: criterion.isDefault || false,
        // Ensure scale property exists
        scale: criterion.scale || { min: 1, max: 5 }
      }));
    },
    enabled: !!user && !!activeVersionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2 // Add retry capability for better reliability
  });
  
  return {
    criteria: criteriaQuery.data || [],
    isLoading: versionsQuery.isLoading || criteriaQuery.isLoading,
    error: versionsQuery.error || criteriaQuery.error,
    activeVersionId
  };
}
