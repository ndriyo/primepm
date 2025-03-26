'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommittee, CommitteeProject, CommitteeScore } from '@/app/_contexts/CommitteeContext';
import { ScoringCard } from '@/app/committee/_components/ScoringCard';
import { ConfirmationDialog } from '@/app/_components/ui/ConfirmationDialog';
import Link from 'next/link';

interface ProjectScoringProps {
  project: CommitteeProject;
  scores: CommitteeScore[];
}

/**
 * ProjectScoring Component
 * 
 * This component displays the project details and allows committee members
 * to score the project against each criterion.
 */
export const ProjectScoring: React.FC<ProjectScoringProps> = ({ project, scores }) => {
  const router = useRouter();
  const { activeSession, loading, saveScore, submitAllScores } = useCommittee();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'info' | 'self-assessment' | 'scoring'>('info');
  
  // State for criteria
  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);
  
  // State for confirmation dialog
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  
  // Get criteria from project scores
  const criteria = project.projectScores?.map(score => score.criterion) || [];
  
  // Get self-assessment scores
  const selfScores = project.projectScores || [];
  
  // Get committee scores by criterion
  const getScoreForCriterion = (criterionId: string) => {
    return scores.find(score => score.criterionId === criterionId);
  };
  
  // Check if all criteria have been scored
  const allCriteriaScored = criteria.every(criterion => 
    scores.some(score => score.criterionId === criterion.id)
  );
  
  // Handle score change
  const handleScoreChange = async (criterionId: string, value: number, comment?: string) => {
    try {
      const existingScore = getScoreForCriterion(criterionId);
      
      if (existingScore) {
        // Update existing score
        await saveScore({
          id: existingScore.id,
          projectId: project.id,
          criterionId,
          score: value,
          comment: comment || existingScore.comment,
          status: 'DRAFT'
        });
      } else {
        // Create new score
        await saveScore({
          projectId: project.id,
          criterionId,
          score: value,
          comment,
          status: 'DRAFT'
        });
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };
  
  // Handle submit all scores
  const handleSubmitScores = async () => {
    try {
      await submitAllScores();
      setShowSubmitConfirmation(false);
      
      // Navigate back to dashboard
      if (activeSession) {
        router.push(`/committee?sessionId=${activeSession.id}`);
      } else {
        router.push('/committee');
      }
    } catch (error) {
      console.error('Error submitting scores:', error);
    }
  };
  
  // Handle next criterion
  const handleNextCriterion = () => {
    if (activeCriterionIndex < criteria.length - 1) {
      setActiveCriterionIndex(activeCriterionIndex + 1);
    }
  };
  
  // Handle previous criterion
  const handlePrevCriterion = () => {
    if (activeCriterionIndex > 0) {
      setActiveCriterionIndex(activeCriterionIndex - 1);
    }
  };
  
  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={activeSession ? `/committee?sessionId=${activeSession.id}` : '/committee'}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold mt-2">{project.name}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
            <span>Department: {project.department?.name || 'N/A'}</span>
            <span>•</span>
            <span>Budget: {formatCurrency(project.budget)}</span>
            <span>•</span>
            <span>Resources: {project.resources} person-days</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Project Information
          </button>
          <button
            onClick={() => setActiveTab('self-assessment')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'self-assessment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Self-Assessment
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scoring'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Committee Scoring
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Project Information Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              <div className="mt-2 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Project Name</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{project.name}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{project.description || 'N/A'}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{project.department?.name || 'N/A'}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{project.status}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900">Financial Information</h2>
              <div className="mt-2 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{formatCurrency(project.budget)}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Resources</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{project.resources} person-days</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900">Timeline</h2>
              <div className="mt-2 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{formatDate(project.startDate)}</dd>
                  </div>
                  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="text-sm text-gray-900 md:col-span-2">{formatDate(project.endDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
        
        {/* Self-Assessment Tab */}
        {activeTab === 'self-assessment' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">PM's Self-Assessment</h2>
            
            {selfScores.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                <p>No self-assessment scores available for this project.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {selfScores.map((score) => (
                  <div key={score.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">
                          {score.criterion.label} {score.criterion.weight ? `(${score.criterion.weight * 100}%)` : ''}
                        </h3>
                        {score.criterion.description && (
                          <p className="text-sm text-gray-500 mt-1">{score.criterion.description}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-bold">{score.score}/5</span>
                      </div>
                    </div>
                    
                    {/* Score visualization */}
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div
                          key={value}
                          className={`h-2 flex-1 rounded-full ${
                            value <= score.score ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                    
                    {/* Comment */}
                    {score.comment && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                        <p className="italic">"{score.comment}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Committee Scoring Tab */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            {criteria.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                <p>No criteria available for scoring this project.</p>
              </div>
            ) : (
              <>
                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${((activeCriterionIndex + 1) / criteria.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <div>Criterion {activeCriterionIndex + 1} of {criteria.length}</div>
                  <div>
                    {scores.length} of {criteria.length} criteria scored
                  </div>
                </div>
                
                {/* Criteria list */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Criteria</h3>
                    <ul className="space-y-2">
                      {criteria.map((criterion, index) => (
                        <li key={criterion.id}>
                          <button
                            onClick={() => setActiveCriterionIndex(index)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                              index === activeCriterionIndex
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'hover:bg-gray-100'
                            } ${
                              getScoreForCriterion(criterion.id)
                                ? 'border-l-4 border-green-500'
                                : 'border-l-4 border-transparent'
                            }`}
                          >
                            {criterion.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="md:col-span-3">
                    {criteria[activeCriterionIndex] && (
                      <ScoringCard
                        criterion={criteria[activeCriterionIndex]}
                        selfScore={selfScores.find(score => score.criterionId === criteria[activeCriterionIndex].id)}
                        committeeScore={getScoreForCriterion(criteria[activeCriterionIndex].id)}
                        onScoreChange={(value, comment) => 
                          handleScoreChange(criteria[activeCriterionIndex].id, value, comment)
                        }
                      />
                    )}
                    
                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={handlePrevCriterion}
                        disabled={activeCriterionIndex === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex gap-2">
                        <Link
                          href={activeSession ? `/committee?sessionId=${activeSession.id}` : '/committee'}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Save & Exit
                        </Link>
                        
                        <button
                          onClick={() => setShowSubmitConfirmation(true)}
                          disabled={!allCriteriaScored || loading.saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading.saving ? 'Submitting...' : 'Submit All Scores'}
                        </button>
                      </div>
                      
                      <button
                        onClick={handleNextCriterion}
                        disabled={activeCriterionIndex === criteria.length - 1}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Submit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSubmitConfirmation}
        message="Once submitted, scores cannot be changed. Are you sure you want to submit all your scores for this project?"
        onConfirm={handleSubmitScores}
        onCancel={() => setShowSubmitConfirmation(false)}
      />
    </div>
  );
};
