import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 3,
  className = "h-20 w-full"
}) => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} bg-slate-100 dark:bg-slate-800 rounded-3xl`}
        />
      ))}
    </div>
  );
};
