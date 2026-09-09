import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../i18n/types';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LanguageSelectorProps {
  variant?: 'cards' | 'dropdown' | 'compact';
  className?: string;
  onSelect?: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'cards',
  className = '',
  onSelect
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    if (onSelect) onSelect(code);
    setIsOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Dropdown Variant (Modern floating pill in header / top bar)
  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-full shadow-xs hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-all text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer select-none"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm">{currentLang.flag}</span>
          <span className="tracking-tight text-xs font-bold">{currentLang.nativeName}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 overflow-hidden"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('profile.appLanguage', 'Language / மொழி')}
                </span>
              </div>
              <div className="space-y-0.5">
                {languages.map((l) => {
                  const isSelected = language === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => handleSelect(l.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 text-primary dark:text-primary-light font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{l.flag}</span>
                        <div className="text-left leading-tight">
                          <div className="font-bold">{l.nativeName}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{l.name}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Compact Variant (Pill group)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl ${className}`}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-light shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="mr-1">{l.flag}</span>
              <span>{l.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Cards Variant (Grid for profile/modal)
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {languages.map((l) => {
        const isSelected = language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => handleSelect(l.code)}
            className={`relative p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
              isSelected
                ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-primary-light shadow-xs ring-1 ring-primary'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl" role="img" aria-label={l.name}>
                {l.flag}
              </span>
              <div>
                <p className="text-xs font-bold leading-tight">{l.nativeName}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {l.name}
                </p>
              </div>
            </div>

            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-2xs"
              >
                <Check className="h-3 w-3 stroke-[3]" />
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
};
