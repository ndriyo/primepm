'use client';

import { useState } from 'react';
import { useCriteria, CriteriaVersion } from '@/app/contexts/CriteriaContext';
import { CriteriaManagement } from './CriteriaManagement';
import { AHPWizard } from './AHPWizard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

type EditingMode = 'version' | 'criteria' | null;

interface VersionFormData {
  name: string;
  description: string;
  isActive: boolean;
}

const initialVersionFormData: VersionFormData = {
  name: '',
  description: '',
  isActive: false,
};

export const CriteriaVersionManagement = () => {
  const { 
    versions, 
    activeVersion, 
    createVersion, 
    updateVersion, 
    deleteVersion, 
    setActiveVersion,
    criteriaByVersion
  } = useCriteria();
  
  const [formData, setFormData] = useState<VersionFormData>(initialVersionFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    activeVersion ? activeVersion.id : versions.length > 0 ? versions[0].id : null
  );
  const [showAHPWizard, setShowAHPWizard] = useState(false);
  const [editingMode, setEditingMode] = useState<EditingMode>(null);
  
  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    if (editingId) {
      // Update existing version
      updateVersion(editingId, formData);
    } else {
      // Create new version
      const newVersionId = createVersion(formData);
      setSelectedVersionId(newVersionId);
    }

    // Reset form
    setFormData(initialVersionFormData);
    setEditingId(null);
    setIsFormVisible(false);
    setEditingMode(null);
  };

  const handleEdit = (version: CriteriaVersion) => {
    setFormData({
      name: version.name,
      description: version.description,
      isActive: version.isActive,
    });
    setEditingId(version.id);
    setIsFormVisible(true);
    setEditingMode('version');
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'This version and all its criteria will be lost.',
      onConfirm: () => {
        const success = deleteVersion(id);
        if (!success) {
          alert('Cannot delete the only version. Create another version first.');
        } else if (selectedVersionId === id) {
          // If the deleted version was selected, select the active version or the first one
          setSelectedVersionId(activeVersion ? activeVersion.id : versions.length > 0 ? versions[0].id : null);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleActivate = (id: string) => {
    setActiveVersion(id);
  };

  const handleCancel = () => {
    setFormData(initialVersionFormData);
    setEditingId(null);
    setIsFormVisible(false);
    setEditingMode(null);
  };

  const handleVersionSelect = (id: string) => {
    // Ensure we're using the correct version ID
    if (id && versions.some(v => v.id === id)) {
      setSelectedVersionId(id);
      setShowAHPWizard(false);
    }
  };

  const handleRunAHP = () => {
    if (selectedVersionId) {
      const versionCriteria = criteriaByVersion[selectedVersionId] || [];
      if (versionCriteria.length < 2) {
        alert('You need at least 2 criteria to run the AHP wizard.');
        return;
      }
      setShowAHPWizard(true);
    }
  };

  const handleCriteriaEditingStart = () => {
    setEditingMode('criteria');
  };

  const handleCriteriaEditingEnd = () => {
    setEditingMode(null);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Criteria Versions</h3>
          <div>
            {!isFormVisible && (
              <button
                onClick={() => {
                  setIsFormVisible(true);
                  setEditingMode('version');
                }}
                className="btn btn-primary btn-sm"
                disabled={editingMode === 'criteria'}
              >
                Create New Version
              </button>
            )}
          </div>
        </div>

        {isFormVisible && (
          <div className="mb-6 p-4 border rounded-md bg-gray-50">
            <h4 className="text-md font-medium mb-4">
              {editingId ? 'Edit Version' : 'Create New Version'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="e.g., 2025 Q1 Criteria"
                  required
                />
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
                  placeholder="Brief description of this criteria version"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Set as active version
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Only one version can be active at a time. The active version will be used for project scoring.
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
                  {editingId ? 'Update' : 'Create'} Version
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={`overflow-x-auto ${editingMode === 'criteria' ? 'opacity-50 pointer-events-none' : ''}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {versions.map(version => (
                <tr 
                  key={version.id} 
                  className={selectedVersionId === version.id ? 'bg-blue-50' : ''}
                  onClick={() => editingMode !== 'criteria' && handleVersionSelect(version.id)}
                  style={{ cursor: editingMode !== 'criteria' ? 'pointer' : 'not-allowed' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {version.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {version.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {version.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingMode !== 'criteria') {
                          handleEdit(version);
                        }
                      }}
                      className={`text-indigo-600 hover:text-indigo-900 mr-3 ${editingMode === 'criteria' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={editingMode === 'criteria'}
                    >
                      Edit
                    </button>
                    {!version.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingMode !== 'criteria') {
                            handleActivate(version.id);
                          }
                        }}
                        className={`text-green-600 hover:text-green-900 mr-3 ${editingMode === 'criteria' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={editingMode === 'criteria'}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingMode !== 'criteria') {
                          handleDelete(version.id);
                        }
                      }}
                      className={`text-red-600 hover:text-red-900 ${editingMode === 'criteria' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={editingMode === 'criteria'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {versions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No versions defined. Click "Create New Version" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVersionId && !showAHPWizard && (
        <div className={`card p-6 ${editingMode === 'version' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Criteria for: {versions.find(v => v.id === selectedVersionId)?.name}
            </h3>
            <button
              onClick={handleRunAHP}
              className="btn btn-primary btn-sm"
              disabled={editingMode === 'version'}
            >
              Run AHP Wizard
            </button>
          </div>
          
          <CriteriaManagement 
            versionId={selectedVersionId} 
            onEditingStart={handleCriteriaEditingStart}
            onEditingEnd={handleCriteriaEditingEnd}
            isDisabled={editingMode === 'version'}
          />
        </div>
      )}

      {selectedVersionId && showAHPWizard && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              AHP Wizard for: {versions.find(v => v.id === selectedVersionId)?.name}
            </h3>
            <button
              onClick={() => setShowAHPWizard(false)}
              className="btn btn-outline btn-sm"
            >
              Back to Criteria
            </button>
          </div>
          
          <AHPWizard 
            versionId={selectedVersionId} 
            onComplete={() => setShowAHPWizard(false)} 
          />
        </div>
      )}

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
