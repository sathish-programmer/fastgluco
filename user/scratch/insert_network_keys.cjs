const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

const networkKeys = {
  en: {
    "network.offlineTitle": "No Internet Connection",
    "network.offlineDesc": "Please turn on your Wi-Fi or mobile data to access your health dashboard and sync logs.",
    "network.retry": "Retry Connection",
    "network.checking": "Checking Connection...",
    "network.backOnline": "You're back online!",
    "network.offlineBanner": "You are currently offline. Changes will sync once reconnected.",
    "auth.sessionExpired": "Session expired. Please log in again."
  },
  ta: {
    "network.offlineTitle": "இணைய இணைப்பு இல்லை",
    "network.offlineDesc": "உங்கள் சுகாதார டாஷ்போர்டை அணுகவும் பதிவுகளை ஒத்திசைக்கவும் வைஃபை அல்லது மொபைல் டேட்டாவை இயக்கவும்.",
    "network.retry": "மீண்டும் முயற்சிக்கவும்",
    "network.checking": "இணைப்பு சரிபார்க்கப்படுகிறது...",
    "network.backOnline": "இணைய இணைப்பு மீண்டும் கிடைத்தது!",
    "network.offlineBanner": "நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள். இணைக்கப்பட்டதும் மாற்றங்கள் ஒத்திசைக்கப்படும்.",
    "auth.sessionExpired": "அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்."
  },
  kn: {
    "network.offlineTitle": "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ",
    "network.offlineDesc": "ನಿಮ್ಮ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಲು ಮತ್ತು ಲಾಗ್‌ಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಲು ದಯವಿಟ್ಟು ವೈ-ಫೈ ಅಥವಾ ಮೊಬೈಲ್ ಡೇಟಾವನ್ನು ಆನ್ ಮಾಡಿ.",
    "network.retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    "network.checking": "ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
    "network.backOnline": "ನೀವು ಮತ್ತೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ!",
    "network.offlineBanner": "ನೀವು ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಮರುಸಂಪರ್ಕಗೊಂಡ ನಂತರ ಬದಲಾವಣೆಗಳು ಸಿಂಕ್ ಆಗುತ್ತವೆ.",
    "auth.sessionExpired": "ಅಧಿವೇಶನ ಅವಧಿ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ."
  },
  hi: {
    "network.offlineTitle": "इंटरनेट कनेक्शन नहीं है",
    "network.offlineDesc": "कृपया अपने स्वास्थ्य डैशबोर्ड तक पहुंचने और डेटा सिंक करने के लिए वाई-फाई या मोबाइल डेटा चालू करें।",
    "network.retry": "पुनः प्रयास करें",
    "network.checking": "कनेक्शन जांचा जा रहा है...",
    "network.backOnline": "आप वापस ऑनलाइन हैं!",
    "network.offlineBanner": "आप वर्तमान में ऑफ़लाइन हैं। पुनः कनेक्ट होने पर परिवर्तन सिंक हो जाएंगे।",
    "auth.sessionExpired": "सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।"
  }
};

function insertKeysIntoFile(filePath, keysObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lastBraceIdx = content.lastIndexOf('} as const;');
  if (lastBraceIdx === -1) {
    console.error(`Could not find closing brace in ${filePath}`);
    return;
  }

  let injection = '\n  // --- NETWORK & SESSION LOCALIZATION ---\n';
  for (const [k, v] of Object.entries(keysObj)) {
    const escapedVal = JSON.stringify(v);
    injection += `  ${JSON.stringify(k)}: ${escapedVal},\n`;
  }

  const before = content.slice(0, lastBraceIdx);
  const after = content.slice(lastBraceIdx);
  fs.writeFileSync(filePath, before + injection + after, 'utf8');
  console.log(`Updated ${filePath} with ${Object.keys(keysObj).length} keys.`);
}

insertKeysIntoFile(enPath, networkKeys.en);
insertKeysIntoFile(taPath, networkKeys.ta);
insertKeysIntoFile(knPath, networkKeys.kn);
insertKeysIntoFile(hiPath, networkKeys.hi);
