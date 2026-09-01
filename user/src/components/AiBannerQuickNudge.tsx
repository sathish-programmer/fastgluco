import React from 'react';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

interface AiBannerQuickNudgeProps {
  onOpenAiCheckin?: () => void;
  title?: string;
  subtitle?: string;
}

export const AiBannerQuickNudge: React.FC<AiBannerQuickNudgeProps> = ({
  onOpenAiCheckin,
  title = "Log all daily habits 10x faster",
  subtitle = "Log habits & upload reports in under 60s via AI Voice"
}) => {
  if (!onOpenAiCheckin) return null;

  return (
    <div className="mb-2 relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-700 dark:via-indigo-700 dark:to-violet-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 shadow-md hover:shadow-xl transition-all duration-300 border border-white/20 group">
      {/* Decorative ambient glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
      <div className="absolute -left-6 -top-6 w-20 h-20 bg-indigo-400/20 rounded-full blur-lg pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner backdrop-blur-md group-hover:scale-105 transition-transform">
            <Bot className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black text-white tracking-tight leading-snug">
                {title}
              </h4>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                <Sparkles className="h-2.5 w-2.5 fill-slate-950" /> AI POWERED
              </span>
            </div>
            <p className="text-[11px] text-blue-100/90 font-medium mt-0.5 truncate max-w-md">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAiCheckin}
          className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 font-extrabold text-xs rounded-xl sm:rounded-2xl shadow-sm hover:shadow transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 group-hover:translate-x-0.5"
        >
          <span>Try AI</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
