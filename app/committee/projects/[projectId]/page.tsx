'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCommittee } from '@/app/_contexts/CommitteeContext';
import { PageLayout } from '@/app/_components/layout/PageLayout';

/**
 * Project Scoring Page
 * This page allows committee members to score a specific project
 */
export default function ProjectScoringPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const { 
    activeSession, 
    selectedProject, 
    scores, 
    loading, 
    error, 
    fetchProject, 
    fetchScores, 
    saveScore 
  } = useCommittee();

  // Local state for current criterion index
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [localScores, setLocalScores] = useState<Record<string, { score: number; comment: string }>>({});

  // Fetch project and scores when component mounts
  useEffect(() => {
    if (projectId && activeSession) {
      fetchProject(projectId);
      fetchScores(projectId);
    }
  }, [projectId, activeSession, fetchProject, fetchScores]);

  // Initialize local scores from fetched scores
  useEffect(() => {
    if (scores.length > 0) {
      const initialScores: Record<string, { score: number; comment: string }> = {};
      scores.forEach(score => {
        initialScores[score.criterionId] = {
          score: score.score,
          comment: score.comment || ''
        };
      });
      setLocalScores(initialScores);
    }
  }, [scores]);

  // Get criteria from project
  const criteria = selectedProject?.projectScores?.map(score => score.criterion) || [];

  // Get current criterion
  const currentCriterion = criteria[currentCriterionIndex];

  // Handle score selection
  const handleScoreSelect = (criterionId: string, score: number) => {
    setLocalScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score
      }
    }));
  };

  // Handle comment change
  const handleCommentChange = (criterionId: string, comment: string) => {
    setLocalScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        comment
      }
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!currentCriterion || !activeSession) return;
    
    setSaving(true);
    try {
      const criterionId = currentCriterion.id;
      const localScore = localScores[criterionId];
      
      if (localScore) {
        await saveScore({
          projectId,
          criterionId,
          score: localScore.score,
          comment: localScore.comment,
          sessionId: activeSession.id
        });
      }
      
      // Move to next criterion if available
      if (currentCriterionIndex < criteria.length - 1) {
        setCurrentCriterionIndex(currentCriterionIndex + 1);
      }
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentCriterionIndex > 0) {
      setCurrentCriterionIndex(currentCriterionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentCriterionIndex < criteria.length - 1) {
      setCurrentCriterionIndex(currentCriterionIndex + 1);
    }
  };

  // Handle back to list
  const handleBackToList = () => {
    router.push('/committee');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate progress percentage
  const progressPercentage = criteria.length > 0 
    ? ((currentCriterionIndex + 1) / criteria.length) * 100 
    : 0;

  return (
    <PageLayout>
      <div className="flex flex-col space-y-6 p-6">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Projects
        </button>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading state */}
        {(loading.project || loading.scores) ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          selectedProject && (
            <>
              {/* Project header */}
              <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 font-medium">{selectedProject.department?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <span className="ml-2 font-medium">
                      {selectedProject.budget ? formatCurrency(selectedProject.budget) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Resources:</span>
                    <span className="ml-2 font-medium">{selectedProject.resources || 'N/A'}</span>
                  </div>
                </div>
                {selectedProject.description && (
                  <div className="mt-4">
                    <span className="text-gray-500">Description:</span>
                    <p className="mt-1">{selectedProject.description}</p>
                  </div>
                )}
              </div>

              {/* Scoring interface */}
              {criteria.length > 0 && currentCriterion && (
                <div className="bg-white rounded-lg shadow">
                  {/* Progress bar */}
                  <div className="p-4 border-b">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Criterion {currentCriterionIndex + 1} of {criteria.length}</span>
                      <span>{Math.round(progressPercentage)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Criterion content */}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">
                      {currentCriterion.label} 
                      {currentCriterion.weight && (
                        <span className="text-gray-500 text-sm ml-2">
                          ({Math.round(currentCriterion.weight * 100)}%)
                        </span>
                      )}
                    </h2>
                    
                    {currentCriterion.description && (
                      <p className="text-gray-600 mb-6">{currentCriterion.description}</p>
                    )}

                    {/* Self-assessment score */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-700">Project Manager's Self-Assessment</h3>
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <div 
                              key={score} 
                              className={`w-8 h-8 flex items-center justify-center rounded-full mr-1
                                ${selectedProject.projectScores?.find(s => s.criterionId === currentCriterion.id)?.score === score 
                                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-500' 
                                  : 'bg-gray-100 text-gray-500'}`}
                            >
                              {score}
                            </div>
                          ))}
                        </div>
                        <span className="ml-4 text-gray-600">
                          {selectedProject.projectScores?.find(s => s.criterionId === currentCriterion.id)?.comment || 'No comment provided'}
                        </span>
                      </div>
                    </div>

                    {/* Committee scoring */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-700 mb-4">Your Score</h3>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            className={`p-4 rounded-lg border-2 transition-all
                              ${localScores[currentCriterion.id]?.score === score 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                            onClick={() => handleScoreSelect(currentCriterion.id, score)}
                          >
                            <div className="text-2xl font-bold text-center mb-2">{score}</div>
                            <div className="text-sm text-gray-600 text-center">
                              {score === 1 && 'Very Poor'}
                              {score === 2 && 'Poor'}
                              {score === 3 && 'Average'}
                              {score === 4 && 'Good'}
                              {score === 5 && 'Excellent'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                      <label htmlFor="comment" className="block text-md font-medium text-gray-700 mb-2">
                        Your Comments (Optional)
                      </label>
                      <textarea
                        id="comment"
                        rows={4}
                        className="w-full p-2 border rounded-md"
                        placeholder="Add your comments here..."
                        value={localScores[currentCriterion.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(currentCriterion.id, e.target.value)}
                      ></textarea>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between">
                      <button
                        onClick={handlePrevious}
                        disabled={currentCriterionIndex === 0}
                        className={`px-4 py-2 rounded-md ${
                          currentCriterionIndex === 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={handleSave}
                          disabled={saving || !localScores[currentCriterion.id]?.score}
                          className={`px-4 py-2 rounded-md ${
                            saving || !localScores[currentCriterion.id]?.score
                              ? 'bg-blue-300 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {saving ? 'Saving...' : 'Save & Continue'}
                        </button>
                        
                        {currentCriterionIndex < criteria.length - 1 && (
                          <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </PageLayout>
  );
}
