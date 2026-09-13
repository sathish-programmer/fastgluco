const fs = require('fs');
const path = require('path');

const newKeys = {
  en: {
    "habits.yesMinus1": "Yes (-1)",
    "habits.noZero": "No (0)",
    "habits.yesSafeZero": "Yes (Safe - 0)",
    "habits.noRiskMinus1": "No (Risk -1)",
    "gia.geneticAiCounselor": "Genetic AI Counselor",
    "gia.guidelinesAdherence": "NCCN v2.2025 & ASCO 2024 Guidelines",
    "gia.restartAssessment": "Restart"
  },
  ta: {
    "habits.yesMinus1": "ஆம் (-1)",
    "habits.noZero": "இல்லை (0)",
    "habits.yesSafeZero": "ஆம் (பாதுகாப்பானது - 0)",
    "habits.noRiskMinus1": "இல்லை (அபாயமானது -1)",
    "gia.geneticAiCounselor": "மரபணு AI ஆலோசகர்",
    "gia.guidelinesAdherence": "NCCN v2.2025 & ASCO 2024 வழிகாட்டுதல்கள்",
    "gia.restartAssessment": "மறுதொடக்கம்"
  },
  kn: {
    "habits.yesMinus1": "ಹೌದು (-1)",
    "habits.noZero": "ಇಲ್ಲ (0)",
    "habits.yesSafeZero": "ಹೌದು (ಸುರಕ್ಷಿತ - 0)",
    "habits.noRiskMinus1": "ಇಲ್ಲ (ಅಪಾಯ -1)",
    "gia.geneticAiCounselor": "ಜೆನೆಟಿಕ್ AI ಕೌನ್ಸಿಲರ್",
    "gia.guidelinesAdherence": "NCCN v2.2025 & ASCO 2024 ಮಾರ್ಗಸೂಚಿಗಳು",
    "gia.restartAssessment": "ಮರುಪ್ರಾರಂಭಿಸಿ"
  },
  hi: {
    "habits.yesMinus1": "हाँ (-1)",
    "habits.noZero": "नहीं (0)",
    "habits.yesSafeZero": "हाँ (सुरक्षित - 0)",
    "habits.noRiskMinus1": "नहीं (जोखिम -1)",
    "gia.geneticAiCounselor": "जेनेटिक AI काउंसलर",
    "gia.guidelinesAdherence": "NCCN v2.2025 & ASCO 2024 दिशानिर्देश",
    "gia.restartAssessment": "पुನरारंभ करें"
  },
  te: {
    "habits.yesMinus1": "అవును (-1)",
    "habits.noZero": "లేదు (0)",
    "habits.yesSafeZero": "అవును (సురక్షితమైనది - 0)",
    "habits.noRiskMinus1": "లేదు (ప్రమాదం -1)",
    "gia.geneticAiCounselor": "జెనెటిక్ AI కౌన్సిలర్",
    "gia.guidelinesAdherence": "NCCN v2.2025 & ASCO 2024 మార్గదర్శకాలు",
    "gia.restartAssessment": "పునఃప్రారంభించండి"
  }
};

const langs = ['en', 'ta', 'kn', 'hi', 'te'];

langs.forEach(lang => {
  const filePath = path.join(__dirname, `../src/i18n/locales/${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  const keysToAdd = newKeys[lang];
  let snippet = '';
  for (const [k, v] of Object.entries(keysToAdd)) {
    if (!content.includes(`"${k}":`)) {
      snippet += `  "${k}": ${JSON.stringify(v)},\n`;
    }
  }

  content = content.replace(/} as const;\s*$/, `${snippet}} as const;\n`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Appended 7 remaining keys to ${lang}.ts`);
});
