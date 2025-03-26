'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Basic criterion interface
export interface Criterion {
  id: string;
  key: string;
  label: string;
  description: string;
  isInverse: boolean;
  isDefault: boolean;
  weight?: number;
  scale?: {
    min: number;
    max: number;
  };
  rubric?: {
    [score: number]: string;
  };
}

// Criteria version interface
export interface CriteriaVersion {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comparison value for AHP
export enum ComparisonValue {
  LESS_IMPORTANT = 1/3,  // A is less important than B
  EQUAL_IMPORTANCE = 1,  // A and B are equally important
  MORE_IMPORTANT = 3     // A is more important than B
}

// Pairwise comparison for AHP
export interface PairwiseComparison {
  criterionAId: string;
  criterionBId: string;
  value: ComparisonValue;
}

interface CriteriaContextType {
  // Legacy support for old implementation
  criteria: Criterion[];
  addCriterion: (criterion: Omit<Criterion, 'id' | 'isDefault'>) => void;
  updateCriterion: (id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => void;
  removeCriterion: (id: string) => boolean;
  getDefaultCriteria: () => Criterion[];
  resetToDefaultCriteria: () => void;
  
  // New version-based implementation
  versions: CriteriaVersion[];
  activeVersion: CriteriaVersion | null;
  criteriaByVersion: Record<string, Criterion[]>;
  
  // Version operations
  createVersion: (version: Omit<CriteriaVersion, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateVersion: (id: string, updates: Partial<Omit<CriteriaVersion, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteVersion: (id: string) => boolean;
  setActiveVersion: (id: string) => void;
  
  // Criteria operations for versions
  addCriterionToVersion: (versionId: string, criterion: Omit<Criterion, 'id' | 'isDefault'>) => string;
  updateCriterionInVersion: (versionId: string, id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => void;
  removeCriterionFromVersion: (versionId: string, id: string) => boolean;
  
  // AHP operations
  savePairwiseComparisons: (versionId: string, comparisons: PairwiseComparison[]) => void;
  calculateWeights: (versionId: string) => void;
  
  // Data fetching
  loading: boolean;
  error: string | null;
  refreshCriteria: () => Promise<void>;
}

// Sample criteria structure for type checking and documentation
// These are not used as defaults anymore - we only use data from the database
const sampleCriteria: Criterion[] = [
  { id: '', key: 'revenue', label: 'Revenue Impact', description: 'Potential revenue generation or savings', isInverse: false, isDefault: true },
  { id: '', key: 'policyImpact', label: 'Policy Impact', description: 'Impact on organizational policies and strategies', isInverse: false, isDefault: true },
  { id: '', key: 'budget', label: 'Budget', description: 'Required financial investment', isInverse: true, isDefault: true },
  { id: '', key: 'resources', label: 'Resources', description: 'Required human and other resources', isInverse: true, isDefault: true },
  { id: '', key: 'complexity', label: 'Complexity', description: 'Technical and implementation complexity', isInverse: true, isDefault: true },
];

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export const CriteriaProvider = ({ children }: { children: ReactNode }) => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [versions, setVersions] = useState<CriteriaVersion[]>([]);
  const [criteriaByVersion, setCriteriaByVersion] = useState<Record<string, Criterion[]>>({});

  // Helper functions
  const generateId = (prefix: string = 'c'): string => {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Use React Query for versions
  const { 
    data: versionsData,
    isLoading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions 
  } = useQuery({
    queryKey: ['criteria-versions', organization?.id],
    queryFn: async () => {
      if (!organization || !user) {
        return [];
      }
      
      // Include RLS headers for proper data filtering
      const headers: HeadersInit = {
        'x-organization-id': organization.id,
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      // Include organizationId as query parameter
      const response = await fetch(`/api/criteria/versions?organizationId=${organization.id}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch criteria versions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform dates
      return data.map((version: any) => ({
        ...version,
        createdAt: new Date(version.createdAt),
        updatedAt: new Date(version.updatedAt),
      }));
    },
    enabled: !!organization && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - versions change rarely
  });
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (versionsData && versionsData.length > 0) {
      setVersions(prevVersions => {
        // Only update if there's an actual change in the data
        if (prevVersions.length === versionsData.length && 
            JSON.stringify(prevVersions) === JSON.stringify(versionsData)) {
          return prevVersions; // No change needed
        }
        return versionsData;
      });
    }
  }, [versionsData]);
  
  // Get active version
  const activeVersion = versions.find(v => v.isActive) || null;
  
  // Use React Query for criteria of active version
  const { 
    data: criteriaData,
    isLoading: criteriaLoading,
    error: criteriaError,
    refetch: refetchCriteria 
  } = useQuery({
    queryKey: ['criteria', activeVersion?.id],
    queryFn: async () => {
      if (!organization || !user || !activeVersion) {
        return [];
      }
      
      const headers: HeadersInit = {
        'x-organization-id': organization.id,
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      const response = await fetch(`/api/criteria/versions/${activeVersion.id}/criteria`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch criteria for active version');
      }
      
      const data = await response.json();
      
      // Transform data if needed
      return data.map((criterion: any) => ({
        ...criterion,
        isDefault: criterion.isDefault || false,
        rubric: criterion.rubric || {}
      }));
    },
    enabled: !!organization && !!user && !!activeVersion,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (criteriaData && criteriaData.length > 0 && activeVersion) {
      setCriteria(criteriaData);
      setCriteriaByVersion(prev => {
        // Check if current data differs from what we already have
        const currentVersion = prev[activeVersion.id];
        if (currentVersion && 
            currentVersion.length === criteriaData.length && 
            JSON.stringify(currentVersion) === JSON.stringify(criteriaData)) {
          return prev; // No change needed
        }
        
        // Update with new data
        return {
          ...prev,
          [activeVersion.id]: criteriaData,
        };
      });
    }
  }, [criteriaData, activeVersion]);
  
  // Combined loading state
  const loading = versionsLoading || criteriaLoading;
  
  // Combined error
  const error = versionsError 
    ? (versionsError as Error).message 
    : criteriaError 
      ? (criteriaError as Error).message 
      : null;
  
  // Refresh all criteria data
  const refreshCriteria = async () => {
    await Promise.all([refetchVersions(), refetchCriteria()]);
  };

  // Legacy functions for backward compatibility
  const getDefaultCriteria = (): Criterion[] => {
    // Return a copy of the sample criteria with generated IDs
    return sampleCriteria.map(criterion => ({
      ...criterion,
      id: generateId(),
    }));
  };

  const addCriterion = (criterion: Omit<Criterion, 'id' | 'isDefault'>) => {
    const newCriterion: Criterion = {
      ...criterion,
      id: generateId(),
      isDefault: false,
    };
    setCriteria([...criteria, newCriterion]);
    
    // Add to active version if it exists
    if (activeVersion) {
      setCriteriaByVersion(prev => ({
        ...prev,
        [activeVersion.id]: [...(prev[activeVersion.id] || []), newCriterion],
      }));
    }
  };

  const updateCriterion = (id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => {
    const updatedCriteria = criteria.map(criterion => 
      criterion.id === id ? { ...criterion, ...updates } : criterion
    );
    setCriteria(updatedCriteria);
    
    // Update in active version if it exists
    if (activeVersion) {
      setCriteriaByVersion(prev => ({
        ...prev,
        [activeVersion.id]: updatedCriteria,
      }));
    }
  };

  const removeCriterion = (id: string): boolean => {
    const criterionToRemove = criteria.find(c => c.id === id);
    if (!criterionToRemove) {
      return false;
    }

    setCriteria(criteria.filter(criterion => criterion.id !== id));
    
    // Remove from active version if it exists
    if (activeVersion) {
      setCriteriaByVersion(prev => ({
        ...prev,
        [activeVersion.id]: (prev[activeVersion.id] || []).filter(c => c.id !== id),
      }));
    }
    
    return true;
  };

  const resetToDefaultCriteria = () => {
    const defaultCriteria = getDefaultCriteria();
    setCriteria(defaultCriteria);
    
    // Reset active version if it exists
    if (activeVersion) {
      setCriteriaByVersion(prev => ({
        ...prev,
        [activeVersion.id]: [...defaultCriteria],
      }));
    }
  };

  // Version operations
  const createVersion = (version: Omit<CriteriaVersion, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = new Date();
    const newVersion: CriteriaVersion = {
      ...version,
      id: generateId('v'),
      createdAt: now,
      updatedAt: now,
    };
    
    // If this is the first version or it's set as active, deactivate all others
    if (version.isActive || versions.length === 0) {
      setVersions(prevVersions => 
        prevVersions.map(v => ({ ...v, isActive: false })).concat({ ...newVersion, isActive: true })
      );
    } else {
      setVersions(prevVersions => [...prevVersions, newVersion]);
    }
    
    // Initialize with empty criteria list
    setCriteriaByVersion(prev => ({
      ...prev,
      [newVersion.id]: [],
    }));
    
    return newVersion.id;
  };

  const updateVersion = (id: string, updates: Partial<Omit<CriteriaVersion, 'id' | 'createdAt' | 'updatedAt'>>) => {
    // If setting as active, deactivate all others
    if (updates.isActive) {
      setVersions(prevVersions => 
        prevVersions.map(v => 
          v.id === id 
            ? { ...v, ...updates, isActive: true, updatedAt: new Date() } 
            : { ...v, isActive: false }
        )
      );
    } else {
      setVersions(prevVersions => 
        prevVersions.map(v => 
          v.id === id 
            ? { ...v, ...updates, updatedAt: new Date() } 
            : v
        )
      );
    }
  };

  const deleteVersion = (id: string): boolean => {
    const versionToDelete = versions.find(v => v.id === id);
    if (!versionToDelete) {
      return false;
    }
    
    // Don't allow deleting the only version
    if (versions.length <= 1) {
      return false;
    }
    
    // If deleting the active version, activate another one
    if (versionToDelete.isActive) {
      const remainingVersions = versions.filter(v => v.id !== id);
      const newActiveVersion = remainingVersions[0];
      
      setVersions(
        remainingVersions.map((v, index) => 
          index === 0 ? { ...v, isActive: true } : v
        )
      );
    } else {
      setVersions(versions.filter(v => v.id !== id));
    }
    
    // Remove criteria for this version
    setCriteriaByVersion(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    
    return true;
  };

  const setActiveVersion = (id: string) => {
    setVersions(prevVersions => 
      prevVersions.map(v => ({ ...v, isActive: v.id === id }))
    );
    
    // Trigger React Query refetch with new active version
    queryClient.invalidateQueries({ queryKey: ['criteria'] });
  };

  // Criteria operations for versions
  const addCriterionToVersion = (versionId: string, criterion: Omit<Criterion, 'id' | 'isDefault'>): string => {
    const newCriterion: Criterion = {
      ...criterion,
      id: generateId(),
      isDefault: false,
    };
    
    setCriteriaByVersion(prev => ({
      ...prev,
      [versionId]: [...(prev[versionId] || []), newCriterion],
    }));
    
    // If this is the active version, also update the main criteria array
    if (activeVersion && activeVersion.id === versionId) {
      setCriteria(prev => [...prev, newCriterion]);
    }
    
    return newCriterion.id;
  };

  const updateCriterionInVersion = (versionId: string, id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => {
    setCriteriaByVersion(prev => ({
      ...prev,
      [versionId]: (prev[versionId] || []).map(criterion => 
        criterion.id === id ? { ...criterion, ...updates } : criterion
      ),
    }));
    
    // If this is the active version, also update the main criteria array
    if (activeVersion && activeVersion.id === versionId) {
      setCriteria(prev => prev.map(criterion => 
        criterion.id === id ? { ...criterion, ...updates } : criterion
      ));
    }
  };

  const removeCriterionFromVersion = (versionId: string, id: string): boolean => {
    const versionCriteria = criteriaByVersion[versionId] || [];
    const criterionToRemove = versionCriteria.find(c => c.id === id);
    
    if (!criterionToRemove) {
      return false;
    }
    
    // Create a new array with all criteria except the one to remove
    const updatedCriteria = versionCriteria.filter(criterion => criterion.id !== id);
    
    // Create a new criteriaByVersion object with the updated criteria for this version
    setCriteriaByVersion(prev => {
      const newState = { ...prev };
      newState[versionId] = updatedCriteria;
      return newState;
    });
    
    // If this is the active version, also update the main criteria array
    if (activeVersion && activeVersion.id === versionId) {
      setCriteria(prev => prev.filter(criterion => criterion.id !== id));
    }
    
    return true;
  };

  // AHP functions
  const savePairwiseComparisons = (versionId: string, comparisons: PairwiseComparison[]) => {
    // Store the comparisons for later calculation
    // In a real app, you might want to store these separately
    // For now, we'll just calculate the weights immediately
    const versionCriteria = criteriaByVersion[versionId] || [];
    
    // Build comparison matrix
    const matrix = buildComparisonMatrix(versionCriteria, comparisons);
    
    // Calculate weights
    const weights = calculateAHPWeights(matrix);
    
    // Update criteria with calculated weights
    setCriteriaByVersion(prev => ({
      ...prev,
      [versionId]: versionCriteria.map((criterion, index) => ({
        ...criterion,
        weight: weights[index],
      })),
    }));
    
    // If this is the active version, also update the main criteria array
    if (activeVersion && activeVersion.id === versionId) {
      setCriteria(prev => prev.map((criterion, index) => ({
        ...criterion,
        weight: weights[index < weights.length ? index : 0],
      })));
    }
  };

  const calculateWeights = (versionId: string) => {
    // This would recalculate weights based on stored comparisons
    // For now, it's just a placeholder as we calculate immediately in savePairwiseComparisons
  };

  // Helper functions for AHP
  const buildComparisonMatrix = (
    criteria: Criterion[], 
    comparisons: PairwiseComparison[]
  ): number[][] => {
    const n = criteria.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(1)); // Initialize with 1s (equal importance)
    
    // Create a map for quick lookup
    const criteriaIndexMap = new Map<string, number>();
    criteria.forEach((criterion, index) => {
      criteriaIndexMap.set(criterion.id, index);
    });
    
    // Fill the matrix with comparison values
    comparisons.forEach(comparison => {
      const i = criteriaIndexMap.get(comparison.criterionAId);
      const j = criteriaIndexMap.get(comparison.criterionBId);
      
      if (i !== undefined && j !== undefined) {
        matrix[i][j] = comparison.value;
        matrix[j][i] = 1 / comparison.value; // Reciprocal value
      }
    });
    
    return matrix;
  };

  const calculateAHPWeights = (matrix: number[][]): number[] => {
    const n = matrix.length;
    
    // 1. Calculate column sums
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += matrix[i][j];
      }
    }
    
    // 2. Normalize the matrix
    const normalizedMatrix = matrix.map((row, i) => 
      row.map((val, j) => val / colSums[j])
    );
    
    // 3. Calculate row averages (weights)
    const weights = normalizedMatrix.map(row => 
      row.reduce((sum, val) => sum + val, 0) / n
    );
    
    // 4. Normalize weights to sum to 1
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / weightSum);
  };

  return (
    <CriteriaContext.Provider
      value={{
        // Legacy support
        criteria,
        addCriterion,
        updateCriterion,
        removeCriterion,
        getDefaultCriteria,
        resetToDefaultCriteria,
        
        // New version-based implementation
        versions,
        activeVersion,
        criteriaByVersion,
        
        // Version operations
        createVersion,
        updateVersion,
        deleteVersion,
        setActiveVersion,
        
        // Criteria operations for versions
        addCriterionToVersion,
        updateCriterionInVersion,
        removeCriterionFromVersion,
        
        // AHP operations
        savePairwiseComparisons,
        calculateWeights,
        
        // Data fetching state
        loading,
        error,
        refreshCriteria
      }}
    >
      {children}
    </CriteriaContext.Provider>
  );
};

export const useCriteria = (): CriteriaContextType => {
  const context = useContext(CriteriaContext);
  if (context === undefined) {
    throw new Error('useCriteria must be used within a CriteriaProvider');
  }
  return context;
};
