import { SkeletonElement } from './SkeletonElement';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true
}: SkeletonTableProps) => {
  return (
    <div className={`overflow-hidden rounded-lg shadow ${className}`}>
      <div className="bg-white">
        <div className="divide-y divide-gray-200">
          {/* Table header */}
          {showHeader && (
            <div className="bg-gray-100 px-4 py-3">
              <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                {Array(columns)
                  .fill(0)
                  .map((_, i) => (
                    <div key={`header-${i}`} className="px-2">
                      <SkeletonElement className="h-6" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Table rows */}
          {Array(rows)
            .fill(0)
            .map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="px-4 py-3">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                  {Array(columns)
                    .fill(0)
                    .map((_, colIndex) => (
                      <div key={`cell-${rowIndex}-${colIndex}`} className="px-2">
                        <SkeletonElement 
                          className="h-5" 
                          width={colIndex === 0 ? '80%' : colIndex === columns - 1 ? '40%' : '70%'} 
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
