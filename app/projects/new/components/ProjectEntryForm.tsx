'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects } from '@/app/_contexts/ProjectContext';
import { useCriteria } from '@/app/_contexts/CriteriaContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { Project } from '@/src/data/projects';
import ProjectInfoStep from '@/app/projects/new/components/ProjectInfoStep';
import SelfAssessmentStep from '@/app/projects/new/components/SelfAssessmentStep';
import ReviewSubmitStep from '@/app/projects/new/components/ReviewSubmitStep';

type FormStep = 'info' | 'assessment' | 'review';

// Extended form data interface with departmentId
interface ProjectFormData extends Partial<Project> {
  departmentId?: string;
  departmentName?: string;
  criteriaComments?: Record<string, string>;
}

// Default new project template
const defaultNewProject: ProjectFormData = {
  name: '',
  description: '',
  department: '',
  departmentId: '',
  status: 'initiation', // Default status for new projects
  criteria: {},
  tags: []
};

export default function ProjectEntryForm() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [isEditMode, setIsEditMode] = useState(!!projectId);
  const router = useRouter();
  const { projects, refreshProjects } = useProjects();
  const { criteria, loading: criteriaLoading } = useCriteria();
  const { user, organization } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('info');
  const [formData, setFormData] = useState<ProjectFormData>(defaultNewProject);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    // Default end date is 1 month from now
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  const [resourceMandays, setResourceMandays] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Fetch project data if in edit mode
  useEffect(() => {
    if (isEditMode && projectId) {
      const fetchProjectData = async () => {
        setIsLoading(true);
        try {
          if (!organization || !user) {
            throw new Error('Authentication required');
          }
          
          const headers: HeadersInit = {
            'x-organization-id': organization.id,
            'x-user-id': user.id,
            'x-user-role': user.role,
          };
          
          const response = await fetch(`/api/projects/${projectId}?includeScores=true`, { headers });
          
          if (!response.ok) {
            throw new Error('Failed to fetch project data');
          }
          
          const projectData = await response.json();
          
          // Extract comments and scores from projectScores if available
          const criteriaComments: Record<string, string> = {};
          const criteriaScores: Record<string, number> = {};
          
          if (projectData.projectScores && Array.isArray(projectData.projectScores)) {
            projectData.projectScores.forEach((score: { comment?: string; score?: number; criterion?: { key: string } }) => {
              if (score.criterion?.key) {
                // Save comments if available
                if (score.comment) {
                  criteriaComments[score.criterion.key] = score.comment;
                }
                
                // Save scores if available
                if (typeof score.score === 'number') {
                  criteriaScores[score.criterion.key] = score.score;
                }
              }
            });
          }
          
          console.log('Extracted comments:', criteriaComments);
          console.log('Extracted scores:', criteriaScores);
          
          // Update form data with project data
          setFormData({
            ...projectData,
            id: projectData.id,
            name: projectData.name,
            description: projectData.description,
            // Use department object from projectData if available
            department: projectData.department?.name || '', 
            departmentId: projectData.department?.id || projectData.departmentId || '',
            budget: projectData.budget,
            resources: projectData.resources,
            tags: projectData.tags || [],
            team: projectData.team || [],
            // Use extracted scores instead of criteria property 
            // which might not be properly populated
            criteria: criteriaScores,
            // Add extracted comments
            criteriaComments: criteriaComments
          });
          
          console.log('Loaded project data:', projectData);
          console.log('Department ID set to:', projectData.departmentId || projectData.department);
          
          // Update dates
          if (projectData.startDate) {
            setStartDate(new Date(projectData.startDate));
          }
          
          if (projectData.endDate) {
            setEndDate(new Date(projectData.endDate));
          }
          
          // Update resources
          if (projectData.resources) {
            setResourceMandays(projectData.resources);
          }
          
        } catch (error) {
          console.error('Error fetching project data:', error);
          setErrors({ submit: 'Failed to load project data. Please try again.' });
          router.push('/selection');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProjectData();
    }
  }, [isEditMode, projectId, organization, user, router]);

  // Initialize criteria scores when criteria are loaded (for new projects only)
  useEffect(() => {
    if (criteria.length > 0 && !isEditMode) {
      const initialCriteriaScores: Record<string, number> = {};
      criteria.forEach(criterion => {
        initialCriteriaScores[criterion.key] = 5; // Default mid-value on 1-10 scale
      });
      
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...initialCriteriaScores,
          ...prev.criteria // Keep any existing criteria scores
        }
      }));
    }
  }, [criteria, isEditMode]);

  // Handle form input changes 
  const handleInfoChange = (fieldName: string, value: any) => {
    // Special case for department selection
    if (fieldName === 'department') {
      // value will be departmentId from select dropdown
      const departmentId = value;
      
      // Update the form data - department name will be retrieved from the context when needed
      setFormData(prev => ({
        ...prev,
        departmentId: departmentId,
        department: departmentId // Keep ID in department field for backward compatibility
      }));
    } else {
      // Normal field update
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }
    
    // Clear error for this field if any
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle criteria score changes
  const handleCriteriaChange = (criterionKey: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionKey]: value
      }
    }));
  };
  
  // Handle criteria comment changes
  const handleCriteriaCommentChange = (criterionKey: string, comment: string) => {
    setFormData(prev => ({
      ...prev,
      criteriaComments: {
        ...(prev.criteriaComments || {}),
        [criterionKey]: comment
      }
    }));
  };

  // Handle tag changes
  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 'info') {
      if (!formData.name?.trim()) {
        newErrors.name = 'Project name is required';
      }
      
      if (!formData.description?.trim()) {
        newErrors.description = 'Project description is required';
      }
      
      if (!formData.department?.trim()) {
        newErrors.department = 'Division/department is required';
      }
      
      if (!formData.budget || formData.budget <= 0) {
        newErrors.budget = 'Valid budget amount is required';
      }
      
      if (!startDate) {
        newErrors.startDate = 'Start date is required';
      }
      
      if (!endDate) {
        newErrors.endDate = 'End date is required';
      }
      
      if (startDate && endDate && startDate >= endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
      
      if (resourceMandays < 1) {
        newErrors.resources = 'Resources must be at least 1 manday';
      }
    }
    
    if (currentStep === 'assessment') {
      // Check if all criteria have scores
      criteria.forEach(criterion => {
        if (formData.criteria?.[criterion.key] === undefined) {
          newErrors[`criteria_${criterion.key}`] = `Score for ${criterion.label} is required`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const handleNext = () => {
    const isValid = validateCurrentStep();
    
    if (!isValid) return;
    
    if (currentStep === 'info') {
      setCurrentStep('assessment');
    } else if (currentStep === 'assessment') {
      setCurrentStep('review');
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep === 'assessment') {
      setCurrentStep('info');
    } else if (currentStep === 'review') {
      setCurrentStep('assessment');
    }
  };

  // Submit the form
  const handleSubmit = async () => {
    // Validate all steps
    if (!validateCurrentStep()) return;
    
    // Ensure user and organization context exists
    if (!user || !organization) {
      setErrors({ submit: 'User authentication required. Please log in again.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format dates as ISO-8601 DateTime strings with time component
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();
      
        // Make sure departmentId is set
        // If we only have department but not departmentId, they should be the same
        const department = formData.departmentId || formData.department || '';
        
        // Log department values for debugging
        console.log('Department values:', {
          department: formData.department,
          departmentId: formData.departmentId,
          finalValue: department
        });
        
        // Assemble the final project data
        const projectData = {
          name: formData.name || '',
          description: formData.description || '',
          departmentId: department,  // Using the verified department ID
          status: formData.status || 'initiation', // Ensure status is included
          startDate: startDateTime,
          endDate: endDateTime,
          budget: formData.budget,
          resources: resourceMandays,
          tags: formData.tags || [],
          organizationId: organization.id, // Required for database storage
          criteriaScores: Object.entries(formData.criteria || {}).map(([key, score]) => ({
            criterionKey: key,
            score: score,
            comment: formData.criteriaComments?.[key] || null
          }))
        };
        
        console.log('Submitting criteria with comments:', projectData.criteriaScores);
      
      // Include RLS headers for proper data filtering and access control
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-organization-id': organization.id,
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      let url = '/api/projects';
      let method = 'POST';
      
      // If editing, use PATCH method and include project ID in URL
      if (isEditMode && projectId) {
        url = `/api/projects/${projectId}`;
        method = 'PATCH';
        console.log('Updating existing project:', projectData);
      } else {
        console.log('Submitting new project to database:', projectData);
      }
      
      // Submit to API
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: Failed to save project`);
      }
      
      const savedProject = await response.json();
      console.log('Successfully saved project:', savedProject);
      
      // Refresh projects list to include the new project
      await refreshProjects();
      
      // Show success message and redirect
      setErrors({});
      
      // If editing, redirect back to project details
      if (isEditMode && projectId) {
        router.push(`/details/${projectId}`);
      } else {
        router.push('/selection');
      }
      
    } catch (error) {
      console.error('Error submitting project:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit project. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="mt-4">
      <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Project' : 'New Project'}</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project data...</p>
          </div>
        </div>
      ) : (
        <>
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            <div className={`flex-1 text-center ${currentStep === 'info' ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto mb-2 ${
              currentStep === 'info' ? 'bg-blue-600 text-white' : 
              currentStep === 'assessment' || currentStep === 'review' ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}>
              1
            </div>
            Project Information
          </div>
          <div className={`flex-1 text-center ${currentStep === 'assessment' ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto mb-2 ${
              currentStep === 'assessment' ? 'bg-blue-600 text-white' : 
              currentStep === 'review' ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}>
              2
            </div>
            Self Assessment
          </div>
          <div className={`flex-1 text-center ${currentStep === 'review' ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto mb-2 ${
              currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>
              3
            </div>
            Review & Submit
          </div>
        </div>
        <div className="relative mt-2">
          <div className="absolute top-1/2 transform -translate-y-1/2 left-0 right-0 h-1 bg-gray-200"></div>
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 left-0 h-1 bg-blue-600 transition-all duration-300" 
            style={{
              width: currentStep === 'info' ? '16.67%' : 
                     currentStep === 'assessment' ? '50%' : '100%'
            }}
          ></div>
        </div>
      </div>

      {/* Step content */}
      <div className="mt-6">
        {currentStep === 'info' && (
          <ProjectInfoStep 
            formData={formData}
            startDate={startDate}
            endDate={endDate}
            resourceMandays={resourceMandays}
            errors={errors}
            onChange={handleInfoChange}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onResourceChange={setResourceMandays}
            onTagsChange={handleTagsChange}
          />
        )}
        
        {currentStep === 'assessment' && (
          <SelfAssessmentStep 
            criteria={criteria}
            criteriaScores={formData.criteria || {}}
            criteriaComments={formData.criteriaComments}
            errors={errors}
            onChange={handleCriteriaChange}
            onCommentChange={handleCriteriaCommentChange}
          />
        )}
        
        {currentStep === 'review' && (
          <ReviewSubmitStep 
            formData={formData}
            startDate={startDate}
            endDate={endDate}
            resourceMandays={resourceMandays}
            criteria={criteria}
          />
        )}
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
              onClick={() => router.push('/details')}
              type="button"
            >
              Cancel
            </button>
            
            {currentStep !== 'info' && (
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                onClick={handleBack}
                disabled={isSubmitting}
                type="button"
              >
                Back
              </button>
            )}
          </div>
          
          {currentStep !== 'review' ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              onClick={handleNext}
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? 'Submitting...' : isEditMode ? 'Update Project' : 'Submit to Committee'}
            </button>
          )}
        </div>
        
        {/* General submission error */}
        {errors.submit && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {errors.submit}
          </div>
        )}
        </div>
        </>
      )}
    </div>
  );
}
