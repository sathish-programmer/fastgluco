import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, ChevronRight, Wind, Droplets, Dna, ShoppingBag, Heart } from 'lucide-react';

export const LATEST_RELEASE_VERSION = 'v4.5.0';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreFeature: (featureKey: string) => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onExploreFeature
}) => {
  if (!isOpen) return null;

  const features = [
    {
      key: 'ENVIRONMENT',
      icon: <Wind className="h-6 w-6 text-sky-500" />,
      bg: 'bg-sky-500/10 border-sky-500/20',
      title: '🫁 Environmental Air & Exposure Audit',
      description: 'Check local AQI, PM2.5 levels, indoor air toxins, and receive protective guidance.',
      actionLabel: 'Check Environment'
    },
    {
      key: 'WATER',
      icon: <Droplets className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-500/10 border-blue-500/20',
      title: '💧 Water Safety & Contaminants',
      description: 'Assess municipal water purity, heavy metals, microplastics, and filter recommendations.',
      actionLabel: 'Check Water'
    },
    {
      key: 'GENETICS',
      icon: <Dna className="h-6 w-6 text-violet-500" />,
      bg: 'bg-violet-500/10 border-violet-500/20',
      title: '🧬 Genetic Susceptibility & Lifestyle',
      description: 'Understand hereditary predisposition factors and protective dietary antioxidants.',
      actionLabel: 'View Genetics'
    },
    {
      key: 'RECOMMENDED_PRODUCTS',
      icon: <ShoppingBag className="h-6 w-6 text-emerald-500" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: '🛍️ Verified Healthcare Products',
      description: 'Air purifiers, N95 masks, water filters, and organic non-toxic daily essentials.',
      actionLabel: 'Browse Products'
    },
    {
      key: 'WIGS',
      icon: <Heart className="h-6 w-6 text-rose-500" />,
      bg: 'bg-rose-500/10 border-rose-500/20',
      title: '💇 Wigs for Treatment-Related Hair Loss',
      description: 'Comfortable, medical-grade wigs and soft head coverings curated for treatment support.',
      actionLabel: 'Explore Wigs'
    }
  ];

  const handleDismiss = () => {
    localStorage.setItem(`mito_whats_new_dismissed_${LATEST_RELEASE_VERSION}`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block">Release {LATEST_RELEASE_VERSION}</span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-0.5">
                What’s New in Mito_Reboot
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feature Cards Stack */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {features.map(f => (
            <div
              key={f.key}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className={`p-3 rounded-2xl border shrink-0 ${f.bg}`}>
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 tracking-tight">
                    {f.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleDismiss();
                  onExploreFeature(f.key);
                }}
                className="shrink-0 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 mt-1"
              >
                <span>Explore</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Check back anytime from your profile settings
          </span>
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all hover:opacity-90"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};
