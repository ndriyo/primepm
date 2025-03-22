'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useCriteria } from '@/app/contexts/CriteriaContext';
import { useAuth } from '@/app/contexts/AuthContext';

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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [weightSettings, setWeightSettings] = useState<Record<string, number>>({});
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  // Helper function to transform projectScores to criteria format
  const transformScoresToCriteria = (projectScores: any[]): Record<string, number> => {
    const criteriaMap: Record<string, number> = {};
    
    console.log('transformScoresToCriteria - Raw projectScores:', projectScores);
    
    if (!projectScores || !Array.isArray(projectScores) || projectScores.length === 0) {
      console.log('transformScoresToCriteria - projectScores is empty or invalid');
      return criteriaMap;
    }
    
    // Extract criteria data from projectScores
    // This expects the format from Prisma with nested criterion objects
    projectScores.forEach(score => {
      if (score.criterion && score.criterion.key && typeof score.score === 'number') {
        criteriaMap[score.criterion.key] = score.score;
        console.log(`Found score with criterion.key: ${score.criterion.key} = ${score.score}`);
      }
    });
    
    console.log('Extracted criteria from scores:', criteriaMap);
    
    console.log('Final transformed criteriaMap:', criteriaMap);
    return criteriaMap;
  };

  // Function to fetch projects from API with role-based access control
  const fetchProjects = useCallback(async () => {
    // Only fetch if we have organization context
    if (!organization || !user) {
      setLoading(false);
      setProjects([]);
      setFilteredProjects([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
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
      
      // Use live data API
      const apiEndpoint = '/api/projects';
      
      console.log(`Fetching projects from database API with role ${user.role}`);
      const response = await fetch(apiEndpoint, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      console.log('Raw API data from fetchProjects:', data);
      console.log('First project structure (example):', data.length > 0 ? data[0] : 'No projects found');
      
      // Transform data if needed
      const transformedData = data.map((project: any) => {
        // Determine which source to use for criteria data
        let criteriaSource = null;
        
        if (project.projectScores && Array.isArray(project.projectScores) && project.projectScores.length > 0) {
          criteriaSource = 'projectScores';
        } else if (project.criteria && Object.keys(project.criteria).length > 0) {
          criteriaSource = 'criteria';
        } else if (project.scores && Array.isArray(project.scores) && project.scores.length > 0) {
          criteriaSource = 'scores';
        }
        
        console.log(`Project ${project.id} criteria source:`, criteriaSource);
        
        let transformedCriteria;
        if (criteriaSource === 'projectScores') {
          transformedCriteria = transformScoresToCriteria(project.projectScores);
        } else if (criteriaSource === 'scores') {
          transformedCriteria = transformScoresToCriteria(project.scores);
        } else if (criteriaSource === 'criteria') {
          transformedCriteria = project.criteria;
        } else {
          // Default case - look for various possible sources
          transformedCriteria = project.projectScores ? transformScoresToCriteria(project.projectScores) :
                              project.scores ? transformScoresToCriteria(project.scores) :
                              project.criteria ? project.criteria : {};
          
          // Last resort - try to find any other possible criteria-like fields
          if (Object.keys(transformedCriteria).length === 0) {
            Object.entries(project).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const potentialCriteria = Object.entries(value)
                  .filter(([k, v]) => typeof v === 'number')
                  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
                
                if (Object.keys(potentialCriteria).length > 0) {
                  console.log(`Found potential criteria in project.${key}:`, potentialCriteria);
                  transformedCriteria = potentialCriteria;
                }
              }
            });
          }
        }
        
        // No fallback test data - strict use of database data only
        const transformedProject = {
          ...project,
          // Transform any data that doesn't match expected structure
          startDate: project.startDate,
          endDate: project.endDate,
          criteria: transformedCriteria
        };
        
        // Debug individual project transformation
        console.log(`Project ${project.id} original criteria:`, project.criteria);
        console.log(`Project ${project.id} transformed criteria:`, transformedProject.criteria);
        
        return transformedProject;
      });
      
      console.log('Transformed project data:', transformedData);
      
      setProjects(transformedData);
      setFilteredProjects(transformedData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set empty arrays on error
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  }, [organization, user]);

  // Fetch projects when organization changes (RLS context changes)
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, organization?.id, user?.id]);
  
  // Initialize weight settings when criteria change
  useEffect(() => {
    const newWeightSettings: Record<string, number> = {};
    criteria.forEach(criterion => {
      // Keep existing weights if they exist, otherwise set to 1
      newWeightSettings[criterion.key] = weightSettings[criterion.key] || 1;
    });
    setWeightSettings(newWeightSettings);
  }, [criteria]);

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

  // Calculate overall score function - no longer using static data
  const calculateOverallScore = (
    project: Project, 
    weights: Record<string, number> = {}, 
    inverseCriteria: string[] = []
  ): number => {
    // Get criteria keys that exist in the project
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
      if (inverseCriteria.includes(key)) {
        value = 11 - value; // Invert scale: 1->10, 2->9, 3->8, etc.
      }
      
      weightedSum += value * weight;
    });
    
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  };
  
  const getProjectScore = (project: Project): number => {
    // Get inverse criteria keys
    const inverseCriteria = criteria
      .filter(criterion => criterion.isInverse)
      .map(criterion => criterion.key);

    return calculateOverallScore(project, weightSettings, inverseCriteria);
  };

  // Function to fetch a specific project with RLS
  const fetchProjectById = useCallback(async (projectId: string): Promise<Project | null> => {
    if (!organization || !user) return null;
    
    try {
      const headers: HeadersInit = {
        'x-organization-id': organization.id,
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      if (user.role === 'projectManager' && user.departmentId) {
        headers['x-department-id'] = user.departmentId;
      }
      
      // Use live data API with includeScores parameter
      const apiBase = '/api/projects';
      
      const response = await fetch(`${apiBase}/${projectId}?includeScores=true`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      
      const data = await response.json();
      console.log(`fetchProjectById - Raw project data:`, data);
      
      // Determine which source to use for criteria
      let criteriaData;
      if (data.projectScores && Array.isArray(data.projectScores) && data.projectScores.length > 0) {
        criteriaData = transformScoresToCriteria(data.projectScores);
      } else if (data.scores && Array.isArray(data.scores) && data.scores.length > 0) {
        criteriaData = transformScoresToCriteria(data.scores);
      } else if (data.criteria && Object.keys(data.criteria).length > 0) {
        criteriaData = data.criteria;
      } else {
        criteriaData = {};
      }
      
      console.log(`fetchProjectById - Transformed criteria:`, criteriaData);
      
      // No fallback test data - strict use of database data only
      console.log(`fetchProjectById - Project ${projectId} final criteria:`, criteriaData);
      
      // Transform data
      return {
        ...data,
        criteria: criteriaData
      };
    } catch (err) {
      console.error(`Error fetching project ${projectId}:`, err);
      return null;
    }
  }, [organization, user]);

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
        refreshProjects: fetchProjects,
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
