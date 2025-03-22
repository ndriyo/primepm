import { SkeletonElement } from './SkeletonElement';

interface SkeletonChartProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  showLegend?: boolean;
}

export const SkeletonChart = ({
  className = '',
  height = '200px',
  width = '100%',
  showLegend = true
}: SkeletonChartProps) => {
  return (
    <div className={`card ${className}`}>
      {/* Chart title */}
      <div className="mb-4">
        <SkeletonElement className="h-6 w-2/3" />
      </div>
      
      {/* Chart area */}
      <div className="relative">
        <SkeletonElement 
          height={height}
          width={width}
          rounded="rounded-lg"
        />
        
        {/* Optional chart labels */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <SkeletonElement className="h-4 w-1/3" />
        </div>
      </div>
      
      {/* Chart legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={`legend-${i}`} className="flex items-center">
                <SkeletonElement className="h-4 w-4 rounded-sm mr-2" />
                <SkeletonElement className="h-4 w-16" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
