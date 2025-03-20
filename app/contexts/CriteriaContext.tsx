'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
}

// Default criteria
const defaultCriteria: Criterion[] = [
  { id: 'c1', key: 'revenue', label: 'Revenue Impact', description: 'Potential revenue generation or savings', isInverse: false, isDefault: true },
  { id: 'c2', key: 'policyImpact', label: 'Policy Impact', description: 'Impact on organizational policies and strategies', isInverse: false, isDefault: true },
  { id: 'c3', key: 'budget', label: 'Budget', description: 'Required financial investment', isInverse: true, isDefault: true },
  { id: 'c4', key: 'resources', label: 'Resources', description: 'Required human and other resources', isInverse: true, isDefault: true },
  { id: 'c5', key: 'complexity', label: 'Complexity', description: 'Technical and implementation complexity', isInverse: true, isDefault: true },
];

// Default version
const defaultVersion: CriteriaVersion = {
  id: 'v1',
  name: 'Default Version',
  description: 'Default criteria version',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Local storage keys
const CRITERIA_STORAGE_KEY = 'prime-pm-criteria';
const VERSIONS_STORAGE_KEY = 'prime-pm-criteria-versions';
const CRITERIA_BY_VERSION_STORAGE_KEY = 'prime-pm-criteria-by-version';

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export const CriteriaProvider = ({ children }: { children: ReactNode }) => {
  // Legacy state for backward compatibility
  const [criteria, setCriteria] = useState<Criterion[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCriteria = localStorage.getItem(CRITERIA_STORAGE_KEY);
      return savedCriteria ? JSON.parse(savedCriteria) : defaultCriteria;
    }
    return defaultCriteria;
  });

  // New version-based state
  const [versions, setVersions] = useState<CriteriaVersion[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVersions = localStorage.getItem(VERSIONS_STORAGE_KEY);
      return savedVersions ? JSON.parse(savedVersions) : [defaultVersion];
    }
    return [defaultVersion];
  });

  const [criteriaByVersion, setCriteriaByVersion] = useState<Record<string, Criterion[]>>(() => {
    if (typeof window !== 'undefined') {
      const savedCriteriaByVersion = localStorage.getItem(CRITERIA_BY_VERSION_STORAGE_KEY);
      if (savedCriteriaByVersion) {
        return JSON.parse(savedCriteriaByVersion);
      }
    }
    return { [defaultVersion.id]: [...defaultCriteria] };
  });

  // Get active version
  const activeVersion = versions.find(v => v.isActive) || null;

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(criteria));
      localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions));
      localStorage.setItem(CRITERIA_BY_VERSION_STORAGE_KEY, JSON.stringify(criteriaByVersion));
    }
  }, [criteria, versions, criteriaByVersion]);

  // Helper functions
  const generateId = (prefix: string = 'c'): string => {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Legacy functions for backward compatibility
  const getDefaultCriteria = (): Criterion[] => {
    return defaultCriteria;
  };

  const addCriterion = (criterion: Omit<Criterion, 'id' | 'isDefault'>) => {
    const newCriterion: Criterion = {
      ...criterion,
      id: generateId(),
      isDefault: false,
    };
    setCriteria([...criteria, newCriterion]);
  };

  const updateCriterion = (id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => {
    setCriteria(
      criteria.map(criterion => 
        criterion.id === id ? { ...criterion, ...updates } : criterion
      )
    );
  };

  const removeCriterion = (id: string): boolean => {
    const criterionToRemove = criteria.find(c => c.id === id);
    if (!criterionToRemove) {
      return false;
    }

    setCriteria(criteria.filter(criterion => criterion.id !== id));
    return true;
  };

  const resetToDefaultCriteria = () => {
    setCriteria(defaultCriteria);
  };

  // New version-based functions
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
  };

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
    
    return newCriterion.id;
  };

  const updateCriterionInVersion = (versionId: string, id: string, updates: Partial<Omit<Criterion, 'id' | 'isDefault'>>) => {
    setCriteriaByVersion(prev => ({
      ...prev,
      [versionId]: (prev[versionId] || []).map(criterion => 
        criterion.id === id ? { ...criterion, ...updates } : criterion
      ),
    }));
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
