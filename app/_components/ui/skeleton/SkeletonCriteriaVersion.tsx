import { SkeletonElement } from './SkeletonElement';
import { SkeletonText } from './SkeletonText';
import { SkeletonTable } from './SkeletonTable';

export const SkeletonCriteriaVersion = () => {
  return (
    <div className="space-y-6">
      {/* Criteria Versions card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <SkeletonElement className="h-7 w-48" />
          <SkeletonElement className="h-9 w-32 rounded-md" />
        </div>

        {/* Table for versions */}
        <SkeletonTable 
          rows={4} 
          columns={5} 
          showHeader={true} 
        />
      </div>

      {/* Criteria Management card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <SkeletonElement className="h-7 w-64" />
          <SkeletonElement className="h-9 w-32 rounded-md" />
        </div>

        <div className="mb-6">
          <SkeletonText lines={2} className="mb-4" />
          
          {/* Criteria cards */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <SkeletonElement className="h-6 w-1/3" />
                  <div className="flex space-x-2">
                    <SkeletonElement className="h-8 w-16 rounded-md" />
                    <SkeletonElement className="h-8 w-16 rounded-md" />
                  </div>
                </div>
                <SkeletonText lines={2} />
                <div className="mt-3 flex items-center">
                  <SkeletonElement className="h-5 w-24 mr-2" />
                  <SkeletonElement className="h-5 w-64" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
