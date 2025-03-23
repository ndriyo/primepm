'use client';

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface ValidationResult {
  rowNumber: number;
  projectName: string;
  isValid: boolean;
  errors: Record<string, string>;
}

interface ResultsDisplayProps {
  results: ValidationResult[];
  validCount: number;
  invalidCount: number;
  onImport: () => void;
  onCancel: () => void;
}

export function ResultsDisplay({
  results,
  validCount,
  invalidCount,
  onImport,
  onCancel
}: ResultsDisplayProps) {
  const totalCount = results.length;
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Validation Results</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-medium">{totalCount}</span> projects processed
          </div>
          <div className="text-sm">
            <span className="font-medium text-green-600">{validCount}</span> valid
          </div>
          <div className="text-sm">
            <span className="font-medium text-red-600">{invalidCount}</span> with errors
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Row #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <tr key={result.rowNumber} className={result.isValid ? 'bg-white' : 'bg-red-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.rowNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.projectName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {result.isValid ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="mr-1 h-4 w-4 text-green-500" />
                      Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="mr-1 h-4 w-4 text-red-500" />
                      Error
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {!result.isValid && Object.entries(result.errors).map(([field, message]) => (
                    <div key={field} className="text-red-600">
                      {field}: {message}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-4 justify-end pt-4">
        <button
          onClick={onCancel}
          className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          disabled={validCount === 0}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Import Valid Projects ({validCount})
        </button>
      </div>
    </div>
  );
}
