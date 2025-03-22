'use client';

import { useState } from 'react';
import { Project } from '@/src/data/projects';
import { useDepartments } from '@/app/contexts/DepartmentContext';

interface ProjectFormData extends Partial<Project> {
  departmentId?: string;
}

interface ProjectInfoStepProps {
  formData: ProjectFormData;
  startDate: Date;
  endDate: Date;
  resourceMandays: number;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onResourceChange: (mandays: number) => void;
  onTagsChange: (tags: string[]) => void;
}

// Format number with thousand separator
const formatNumber = (value: number | string): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Parse formatted number to get actual value
const parseFormattedNumber = (formattedValue: string): number => {
  return parseInt(formattedValue.replace(/,/g, ''), 10) || 0;
};

// Format date for input
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProjectInfoStep({
  formData,
  startDate,
  endDate,
  resourceMandays,
  errors,
  onChange,
  onStartDateChange,
  onEndDateChange,
  onResourceChange,
  onTagsChange
}: ProjectInfoStepProps) {
  const [tagInput, setTagInput] = useState('');
  const { departments, loading: departmentsLoading } = useDepartments();

  // Add a tag to the list
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      onTagsChange(newTags);
      setTagInput('');
    }
  };

  // Remove a tag from the list
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (formData.tags || []).filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  // Handle Enter key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onStartDateChange(new Date(dateValue));
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onEndDateChange(new Date(dateValue));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Project Information</h2>
      
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-name">
          Project Name*
        </label>
        <input
          id="project-name"
          type="text"
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          placeholder="Enter project name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-description">
          Description*
        </label>
        <textarea
          id="project-description"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          placeholder="Describe the project's purpose and goals"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>
      
      {/* Department/Division */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-department">
          Division/Department*
        </label>
        <select
          id="project-department"
          value={formData.departmentId || formData.department || ''}
          onChange={(e) => onChange('department', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.department ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          disabled={departmentsLoading}
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
      </div>
      
      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-budget">
          Budget*
        </label>
        <div className="flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              id="project-budget"
              type="text"
              value={formData.budget ? formatNumber(formData.budget) : ''}
              onChange={(e) => {
                const formattedValue = e.target.value.replace(/[^0-9,]/g, '');
                const numericValue = parseFormattedNumber(formattedValue);
                onChange('budget', numericValue);
              }}
              className={`w-full pl-7 pr-3 py-2 border ${errors.budget ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter project budget"
            />
          </div>
        </div>
        {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
      </div>
      
      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-start-date">
          Start Date*
        </label>
        <input
          id="project-start-date"
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          className={`w-full px-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
      </div>
      
      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-end-date">
          End Date*
        </label>
        <input
          id="project-end-date"
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          className={`w-full px-3 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
      </div>
      
      {/* Resources required (in mandays) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-resources">
          Resources Required (in mandays)*
        </label>
        <div className="flex items-center">
          <input
            id="project-resources"
            type="text"
            value={formatNumber(resourceMandays)}
            onChange={(e) => {
              const formattedValue = e.target.value.replace(/[^0-9,]/g, '');
              const numericValue = parseFormattedNumber(formattedValue);
              onResourceChange(numericValue || 1);
            }}
            className={`w-48 px-3 py-2 border ${errors.resources ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          <span className="ml-2 text-gray-500">mandays</span>
        </div>
        {errors.resources && <p className="mt-1 text-sm text-red-600">{errors.resources}</p>}
      </div>
      
      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        {/* Tag display */}
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags && formData.tags.map((tag) => (
            <div key={tag} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
              <span className="text-blue-800">{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-blue-700 hover:text-blue-900"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">* Required fields</div>
    </div>
  );
}
