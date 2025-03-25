import { SkeletonElement } from './SkeletonElement';
import { SkeletonText } from './SkeletonText';

export const SkeletonProjectForm = () => {
  return (
    <div className="mt-4">
      {/* Form Title */}
      <div className="mb-6">
        <SkeletonElement className="h-8 w-48" />
      </div>
      
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          <div className="flex-1 text-center">
            <div className="rounded-full h-8 w-8 skeleton-pulse flex items-center justify-center mx-auto mb-2"></div>
            <SkeletonElement className="h-4 w-24 mx-auto" />
          </div>
          <div className="flex-1 text-center">
            <div className="rounded-full h-8 w-8 skeleton-pulse flex items-center justify-center mx-auto mb-2"></div>
            <SkeletonElement className="h-4 w-32 mx-auto" />
          </div>
          <div className="flex-1 text-center">
            <div className="rounded-full h-8 w-8 skeleton-pulse flex items-center justify-center mx-auto mb-2"></div>
            <SkeletonElement className="h-4 w-28 mx-auto" />
          </div>
        </div>
        <div className="relative mt-2">
          <div className="absolute top-1/2 transform -translate-y-1/2 left-0 right-0 h-1 bg-gray-200"></div>
          <div className="absolute top-1/2 transform -translate-y-1/2 left-0 h-1 w-1/6 skeleton-pulse"></div>
        </div>
      </div>

      {/* Form fields - Project Info section */}
      <div className="space-y-6">
        {/* Project name */}
        <div>
          <SkeletonElement className="h-5 w-32 mb-2" />
          <SkeletonElement className="h-10 w-full rounded-md" />
        </div>
        
        {/* Project description */}
        <div>
          <SkeletonElement className="h-5 w-40 mb-2" />
          <SkeletonElement className="h-28 w-full rounded-md" />
        </div>
        
        {/* Department */}
        <div>
          <SkeletonElement className="h-5 w-36 mb-2" />
          <SkeletonElement className="h-10 w-full rounded-md" />
        </div>
        
        {/* Budget */}
        <div>
          <SkeletonElement className="h-5 w-24 mb-2" />
          <SkeletonElement className="h-10 w-full rounded-md" />
        </div>
        
        {/* Dates - two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SkeletonElement className="h-5 w-28 mb-2" />
            <SkeletonElement className="h-10 w-full rounded-md" />
          </div>
          <div>
            <SkeletonElement className="h-5 w-24 mb-2" />
            <SkeletonElement className="h-10 w-full rounded-md" />
          </div>
        </div>
        
        {/* Resources */}
        <div>
          <SkeletonElement className="h-5 w-32 mb-2" />
          <SkeletonElement className="h-10 w-full rounded-md" />
        </div>
        
        {/* Tags */}
        <div>
          <SkeletonElement className="h-5 w-20 mb-2" />
          <SkeletonElement className="h-10 w-full rounded-md" />
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <SkeletonElement className="h-10 w-24 rounded-md" />
          <SkeletonElement className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
};
