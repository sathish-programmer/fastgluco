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

  // Cards Variant (Modern clean UI for profile/modal)
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {languages.map((l) => {
        const isSelected = language === l.code;
        const isFeatured = l.code === 'en';
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => handleSelect(l.code)}
            className={`group relative p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              isFeatured ? 'col-span-2' : 'col-span-1'
            } ${
              isSelected
                ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary ring-1 ring-primary/40 text-slate-900 dark:text-white shadow-xs'
                : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Modern Flag Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isSelected
                    ? 'bg-primary/15 dark:bg-primary/25 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-700/60'
                }`}
              >
                <span role="img" aria-label={l.name}>
                  {l.flag}
                </span>
              </div>

              {/* Language Name & Subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {l.nativeName}
                  </p>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-1 py-0.5 rounded leading-none">
                    {l.code.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                  {l.name}
                  {isFeatured && (
                    <span className="text-primary font-semibold ml-1.5">• Default</span>
                  )}
                </p>
              </div>
            </div>

            {/* Selection Check Indicator */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'border border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
              }`}
            >
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Check className="h-3 w-3 stroke-[3]" />
                </motion.div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
};
