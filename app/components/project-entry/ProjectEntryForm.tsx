'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/app/contexts/ProjectContext';
import { useCriteria } from '@/app/contexts/CriteriaContext';
import { Project } from '@/src/data/projects';
import ProjectInfoStep from '@/app/components/project-entry/ProjectInfoStep';
import SelfAssessmentStep from '@/app/components/project-entry/SelfAssessmentStep';
import ReviewSubmitStep from '@/app/components/project-entry/ReviewSubmitStep';

type FormStep = 'info' | 'assessment' | 'review';

// Default new project template
const defaultNewProject: Partial<Project> = {
  name: '',
  description: '',
  department: '',
  status: 'planning',
  criteria: {},
  tags: [],
  team: [],
};

export default function ProjectEntryForm() {
  const router = useRouter();
  const { projects } = useProjects();
  const { criteria } = useCriteria();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('info');
  const [formData, setFormData] = useState<Partial<Project>>(defaultNewProject);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [resourceMandays, setResourceMandays] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize criteria scores when criteria are loaded
  useEffect(() => {
    if (criteria.length > 0) {
      const initialCriteriaScores: Record<string, number> = {};
      criteria.forEach(criterion => {
        initialCriteriaScores[criterion.key] = 5; // Default mid-value on 1-10 scale
      });
      
      setFormData(prev => ({
        ...prev,
        criteria: initialCriteriaScores
      }));
    }
  }, [criteria]);

  // Handle form input changes
  const handleInfoChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
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
      
      if (durationMonths < 1) {
        newErrors.duration = 'Duration must be at least 1 month';
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
    
    setIsSubmitting(true);
    
    try {
      // Generate start and end dates based on duration
      const startDate = new Date().toISOString().split('T')[0]; // Today
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Generate a unique ID
      const newId = `p${projects.length + 1}`;
      
      // Assemble the final project data
      const newProject: Project = {
        id: newId,
        name: formData.name || '',
        description: formData.description || '',
        department: formData.department || '',
        status: 'planning',
        criteria: formData.criteria || {},
        startDate,
        endDate: endDateStr,
        tags: formData.tags || [],
        team: [], // Empty team as per requirements
        budget: formData.budget,
      };
      
      console.log('Submitting new project:', newProject);
      
      // TODO: Connect to API for actual data persistence
      // For now, just simulate success and redirect
      
      // Redirect to project details page after submission
      setTimeout(() => {
        router.push('/selection');
      }, 1000);
    } catch (error) {
      console.error('Error submitting project:', error);
      setErrors({ submit: 'Failed to submit project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
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
            durationMonths={durationMonths}
            resourceMandays={resourceMandays}
            errors={errors}
            onChange={handleInfoChange}
            onDurationChange={setDurationMonths}
            onResourceChange={setResourceMandays}
            onTagsChange={handleTagsChange}
          />
        )}
        
        {currentStep === 'assessment' && (
          <SelfAssessmentStep 
            criteria={criteria}
            criteriaScores={formData.criteria || {}}
            errors={errors}
            onChange={handleCriteriaChange}
          />
        )}
        
        {currentStep === 'review' && (
          <ReviewSubmitStep 
            formData={formData}
            durationMonths={durationMonths}
            resourceMandays={resourceMandays}
            criteria={criteria}
          />
        )}
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
              onClick={() => router.push('/selection')}
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
              {isSubmitting ? 'Submitting...' : 'Submit to Committee'}
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
    </div>
  );
}
