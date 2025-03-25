'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/_contexts/AuthContext';

export function ImportInstructions() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { user, organization } = useAuth();
  
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    
    try {
      // Fetch the template from the API
      const response = await fetch('/api/projects/import/template', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
          'x-organization-id': organization?.id || '',
          'x-department-id': user?.departmentId || '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
      }
      
      // Get the filename from the Content-Disposition header or use a default name
      let filename = 'project_import_template.xlsx';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = /filename="([^"]+)"/.exec(contentDisposition);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      
      // Get the Excel file as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up the temporary objects
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Template download failed:', error);
      alert(`Failed to download template: ${(error as Error).message}`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Instructions:</h2>
      
      <ol className="list-decimal pl-6 space-y-2">
        <li>Download the Excel template with the current criteria structure</li>
        <li>Fill in your project information according to the template guidelines</li>
        <li>Upload the completed file (Excel or JSON format) and validate the data</li>
        <li>Review validation results and import valid projects</li>
      </ol>
      
      <button
        onClick={handleDownloadTemplate}
        disabled={isDownloading}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
        {isDownloading ? 'Downloading...' : 'Download Template'}
      </button>
      
      <p className="text-sm text-gray-500 mt-2">
        The template includes all required fields and criteria based on the current active version.
        Follow the instructions in the template for proper formatting.
      </p>
      
      <div className="mt-4 bg-blue-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-blue-800">Supported File Formats:</h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium">Excel (.xlsx, .xls)</span>: Use the downloaded template for the correct structure. 
            Column headers should match field names (e.g., "Project Name", "Department", "Budget", etc.).
          </li>
          <li>
            <span className="font-medium">JSON</span>: Must include a "projects" array with project objects containing the required fields.
          </li>
        </ul>
        <p className="mt-2 text-sm text-blue-700">
          The system will automatically detect your file type and process it accordingly.
        </p>
      </div>
    </div>
  );
}
