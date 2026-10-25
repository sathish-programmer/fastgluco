import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Share2, Check, Flame, Heart, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DailyMotivationModalProps {
  isOpen: boolean;
  dayNumber: number;
  message: string;
  onClose: () => void;
}

export const DailyMotivationModal: React.FC<DailyMotivationModalProps> = ({
  isOpen,
  dayNumber,
  message,
  onClose
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareText = `Mito Reboot • Day ${dayNumber} of 365\n\n"${message}"\n\nDaily healthy living with Mito Reboot.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Mito Reboot • Day ${dayNumber} Motivation`,
          text: shareText
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors z-20 cursor-pointer shadow-xs"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 sm:p-8 space-y-6 relative z-10">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 shadow-2xs">
                <Sun className="h-4 w-4 text-amber-500 animate-spin-slow" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {t('motivation.dayTracker', `Day ${dayNumber} of 365`)}
                </span>
              </div>

              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {t('motivation.dailySequence', 'Daily Sequence')}
              </div>
            </div>

            {/* Central Inspiring Quote Card */}
            <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-purple-50/40 dark:from-slate-800/80 dark:via-slate-850/60 dark:to-slate-800/60 border border-amber-100/60 dark:border-slate-750">
              {/* Decorative quotation icon */}
              <div className="absolute -top-3 left-6 px-2 bg-white dark:bg-slate-900 text-amber-500 text-2xl font-serif leading-none select-none">
                “
              </div>

              <p className="text-base sm:text-lg font-bold text-slate-850 dark:text-slate-100 leading-relaxed pt-1.5 pb-2 text-center sm:text-left">
                {message}
              </p>

              {/* Sub-label */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-amber-200/40 dark:border-slate-700/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-rose-500" />
                  <span>{t('motivation.cellularDefense', 'Cellular Health & Mindset')}</span>
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <Heart className="h-3 w-3 fill-primary" />
                  <span>Mito Reboot</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">{t('common.copied', 'Copied to Clipboard!')}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{t('motivation.shareQuote', 'Share Motivation')}</span>
                  </>
                )}
              </button>

              {/* Primary Acknowledge Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-primary hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{t('motivation.startMyDay', 'Start My Day')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
