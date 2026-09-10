const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

const whatsNewKeys = {
  en: {
    "whatsNew.chooseLanguageTitle": "Choose Your Preferred Language",
    "whatsNew.chooseLanguageSubtitle": "Experience the entire app in your native language. Switch anytime from the top header or profile:",
    "whatsNew.multilingual.title": "Regional Multilingual Support",
    "whatsNew.multilingual.desc": "Full in-depth translation across English, தமிழ், ಕನ್ನಡ, and हिन्दी with instant switching.",
    "whatsNew.openWhatsNew": "What's New in v5.5.0"
  },
  ta: {
    "whatsNew.chooseLanguageTitle": "உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்",
    "whatsNew.chooseLanguageSubtitle": "முழு செயலியையும் உங்கள் தாய்மொழியில் அனுபவியுங்கள். மேலே உள்ள தலைப்பிலிருந்தோ சுயவிவரத்திலிருந்தோ எப்போது வேண்டுமானாலும் மாற்றலாம்:",
    "whatsNew.multilingual.title": "பிராந்திய பன்மொழி ஆதரவு",
    "whatsNew.multilingual.desc": "ஆங்கிலம், தமிழ், கன்னடம் மற்றும் இந்தியில் முழுமையான மொழிபெயர்ப்பு மற்றும் உடனடி மாற்றம்.",
    "whatsNew.openWhatsNew": "பதிப்பு 5.5.0 இல் புதிய அம்சங்கள்"
  },
  kn: {
    "whatsNew.chooseLanguageTitle": "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "whatsNew.chooseLanguageSubtitle": "ನಿಮ್ಮ ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಸಂಪೂರ್ಣ ಅಪ್ಲಿಕೇಶನ್ ಅನುಭವಿಸಿ. ಹೆಡರ್ ಅಥವಾ ಪ್ರೊಫೈಲ್‌ನಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಿ:",
    "whatsNew.multilingual.title": "ಪ್ರಾದೇಶಿಕ ಬಹುಭಾಷಾ ಬೆಂಬಲ",
    "whatsNew.multilingual.desc": "ಇಂಗ್ಲಿಷ್, ತಮಿಳು, ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿಯಲ್ಲಿ ಸಂಪೂರ್ಣ ಅನುವಾದ ಮತ್ತು ತ್ವರಿತ ಬದಲಾವಣೆ.",
    "whatsNew.openWhatsNew": "ಆವೃತ್ತಿ 5.5.0 ರ ಹೊಸ ವೈಶಿಷ್ಟ್ಯಗಳು"
  },
  hi: {
    "whatsNew.chooseLanguageTitle": "अपनी पसंदीदा भाषा चुनें",
    "whatsNew.chooseLanguageSubtitle": "अपनी मातृभाषा में संपूर्ण ऐप का अनुभव करें। हेडर या प्रोफ़ाइल से कभी भी बदलें:",
    "whatsNew.multilingual.title": "क्षेत्रीय बहुभाषी समर्थन",
    "whatsNew.multilingual.desc": "अंग्रेजी, तमिल, कन्नड़ और हिंदी में पूर्ण अनुवाद और त्वरित स्विचिंग।",
    "whatsNew.openWhatsNew": "संस्करण 5.5.0 में नया क्या है"
  }
};

function insertKeysIntoFile(filePath, keysObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lastBraceIdx = content.lastIndexOf('} as const;');
  if (lastBraceIdx === -1) {
    console.error(`Could not find closing brace in ${filePath}`);
    return;
  }

  let injection = '\n  // --- WHATS NEW & LANGUAGE SPOTLIGHT ---\n';
  for (const [k, v] of Object.entries(keysObj)) {
    const escapedVal = JSON.stringify(v);
    injection += `  ${JSON.stringify(k)}: ${escapedVal},\n`;
  }

  const before = content.slice(0, lastBraceIdx);
  const after = content.slice(lastBraceIdx);
  fs.writeFileSync(filePath, before + injection + after, 'utf8');
  console.log(`Updated ${filePath} with ${Object.keys(keysObj).length} keys.`);
}

insertKeysIntoFile(enPath, whatsNewKeys.en);
insertKeysIntoFile(taPath, whatsNewKeys.ta);
insertKeysIntoFile(knPath, whatsNewKeys.kn);
insertKeysIntoFile(hiPath, whatsNewKeys.hi);
