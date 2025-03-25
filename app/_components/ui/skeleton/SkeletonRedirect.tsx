export const SkeletonRedirect = () => {
  return (
    <div className="flex flex-col justify-center items-center h-64 w-full">
      <div className="skeleton-pulse h-6 w-64 rounded mb-4"></div>
      <div className="skeleton-pulse h-10 w-10 rounded-full animate-spin border-4 border-gray-200"></div>
    </div>
  );
};
