'use client';

import { useState } from 'react';
import { Criterion } from '@/app/contexts/CriteriaContext';

interface SelfAssessmentStepProps {
  criteria: Criterion[];
  criteriaScores: Record<string, number>;
  errors: Record<string, string>;
  onChange: (criterionKey: string, value: number) => void;
}

// Option Card component for score selection
const OptionCard = ({ 
  score,
  description,
  isSelected,
  onClick
}: { 
  score: number;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <div 
      className={`border p-3 rounded-lg cursor-pointer transition ${
        isSelected 
          ? 'bg-blue-50 border-blue-500 shadow-sm' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-base">Score: {score}</span>
      </div>
      <p className="text-sm text-gray-600">
        {description}
      </p>
    </div>
  );
};

export default function SelfAssessmentStep({
  criteria,
  criteriaScores,
  errors,
  onChange
}: SelfAssessmentStepProps) {
  // Track which criterion descriptions are expanded
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  // Toggle description visibility
  const toggleDescription = (criterionId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [criterionId]: !prev[criterionId]
    }));
  };

  // Get error for a specific criterion
  const getCriterionError = (key: string) => {
    return errors[`criteria_${key}`];
  };

  // Get default description for a score point if rubric doesn't exist
  const getDefaultDescription = (criterion: Criterion, score: number): string => {
    // Default scale descriptions
    if (criterion.isInverse) {
      // For inverse criteria (lower is better)
      if (score === 1) return 'Very Low';
      if (score === 2) return 'Low';
      if (score <= 4) return 'Below Average';
      if (score <= 6) return 'Average';
      if (score <= 8) return 'Above Average';
      if (score === 9) return 'High';
      return 'Very High';
    } else {
      // For regular criteria (higher is better)
      if (score === 10) return 'Excellent';
      if (score === 9) return 'Very Good';
      if (score >= 8) return 'Good';
      if (score >= 6) return 'Above Average';
      if (score >= 4) return 'Average';
      if (score >= 2) return 'Below Average';
      return 'Poor';
    }
  };

  // Generate option cards for a criterion
  const generateOptionCards = (criterion: Criterion) => {
    // Determine scale min and max
    const min = criterion.scale?.min || 1;
    const max = criterion.scale?.max || 10;
    const range = max - min + 1;
    
    // Determine appropriate grid columns based on range
    const gridClass = 
      range <= 3 ? 'grid-cols-1 md:grid-cols-3' :
      range <= 5 ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5' :
      'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6';
    
    return (
      <div className={`grid ${gridClass} gap-3 mt-4`}>
        {Array.from({ length: range }, (_, i) => {
          const score = min + i;
          const description = criterion.rubric?.[score] || getDefaultDescription(criterion, score);
          
          return (
            <OptionCard
              key={score}
              score={score}
              description={description}
              isSelected={criteriaScores[criterion.key] === score}
              onClick={() => onChange(criterion.key, score)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Self Assessment</h2>
      <p className="text-gray-600 mb-6">
        Rate your project against each criterion. This assessment will be reviewed by the project committee.
      </p>
      
      {criteria.length === 0 ? (
        <div className="p-4 border border-yellow-400 bg-yellow-50 rounded-md">
          <p className="text-yellow-700">No criteria defined. Please contact your PMO to set up evaluation criteria.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {criteria.map((criterion) => (
            <div key={criterion.id} className="p-5 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {criterion.label}
                    {criterion.isInverse && (
                      <span className="ml-2 text-sm text-gray-500 font-normal">(Lower is better)</span>
                    )}
                  </h3>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    onClick={() => toggleDescription(criterion.id)}
                  >
                    {expandedDescriptions[criterion.id] ? 'Hide' : 'Show'} description
                  </button>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {criteriaScores[criterion.key] ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Score: {criteriaScores[criterion.key]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not rated
                    </span>
                  )}
                </div>
              </div>
              
              {expandedDescriptions[criterion.id] && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  <p>{criterion.description}</p>
                </div>
              )}
              
              {/* Option Cards */}
              {generateOptionCards(criterion)}
              
              {getCriterionError(criterion.key) && (
                <p className="mt-2 text-sm text-red-600">{getCriterionError(criterion.key)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
