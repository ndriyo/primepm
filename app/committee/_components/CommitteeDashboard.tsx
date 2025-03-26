'use client';

import React, { useState } from 'react';
import { useCommittee } from '@/app/_contexts/CommitteeContext';
import { BentoCard } from '@/app/_components/ui/BentoCard';
import { ProjectList } from '@/app/committee/_components/ProjectList';
import { ScoringProgress } from '@/app/committee/_components/ScoringProgress';
import { ConfirmationDialog } from '@/app/_components/ui/ConfirmationDialog';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonDashboard } from '@/app/_components/ui/skeleton/SkeletonDashboard';
import Link from 'next/link';

/**
 * Committee Dashboard Component
 * 
 * This component displays the main dashboard for committee members,
 * showing their progress, metrics, and a list of projects to review.
 */
export const CommitteeDashboard: React.FC = () => {
  const {
    activeSession,
    sessions,
    progress,
    loading,
    error,
    setActiveSession,
    submitAllScores
  } = useCommittee();
  
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  
  // Handle session change
  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  };
  
  // Handle submit all scores
  const handleSubmitScores = async () => {
    try {
      await submitAllScores();
      setShowSubmitConfirmation(false);
    } catch (error) {
      console.error('Error submitting scores:', error);
    }
  };
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!activeSession?.endDate) return 'N/A';
    
    const endDate = new Date(activeSession.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Render loading state
  if (loading.sessions || loading.progress) {
    return (
      <LoadingWrapper isLoading={true} skeleton={<SkeletonDashboard />}>
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
      </div>
    );
  }
  
  // Render empty state
  if (!activeSession) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No Active Review Sessions</h2>
        <p className="text-gray-600 mb-6">
          There are no committee review sessions available for you at this time.
        </p>
        {sessions.length === 0 && (
          <p className="text-gray-600">
            Please contact your PMO to be assigned to a committee review session.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Committee Review Dashboard</h1>
          <p className="text-gray-600">
            Current Portfolio: {activeSession.name}
          </p>
        </div>
        
        {sessions.length > 1 && (
          <div className="w-full md:w-auto">
            <select
              value={activeSession.id}
              onChange={handleSessionChange}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Progress Summary */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <BentoCard
            title="Total Projects"
            value={progress.totalProjects}
            colors={['#3b82f6', '#60a5fa']}
            delay={0.1}
          />
          
          <BentoCard
            title="Completed"
            value={progress.projectProgress.filter(p => p.status === 'COMPLETED').length}
            colors={['#10b981', '#34d399']}
            delay={0.2}
          />
          
          <BentoCard
            title="In Progress"
            value={progress.projectProgress.filter(p => p.status === 'IN_PROGRESS').length}
            colors={['#f59e0b', '#fbbf24']}
            delay={0.3}
          />
          
          <BentoCard
            title="Not Started"
            value={progress.projectProgress.filter(p => p.status === 'NOT_STARTED').length}
            colors={['#ef4444', '#f87171']}
            delay={0.4}
          />
          
          <BentoCard
            title="Days Remaining"
            value={getDaysRemaining()}
            colors={['#6366f1', '#818cf8']}
            delay={0.5}
          />
        </div>
      )}
      
      {/* Overall Progress */}
      {progress && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            <div className="mt-2 md:mt-0">
              <button
                onClick={() => setShowSubmitConfirmation(true)}
                disabled={progress.draftScores === 0 || loading.saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.saving ? 'Submitting...' : 'Submit All Scores'}
              </button>
            </div>
          </div>
          
          <ScoringProgress progress={progress} />
        </div>
      )}
      
      {/* Project List */}
      <ProjectList />
      
      {/* Submit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSubmitConfirmation}
        message="Once submitted, scores cannot be changed. Are you sure you want to submit all your draft scores?"
        onConfirm={handleSubmitScores}
        onCancel={() => setShowSubmitConfirmation(false)}
      />
    </div>
  );
};
