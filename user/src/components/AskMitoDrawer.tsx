import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, ChevronRight, AlertCircle } from 'lucide-react';

interface AskMitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AskMitoDrawer: React.FC<AskMitoDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab: _onNavigateToTab
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  if (!isOpen) return null;

  const prompts = [
    {
      id: 'cgm',
      title: '📈 Explain my CGM Report',
      description: 'Understand mean glucose, Time-in-Range (TIR), and glucose variability spikes.',
      answer: 'Continuous Glucose Monitoring (CGM) measures interstitial glucose every 5 minutes. Key metrics include Time-In-Range (70-180 mg/dL target), glycemic variability, and post-prandial spikes after meals.'
    },
    {
      id: 'doctor_questions',
      title: '🩺 What questions should I ask my doctor?',
      description: 'Generate a personalized consultation checklist for your physician visit.',
      answer: 'Recommended Doctor Checklist:\n1. How do my recent blood glucose patterns correlate with my medication?\n2. Are there specific physical activities I should prioritize?\n3. What specific lab markers should we monitor next?'
    },
    {
      id: 'env',
      title: '🫁 What does my environment assessment mean?',
      description: 'Learn how air quality, microplastics, and heavy metals affect cell resilience.',
      answer: 'Environmental exposures like PM2.5 particulate matter and endocrine disruptors increase systemic oxidative stress. Reducing exposure through HEPA air filtration and water purification helps protect cellular integrity.'
    },
    {
      id: 'feature_help',
      title: '💡 Help me understand Mito_Reboot features',
      description: 'Quick tour of habit logging, report uploads, and focus journeys.',
      answer: 'Mito_Reboot integrates your habits, metabolic data, and environment into a unified focus mode. You can switch focus modes anytime at the top of your dashboard.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-2xl z-10 border-t border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col"
      >
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />

        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Ask Mito_Reboot
              </h3>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                Educational Support Companion
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Disclaimer Warning Box */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] text-blue-700 dark:text-blue-300 font-medium mb-4 flex items-start space-x-2 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
          <span>
            <strong className="font-bold">Educational Support Only: </strong>
            Ask Mito_Reboot provides general health education and feature navigation. It does not provide medical diagnoses or replace direct consultation with your healthcare provider.
          </span>
        </div>

        {/* Prompts list */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {prompts.map(p => (
            <div
              key={p.id}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              <button
                onClick={() => setSelectedPrompt(selectedPrompt === p.id ? null : p.id)}
                className="w-full text-left flex items-start justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {p.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.description}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${selectedPrompt === p.id ? 'rotate-90' : ''}`} />
              </button>

              {selectedPrompt === p.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900 p-3 rounded-2xl"
                >
                  {p.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
