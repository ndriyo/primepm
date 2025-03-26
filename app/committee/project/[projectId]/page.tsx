'use client';

import React, { Suspense, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CommitteeProvider, useCommittee } from '@/app/_contexts/CommitteeContext';
import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectScoring } from '@/app/committee/_components/ProjectScoring';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonProjectForm } from '@/app/_components/ui/skeleton/SkeletonProjectForm';
import Link from 'next/link';

/**
 * ProjectScoringWrapper Component
 * 
 * This component wraps the ProjectScoring component and handles
 * fetching the project data and scores.
 */
const ProjectScoringWrapper: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const sessionId = searchParams.get('sessionId');
  
  const {
    activeSession,
    sessions,
    selectedProject,
    scores,
    loading,
    error,
    setActiveSession,
    fetchProject,
    fetchScores
  } = useCommittee();
  
  // Set active session from URL parameter
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session && (!activeSession || activeSession.id !== sessionId)) {
        setActiveSession(session);
      }
    }
  }, [sessionId, sessions, activeSession, setActiveSession]);
  
  // Fetch project and scores when active session is set
  useEffect(() => {
    if (activeSession && projectId) {
      fetchProject(projectId);
      fetchScores(projectId);
    }
  }, [activeSession, projectId, fetchProject, fetchScores]);
  
  // Render loading state
  if (loading.project || loading.scores) {
    return (
      <LoadingWrapper isLoading={true} skeleton={<SkeletonProjectForm />}>
        <div />
      </LoadingWrapper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <div className="mt-4">
          <Link
            href="/committee"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!selectedProject) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-gray-600 mb-6">
          The project you are looking for could not be found.
        </p>
        <Link
          href="/committee"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return <ProjectScoring project={selectedProject} scores={scores} />;
};

/**
 * ProjectPage Component
 * 
 * This is the main entry point for the project scoring page.
 * It provides the CommitteeProvider context and renders the ProjectScoringWrapper.
 */
export default function ProjectPage() {
  return (
    <PageLayout>
      <Suspense fallback={<LoadingWrapper isLoading={true} skeleton={<SkeletonProjectForm />}><div /></LoadingWrapper>}>
        <CommitteeProvider>
          <ProjectScoringWrapper />
        </CommitteeProvider>
      </Suspense>
    </PageLayout>
  );
}
