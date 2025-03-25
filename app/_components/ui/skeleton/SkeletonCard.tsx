import { SkeletonElement } from './SkeletonElement';
import { SkeletonText } from './SkeletonText';

interface SkeletonCardProps {
  className?: string;
  headerAction?: boolean;
  footerAction?: boolean;
}

export const SkeletonCard = ({
  className = '',
  headerAction = false,
  footerAction = false
}: SkeletonCardProps) => {
  return (
    <div className={`card ${className}`}>
      <div className="flex flex-col space-y-4">
        {/* Card header */}
        <div className="flex justify-between items-center">
          <SkeletonElement className="h-6 w-2/3" />
          {headerAction && <SkeletonElement className="h-8 w-8 rounded-full" />}
        </div>
        
        {/* Card content */}
        <SkeletonText lines={2} />
        
        {/* Card footer */}
        {footerAction && (
          <div className="pt-2 flex justify-end">
            <SkeletonElement className="h-8 w-24" />
          </div>
        )}
      </div>
    </div>
  );
};
