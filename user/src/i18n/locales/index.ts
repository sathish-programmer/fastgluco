import { en } from './en';
import { ta } from './ta';
import { kn } from './kn';
import { hi } from './hi';
import type { SupportedLanguage } from '../types';

export const translations = {
  en,
  ta,
  kn,
  hi
} as const;

export type TranslationKey = string;

/**
 * Resolves a nested key (e.g. 'nav.home', 'dashboard.greeting') for the given language.
 * Automatically falls back to English, then to provided fallback string or key if missing.
 */
export function getTranslation(
  lang: SupportedLanguage,
  key: string,
  paramsOrFallback?: Record<string, string | number> | string,
  fallback?: string
): string {
  const keys = key.split('.');
  const params = typeof paramsOrFallback === 'object' && paramsOrFallback !== null ? paramsOrFallback : undefined;
  const defaultFallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;

  // 1. Direct flat key lookup in chosen language
  let value: any = (translations[lang] as any)?.[key];

  // 2. Nested key lookup in chosen language
  if (value === undefined || typeof value !== 'string') {
    let nested: any = translations[lang];
    for (const k of keys) {
      if (nested && typeof nested === 'object' && k in nested) {
        nested = nested[k];
      } else {
        nested = undefined;
        break;
      }
    }
    if (typeof nested === 'string') {
      value = nested;
    }
  }

  // 3. Fallback to English (flat then nested)
  if (value === undefined || typeof value !== 'string') {
    let fallbackValue: any = (translations.en as any)?.[key];
    if (fallbackValue === undefined || typeof fallbackValue !== 'string') {
      let nestedEn: any = translations.en;
      for (const k of keys) {
        if (nestedEn && typeof nestedEn === 'object' && k in nestedEn) {
          nestedEn = nestedEn[k];
        } else {
          nestedEn = undefined;
          break;
        }
      }
      if (typeof nestedEn === 'string') {
        fallbackValue = nestedEn;
      }
    }
    value = fallbackValue;
  }

  if (typeof value !== 'string') {
    return defaultFallback || key;
  }

  // Interpolate dynamic parameters like {{name}} or {{count}} or {name}
  if (params) {
    return Object.entries(params).reduce((acc, [pKey, pVal]) => {
      const regexDouble = new RegExp(`{{\\s*${pKey}\\s*}}`, 'g');
      const regexSingle = new RegExp(`{\\s*${pKey}\\s*}`, 'g');
      return acc.replace(regexDouble, String(pVal)).replace(regexSingle, String(pVal));
    }, value);
  }

  return value;
}
