import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Heart, Sparkles, Check, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const ModeSwitcher: React.FC = () => {
  const { activeMode, setActiveMode, updateProfile, branding } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingMode, setPendingMode] = useState<'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const modesConfig = [
    {
      key: 'PREVENTION' as const,
      title: 'Cancer Prevention',
      description: 'Focus on lifestyle optimization, screening compliance, and wellness habits.',
      icon: ShieldCheck,
      gradient: 'from-emerald-500 to-teal-600',
      activeShadow: 'shadow-[0_15px_35px_-5px_rgba(16,185,129,0.3)]',
      borderGlow: 'border-emerald-400 dark:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      illustration: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      key: 'TREATMENT' as const,
      title: 'Cancer',
      description: 'Monitor treatments, logs symptoms, manage medications, and check glucose.',
      icon: Heart,
      gradient: 'from-indigo-500 to-violet-600',
      activeShadow: 'shadow-[0_15px_35px_-5px_rgba(99,102,241,0.3)]',
      borderGlow: 'border-indigo-400 dark:border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
      illustration: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )
    },
    {
      key: 'SECONDARY_PREVENTION' as const,
      title: 'Secondary Prevention',
      description: 'Track long-term recovery metrics and active recurrence prevention habits.',
      icon: Sparkles,
      gradient: 'from-rose-500 to-amber-500',
      activeShadow: 'shadow-[0_15px_35px_-5px_rgba(244,63,94,0.3)]',
      borderGlow: 'border-rose-400 dark:border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      illustration: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.861H13.62l.812-5.043L5.451 15.904h4.362z" />
        </svg>
      )
    }
  ];

  const currentDetails = modesConfig.find(m => m.key === activeMode) || modesConfig[0];
  const ActiveIcon = currentDetails.icon;

  const handleSelectMode = (key: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION') => {
    if (key === activeMode) {
      setIsOpen(false);
      return;
    }
    setPendingMode(key);
    setShowDisclaimer(true);
    setIsOpen(false);
  };

  return (
    <div className="w-full mb-6">
      {/* Compact Active Mode Selector Card */}
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full text-left rounded-3xl p-4 bg-gradient-to-r ${currentDetails.gradient} ${currentDetails.activeShadow} text-white flex items-center justify-between transition-all duration-300 transform active:scale-[0.98] border border-white/10`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <ActiveIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black text-white/70 uppercase tracking-widest block">Active Focus</span>
            <h4 className="font-sans font-black text-sm tracking-tight leading-none text-white mt-0.5">
              {currentDetails.title}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/35 px-3.5 py-1.5 rounded-full transition-all shrink-0">
          <span className="text-[10px] font-bold tracking-wide">Change</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </button>

      {/* Premium Sliding Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Bottom Sheet Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl z-10 transform translate-y-0 transition-transform duration-300 border-t border-slate-100 dark:border-slate-800">
            {/* Drag Handle Bar */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Header Section */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-sans font-black text-lg text-slate-850 dark:text-slate-100 tracking-tight leading-none">
                  Select Focus Journey
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  Switch focus modes to personalize your dashboard metrics
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-450 dark:text-slate-400 rounded-full transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Premium Vertical Cards Stack inside Bottom Sheet */}
            <div className="space-y-3">
              {modesConfig.map((mode) => {
                const isActive = activeMode === mode.key;
                
                return (
                  <button
                    key={mode.key}
                    onClick={() => handleSelectMode(mode.key)}
                    className={`w-full text-left rounded-3xl p-4 transition-all duration-300 transform relative overflow-hidden border flex items-center justify-between gap-4 ${
                      isActive
                        ? `bg-gradient-to-r ${mode.gradient} ${mode.activeShadow} ${mode.borderGlow} border-transparent text-white scale-[1.01]`
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/15 text-white' : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                      }`}>
                        {mode.illustration}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-sans font-black text-sm tracking-tight leading-none">
                          {mode.title}
                        </h4>
                        <p className={`text-[10px] mt-1.5 font-medium leading-normal ${
                          isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {mode.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                        isActive 
                          ? 'bg-white text-slate-800 border-white shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}>
                        {isActive && <Check className="h-3.5 w-3.5 text-slate-850 stroke-[3px]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal Overlay */}
      {showDisclaimer && pendingMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-rose-500 dark:text-rose-400 fill-rose-500 dark:fill-rose-400/20" />
              <span>Medical Disclaimer</span>
            </h3>
            <div
              className="max-h-60 overflow-y-auto pr-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6 whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: pendingMode === 'TREATMENT'
                  ? branding.cancerTreatmentDisclaimer
                  : pendingMode === 'SECONDARY_PREVENTION'
                  ? branding.cancerSecondaryDisclaimer
                  : branding.cancerPreventionDisclaimer
              }}
            ></div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDisclaimer(false);
                  setPendingMode(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                disabled={isSaving}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const success = await updateProfile({
                      cancerJourney: pendingMode,
                      cancerDisclaimerAccepted: true,
                      cancerDisclaimerAcceptedAt: new Date().toISOString()
                    });
                    if (success) {
                      await setActiveMode(pendingMode);
                      showToast('Focus journey updated successfully!', 'success');
                    } else {
                      showToast('Failed to update focus journey.', 'error');
                    }
                  } catch (err) {
                    showToast('An error occurred while updating.', 'error');
                  } finally {
                    setIsSaving(false);
                    setShowDisclaimer(false);
                    setPendingMode(null);
                  }
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 dark:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft flex items-center justify-center"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'I Understand & Accept'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
