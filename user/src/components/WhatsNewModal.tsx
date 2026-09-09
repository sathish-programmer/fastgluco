import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, ChevronRight, Wind, ShoppingBag, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LATEST_RELEASE_VERSION = 'v4.8.7';
const CURRENT_APP_VERSION = '2.4.0';

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
  const { branding } = useAuth();
  const { t } = useLanguage();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldShow(true);
      return;
    }

    const lastSeenVersion = localStorage.getItem('mito_last_seen_version');
    if (lastSeenVersion !== CURRENT_APP_VERSION) {
      setShouldShow(true);
    }
  }, [isOpen]);

  const handleDismiss = () => {
    localStorage.setItem('mito_last_seen_version', CURRENT_APP_VERSION);
    setShouldShow(false);
    onClose();
  };

  if (!isOpen && !shouldShow) return null;

  const features = [
    {
      key: 'cancer_care',
      title: t('whatsNew.cancerCare.title', 'Active Cancer Care Support Mode'),
      description: t('whatsNew.cancerCare.desc', 'Specialized protocols for chemotherapy tolerance, organ protection, and secondary recurrence defense.'),
      icon: <Activity className="h-5 w-5 text-pink-500" />,
      bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
    },
    {
      key: 'breath',
      title: t('whatsNew.breath.title', 'Vagus Nerve Stimulating Breathwork'),
      description: t('whatsNew.breath.desc', 'Interactive animated timer with Box breathing, 4-7-8 relaxing breath, and Coherent resonance.'),
      icon: <Wind className="h-5 w-5 text-indigo-500" />,
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      key: 'environmental',
      title: t('whatsNew.environmental.title', 'Environmental Carcinogen & Cookware Hub'),
      description: t('whatsNew.environmental.desc', 'Comprehensive audit for PM2.5 air toxins, water contaminants, microplastics, and teflon cookware.'),
      icon: <AlertCircle className="h-5 w-5 text-emerald-500" />,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      key: 'shop',
      title: t('whatsNew.shop.title', 'Curated Wellness Products & Safe Living Store'),
      description: t('whatsNew.shop.desc', 'HEPA air purifiers, water filtration devices, toxin-free kitchenware, and targeted antioxidants.'),
      icon: <ShoppingBag className="h-5 w-5 text-amber-500" />,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                {t('whatsNew.version', 'Version')} {CURRENT_APP_VERSION} {t('whatsNew.updates', 'Updates')}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-0.5">
                {t('whatsNew.title', 'What’s New in')} {branding.appName}
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
                <span>{t('common.explore', 'Explore')}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {t('whatsNew.footer', 'Check back anytime from your profile settings')}
          </span>
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all hover:opacity-90"
          >
            {t('common.confirm', 'Got It')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
