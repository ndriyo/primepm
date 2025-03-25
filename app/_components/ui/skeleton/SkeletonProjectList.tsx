import { SkeletonElement } from './SkeletonElement';
import { SkeletonText } from './SkeletonText';

interface SkeletonProjectListProps {
  count?: number;
  className?: string;
  showActions?: boolean;
}

export const SkeletonProjectList = ({
  count = 5,
  className = '',
  showActions = true
}: SkeletonProjectListProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter/search bar */}
      <div className="flex justify-between items-center mb-6">
        <SkeletonElement className="h-10 w-48" rounded="rounded-md" />
        {showActions && (
          <div className="flex space-x-2">
            <SkeletonElement className="h-10 w-10" rounded="rounded-md" />
            <SkeletonElement className="h-10 w-24" rounded="rounded-md" />
          </div>
        )}
      </div>
      
      {/* Project items */}
      <div className="space-y-4">
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <div key={`project-${i}`} className="card flex flex-col sm:flex-row justify-between">
              <div className="flex-1 min-w-0">
                {/* Project title */}
                <SkeletonElement className="h-6 w-3/4 mb-2" />
                
                {/* Project description */}
                <SkeletonText lines={2} lastLineWidth="60%" />
                
                {/* Project metadata */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <SkeletonElement className="h-6 w-20" rounded="rounded-full" />
                  <SkeletonElement className="h-6 w-24" rounded="rounded-full" />
                  <SkeletonElement className="h-6 w-16" rounded="rounded-full" />
                </div>
              </div>
              
              {/* Project action buttons */}
              {showActions && (
                <div className="flex mt-4 sm:mt-0 sm:ml-4 space-x-2 items-start">
                  <SkeletonElement className="h-9 w-24" rounded="rounded-md" />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
