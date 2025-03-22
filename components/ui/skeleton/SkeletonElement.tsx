interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: string;
}

export const SkeletonElement = ({ 
  className = '',
  height,
  width,
  rounded = 'rounded'
}: SkeletonProps) => {
  const style: React.CSSProperties = {};
  
  if (height) style.height = height;
  if (width) style.width = width;
  
  return (
    <div 
      className={`skeleton-pulse ${rounded} ${className}`}
      style={style}
    />
  );
};
