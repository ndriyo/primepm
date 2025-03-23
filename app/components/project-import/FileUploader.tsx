'use client';

import { useState, useCallback, useRef } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

interface FileUploaderProps {
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onValidateRequest: () => void;
  isValidating: boolean;
  isValidationComplete: boolean;
}

export function FileUploader({
  selectedFile,
  onFileSelected,
  onValidateRequest,
  isValidating,
  isValidationComplete
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        onFileSelected(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, [onFileSelected]);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        onFileSelected(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, [onFileSelected]);
  
  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  const handleClearFile = useCallback(() => {
    onFileSelected(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelected]);
  
  const getDropzoneClasses = () => {
    let classes = "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all";
    if (isDragging) {
      classes += " border-blue-500 bg-blue-50";
    } else {
      classes += " border-gray-300 hover:border-gray-400";
    }
    return classes;
  };
  
  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={getDropzoneClasses()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            Drop your Excel file here or click to browse files
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Only Excel files (.xlsx, .xls) are accepted
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center">
              <DocumentCheckIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Excel file
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              disabled={isValidating}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {!isValidationComplete && (
            <button
              onClick={onValidateRequest}
              disabled={isValidating}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Validate File'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
