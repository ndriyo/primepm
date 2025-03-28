'use client';

import { Project } from '@/src/data/projects';
import { Criterion } from '@/app/_contexts/CriteriaContext';
import { calculatePreviewScore } from '@/app/_lib/scoreCalculator';
import { useDepartments } from '@/app/_contexts/DepartmentContext';

interface ProjectFormData extends Partial<Project> {
  departmentId?: string;
}

interface ReviewSubmitStepProps {
  formData: ProjectFormData;
  startDate: Date;
  endDate: Date;
  resourceMandays: number;
  criteria: Criterion[];
}

export default function ReviewSubmitStep({
  formData,
  startDate,
  endDate,
  resourceMandays,
  criteria
}: ReviewSubmitStepProps) {
  // Get departments data
  const { departments } = useDepartments();
  
  // Get department name by ID
  const getDepartmentName = (departmentId?: string): string => {
    if (!departmentId) return 'Not specified';
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : departmentId;
  };
  // Get inverse criteria keys
  const inverseCriteria = criteria
    .filter(criterion => criterion.isInverse)
    .map(criterion => criterion.key);
    
  // Calculate overall score for display using the centralized score calculator
  const getOverallScore = (): number => {
    if (!formData.criteria || Object.keys(formData.criteria).length === 0) {
      return 0;
    }
    
    // Use the centralized score calculator for preview
    // This ensures consistency between preview and stored scores
    return calculatePreviewScore(
      formData.criteria,
      criteria,
      { normalizeOutput: true, outputScaleMax: 5, outputScaleMin: 1 }
    );
  };
  
  // Get score color based on overall score
  const getScoreColor = (score: number): string => {
    if (score >= 3.5) return 'text-green-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Format a date for display
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate duration in months based on start and end dates
  const calculateDurationMonths = (): number => {
    const monthDiff = endDate.getMonth() - startDate.getMonth() + 
      (12 * (endDate.getFullYear() - startDate.getFullYear()));
    return Math.max(1, monthDiff); // Ensure at least 1 month
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
            <p>{getDepartmentName(formData.departmentId || formData.department)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Budget</h4>
            <p>${formData.budget?.toLocaleString()}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-500">Timeline</h4>
            <p>{formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)} ({calculateDurationMonths()} months)</p>
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
              {getOverallScore().toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(getOverallScore() / 5) * 100}%` }}
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
                          ? formData.criteria[criterion.key] <= (criterion.scale?.min || 1) + Math.floor((criterion.scale?.max || 10) * 0.2) ? 'text-green-600' : 
                            formData.criteria[criterion.key] <= (criterion.scale?.min || 1) + Math.floor((criterion.scale?.max || 10) * 0.7) ? 'text-yellow-600' : 'text-red-600'
                          : formData.criteria[criterion.key] >= (criterion.scale?.min || 1) + Math.floor((criterion.scale?.max || 10) * 0.8) ? 'text-green-600' :
                            formData.criteria[criterion.key] >= (criterion.scale?.min || 1) + Math.floor((criterion.scale?.max || 10) * 0.4) ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {formData.criteria[criterion.key]} / {criterion.scale?.max || 10}
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
