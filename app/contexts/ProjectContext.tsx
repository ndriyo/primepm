'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useCriteria } from '@/app/contexts/CriteriaContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Update the Project interface to match expected database schema
export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  organizationId: string;
  departmentId?: string;
  budget?: number;
  resources: number;
  tags: string[];
  criteria: Record<string, number>;
  score?: number; // Overall project score
  team?: string[];
  department?: string;
  status: string; // Added status field to match database schema
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdById?: string;
  updatedById?: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  weightSettings: Record<string, number>;
  updateWeightSettings: (newSettings: Record<string, number>) => void;
  filteredProjects: Project[];
  setFilteredProjects: (projects: Project[]) => void;
  filterSettings: FilterSettings;
  updateFilterSettings: (newSettings: Partial<FilterSettings>) => void;
  getProjectScore: (project: Project) => number;
  refreshProjects: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// WeightSettings is now dynamic based on criteria

export interface FilterSettings {
  department: string[];
  minScore: number;
  maxScore: number;
  searchTerm: string;
}

const defaultFilterSettings: FilterSettings = {
  department: [],
  minScore: 0,
  maxScore: 10,
  searchTerm: '',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { criteria } = useCriteria();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [weightSettings, setWeightSettings] = useState<Record<string, number>>({});
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  // Helper function to transform projectScores to criteria format
  const transformScoresToCriteria = (projectScores: any[]): Record<string, number> => {
    const criteriaMap: Record<string, number> = {};
    
    if (!projectScores || !Array.isArray(projectScores) || projectScores.length === 0) {
      return criteriaMap;
    }
    
    // Extract criteria data from projectScores
    projectScores.forEach(score => {
      if (score.criterion && score.criterion.key && typeof score.score === 'number') {
        criteriaMap[score.criterion.key] = score.score;
      }
    });
    
    return criteriaMap;
  };

  // Use React Query for fetching projects
  const { 
    data: projects = [], 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ['projects', organization?.id, user?.id],
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
      
      // For Project Managers, add department info for filtering
      if (user.role === 'projectManager' && user.departmentId) {
        headers['x-department-id'] = user.departmentId;
      }
      
      // Use dashboard API endpoint for real data with budget information
      const apiEndpoint = '/api/projects/dashboard';
      
      const response = await fetch(apiEndpoint, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      // Transform data if needed
      return data.map((project: any) => {
        // Determine which source to use for criteria data
        let criteriaSource = null;
        
        if (project.projectScores && Array.isArray(project.projectScores) && project.projectScores.length > 0) {
          criteriaSource = 'projectScores';
        } else if (project.criteria && Object.keys(project.criteria).length > 0) {
          criteriaSource = 'criteria';
        } else if (project.scores && Array.isArray(project.scores) && project.scores.length > 0) {
          criteriaSource = 'scores';
        }
        
        let transformedCriteria;
        if (criteriaSource === 'projectScores') {
          transformedCriteria = transformScoresToCriteria(project.projectScores);
        } else if (criteriaSource === 'scores') {
          transformedCriteria = transformScoresToCriteria(project.scores);
        } else if (criteriaSource === 'criteria') {
          transformedCriteria = project.criteria;
        } else {
          transformedCriteria = project.projectScores ? transformScoresToCriteria(project.projectScores) :
                               project.scores ? transformScoresToCriteria(project.scores) :
                               project.criteria ? project.criteria : {};
        }
        
        // Ensure budget is a number (or default to 0)
        const budget = typeof project.budget === 'number' ? project.budget : 0;
        
        // Ensure resources is a number (or default to 0)
        const resources = typeof project.resources === 'number' ? project.resources : 0;
        
        // No fallback test data - strict use of database data only
        return {
          ...project,
          startDate: project.startDate,
          endDate: project.endDate,
          criteria: transformedCriteria,
          budget,
          resources
        };
      });
    },
    enabled: !!organization && !!user,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Update filtered projects when projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      setFilteredProjects(projects);
    }
  }, [projects]);
  
  // Initialize weight settings when criteria change
  useEffect(() => {
    setWeightSettings(prevWeights => {
      const newWeightSettings: Record<string, number> = {};
      criteria.forEach(criterion => {
        newWeightSettings[criterion.key] = prevWeights[criterion.key] || 1;
      });

      // Only update if there are actual differences to avoid infinite loop
      const hasChanges = Object.keys(newWeightSettings).some(key => 
        newWeightSettings[key] !== prevWeights[key] || 
        !Object.hasOwn(prevWeights, key)
      );
      return hasChanges ? newWeightSettings : prevWeights;
    });
  }, [criteria]); // Only depend on criteria changes

  const updateWeightSettings = (newSettings: Record<string, number>) => {
    setWeightSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const updateFilterSettings = (newSettings: Partial<FilterSettings>) => {
    setFilterSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Calculate overall score function
  const calculateOverallScore = (
    project: Project, 
    weights: Record<string, number> = {}, 
    inverseCriteria: string[] = []
  ): number => {
    const criteriaKeys = Object.keys(project.criteria);
    const filteredWeights: Record<string, number> = {};
    
    criteriaKeys.forEach(key => {
      filteredWeights[key] = weights[key] || 1;
    });
    
    const totalWeight = Object.values(filteredWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) return 0;
    
    let weightedSum = 0;
    
    criteriaKeys.forEach(key => {
      let value = project.criteria[key];
      const weight = filteredWeights[key] || 0;
      
      if (inverseCriteria.includes(key)) {
        value = 11 - value;
      }
      
      weightedSum += value * weight;
    });
    
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  };
  
  const getProjectScore = (project: Project): number => {
    const inverseCriteria = criteria
      .filter(criterion => criterion.isInverse)
      .map(criterion => criterion.key);

    return calculateOverallScore(project, weightSettings, inverseCriteria);
  };

  // Convert React Query error to string for context
  const error = queryError ? (queryError as Error).message : null;

  // Function to refresh projects data
  const refreshProjects = async () => {
    await refetch();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject,
        weightSettings,
        updateWeightSettings,
        filteredProjects,
        setFilteredProjects,
        filterSettings,
        updateFilterSettings,
        getProjectScore,
        refreshProjects,
        loading,
        error
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const calculateOverallScore = (
  project: Project, 
  weights: Record<string, number> = {},
  inverseCriteria: string[] = []
) => {
  // Get all criteria keys that exist in the project
  const criteriaKeys = Object.keys(project.criteria);
  
  // Filter weights to only include criteria that exist in the project
  const filteredWeights: Record<string, number> = {};
  
  // Default weight of 1 for all criteria if not specified
  criteriaKeys.forEach(key => {
    filteredWeights[key] = weights[key] || 1;
  });
  
  const totalWeight = Object.values(filteredWeights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;
  
  let weightedSum = 0;
  
  // Calculate weighted sum, handling inverse criteria
  criteriaKeys.forEach(key => {
    let value = project.criteria[key];
    const weight = filteredWeights[key] || 0;
    
    // For inverse criteria, invert the scale (10 - value + 1)
    // This makes lower values score higher
    if (inverseCriteria.includes(key)) {
      value = 5 - value; // Invert scale: 1->10, 2->9, 3->8, etc.
    }
    
    weightedSum += value * weight;
  });
  
  return parseFloat((weightedSum / totalWeight).toFixed(2));
};
