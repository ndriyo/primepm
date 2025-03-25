'use client';

import { useState, useEffect } from 'react';
import { Criterion, CriterionCreateInput, CriterionUpdateInput } from '@/app/_repositories/CriteriaRepository';
// Import the API-based hook
import { useCriteria } from '@/app/_hooks/useCriteria';
import { ConfirmationDialog } from '@/app/_components/ui/ConfirmationDialog';
import { useAuth } from '@/app/_contexts/AuthContext';

interface CriteriaFormData {
  key: string;
  label: string;
  description: string;
  isInverse: boolean;
  scale?: {
    min: number;
    max: number;
  };
  rubric?: {
    [score: number]: string;
  };
}

interface CriteriaManagementProps {
  versionId: string;
  onEditingStart?: () => void;
  onEditingEnd?: () => void;
  isDisabled?: boolean;
  apiCriteria?: Criterion[]; // Add API criteria from parent component
}

const initialFormData: CriteriaFormData = {
  key: '',
  label: '',
  description: '',
  isInverse: false,
  scale: {
    min: 1,
    max: 5
  },
  rubric: {
    1: '',
    2: '',
    3: '',
    4: '',
    5: ''
  }
};

// Default criteria for the "Add Default Criteria" button
const defaultCriteria = [
  { key: 'revenue', label: 'Revenue Impact', description: 'Potential revenue generation or savings', isInverse: false },
  { key: 'policyImpact', label: 'Policy Impact', description: 'Impact on organizational policies and strategies', isInverse: false },
  { key: 'budget', label: 'Budget', description: 'Required financial investment', isInverse: true },
  { key: 'resources', label: 'Resources', description: 'Required human and other resources', isInverse: true },
  { key: 'complexity', label: 'Complexity', description: 'Technical and implementation complexity', isInverse: true }
];

export const CriteriaManagement = ({ 
  versionId, 
  onEditingStart, 
  onEditingEnd,
  isDisabled = false,
  apiCriteria = [] 
}: CriteriaManagementProps) => {
  const { user } = useAuth();
  
  // Get the hooks from useCriteria
  const {
    useCreateCriterion,
    useUpdateCriterion,
    useDeleteCriterion
  } = useCriteria();
  
  // Initialize the mutations
  const createCriterionMutation = useCreateCriterion();
  const updateCriterionMutation = useUpdateCriterion();
  const deleteCriterionMutation = useDeleteCriterion();
  
  // State
  const [displayCriteria, setDisplayCriteria] = useState<Criterion[]>([]);
  const [formData, setFormData] = useState<CriteriaFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // Set display criteria from API
  useEffect(() => {
    if (apiCriteria && apiCriteria.length > 0) {
      setDisplayCriteria(apiCriteria);
    }
  }, [apiCriteria]);

  // Calculate total weight and check if any criteria are missing weights
  const totalWeight = displayCriteria.reduce((sum: number, criterion: Criterion) => 
    sum + (criterion.weight || 0), 0
  );
  
  // Check if weights sum to approximately 100% (allowing for small floating-point errors)
  const isWeightComplete = Math.abs(totalWeight - 1) < 0.01;
  
  // Check if any criteria are missing weights
  const hasUnsetWeights = displayCriteria.some((criterion: Criterion) => criterion.weight === undefined);

  // Notify parent component when editing starts/ends
  useEffect(() => {
    if (isFormVisible && onEditingStart) {
      onEditingStart();
    } else if (!isFormVisible && onEditingEnd) {
      onEditingEnd();
    }
  }, [isFormVisible, onEditingStart, onEditingEnd]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('User not found');
      return;
    }

    // Validate form
    if (!formData.key.trim() || !formData.label.trim()) {
      alert('Key and Label are required');
      return;
    }

    // Check for duplicate key
    const keyExists = displayCriteria.some((c: Criterion) => c.key === formData.key && c.id !== editingId);
    if (keyExists) {
      alert(`A criterion with key "${formData.key}" already exists`);
      return;
    }

    if (editingId) {
      // Update existing criterion
      const updateData: CriterionUpdateInput = {
        key: formData.key,
        label: formData.label,
        description: formData.description,
        isInverse: formData.isInverse,
        scale: formData.scale,
        rubric: formData.rubric,
        updatedById: user.id
      };
      
      updateCriterionMutation.mutate({
        id: editingId,
        data: updateData,
        versionId: versionId
      });
    } else {
      // Add new criterion
      const createData: CriterionCreateInput = {
        key: formData.key,
        label: formData.label,
        description: formData.description,
        isInverse: formData.isInverse,
        scale: formData.scale,
        rubric: formData.rubric,
        versionId: versionId,
        createdById: user.id
      };
      
      createCriterionMutation.mutate({
        versionId: versionId,
        data: createData
      });
    }

    // Reset form
    setFormData(initialFormData);
    setEditingId(null);
    setIsFormVisible(false);
  };

  const handleEdit = (criterion: Criterion) => {
    setFormData({
      key: criterion.key,
      label: criterion.label,
      description: criterion.description || '',
      isInverse: criterion.isInverse ?? false,
      scale: criterion.scale as { min: number; max: number } || { min: 1, max: 5 },
      rubric: criterion.rubric || { 1: '', 2: '', 3: '', 4: '', 5: '' }
    });
    setEditingId(criterion.id);
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    if (!user) {
      alert('User not found');
      return;
    }
    
    const criterionToDelete = displayCriteria.find((c: Criterion) => c.id === id);
    if (!criterionToDelete) return;
    
    setConfirmDialog({
      isOpen: true,
      message: `Criterion "${criterionToDelete.label}" will be removed.`,
      onConfirm: () => {
        deleteCriterionMutation.mutate({ 
          id, 
          userId: user.id 
        });
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleReset = () => {
    if (!user) {
      alert('User not found');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      message: 'Default criteria will be added to this version.',
      onConfirm: () => {
        defaultCriteria.forEach(criterion => {
          // Skip if a criterion with the same key already exists
          if (!displayCriteria.some((c: Criterion) => c.key === criterion.key)) {
            const createData: CriterionCreateInput = {
              key: criterion.key,
              label: criterion.label,
              description: criterion.description,
              isInverse: criterion.isInverse,
              versionId: versionId,
              createdById: user.id
            };
            
            createCriterionMutation.mutate({
              versionId: versionId,
              data: createData
            });
          }
        });
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsFormVisible(false);
  };

  if (isDisabled) {
    return (
      <div className="opacity-50 pointer-events-none">
        <div className="p-4 bg-gray-100 border rounded-md text-center">
          <p className="text-gray-500">Criteria management is disabled while editing version details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Criteria Management</h3>
        <div className="space-x-2">
          {!isFormVisible && (
            <button
              onClick={() => setIsFormVisible(true)}
              className="btn btn-primary btn-sm"
            >
              Add New Criterion
            </button>
          )}
          <button
            onClick={handleReset}
            className="btn btn-outline btn-sm"
          >
            Add Default Criteria
          </button>
        </div>
      </div>

      {/* Weight Warnings */}
      {displayCriteria.length > 0 && (
        <>
          {/* Warning for incomplete total weight */}
          {!isWeightComplete && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Total weight is {(totalWeight * 100).toFixed(1)}%. Run the AHP Wizard to calculate weights that sum to 100%.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Warning for unset weights */}
          {hasUnsetWeights && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Some criteria don't have weights set. Run the AHP Wizard to calculate weights for all criteria.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {isFormVisible && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h4 className="text-md font-medium mb-4">
            {editingId ? 'Edit Criterion' : 'Add New Criterion'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="e.g., marketPotential"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier, use camelCase without spaces
                </p>
              </div>
              <div>
                <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="e.g., Market Potential"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Human-readable name displayed in UI
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Brief explanation of this criterion"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="scale.min" className="block text-sm font-medium text-gray-700 mb-1">
                  Scale Minimum
                </label>
                <input
                  type="number"
                  id="scale.min"
                  name="scale.min"
                  value={formData.scale?.min || 1}
                  onChange={(e) => setFormData({
                    ...formData,
                    scale: {
                      ...(formData.scale || { min: 1, max: 5 }),
                      min: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <label htmlFor="scale.max" className="block text-sm font-medium text-gray-700 mb-1">
                  Scale Maximum
                </label>
                <input
                  type="number"
                  id="scale.max"
                  name="scale.max"
                  value={formData.scale?.max || 5}
                  onChange={(e) => setFormData({
                    ...formData,
                    scale: {
                      ...(formData.scale || { min: 1, max: 5 }),
                      max: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rubric (Description for each score level)
              </label>
              {formData.scale && Array.from({ length: (formData.scale.max - formData.scale.min) + 1 }, (_, i) => i + formData.scale!.min).map(score => (
                <div key={score} className="mb-2">
                  <label htmlFor={`rubric.${score}`} className="block text-xs font-medium text-gray-600 mb-1">
                    Score {score}
                  </label>
                  <input
                    type="text"
                    id={`rubric.${score}`}
                    name={`rubric.${score}`}
                    value={formData.rubric?.[score] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      rubric: {
                        ...(formData.rubric || {}),
                        [score]: e.target.value
                      }
                    })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder={`Description for score ${score}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isInverse"
                  checked={formData.isInverse}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Inverse Scale (lower values are better)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                E.g., for metrics like 'Cost' or 'Risk' where lower values are preferred
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={createCriterionMutation.isPending || updateCriterionMutation.isPending}
              >
                {editingId ? 'Update' : 'Add'} Criterion
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scale
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayCriteria.map((criterion: Criterion) => (
              <tr key={criterion.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {criterion.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {criterion.key}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {criterion.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {criterion.isInverse ? 'Inverse (lower is better)' : 'Standard (higher is better)'}
                  {criterion.scale && <span className="ml-1">({criterion.scale.min}-{criterion.scale.max})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {criterion.weight !== undefined && criterion.weight !== null ? 
                    `${(criterion.weight * 100).toFixed(1)}%` : 
                    <span className="text-yellow-500">Not set</span>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {criterion.isDefault ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Default
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Custom
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(criterion)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(criterion.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {displayCriteria.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No criteria defined. Click "Add New Criterion" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};
