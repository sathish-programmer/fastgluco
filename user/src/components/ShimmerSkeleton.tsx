import React from 'react';

interface ShimmerSkeletonProps {
  className?: string;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ className = 'h-16 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl ${className}`}
    />
  );
};

export const DashboardHabitSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          className="p-3 bg-white/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>
          <div className="h-2 w-14 bg-slate-100 dark:bg-slate-700/60 rounded-md" />
        </div>
      ))}
    </div>
  );
};

