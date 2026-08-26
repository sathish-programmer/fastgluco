import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AiFeatureDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiChat: () => void;
  onContinueManually: () => void;
  targetFeatureName?: string;
}

export const AiFeatureDiscoveryModal: React.FC<AiFeatureDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onOpenAiChat,
  onContinueManually,
  targetFeatureName = 'Habit Logging'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-center"
        >
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Bot Badge */}
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
            <Bot className="h-8 w-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full mb-2">
            <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>Faster AI Experience</span>
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            Log {targetFeatureName} 10x Faster with AI!
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
            Did you know? You can answer a quick 60-second voice check-in or upload reports with our AI Assistant — no manual typing needed!
          </p>

          {/* Quick Perks */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Voice recognition auto-logs your habits</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Instant report parsing & dashboard updates</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onOpenAiChat();
                onClose();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>🤖 Try AI Check-in Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                onContinueManually();
                onClose();
              }}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Continue Manually
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
