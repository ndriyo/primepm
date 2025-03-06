import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, projects, calculateOverallScore } from '../data/projects';
import { useCriteria } from './CriteriaContext';

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
}

// WeightSettings is now dynamic based on criteria

export interface FilterSettings {
  status: string[];
  department: string[];
  minScore: number;
  maxScore: number;
  searchTerm: string;
}


const defaultFilterSettings: FilterSettings = {
  status: [],
  department: [],
  minScore: 0,
  maxScore: 10,
  searchTerm: '',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { criteria } = useCriteria();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [weightSettings, setWeightSettings] = useState<Record<string, number>>({});
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

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

  const getProjectScore = (project: Project): number => {
    // Get inverse criteria keys
    const inverseCriteria = criteria
      .filter(criterion => criterion.isInverse)
      .map(criterion => criterion.key);

    return calculateOverallScore(project, weightSettings, inverseCriteria);
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
