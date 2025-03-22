import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Criterion, 
  CriteriaVersion, 
  CriterionCreateInput, 
  CriterionUpdateInput,
  CriteriaVersionCreateInput,
  CriteriaVersionUpdateInput
} from '@/src/repositories/CriteriaRepository';

// Types for hook parameters and responses
interface PairwiseComparison {
  criterionAId: string;
  criterionBId: string;
  value: number;
}

// Utility function to validate if a string is a valid UUID
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f][0-9a-f]{3}-[0-9a-f][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// API Client functions
const CriteriaApi = {
  async getVersions(organizationId: string): Promise<CriteriaVersion[]> {
    // Validate organizationId is a proper UUID to prevent database errors
    if (!organizationId || !isValidUUID(organizationId)) {
      console.error('Invalid organizationId format:', organizationId);
      return [];
    }
    
    const response = await fetch(`/api/criteria/versions?organizationId=${organizationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch criteria versions');
    }
    return response.json();
  },
  
  async getActiveVersion(organizationId: string): Promise<CriteriaVersion | null> {
    // Validate organizationId is a proper UUID to prevent database errors
    if (!organizationId || !isValidUUID(organizationId)) {
      console.error('Invalid organizationId format:', organizationId);
      return null;
    }
    
    const response = await fetch(`/api/criteria/versions?organizationId=${organizationId}&active=true`);
    if (!response.ok) {
      throw new Error('Failed to fetch active criteria version');
    }
    const versions = await response.json();
    return versions.length > 0 ? versions[0] : null;
  },
  
  async getVersion(id: string): Promise<CriteriaVersion> {
    const response = await fetch(`/api/criteria/versions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch criteria version ${id}`);
    }
    return response.json();
  },
  
  async createVersion(version: CriteriaVersionCreateInput): Promise<CriteriaVersion> {
    const response = await fetch('/api/criteria/versions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(version),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create criteria version');
    }
    return response.json();
  },
  
  async updateVersion(id: string, version: CriteriaVersionUpdateInput): Promise<CriteriaVersion> {
    const response = await fetch(`/api/criteria/versions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(version),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update criteria version ${id}`);
    }
    return response.json();
  },
  
  async deleteVersion(id: string, userId: string): Promise<void> {
    const response = await fetch(`/api/criteria/versions/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete criteria version ${id}`);
    }
  },
  
  async getCriteria(versionId: string): Promise<Criterion[]> {
    const response = await fetch(`/api/criteria/versions/${versionId}/criteria`);
    if (!response.ok) {
      throw new Error(`Failed to fetch criteria for version ${versionId}`);
    }
    return response.json();
  },
  
  async getCriterion(id: string): Promise<Criterion> {
    const response = await fetch(`/api/criteria/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch criterion ${id}`);
    }
    return response.json();
  },
  
  async createCriterion(versionId: string, criterion: CriterionCreateInput): Promise<Criterion> {
    const response = await fetch(`/api/criteria/versions/${versionId}/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criterion),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create criterion');
    }
    return response.json();
  },
  
  async updateCriterion(id: string, criterion: CriterionUpdateInput, versionId?: string): Promise<Criterion> {
    let endpoint = `/api/criteria/${id}`;
    let requestData: any = { ...criterion };
    
    // If versionId is provided, use the version-based criteria endpoint
    if (versionId) {
      endpoint = `/api/criteria/versions/${versionId}/criteria`;
      requestData.id = id; // Include the ID in the request data
    }
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update criterion ${id}`);
    }
    return response.json();
  },
  
  async deleteCriterion(id: string, userId: string): Promise<void> {
    const response = await fetch(`/api/criteria/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete criterion ${id}`);
    }
  },
  
  async savePairwiseComparisons(versionId: string, comparisons: PairwiseComparison[], userId: string): Promise<any> {
    const response = await fetch(`/api/criteria/versions/${versionId}/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comparisons,
        userId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save pairwise comparisons for version ${versionId}`);
    }
    return response.json();
  },
};

// Main hook
export function useCriteria() {
  const queryClient = useQueryClient();
  
  // Query for fetching criteria versions
  const useVersionsQuery = (organizationId: string) => {
    return useQuery({
      queryKey: ['criteria-versions', organizationId],
      queryFn: () => CriteriaApi.getVersions(organizationId),
      enabled: !!organizationId,
    });
  };
  
  // Query for fetching active version
  const useActiveVersionQuery = (organizationId: string) => {
    return useQuery({
      queryKey: ['active-criteria-version', organizationId],
      queryFn: () => CriteriaApi.getActiveVersion(organizationId),
      enabled: !!organizationId,
    });
  };
  
  // Query for fetching a single version
  const useVersionQuery = (id: string) => {
    return useQuery({
      queryKey: ['criteria-version', id],
      queryFn: () => CriteriaApi.getVersion(id),
      enabled: !!id,
    });
  };
  
  // Query for fetching criteria by version ID
  const useCriteriaQuery = (versionId: string) => {
    return useQuery({
      queryKey: ['criteria', versionId],
      queryFn: async () => {
        console.log(`[useCriteria] Fetching criteria for version: ${versionId}`);
        const result = await CriteriaApi.getCriteria(versionId);
        console.log(`[useCriteria] Received criteria data:`, result);
        return result;
      },
      enabled: !!versionId,
    });
  };
  
  // Query for fetching a single criterion
  const useCriterionQuery = (id: string) => {
    return useQuery({
      queryKey: ['criterion', id],
      queryFn: () => CriteriaApi.getCriterion(id),
      enabled: !!id,
    });
  };
  
  // Mutation for creating a new version
  const useCreateVersion = () => {
    return useMutation({
      mutationFn: (version: CriteriaVersionCreateInput) => CriteriaApi.createVersion(version),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['criteria-versions', data.organizationId] });
        
        // If the new version is active, invalidate the active version query
        if (data.isActive) {
          queryClient.invalidateQueries({ queryKey: ['active-criteria-version', data.organizationId] });
        }
      },
    });
  };
  
  // Mutation for updating a version
  const useUpdateVersion = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: CriteriaVersionUpdateInput }) =>
        CriteriaApi.updateVersion(id, data),
      onSuccess: (_, variables) => {
        // Get the version to find its organizationId
        queryClient.invalidateQueries({ queryKey: ['criteria-version', variables.id] });
        
        // Invalidate version list and potentially active version
        const version = queryClient.getQueryData<CriteriaVersion>(['criteria-version', variables.id]);
        if (version?.organizationId) {
          queryClient.invalidateQueries({ queryKey: ['criteria-versions', version.organizationId] });
          
          // If isActive is being changed, invalidate the active version query
          if (variables.data.isActive !== undefined) {
            queryClient.invalidateQueries({ queryKey: ['active-criteria-version', version.organizationId] });
          }
        }
      },
    });
  };
  
  // Mutation for deleting a version
  const useDeleteVersion = () => {
    return useMutation({
      mutationFn: ({ id, userId }: { id: string; userId: string }) => CriteriaApi.deleteVersion(id, userId),
      onSuccess: (_, variables) => {
        // Get the version to find its organizationId before it's deleted
        const version = queryClient.getQueryData<CriteriaVersion>(['criteria-version', variables.id]);
        
        // Invalidate relevant queries
        if (version?.organizationId) {
          queryClient.invalidateQueries({ queryKey: ['criteria-versions', version.organizationId] });
          
          // If this was the active version, invalidate the active version query
          if (version.isActive) {
            queryClient.invalidateQueries({ queryKey: ['active-criteria-version', version.organizationId] });
          }
        }
        
        // Remove the version from the cache
        queryClient.removeQueries({ queryKey: ['criteria-version', variables.id] });
      },
    });
  };
  
  // Mutation for creating a new criterion
  const useCreateCriterion = () => {
    return useMutation({
      mutationFn: ({ versionId, data }: { versionId: string; data: CriterionCreateInput }) => 
        CriteriaApi.createCriterion(versionId, data),
      onSuccess: (_, variables) => {
        // Invalidate criteria list and version query to reflect the new criterion
        queryClient.invalidateQueries({ queryKey: ['criteria', variables.versionId] });
        queryClient.invalidateQueries({ queryKey: ['criteria-version', variables.versionId] });
      },
    });
  };
  
  // Mutation for updating a criterion
  const useUpdateCriterion = () => {
    return useMutation({
      mutationFn: ({ id, data, versionId }: { id: string; data: CriterionUpdateInput; versionId?: string }) =>
        CriteriaApi.updateCriterion(id, data, versionId),
      onSuccess: (_, variables) => {
        // Get the criterion to find its versionId
        const criterion = queryClient.getQueryData<Criterion>(['criterion', variables.id]);
        const versionId = variables.versionId || criterion?.versionId;
        
        // Invalidate criterion and related queries
        queryClient.invalidateQueries({ queryKey: ['criterion', variables.id] });
        
        if (versionId) {
          queryClient.invalidateQueries({ queryKey: ['criteria', versionId] });
          queryClient.invalidateQueries({ queryKey: ['criteria-version', versionId] });
        }
      },
    });
  };
  
  // Mutation for deleting a criterion
  const useDeleteCriterion = () => {
    return useMutation({
      mutationFn: ({ id, userId }: { id: string; userId: string }) => CriteriaApi.deleteCriterion(id, userId),
      onSuccess: (_, variables) => {
        // Get the criterion to find its versionId before it's deleted
        const criterion = queryClient.getQueryData<Criterion>(['criterion', variables.id]);
        
        // Invalidate related queries
        if (criterion?.versionId) {
          queryClient.invalidateQueries({ queryKey: ['criteria', criterion.versionId] });
          queryClient.invalidateQueries({ queryKey: ['criteria-version', criterion.versionId] });
        }
        
        // Remove the criterion from the cache
        queryClient.removeQueries({ queryKey: ['criterion', variables.id] });
      },
    });
  };
  
  // Mutation for saving pairwise comparisons
  const useSavePairwiseComparisons = () => {
    return useMutation({
      mutationFn: ({ 
        versionId, 
        comparisons, 
        userId 
      }: { 
        versionId: string; 
        comparisons: PairwiseComparison[]; 
        userId: string 
      }) => CriteriaApi.savePairwiseComparisons(versionId, comparisons, userId),
      onSuccess: (_, variables) => {
        // Invalidate criteria list and version query to reflect updated weights
        queryClient.invalidateQueries({ queryKey: ['criteria', variables.versionId] });
        queryClient.invalidateQueries({ queryKey: ['criteria-version', variables.versionId] });
      },
    });
  };
  
  // Return all queries and mutations
  return {
    useVersionsQuery,
    useActiveVersionQuery,
    useVersionQuery,
    useCriteriaQuery,
    useCriterionQuery,
    useCreateVersion,
    useUpdateVersion,
    useDeleteVersion,
    useCreateCriterion,
    useUpdateCriterion,
    useDeleteCriterion,
    useSavePairwiseComparisons,
  };
}
