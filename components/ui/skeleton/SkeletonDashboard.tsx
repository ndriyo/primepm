import { SkeletonCard } from './SkeletonCard';
import { SkeletonChart } from './SkeletonChart';
import { SkeletonTable } from './SkeletonTable';

export const SkeletonDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Dashboard heading */}
      <div className="mb-6">
        <div className="h-8 w-48 skeleton-pulse rounded mb-2" />
        <div className="h-4 w-96 skeleton-pulse rounded" />
      </div>
      
      {/* Metrics summary cards section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <SkeletonCard key={`metric-${i}`} />
          ))}
      </div>
      
      {/* Charts section - 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height="240px" />
        <SkeletonChart height="240px" />
      </div>
      
      {/* Projects section */}
      <div className="mt-6">
        <div className="h-6 w-48 skeleton-pulse rounded mb-4" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    </div>
  );
};
