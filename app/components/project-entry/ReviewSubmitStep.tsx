'use client';

import { Project } from '@/src/data/projects';
import { Criterion } from '@/app/contexts/CriteriaContext';
import { calculateOverallScore } from '@/src/data/projects';

interface ReviewSubmitStepProps {
  formData: Partial<Project>;
  durationMonths: number;
  resourceMandays: number;
  criteria: Criterion[];
}

export default function ReviewSubmitStep({
  formData,
  durationMonths,
  resourceMandays,
  criteria
}: ReviewSubmitStepProps) {
  // Get inverse criteria keys
  const inverseCriteria = criteria
    .filter(criterion => criterion.isInverse)
    .map(criterion => criterion.key);
    
  // Calculate overall score for display
  const getOverallScore = (): number => {
    if (!formData.criteria || Object.keys(formData.criteria).length === 0) {
      return 0;
    }
    
    // Convert to a full Project to use the calculation function
    const tempProject = {
      ...formData,
      id: 'temp',
      status: 'planning',
      startDate: '',
      endDate: '',
      team: formData.team || []
    } as Project;
    
    return calculateOverallScore(tempProject, {}, inverseCriteria);
  };
  
  // Get score color based on overall score
  const getScoreColor = (score: number): string => {
    if (score >= 7) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Format a date string
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Calculate estimated end date
  const calculateEndDate = (): string => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return formatDate(endDate);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
      <p className="text-gray-600 mb-6">
        Please review your project information and self-assessment before submitting to the committee.
      </p>
      
      {/* Project overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Project Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Project Name</h4>
            <p>{formData.name}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Division/Department</h4>
            <p>{formData.department}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Budget</h4>
            <p>${formData.budget?.toLocaleString()}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Duration</h4>
            <p>{durationMonths} months (Est. end: {calculateEndDate()})</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Resources Required</h4>
            <p>{resourceMandays.toLocaleString()} mandays</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500">Description</h4>
          <p className="whitespace-pre-wrap">{formData.description}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-500">Tags</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags && formData.tags.length > 0 ? (
              formData.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No tags</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Self-assessment summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Self-Assessment Summary</h3>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Overall Score</h4>
            <span className={`text-lg font-bold ${getScoreColor(getOverallScore())}`}>
              {getOverallScore().toFixed(2)} / 10
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${getOverallScore() * 10}%` }}
            ></div>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200 mt-4">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criterion
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Rating
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {criteria.map((criterion) => (
              <tr key={criterion.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {criterion.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {criterion.isInverse ? '(Lower is better)' : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {formData.criteria && formData.criteria[criterion.key] !== undefined ? (
                    <span 
                      className={`text-sm font-medium ${
                        criterion.isInverse 
                          ? formData.criteria[criterion.key] <= 3 ? 'text-green-600' : 
                            formData.criteria[criterion.key] <= 7 ? 'text-yellow-600' : 'text-red-600'
                          : formData.criteria[criterion.key] >= 8 ? 'text-green-600' :
                            formData.criteria[criterion.key] >= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {formData.criteria[criterion.key]} / 10
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Not rated</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Submission notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-700 mb-2">Ready to Submit?</h3>
        <p className="text-blue-600">
          Once submitted, your project proposal will be reviewed by the project committee. 
          You will be notified when a decision has been made.
        </p>
      </div>
    </div>
  );
}
