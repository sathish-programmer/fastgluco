import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Your health journey starts here",
  description = "Start logging your habits, environment exposures, or reports to unlock personalized metabolic insights.",
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full p-8 rounded-3xl bg-slate-50/80 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center my-4"
    >
      <div className="p-4 bg-primary/10 rounded-3xl text-primary mb-3 shadow-xs">
        {icon || <Sparkles className="h-8 w-8" />}
      </div>
      <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed mt-1 mb-4">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center space-x-2 transform active:scale-[0.98]"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
};
