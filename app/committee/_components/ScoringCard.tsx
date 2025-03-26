'use client';

import React, { useState, useEffect } from 'react';
import { CommitteeScore } from '@/app/_contexts/CommitteeContext';

interface Criterion {
  id: string;
  key: string;
  label: string;
  description?: string;
  weight?: number;
}

interface SelfScore {
  id: string;
  criterionId: string;
  score: number;
  comment?: string;
  criterion: Criterion;
}

interface ScoringCardProps {
  criterion: Criterion;
  selfScore?: SelfScore;
  committeeScore?: CommitteeScore;
  onScoreChange: (value: number, comment?: string) => void;
}

/**
 * ScoringCard Component
 * 
 * This component displays a card-based scoring interface for a criterion.
 * It shows the criterion details, the PM's self-score, and allows the
 * committee member to select a score and add a comment.
 */
export const ScoringCard: React.FC<ScoringCardProps> = ({
  criterion,
  selfScore,
  committeeScore,
  onScoreChange
}) => {
  // State for selected score and comment
  const [selectedScore, setSelectedScore] = useState<number | null>(
    committeeScore ? committeeScore.score : null
  );
  const [comment, setComment] = useState(committeeScore?.comment || '');
  
  // Update state when committeeScore changes
  useEffect(() => {
    if (committeeScore) {
      setSelectedScore(committeeScore.score);
      setComment(committeeScore.comment || '');
    }
  }, [committeeScore]);
  
  // Handle score selection
  const handleScoreSelect = (value: number) => {
    setSelectedScore(value);
    onScoreChange(value, comment);
  };
  
  // Handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };
  
  // Handle comment blur (save when user leaves the field)
  const handleCommentBlur = () => {
    if (selectedScore !== null) {
      onScoreChange(selectedScore, comment);
    }
  };
  
  // Get score card class
  const getScoreCardClass = (value: number) => {
    if (selectedScore === value) {
      return 'bg-blue-100 border-blue-500 text-blue-700';
    }
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };
  
  // Get score descriptions
  const getScoreDescription = (value: number) => {
    switch (value) {
      case 1:
        return 'Very Poor';
      case 2:
        return 'Poor';
      case 3:
        return 'Average';
      case 4:
        return 'Good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Criterion header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          {criterion.label} {criterion.weight ? `(${criterion.weight * 100}%)` : ''}
        </h2>
        {criterion.description && (
          <p className="mt-1 text-sm text-gray-500">{criterion.description}</p>
        )}
      </div>
      
      {/* Self-score reference */}
      {selfScore && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700">PM's Self-Score</h3>
          <div className="mt-2 flex items-center">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className={`h-2 flex-1 rounded-full ${
                    value <= selfScore.score ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {selfScore.score}/5
            </span>
          </div>
          {selfScore.comment && (
            <div className="mt-2 text-sm text-gray-600 italic">
              "{selfScore.comment}"
            </div>
          )}
        </div>
      )}
      
      {/* Score selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select a score:</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleScoreSelect(value)}
              className={`p-4 border-2 rounded-md shadow-sm transition-colors ${getScoreCardClass(
                value
              )}`}
            >
              <div className="text-2xl font-bold text-center">{value}</div>
              <div className="text-xs text-center mt-1">{getScoreDescription(value)}</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          Comment (optional)
        </label>
        <div className="mt-1">
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            onBlur={handleCommentBlur}
            placeholder="Add your justification or notes here..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          ></textarea>
        </div>
      </div>
    </div>
  );
};
