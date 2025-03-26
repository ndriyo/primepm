'use client';

import React from 'react';
import { CommitteeProgress } from '@/app/_contexts/CommitteeContext';

interface ScoringProgressProps {
  progress: CommitteeProgress;
}

/**
 * ScoringProgress Component
 * 
 * Displays the scoring progress for a committee member,
 * including overall progress and progress by project.
 */
export const ScoringProgress: React.FC<ScoringProgressProps> = ({ progress }) => {
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Get progress bar color
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_STARTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            Overall Progress
          </div>
          <div className="text-sm font-medium text-gray-700">
            {formatPercentage(progress.progress)}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${getProgressBarColor(progress.progress)}`}
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <div>
            {progress.completedScores} of {progress.totalScores} criteria scored
          </div>
          {progress.draftScores > 0 && (
            <div className="text-yellow-600">
              {progress.draftScores} draft{progress.draftScores > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      
      {/* Project Progress */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Progress by Project</h3>
        
        <div className="space-y-4">
          {progress.projectProgress.map((project) => (
            <div key={project.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {project.name}
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressBarColor(project.progress)}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <div>
                  {project.completedCriteria} of {project.totalCriteria} criteria scored
                </div>
                {project.draftCriteria > 0 && (
                  <div className="text-yellow-600">
                    {project.draftCriteria} draft{project.draftCriteria > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
