const TTS_LOCALE_MAP = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

const getTtsLocale = (language) => {
  const code = (language || 'en').toLowerCase().trim();
  return TTS_LOCALE_MAP[code] || 'en-US';
};

module.exports = { getTtsLocale, TTS_LOCALE_MAP };
