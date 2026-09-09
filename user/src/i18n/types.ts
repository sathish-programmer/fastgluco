export type SupportedLanguage = 'en' | 'ta' | 'kn' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  localeTag: string; // Used for Speech Synthesis / TTS
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    localeTag: 'en-US'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    localeTag: 'ta-IN'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    localeTag: 'kn-IN'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    localeTag: 'hi-IN'
  }
];

export type NestedTranslationRecord = {
  [key: string]: string | NestedTranslationRecord;
};
