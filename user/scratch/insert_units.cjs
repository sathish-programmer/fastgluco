const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

const unitsBatch = {
  en: {
    "foodLog.diet": "Diet",
    "status": "Status",
    "serving": "serving",
    "ml": "ml",
    "g": "g"
  },
  ta: {
    "foodLog.diet": "உணவு முறை",
    "status": "நிலை",
    "serving": "பரிமாறுதல்",
    "ml": "மி.லி",
    "g": "கிராம்"
  },
  kn: {
    "foodLog.diet": "ಆಹಾರ ಪದ್ಧತಿ",
    "status": "ಸ್ಥಿತಿ",
    "serving": "ಸೇವೆ",
    "ml": "ಮಿ.ಲೀ",
    "g": "ಗ್ರಾಂ"
  },
  hi: {
    "foodLog.diet": "आहार",
    "status": "स्थिति",
    "serving": "परोसना",
    "ml": "मिली",
    "g": "ग्राम"
  }
};

function insertKeysIntoFile(filePath, keysObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lastBraceIdx = content.lastIndexOf('} as const;');
  if (lastBraceIdx === -1) {
    console.error(`Could not find closing brace in ${filePath}`);
    return;
  }

  let injection = '\n  // --- UNITS BATCH ---\n';
  for (const [k, v] of Object.entries(keysObj)) {
    const escapedVal = JSON.stringify(v);
    injection += `  ${JSON.stringify(k)}: ${escapedVal},\n`;
  }

  const before = content.slice(0, lastBraceIdx);
  const after = content.slice(lastBraceIdx);
  fs.writeFileSync(filePath, before + injection + after, 'utf8');
  console.log(`Updated ${filePath} with ${Object.keys(keysObj).length} keys.`);
}

insertKeysIntoFile(enPath, unitsBatch.en);
insertKeysIntoFile(taPath, unitsBatch.ta);
insertKeysIntoFile(knPath, unitsBatch.kn);
insertKeysIntoFile(hiPath, unitsBatch.hi);
