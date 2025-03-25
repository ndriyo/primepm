import { SkeletonElement } from './SkeletonElement';

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const SkeletonText = ({
  lines = 1,
  className = '',
  lastLineWidth = '75%'
}: SkeletonTextProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <SkeletonElement
            key={i}
            className={`h-4 ${i === lines - 1 && lines > 1 ? lastLineWidth : 'w-full'}`}
          />
        ))}
    </div>
  );
};
