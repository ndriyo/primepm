'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from './AuthContext';

// Types
export interface CommitteeSession {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  portfolioId: string;
}

export interface CommitteeProject {
  id: string;
  name: string;
  description?: string;
  department?: {
    id: string;
    name: string;
  };
  budget?: number;
  resources?: number;
  status?: string;
  startDate: Date;
  endDate: Date;
  projectScores?: any[];
  scoringProgress: {
    totalCriteria: number;
    scoredCriteria: number;
    progress: number;
    status: string;
  };
}

export interface CommitteeScore {
  id?: string;
  projectId: string;
  criterionId: string;
  score: number;
  comment?: string;
  status?: string;
  sessionId?: string;
  criterion?: any;
}

export interface ProjectProgress {
  id: string;
  name: string;
  totalCriteria: number;
  completedCriteria: number;
  draftCriteria: number;
  progress: number;
  status: string;
}

export interface CommitteeProgress {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  notStartedProjects: number;
  totalScores: number;
  completedScores: number;
  draftScores: number;
  progress: number;
  projectProgress: ProjectProgress[];
}

interface CommitteeContextType {
  sessions: CommitteeSession[];
  activeSession: CommitteeSession | null;
  projects: CommitteeProject[] | null;
  selectedProject: CommitteeProject | null;
  scores: CommitteeScore[];
  progress: CommitteeProgress | null;
  loading: {
    sessions: boolean;
    projects: boolean;
    project: boolean;
    scores: boolean;
    progress: boolean;
    saving: boolean;
  };
  error: string | null;
  setActiveSession: (session: CommitteeSession) => void;
  fetchSessions: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  fetchScores: (projectId: string) => Promise<void>;
  fetchProgress: () => Promise<void>;
  saveScore: (score: CommitteeScore) => Promise<void>;
  submitAllScores: () => Promise<void>;
}

// Create context
const CommitteeContext = createContext<CommitteeContextType | undefined>(undefined);

// Provider component
export const CommitteeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchParams = useSearchParams();
  const { user, organization } = useAuth();
  
  // State
  const [sessions, setSessions] = useState<CommitteeSession[]>([]);
  const [activeSession, setActiveSession] = useState<CommitteeSession | null>(null);
  const [projects, setProjects] = useState<CommitteeProject[] | null>(null);
  const [selectedProject, setSelectedProject] = useState<CommitteeProject | null>(null);
  const [scores, setScores] = useState<CommitteeScore[]>([]);
  const [progress, setProgress] = useState<CommitteeProgress | null>(null);
  const [loading, setLoading] = useState({
    sessions: true,
    projects: false,
    project: false,
    scores: false,
    progress: false,
    saving: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, sessions: true }));
      setError(null);
      
      const response = await fetch(`/api/committee/sessions?organizationId=${organization.id}&userId=${user.id}&userRole=${user.role}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSessions(data);
      
      // Set active session from URL or first session
      const sessionId = searchParams.get('sessionId');
      if (sessionId && data.length > 0) {
        const session = data.find((s: CommitteeSession) => s.id === sessionId);
        if (session) {
          setActiveSession(session);
        } else {
          setActiveSession(data[0]);
        }
      } else if (data.length > 0) {
        setActiveSession(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  }, [searchParams, user, organization]);
  
  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      setError(null);
      
      const response = await fetch(`/api/committee/projects?sessionId=${activeSession.id}&organizationId=${organization.id}&userId=${user.id}&userRole=${user.role}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [activeSession, user, organization]);
  
  // Fetch progress
  const fetchProgress = useCallback(async () => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, progress: true }));
      setError(null);
      
      const response = await fetch(`/api/committee/progress?sessionId=${activeSession.id}&organizationId=${organization.id}&userId=${user.id}&userRole=${user.role}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProgress(data);
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, progress: false }));
    }
  }, [activeSession, user, organization]);
  
  // Fetch sessions on mount
  useEffect(() => {
    if (user && organization) {
      fetchSessions();
    }
  }, [fetchSessions, user, organization]);
  
  // Fetch projects and progress when active session changes
  useEffect(() => {
    if (activeSession && user && organization) {
      fetchProjects();
      fetchProgress();
    }
  }, [activeSession, fetchProjects, fetchProgress, user, organization]);
  
  // Fetch single project
  const fetchProject = useCallback(async (projectId: string) => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, project: true }));
      setError(null);
      
      const response = await fetch(`/api/committee/projects/${projectId}?sessionId=${activeSession.id}&organizationId=${organization.id}&userId=${user.id}&userRole=${user.role}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSelectedProject(data);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, project: false }));
    }
  }, [activeSession, user, organization]);
  
  // Fetch scores for a project
  const fetchScores = useCallback(async (projectId: string) => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, scores: true }));
      setError(null);
      
      const response = await fetch(`/api/committee/scores?projectId=${projectId}&sessionId=${activeSession.id}&organizationId=${organization.id}&userId=${user.id}&userRole=${user.role}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scores: ${response.statusText}`);
      }
      
      const data = await response.json();
      setScores(data);
    } catch (error: any) {
      console.error('Error fetching scores:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, scores: false }));
    }
  }, [activeSession, user, organization]);
  
  // Save score
  const saveScore = useCallback(async (score: CommitteeScore) => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      
      // Add session ID if not provided
      if (!score.sessionId) {
        score.sessionId = activeSession.id;
      }
      
      // Add auth context
      const scoreWithAuth = {
        ...score,
        organizationId: organization.id,
        userId: user.id,
        userRole: user.role
      };
      
      let response;
      
      if (score.id) {
        // Update existing score
        response = await fetch(`/api/committee/scores/${score.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scoreWithAuth)
        });
      } else {
        // Create new score
        response = await fetch('/api/committee/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scoreWithAuth)
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to save score: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update scores state
      setScores(prev => {
        const index = prev.findIndex(s => s.id === data.id);
        if (index >= 0) {
          return [...prev.slice(0, index), data, ...prev.slice(index + 1)];
        } else {
          return [...prev, data];
        }
      });
      
      // Refresh progress
      await fetchProgress();
    } catch (error: any) {
      console.error('Error saving score:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  }, [activeSession, fetchProgress, user, organization]);
  
  // Submit all scores
  const submitAllScores = useCallback(async () => {
    if (!activeSession || !user || !organization) return;
    
    try {
      setLoading(prev => ({ ...prev, saving: true }));
      setError(null);
      
      const response = await fetch('/api/committee/progress/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: activeSession.id,
          organizationId: organization.id,
          userId: user.id,
          userRole: user.role
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit scores: ${response.statusText}`);
      }
      
      // Refresh data
      await Promise.all([
        fetchProjects(),
        fetchProgress(),
        selectedProject ? fetchScores(selectedProject.id) : Promise.resolve()
      ]);
    } catch (error: any) {
      console.error('Error submitting scores:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  }, [activeSession, fetchProjects, fetchProgress, fetchScores, selectedProject, user, organization]);
  
  // Context value
  const value = {
    sessions,
    activeSession,
    projects,
    selectedProject,
    scores,
    progress,
    loading,
    error,
    setActiveSession,
    fetchSessions,
    fetchProjects,
    fetchProject,
    fetchScores,
    fetchProgress,
    saveScore,
    submitAllScores
  };
  
  return (
    <CommitteeContext.Provider value={value}>
      {children}
    </CommitteeContext.Provider>
  );
};

// Hook to use the context
export const useCommittee = () => {
  const context = useContext(CommitteeContext);
  
  if (context === undefined) {
    throw new Error('useCommittee must be used within a CommitteeProvider');
  }
  
  return context;
};
