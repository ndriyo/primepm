import { useState } from 'react';
import { useCriteria, Criterion } from '../../contexts/CriteriaContext';

interface CriteriaFormData {
  key: string;
  label: string;
  description: string;
  isInverse: boolean;
}

const initialFormData: CriteriaFormData = {
  key: '',
  label: '',
  description: '',
  isInverse: false,
};

export const CriteriaManagement = () => {
  const { criteria, addCriterion, updateCriterion, removeCriterion, resetToDefaultCriteria } = useCriteria();
  const [formData, setFormData] = useState<CriteriaFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

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

    // Validate form
    if (!formData.key.trim() || !formData.label.trim()) {
      alert('Key and Label are required');
      return;
    }

    // Check for duplicate key
    const keyExists = criteria.some(c => c.key === formData.key && c.id !== editingId);
    if (keyExists) {
      alert(`A criterion with key "${formData.key}" already exists`);
      return;
    }

    if (editingId) {
      // Update existing criterion
      updateCriterion(editingId, formData);
    } else {
      // Add new criterion
      addCriterion(formData);
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
      description: criterion.description,
      isInverse: criterion.isInverse,
    });
    setEditingId(criterion.id);
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this criterion?')) {
      const success = removeCriterion(id);
      if (!success) {
        alert('Cannot delete default criteria');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default criteria? All custom criteria will be lost.')) {
      resetToDefaultCriteria();
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setIsFormVisible(false);
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Selection Criteria</h3>
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
            Reset to Defaults
          </button>
        </div>
      </div>

      {isFormVisible && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h4 className="text-md font-medium mb-4">
            {editingId ? 'Edit Criterion' : 'Add New Criterion'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {criteria.map(criterion => (
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
                  {!criterion.isDefault && (
                    <button
                      onClick={() => handleDelete(criterion.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {criteria.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No criteria defined. Click "Add New Criterion" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
