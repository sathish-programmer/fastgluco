import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, ShieldCheck, PlayCircle, Bot, Sun, Check, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../i18n/types';

export const CURRENT_APP_VERSION = 'v6.1.1';

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

  // v6.1.1 Current Release Features
  const features = [
    {
      key: 'motivation',
      badge: 'NEW',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      title: t('whatsNew.motivation.title', '365 Days of Daily Motivation'),
      description: t('whatsNew.motivation.desc', 'Start each morning with curated cellular health one-liners, metabolic balance tips, and timely inspiration reminders.'),
      icon: <Sun className="h-5 w-5 text-amber-500" />,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    {
      key: 'kitchen',
      badge: 'NEW',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      title: t('whatsNew.kitchen.title', 'Safe Kitchen & Cooking Audit'),
      description: t('whatsNew.kitchen.desc', 'Audit for high-temperature frying, charred foods, heated plastics, and toxic cookware to protect cellular health.'),
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      key: 'checkin',
      badge: 'UPDATED',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      title: t('whatsNew.checkin.title', 'Interactive Daily AI Check-in Bot'),
      description: t('whatsNew.checkin.desc', 'Conversational check-in bot tracks sleep latency, resting breath rate, snoring checks, and 9 daily recovery habits.'),
      icon: <Bot className="h-5 w-5 text-purple-500" />,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    },
    {
      key: 'screening',
      badge: 'NEW',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
      title: t('whatsNew.screening.title', 'Clinical Self-Exam Video Guides'),
      description: t('whatsNew.screening.desc', 'Step-by-step animated breast self-examination guides and clinical symptom screening directly in your wellness hub.'),
      icon: <PlayCircle className="h-5 w-5 text-rose-500" />,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
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
                    {t('whatsNew.updates', 'Latest Release')}
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
            {/* 🌟 Current Release Major Features */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                {t('whatsNew.newFeatures', 'New in this release')}
              </span>
              {features.map(f => (
                <div
                  key={f.key}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className={`p-2.5 rounded-lg border shrink-0 ${f.bg}`}>
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                          {f.title}
                        </h4>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none shrink-0 ${f.badgeColor}`}>
                          {f.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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

            {/* 🌐 Compact Interactive Native Language Selector */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-purple-50/30 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-600 text-white shadow-2xs">
                    <Languages className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">
                      {t('whatsNew.chooseLanguageTitle', 'Choose Your Preferred Language')}
                    </h4>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                  5 Languages
                </span>
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-2.5">
                {t('whatsNew.chooseLanguageSubtitle', 'Experience the entire app in your native language. Switch anytime from the top header or profile:')}
              </p>

              {/* Responsive Compact Language Grid */}
              {(() => {
                const activeDefault = defaultLanguage || language;
                const sortedLanguages = [
                  ...languages.filter((l) => l.code === activeDefault),
                  ...languages.filter((l) => l.code !== activeDefault)
                ];
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {sortedLanguages.map((lang) => {
                      const isSelected = language === lang.code;
                      const isDefault = activeDefault === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`p-2 rounded-lg border text-left transition-all duration-150 cursor-pointer relative flex items-center justify-between active:scale-[0.99] ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/90'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0 select-none" role="img" aria-label={lang.name}>
                              {lang.flag}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-black block leading-tight truncate">
                                {lang.nativeName}
                              </span>
                              <span className={`text-[9px] block truncate ${isSelected ? 'text-blue-100 font-medium' : 'text-slate-400 dark:text-slate-400'}`}>
                                {lang.name} {isDefault ? '• Default' : ''}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="h-4 w-4 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 ml-1 shadow-2xs">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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
