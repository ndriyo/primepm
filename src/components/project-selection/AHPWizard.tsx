'use client';

import { useState, useMemo } from 'react';
import { useCriteria, Criterion, ComparisonValue, PairwiseComparison } from '@/app/contexts/CriteriaContext';

interface AHPWizardProps {
  versionId: string;
  onComplete: () => void;
}

export const AHPWizard = ({ versionId, onComplete }: AHPWizardProps) => {
  const { criteriaByVersion, savePairwiseComparisons } = useCriteria();
  const criteria = criteriaByVersion[versionId] || [];
  
  // Generate all unique pairs of criteria
  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        result.push([criteria[i], criteria[j]]);
      }
    }
    return result;
  }, [criteria]);

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [comparisons, setComparisons] = useState<PairwiseComparison[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleComparisonSelect = (value: ComparisonValue) => {
    const currentPair = pairs[currentPairIndex];
    
    // Update comparisons
    setComparisons(prev => {
      const newComparisons = [...prev];
      const existingIndex = newComparisons.findIndex(
        c => c.criterionAId === currentPair[0].id && c.criterionBId === currentPair[1].id
      );
      
      const comparison: PairwiseComparison = {
        criterionAId: currentPair[0].id,
        criterionBId: currentPair[1].id,
        value,
      };
      
      if (existingIndex >= 0) {
        newComparisons[existingIndex] = comparison;
      } else {
        newComparisons.push(comparison);
      }
      
      return newComparisons;
    });
    
    // Move to next pair or show results
    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex(currentPairIndex - 1);
      setShowResults(false);
    }
  };

  const handleSaveWeights = () => {
    savePairwiseComparisons(versionId, comparisons);
    onComplete();
  };

  const getCurrentComparisonValue = (): ComparisonValue | null => {
    if (currentPairIndex >= pairs.length) return null;
    
    const currentPair = pairs[currentPairIndex];
    const existingComparison = comparisons.find(
      c => c.criterionAId === currentPair[0].id && c.criterionBId === currentPair[1].id
    );
    
    return existingComparison?.value || null;
  };

  const getProgressPercentage = () => {
    return Math.round((currentPairIndex / pairs.length) * 100);
  };

  // If there are no criteria or only one criterion, show a message
  if (criteria.length < 2) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">
          You need at least 2 criteria to run the AHP wizard. Please add more criteria.
        </p>
      </div>
    );
  }

  // If all comparisons are done, show results
  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-lg font-medium text-green-800 mb-2">All comparisons complete!</h4>
          <p className="text-green-700">
            You've completed all pairwise comparisons. Click "Calculate Weights" to apply the AHP algorithm and determine the final weights.
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className="btn btn-outline btn-sm"
          >
            Back to Comparisons
          </button>
          <button
            onClick={handleSaveWeights}
            className="btn btn-primary btn-sm"
          >
            Calculate Weights
          </button>
        </div>
      </div>
    );
  }

  // Show the current pair comparison
  const currentPair = pairs[currentPairIndex];
  const criterionA = currentPair[0];
  const criterionB = currentPair[1];
  const currentValue = getCurrentComparisonValue();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium">
          Comparison {currentPairIndex + 1} of {pairs.length}
        </h4>
        <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm w-5/12">
            <h5 className="font-medium text-lg mb-2">{criterionA.label}</h5>
            <p className="text-sm text-gray-600">{criterionA.description}</p>
          </div>
          <div className="text-xl font-bold">vs</div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm w-5/12">
            <h5 className="font-medium text-lg mb-2">{criterionB.label}</h5>
            <p className="text-sm text-gray-600">{criterionB.description}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-700 mb-4">
            Compare the relative importance of these two criteria:
          </p>
          
          <label className="flex items-center p-3 border rounded-md hover:bg-gray-100 cursor-pointer">
            <input
              type="radio"
              name={`comparison-${currentPairIndex}`}
              checked={currentValue === ComparisonValue.MORE_IMPORTANT}
              onChange={() => handleComparisonSelect(ComparisonValue.MORE_IMPORTANT)}
              className="mr-3"
            />
            <span><strong>{criterionA.label}</strong> is more important than <strong>{criterionB.label}</strong></span>
          </label>
          
          <label className="flex items-center p-3 border rounded-md hover:bg-gray-100 cursor-pointer">
            <input
              type="radio"
              name={`comparison-${currentPairIndex}`}
              checked={currentValue === ComparisonValue.EQUAL_IMPORTANCE}
              onChange={() => handleComparisonSelect(ComparisonValue.EQUAL_IMPORTANCE)}
              className="mr-3"
            />
            <span>Both are equally important</span>
          </label>
          
          <label className="flex items-center p-3 border rounded-md hover:bg-gray-100 cursor-pointer">
            <input
              type="radio"
              name={`comparison-${currentPairIndex}`}
              checked={currentValue === ComparisonValue.LESS_IMPORTANT}
              onChange={() => handleComparisonSelect(ComparisonValue.LESS_IMPORTANT)}
              className="mr-3"
            />
            <span><strong>{criterionA.label}</strong> is less important than <strong>{criterionB.label}</strong></span>
          </label>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentPairIndex === 0}
          className={`btn btn-outline btn-sm ${currentPairIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Previous
        </button>
        {currentValue !== null && (
          <button
            onClick={() => {
              if (currentPairIndex < pairs.length - 1) {
                setCurrentPairIndex(currentPairIndex + 1);
              } else {
                setShowResults(true);
              }
            }}
            className="btn btn-primary btn-sm"
          >
            {currentPairIndex < pairs.length - 1 ? 'Next' : 'Review Results'}
          </button>
        )}
      </div>
    </div>
  );
};
