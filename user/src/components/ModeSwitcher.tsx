import React, { useState } from 'react';
import { useAuth, type FocusModeType } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck, Heart, Sparkles, Check, ChevronRight, X, ShieldAlert,
  Brain, Droplets, HeartPulse, Flower2, Gauge, Hourglass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ModeSwitcher: React.FC = () => {
  const { activeMode, setActiveMode, updateProfile, branding } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingMode, setPendingMode] = useState<FocusModeType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const modesConfig: {
    key: FocusModeType;
    title: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    cardTheme: string;
    badgeDot: string;
    badgeText: string;
    iconContainer: string;
    changeBtn: string;
  }[] = [
    {
      key: 'PREVENTION',
      title: 'Cancer Prevention',
      shortLabel: 'Prevention',
      description: 'Metabolic circadian fasting, toxin avoidance, and screening compliance.',
      icon: ShieldCheck,
      accentColor: '#10B981',
      cardTheme: 'border-emerald-500/80 dark:border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs shadow-emerald-500/5',
      badgeDot: 'bg-emerald-500',
      badgeText: 'text-emerald-700 dark:text-emerald-400',
      iconContainer: 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      changeBtn: 'bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-700'
    },
    {
      key: 'TREATMENT',
      title: 'Cancer Treatment',
      shortLabel: 'Treatment',
      description: 'Treatment tracking, symptom management, medication logging, and clinical monitoring.',
      icon: Heart,
      accentColor: '#3B82F6',
      cardTheme: 'border-blue-500/80 dark:border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs shadow-blue-500/5',
      badgeDot: 'bg-blue-500',
      badgeText: 'text-blue-700 dark:text-blue-400',
      iconContainer: 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      changeBtn: 'bg-blue-100/80 hover:bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300/80 dark:border-blue-700'
    },
    {
      key: 'SECONDARY_PREVENTION',
      title: 'Secondary Prevention',
      shortLabel: 'Recurrence Care',
      description: 'Long-term survivorship habits, antioxidant support, and recurrence protection.',
      icon: Sparkles,
      accentColor: '#14B8A6',
      cardTheme: 'border-teal-500/80 dark:border-teal-500/70 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs shadow-teal-500/5',
      badgeDot: 'bg-teal-500',
      badgeText: 'text-teal-700 dark:text-teal-400',
      iconContainer: 'bg-teal-100/80 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      changeBtn: 'bg-teal-100/80 hover:bg-teal-200 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border-teal-300/80 dark:border-teal-700'
    },
    {
      key: 'AGEING',
      title: 'Ageing & Longevity',
      shortLabel: 'Ageing',
      description: 'Decade-based organ defense (Eyes, Dental, Bone, Cardiac, Brain, Metabolic).',
      icon: Hourglass,
      accentColor: '#8B5CF6',
      cardTheme: 'border-purple-500/80 dark:border-purple-500/70 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs shadow-purple-500/5',
      badgeDot: 'bg-purple-500',
      badgeText: 'text-purple-700 dark:text-purple-400',
      iconContainer: 'bg-purple-100/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      changeBtn: 'bg-purple-100/80 hover:bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-300/80 dark:border-purple-700'
    },
    {
      key: 'PCOD',
      title: 'PCOD / PCOS Care',
      shortLabel: 'PCOD',
      description: 'Menstrual cycle predictor, androgen/hirsutism monitoring, and metabolic habits.',
      icon: Flower2,
      accentColor: '#EC4899',
      cardTheme: 'border-pink-500/80 dark:border-pink-500/70 bg-pink-50/50 dark:bg-pink-950/30 shadow-xs shadow-pink-500/5',
      badgeDot: 'bg-pink-500',
      badgeText: 'text-pink-700 dark:text-pink-400',
      iconContainer: 'bg-pink-100/80 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      changeBtn: 'bg-pink-100/80 hover:bg-pink-200 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200 border-pink-300/80 dark:border-pink-700'
    },
    {
      key: 'DIABETES',
      title: 'Diabetes & Glucose',
      shortLabel: 'Diabetes',
      description: 'Glycemic control, quarterly HbA1c curves, and yearly podiatry/retina checks.',
      icon: Droplets,
      accentColor: '#059669',
      cardTheme: 'border-emerald-600/80 dark:border-emerald-600/70 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs shadow-emerald-600/5',
      badgeDot: 'bg-emerald-600',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      iconContainer: 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
      changeBtn: 'bg-emerald-100/80 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 border-emerald-300/80 dark:border-emerald-700'
    },
    {
      key: 'HYPERTENSION',
      title: 'Hypertension (HTN)',
      shortLabel: 'Hypertension',
      description: 'Morning & evening blood pressure logs, low-salt DASH tracking, and relaxation.',
      icon: Gauge,
      accentColor: '#EF4444',
      cardTheme: 'border-rose-500/80 dark:border-rose-500/70 bg-rose-50/50 dark:bg-rose-950/30 shadow-xs shadow-rose-500/5',
      badgeDot: 'bg-rose-500',
      badgeText: 'text-rose-700 dark:text-rose-400',
      iconContainer: 'bg-rose-100/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      changeBtn: 'bg-rose-100/80 hover:bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border-rose-300/80 dark:border-rose-700'
    },
    {
      key: 'PARKINSON',
      title: "Parkinson's Care",
      shortLabel: "Parkinson's",
      description: 'Motor symptom severity curves (Tremor/Rigidity/Bradykinesia) and dopamine habits.',
      icon: Brain,
      accentColor: '#7C3AED',
      cardTheme: 'border-violet-500/80 dark:border-violet-500/70 bg-violet-50/50 dark:bg-violet-950/30 shadow-xs shadow-violet-500/5',
      badgeDot: 'bg-violet-500',
      badgeText: 'text-violet-700 dark:text-violet-400',
      iconContainer: 'bg-violet-100/80 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      changeBtn: 'bg-violet-100/80 hover:bg-violet-200 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 border-violet-300/80 dark:border-violet-700'
    },
    {
      key: 'CARDIAC',
      title: 'Cardiac Health',
      shortLabel: 'Cardiac',
      description: 'Arterial protection, lipid defense, BMI management, and gentle cardiac recovery.',
      icon: HeartPulse,
      accentColor: '#DC2626',
      cardTheme: 'border-red-500/80 dark:border-red-500/70 bg-red-50/50 dark:bg-red-950/30 shadow-xs shadow-red-500/5',
      badgeDot: 'bg-red-500',
      badgeText: 'text-red-700 dark:text-red-400',
      iconContainer: 'bg-red-100/80 dark:bg-red-900/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      changeBtn: 'bg-red-100/80 hover:bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300/80 dark:border-red-700'
    }
  ];

  const currentDetails = modesConfig.find(m => m.key === activeMode) || modesConfig[0];
  const ActiveIcon = currentDetails.icon;

  const getDynamicDisclaimer = (mode: FocusModeType | null) => {
    if (!mode) return '';
    if (mode === 'TREATMENT') {
      return (
        branding?.cancerTreatmentDisclaimer ||
        `Lifestyle Guidance & Legal Disclaimer for Cancer Treatment:
This application provides lifestyle, circadian fasting, nutritional, and metabolic habit tracking designed solely to support overall wellness. It does NOT constitute medical treatment, chemotherapy, surgery, radiation, or direct medical diagnosis. All recommendations must be evaluated with your treating oncologist.`
      );
    }
    if (mode === 'SECONDARY_PREVENTION') {
      return (
        branding?.cancerSecondaryDisclaimer ||
        `Lifestyle & Nutrition Guidance for Cancer Survivorship:
This program is designed to support long-term metabolic health, antioxidant intake, and cellular repair habits for individuals in post-treatment survivorship. Always consult your oncology care team for regular clinical screenings.`
      );
    }
    if (mode === 'PREVENTION') {
      return (
        branding?.cancerPreventionDisclaimer ||
        `Lifestyle Guidance & Legal Disclaimer for Cancer Prevention:
This application offers evidence-informed guidance on circadian fasting, sleep hygiene, metabolic stability, and reducing environmental toxin exposure. It is intended for general educational wellness.`
      );
    }
    return `Lifestyle & Wellness Tracking Protocol:
This module is intended to support your personal daily lifestyle habits, nutrition choices, and symptom tracking. It does not provide medical diagnosis or replace consultation with certified healthcare specialists.`;
  };

  const handleSelectMode = (key: FocusModeType) => {
    if (key === activeMode) {
      setIsOpen(false);
      return;
    }
    setPendingMode(key);
    // Show disclaimer modal for cancer modes, or switch directly for condition modules
    if (key === 'TREATMENT' || key === 'SECONDARY_PREVENTION' || key === 'PREVENTION') {
      setShowDisclaimer(true);
    } else {
      executeSwitch(key);
    }
    setIsOpen(false);
  };

  const executeSwitch = async (modeToSet: FocusModeType) => {
    setIsSaving(true);
    try {
      await updateProfile({
        cancerJourney: modeToSet,
        cancerDisclaimerAccepted: true,
        cancerDisclaimerAcceptedAt: new Date().toISOString()
      } as any);
      setActiveMode(modeToSet);
      showToast(`Switched active focus to ${modesConfig.find(m => m.key === modeToSet)?.title}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update focus mode', 'error');
    } finally {
      setIsSaving(false);
      setPendingMode(null);
      setShowDisclaimer(false);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingMode) executeSwitch(pendingMode);
  };

  return (
    <>
      {/* Active Focus Header Card */}
      <div className={`p-4 rounded-3xl border transition-all mb-4 ${currentDetails.cardTheme}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${currentDetails.iconContainer}`}>
              <ActiveIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`h-2 w-2 rounded-full ${currentDetails.badgeDot}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${currentDetails.badgeText}`}>
                  Active Focus
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {currentDetails.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${currentDetails.changeBtn}`}
          >
            Change <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 9-Focus Selection Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Select Your Health Focus
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize your dashboard, habit trackers, and AI assistant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 9-Focus Selection List / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto max-h-[68vh] pr-1 py-1">
                {modesConfig.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = mode.key === activeMode;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => handleSelectMode(mode.key)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center sm:items-start sm:flex-col justify-between sm:justify-start gap-3 transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-600/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center sm:items-start gap-3 min-w-0 flex-1">
                        <div
                          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
                          style={{
                            backgroundColor: `${mode.accentColor}18`,
                            color: mode.accentColor,
                            borderColor: `${mode.accentColor}30`
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                            {mode.title}
                          </h4>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                            {mode.description}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shrink-0 sm:absolute sm:top-2.5 sm:right-2.5 shadow-xs">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 sm:hidden">
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disclaimer Acceptance Modal */}
      <AnimatePresence>
        {showDisclaimer && pendingMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
            >
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
      </AnimatePresence>
    </>
  );
};
