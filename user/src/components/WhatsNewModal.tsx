import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Wind, ShoppingBag, Activity, AlertCircle, Check, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../i18n/types';

export const CURRENT_APP_VERSION = 'v5.9.0';

interface WhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onExploreFeature?: (featureKey: string) => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen = false,
  onClose,
  onExploreFeature
}) => {
  const { branding } = useAuth();
  const { t, language, defaultLanguage, setLanguage, languages } = useLanguage();
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
    if (onClose) onClose();
  };

  const handleLanguageSelect = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md">
                    {CURRENT_APP_VERSION}
                  </span>
                  <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                    {t('whatsNew.updates', 'Major Release')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight mt-0.5 truncate">
                  {t('whatsNew.title', 'What’s New in')} {branding.appName || 'Mito Reboot'}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* 🌟 Spotlight: Interactive Native Language Selector */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/30 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-md bg-blue-600 text-white shadow-2xs">
                  <Languages className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
                    {t('whatsNew.chooseLanguageTitle', 'Choose Your Preferred Language')}
                  </h4>
                </div>
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                {t('whatsNew.chooseLanguageSubtitle', 'Experience the entire app in your native language. Switch anytime from the top header or profile:')}
              </p>

              {/* Balanced Symmetrical 1+4 Language Layout */}
              {(() => {
                const activeDefault = defaultLanguage || language;
                const sortedLanguages = [
                  ...languages.filter((l) => l.code === activeDefault),
                  ...languages.filter((l) => l.code !== activeDefault)
                ];
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {sortedLanguages.map((lang) => {
                      const isSelected = language === lang.code;
                      const isDefault = activeDefault === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer relative flex items-center justify-between active:scale-[0.99] ${
                            isDefault ? 'col-span-2' : 'col-span-1'
                          } ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/90'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0 select-none" role="img" aria-label={lang.name}>
                              {lang.flag}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black block leading-tight truncate">
                                  {lang.nativeName}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                                  isSelected
                                    ? 'bg-blue-500/50 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}>
                                  {lang.code.toUpperCase()}
                                </span>
                              </div>
                              <span className={`text-[10px] block truncate ${isSelected ? 'text-blue-100 font-medium' : 'text-slate-400 dark:text-slate-400'}`}>
                                {lang.name}
                                {isDefault && (
                                  <span className={isSelected ? 'text-amber-300 font-bold ml-1.5' : 'text-blue-600 dark:text-blue-400 font-bold ml-1.5'}>
                                    • {t('common.default', 'Default')}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="h-4.5 w-4.5 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 ml-1 shadow-2xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Other Feature Highlights */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                More in this update
              </span>
              {features.map(f => (
                <div
                  key={f.key}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 ${f.bg}`}>
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 tracking-tight">
                        {f.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {f.description}
                      </p>
                    </div>
                  </div>

                  {onExploreFeature && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDismiss();
                        onExploreFeature(f.key);
                      }}
                      className="shrink-0 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light rounded-md text-[10px] font-bold transition-all flex items-center space-x-1 mt-0.5 cursor-pointer"
                    >
                      <span>{t('common.explore', 'Explore')}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug flex-1 pr-1">
              {t('whatsNew.footer', 'Check back anytime from your profile settings')}
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {t('common.confirm', 'Got It')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
