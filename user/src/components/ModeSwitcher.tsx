import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Heart, Sparkles, Check, ChevronRight, X, ShieldAlert } from 'lucide-react';
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
      cardTheme: 'border-emerald-500/80 dark:border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs shadow-emerald-500/5',
      badgeDot: 'bg-emerald-500',
      badgeText: 'text-emerald-700 dark:text-emerald-400',
      iconContainer: 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      changeBtn: 'bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700',
      illustration: (
        <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      key: 'TREATMENT' as const,
      title: 'Cancer Treatment',
      description: 'Monitor treatments, logs symptoms, manage medications, and check glucose.',
      icon: Heart,
      cardTheme: 'border-blue-500/80 dark:border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs shadow-blue-500/5',
      badgeDot: 'bg-blue-500',
      badgeText: 'text-blue-700 dark:text-blue-400',
      iconContainer: 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      changeBtn: 'bg-blue-100/80 hover:bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300/80 dark:border-blue-700',
      illustration: (
        <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )
    },
    {
      key: 'SECONDARY_PREVENTION' as const,
      title: 'Secondary Prevention',
      description: 'Track long-term recovery metrics and active recurrence prevention habits.',
      icon: Sparkles,
      cardTheme: 'border-teal-500/80 dark:border-teal-500/70 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs shadow-teal-500/5',
      badgeDot: 'bg-teal-500',
      badgeText: 'text-teal-700 dark:text-teal-400',
      iconContainer: 'bg-teal-100/80 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      changeBtn: 'bg-teal-100/80 hover:bg-teal-200 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border-teal-300/80 dark:border-teal-700',
      illustration: (
        <svg className="w-7 h-7 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.861H13.62l.812-5.043L5.451 15.904h4.362z" />
        </svg>
      )
    }
  ];

  const currentDetails = modesConfig.find(m => m.key === activeMode) || modesConfig[0];
  const ActiveIcon = currentDetails.icon;

  const getDynamicDisclaimer = (mode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION') => {
    if (mode === 'TREATMENT') {
      return (
        branding?.cancerTreatmentDisclaimer ||
        `Lifestyle Guidance & Legal Disclaimer for Cancer Patients:

1. Nature of the Service:
This application provides lifestyle, circadian fasting, nutritional, and metabolic habit tracking designed solely to support overall wellness. It does NOT constitute medical treatment, chemotherapy, surgery, radiation, or direct medical diagnosis.

2. Consultation with Healthcare Team:
All recommendations must be evaluated in direct consultation with your treating oncologist, physician, or oncology dietician before making dietary or physical changes.

3. Emergency Situations:
If you experience any severe symptoms, fever during chemotherapy, acute pain, or emergencies, contact your healthcare provider or visit an emergency room immediately.`
      );
    }
    if (mode === 'SECONDARY_PREVENTION') {
      return (
        branding?.cancerSecondaryDisclaimer ||
        `Lifestyle & Nutrition Guidance for Cancer Survivors:

1. Recurrence Risk Support:
This program is designed to support long-term metabolic health, antioxidant intake, and cellular repair habits for individuals in post-treatment survivorship.

2. Professional Supervision:
This app complements, but does not replace, regular oncological screenings, blood work, or follow-ups with your oncology care team.

3. Personal Responsibility:
By proceeding, you agree to utilize this application as an informative lifestyle companion alongside professional medical advice.`
      );
    }
    return (
      branding?.cancerPreventionDisclaimer ||
      `Lifestyle Guidance & Legal Disclaimer for General Cancer Prevention:

1. Preventative Wellness:
This application offers evidence-informed guidance on circadian fasting, sleep hygiene, metabolic stability, and reducing environmental toxin exposure.

2. General Educational Use:
The guidance provided is for informational and healthy living purposes. It is not intended to diagnose, treat, cure, or prevent any clinical disease without professional medical consultation.

3. Screening Awareness:
Always adhere to recommended age-appropriate screening tests and consult certified medical practitioners for health concerns.`
    );
  };

  const handleSelectMode = (key: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION') => {
    if (key === activeMode) {
      setIsOpen(false);
      return;
    }
    setPendingMode(key);
    setShowDisclaimer(true);
    setIsOpen(false);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingMode) return;
    setIsSaving(true);
    try {
      await updateProfile({
        activeMode: pendingMode,
        cancerJourney: pendingMode,
        cancerDisclaimerAccepted: true,
        cancerDisclaimerAcceptedAt: new Date().toISOString()
      } as any);
      setActiveMode(pendingMode);
      showToast(`Switched active focus to ${modesConfig.find(m => m.key === pendingMode)?.title}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update focus mode', 'error');
    } finally {
      setIsSaving(false);
      setShowDisclaimer(false);
      setPendingMode(null);
    }
  };

  return (
    <div className="w-full mb-3">
      {/* Modern Clinical Focus Card with Distinct Themed Active Border */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full text-left rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-100 flex items-center justify-between transition-all duration-200 border-2 ${currentDetails.cardTheme} active:scale-[0.99] cursor-pointer group`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${currentDetails.iconContainer}`}>
            <ActiveIcon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`h-2 w-2 rounded-full ${currentDetails.badgeDot}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest block ${currentDetails.badgeText}`}>
                Active Focus
              </span>
            </div>
            <h4 className="font-sans font-black text-xs sm:text-sm tracking-tight leading-tight text-slate-900 dark:text-slate-100 truncate">
              {currentDetails.title}
            </h4>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all shrink-0 border text-[10.5px] font-extrabold tracking-wide ${currentDetails.changeBtn}`}>
          <span>Change</span>
          <ChevronRight className="h-3 w-3 opacity-70" />
        </div>
      </button>

      {/* Sliding Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
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
                className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-450 dark:text-slate-400 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Vertical Cards Stack inside Bottom Sheet */}
            <div className="space-y-3">
              {modesConfig.map((mode) => {
                const isActive = activeMode === mode.key;

                return (
                  <button
                    key={mode.key}
                    onClick={() => handleSelectMode(mode.key)}
                    className={`w-full text-left rounded-2xl p-4 transition-all duration-200 border flex items-center justify-between gap-4 cursor-pointer ${isActive
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${isActive ? mode.iconContainer : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}>
                        {mode.illustration}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-sans font-black text-sm tracking-tight leading-none text-slate-900 dark:text-slate-100">
                          {mode.title}
                        </h4>
                        <p className="text-[11px] mt-1.5 font-medium leading-normal text-slate-500 dark:text-slate-400">
                          {mode.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}>
                        {isActive && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Admin-Configured Disclaimer Modal Overlay */}
      {showDisclaimer && pendingMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  Medical Disclaimer
                </h3>
                <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
                  {modesConfig.find(m => m.key === pendingMode)?.title}
                </span>
              </div>
            </div>

            {/* Dynamic Admin Content Box */}
            <div className="flex-1 overflow-y-auto my-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-72">
              {getDynamicDisclaimer(pendingMode).includes('<') ? (
                <div 
                  className="space-y-2 [&_p]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: getDynamicDisclaimer(pendingMode) }} 
                />
              ) : (
                <div className="whitespace-pre-wrap">{getDynamicDisclaimer(pendingMode)}</div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDisclaimer(false); setPendingMode(null); }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? 'Switching...' : 'I Understand & Accept'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
