import { createContext, useContext, useState, ReactNode } from 'react';
import { Project, projects, calculateOverallScore } from '../data/projects';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  weightSettings: WeightSettings;
  updateWeightSettings: (newSettings: Partial<WeightSettings>) => void;
  filteredProjects: Project[];
  setFilteredProjects: (projects: Project[]) => void;
  filterSettings: FilterSettings;
  updateFilterSettings: (newSettings: Partial<FilterSettings>) => void;
  getProjectScore: (project: Project) => number;
}

export interface WeightSettings {
  revenue: number;
  policyImpact: number;
  budget: number;
  resources: number;
  complexity: number;
}

export interface FilterSettings {
  status: string[];
  department: string[];
  minScore: number;
  maxScore: number;
  searchTerm: string;
}

const defaultWeightSettings: WeightSettings = {
  revenue: 1,
  policyImpact: 1,
  budget: 1,
  resources: 1,
  complexity: 1,
};

const defaultFilterSettings: FilterSettings = {
  status: [],
  department: [],
  minScore: 0,
  maxScore: 10,
  searchTerm: '',
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [weightSettings, setWeightSettings] = useState<WeightSettings>(defaultWeightSettings);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  const updateWeightSettings = (newSettings: Partial<WeightSettings>) => {
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
    return calculateOverallScore(project, weightSettings);
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
