import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Leaf, 
  Stethoscope, 
  ShoppingBag, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingStep {
  id: number;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  accent: string;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { branding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      badge: 'Step 1 of 5',
      title: 'Personalized Health Journey',
      description: 'Mito_Reboot adapts to your specific focus mode: Cancer Prevention, Treatment Support, or Secondary Recovery.',
      highlights: [
        'Tailored recommendations for your active focus',
        'Personalized daily action priorities',
        'Switch focus modes anytime from your dashboard'
      ],
      icon: <ShieldCheck className="h-10 w-10 text-emerald-500" />,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      iconBg: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      accent: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 2,
      badge: 'Step 2 of 5',
      title: 'Track & Understand Your Health',
      description: 'Continuous Glucose Monitoring (CGM), lab reports, and symptom tracking digitize your wellness in real-time.',
      highlights: [
        'Instant CGM CSV/PDF report parsing & charts',
        'Symptom & habit logging with trend insights',
        'Fasting & circadian metabolic rhythm tools'
      ],
      icon: <Activity className="h-10 w-10 text-indigo-500" />,
      gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent',
      iconBg: 'bg-indigo-500/15 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      accent: 'bg-indigo-600 hover:bg-indigo-700 text-white'
    },
    {
      id: 3,
      badge: 'Step 3 of 5',
      title: 'Lifestyle, Food & Environment Insights',
      description: 'Identify air pollutants, water safety risks, genetic predispositions, and nutrient-dense antioxidant foods.',
      highlights: [
        'Air quality & water safety hazard checks',
        'Glycemic index food logging & meal scanner',
        'Genetic susceptibility & antioxidant guidance'
      ],
      icon: <Leaf className="h-10 w-10 text-amber-500" />,
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      iconBg: 'bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400',
      accent: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    {
      id: 4,
      badge: 'Step 4 of 5',
      title: 'Doctor, Reports & Appointments',
      description: 'Manage lab diagnostics, store medical history securely, and book appointments with specialized health experts.',
      highlights: [
        'Centralized diagnostic report archives',
        'Seamless physician appointment scheduling',
        'Doctor consultation preparation lists'
      ],
      icon: <Stethoscope className="h-10 w-10 text-cyan-500" />,
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-cyan-500/15 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      accent: 'bg-cyan-600 hover:bg-cyan-700 text-white'
    },
    {
      id: 5,
      badge: 'Step 5 of 5',
      title: 'Recommended Products & Support',
      description: 'Access curated wellness products (air purifiers, N95 masks, water filters, wigs for treatment hair loss, organic foods).',
      highlights: [
        'Curated health products tied to your hazard assessments',
        'Treatment support products (e.g. wigs & skin care)',
        'Caregiver stress support & recovery guidance'
      ],
      icon: <ShoppingBag className="h-10 w-10 text-rose-500" />,
      gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
      iconBg: 'bg-rose-500/15 border-rose-500/20 text-rose-600 dark:text-rose-400',
      accent: 'bg-rose-600 hover:bg-rose-700 text-white'
    }
  ];

  if (!isOpen) return null;

  const activeStep = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    localStorage.setItem('mito_welcome_onboarding_completed', 'true');
    localStorage.setItem('fastgluco_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-2xl">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {branding.appName} Companion
            </span>
          </div>
          <button
            onClick={handleComplete}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full transition-colors"
            aria-label="Close Onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Graphic Header */}
        <div className={`relative px-6 py-6 bg-gradient-to-b ${activeStep.gradient} flex flex-col items-center text-center transition-colors duration-300`}>
          <div className={`p-4 rounded-3xl border shadow-sm mb-3 ${activeStep.iconBg}`}>
            {activeStep.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 shadow-xs mb-2">
            {activeStep.badge}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {activeStep.title}
          </h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed mt-2">
            {activeStep.description}
          </p>
        </div>

        {/* Highlights List */}
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-2.5">
          {activeStep.highlights.map((h, i) => (
            <div key={i} className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                {h}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar & Footer Controls */}
        <div className="px-6 pb-6 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-primary dark:bg-primary-dark'
                    : 'w-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          {currentStep === steps.length - 1 ? (
            <div className="flex flex-col space-y-2 text-center">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                Your Mito_Reboot journey starts here
              </p>
              <button
                onClick={handleComplete}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 transform active:scale-[0.99]"
              >
                <span>Explore Mito_Reboot</span>
                <ChevronRight className="h-4 w-4 stroke-[3px]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1 ${
                  currentStep === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                className={`px-6 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center space-x-2 shadow-md ${activeStep.accent}`}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
