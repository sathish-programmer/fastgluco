/**
 * Centralized Text-to-Speech (TTS) helper for 5-Language Support
 * Languages supported:
 *   - English (en) -> en-US
 *   - Tamil (ta) -> ta-IN
 *   - Telugu (te) -> te-IN
 *   - Kannada (kn) -> kn-IN
 *   - Hindi (hi) -> hi-IN
 */

export const TTS_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

export const getTtsLocale = (language?: string): string => {
  const code = (language || 'en').toLowerCase().trim();
  return TTS_LOCALE_MAP[code] || 'en-US';
};

export const cleanTextForSpeech = (rawText: string): string => {
  if (!rawText) return '';
  return rawText
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/\*\*(.*?)\*\*/g, '$1') // Strip bold
    .replace(/\*(.*?)\*/g, '$1') // Strip italic
    .replace(/#{1,6}\s+/g, '') // Strip headers
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Strip code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Strip markdown links
    .replace(/[•\-\*]\s+/g, ' ') // Strip bullets
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // Strip emojis
    .replace(/\s+/g, ' ')
    .trim();
};

export interface SpeakOptions {
  text: string;
  language: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const isTtsSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const speakText = ({
  text,
  language,
  rate = 0.95,
  pitch = 1.0,
  onStart,
  onEnd,
  onError
}: SpeakOptions): boolean => {
  if (!isTtsSupported()) {
    if (onError) onError(new Error('TTS not supported in this browser'));
    return false;
  }

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const ttsLocale = getTtsLocale(language);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = ttsLocale;

    const voices = window.speechSynthesis.getVoices();
    const langCode = (language || 'en').toLowerCase().trim();
    const targetPrefix = ttsLocale.toLowerCase().split('-')[0];

    if (voices.length > 0) {
      const matchedVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        const vName = v.name.toLowerCase();
        if (langCode === 'ta') return vLang.startsWith('ta') || vName.includes('tamil');
        if (langCode === 'te') return vLang.startsWith('te') || vName.includes('telugu');
        if (langCode === 'kn') return vLang.startsWith('kn') || vName.includes('kannada');
        if (langCode === 'hi') return vLang.startsWith('hi') || vName.includes('hindi');
        if (langCode === 'en') return vLang.startsWith('en');
        return vLang.startsWith(targetPrefix);
      });

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (langCode === 'en') {
        const enVoice = voices.find(v =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Alex'))
        ) || voices[0];
        if (enVoice) utterance.voice = enVoice;
      }
      // CRITICAL: For non-English languages (ta, te, kn, hi), if no matching voice is found,
      // we NEVER assign an English voice. Leaving utterance.voice unassigned lets the platform TTS
      // resolve speech synthesis using utterance.lang without mangling pronunciation.
    }

    let finished = false;
    const handleEnd = () => {
      if (finished) return;
      finished = true;
      if (onEnd) onEnd();
    };

    const handleError = (e: any) => {
      if (finished) return;
      finished = true;
      if (onError) onError(e);
    };

    utterance.onstart = () => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (onStart) onStart();
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleError;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('TTS speech execution error:', err);
    if (onError) onError(err);
    return false;
  }
};
