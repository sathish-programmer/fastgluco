const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');

const newKeys = {
  en: {
    "aqi.exposureHoursTitle": "Today's 24-Hour Exposure Hours",
    "aqi.satisfactory51to100": "51 - 100 (Satisfactory)",
    "aqi.moderate101to150": "101 - 150 (Moderate)",
    "aqi.interactiveCurve": "24-Hour Interactive AQI Curve",
    "aqi.good": "Good",
    "aqi.satisfactoryLegend": "Satisfactory",
    "aqi.moderateLegend": "Moderate",
    "aqi.poor": "Poor",
    "aqi.detectingLiveGps": "Detecting live GPS location & air quality data...",
    "aqi.retryLiveGps": "Retry Live GPS",
    "common.hoursAbbr": "hrs",
    "dental.deleteReadingQ": "Delete Reading?",
    "dental.deleteReadingConfirm": "Are you sure you want to delete this stain reading? This action cannot be undone.",
    "dental.yesDelete": "Yes, Delete",
    "common.off": "Off",
    "common.stop": "Stop",
    "common.stopSpeaking": "Stop Speaking",
    "common.tapToListen": "Muted (Tap to Listen)",
    "common.tapToMute": "AI Voice Active (Tap to Mute)"
  },
  ta: {
    "aqi.exposureHoursTitle": "இன்றைய 24 மணிநேர வெளிப்பாடு நேரம்",
    "aqi.satisfactory51to100": "51 - 100 (திருப்திகரமானது)",
    "aqi.moderate101to150": "101 - 150 (மிதமானது)",
    "aqi.interactiveCurve": "24 மணிநேர ஊடாடும் AQI வரைபடம்",
    "aqi.good": "நல்லது",
    "aqi.satisfactoryLegend": "திருப்திகரமானது",
    "aqi.moderateLegend": "மிதமானது",
    "aqi.poor": "மோசமானது",
    "aqi.detectingLiveGps": "நேரடி ஜிபிஎஸ் இருப்பிடம் மற்றும் காற்றின் தரம் கண்டறியப்படுகிறது...",
    "aqi.retryLiveGps": "நேரடி ஜிபிஎஸ் மீண்டும் முயற்சிக்கவும்",
    "common.hoursAbbr": "மணி",
    "dental.deleteReadingQ": "பதிவை நீக்கவா?",
    "dental.deleteReadingConfirm": "இந்த கறை பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த செயலை மாற்ற முடியாது.",
    "dental.yesDelete": "ஆம், நீக்கு",
    "common.off": "முடக்கு",
    "common.stop": "நிறுத்து",
    "common.stopSpeaking": "பேசுவதை நிறுத்து",
    "common.tapToListen": "ஒலியடக்கம் (கேட்க தட்டவும்)",
    "common.tapToMute": "செயலில் உள்ள குரல் (அடக்க தட்டவும்)"
  },
  te: {
    "aqi.exposureHoursTitle": "నేటి 24 గంటల ఎక్స్పోజర్ గంటలు",
    "aqi.satisfactory51to100": "51 - 100 (సంతృప్తికరం)",
    "aqi.moderate101to150": "101 - 150 (మితమైనది)",
    "aqi.interactiveCurve": "24 గంటల ఇంటరాక్టివ్ AQI కర్వ్",
    "aqi.good": "మంచిది",
    "aqi.satisfactoryLegend": "సంతృప్తికరం",
    "aqi.moderateLegend": "మితమైనది",
    "aqi.poor": "పేలవమైనది",
    "aqi.detectingLiveGps": "లైవ్ GPS లొకేషన్ మరియు గాలి నాణ్యత గుర్తించబడుతోంది...",
    "aqi.retryLiveGps": "లైవ్ GPS మళ్ళీ ప్రయత్నించండి",
    "common.hoursAbbr": "గం",
    "dental.deleteReadingQ": "రీడింగ్‌ను తొలగించాలా?",
    "dental.deleteReadingConfirm": "మీరు ఖచ్చితంగా ఈ రీడింగ్‌ను తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేము.",
    "dental.yesDelete": "అవును, తొలగించండి",
    "common.off": "ఆఫ్",
    "common.stop": "ఆపు",
    "common.stopSpeaking": "మాట్లాడటం ఆపండి",
    "common.tapToListen": "మ్యూట్ చేయబడింది (వినడానికి నొక్కండి)",
    "common.tapToMute": "వాయిస్ యాక్టివ్ (మ్యూట్ చేయడానికి నొక్కండి)"
  },
  kn: {
    "aqi.exposureHoursTitle": "ಇಂದಿನ 24 ಗಂಟೆಗಳ ಒಡ್ಡಿಕೊಳ್ಳುವಿಕೆ ಅವಧಿ",
    "aqi.satisfactory51to100": "51 - 100 (ತೃಪ್ತಿಕರ)",
    "aqi.moderate101to150": "101 - 150 (ಮಧ್ಯಮ)",
    "aqi.interactiveCurve": "24 ಗಂಟೆಗಳ ಸಂವಾದಾತ್ಮಕ AQI ಕರ್ವ್",
    "aqi.good": "ಉತ್ತಮ",
    "aqi.satisfactoryLegend": "ತೃಪ್ತಿಕರ",
    "aqi.moderateLegend": "ಮಧ್ಯಮ",
    "aqi.poor": "ಕಳಪೆ",
    "aqi.detectingLiveGps": "ಲೈವ್ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಮತ್ತು ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...",
    "aqi.retryLiveGps": "ಲೈವ್ ಜಿಪಿಎಸ್ ಮರುಪ್ರಯತ್ನಿಸಿ",
    "common.hoursAbbr": "ಗಂಟೆ",
    "dental.deleteReadingQ": "ದಾಖಲೆಯನ್ನು ಅಳಿಸುವುದೇ?",
    "dental.deleteReadingConfirm": "ನೀವು ಖಂಡಿತವಾಗಿಯೂ ಈ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.",
    "dental.yesDelete": "ಹೌದು, ಅಳಿಸಿ",
    "common.off": "ಆಫ್",
    "common.stop": "ನಿಲ್ಲಿಸಿ",
    "common.stopSpeaking": "ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ",
    "common.tapToListen": "ಮ್ಯೂಟ್ ಮಾಡಲಾಗಿದೆ (ಕೇಳಲು ಟ್ಯಾಪ್ ಮಾಡಿ)",
    "common.tapToMute": "ಧ್ವನಿ ಸಕ್ರಿಯ (ಮ್ಯೂಟ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ)"
  },
  hi: {
    "aqi.exposureHoursTitle": "आज के 24 घंटे के संपर्क के घंटे",
    "aqi.satisfactory51to100": "51 - 100 (संतोषजनक)",
    "aqi.moderate101to150": "101 - 150 (मध्यम)",
    "aqi.interactiveCurve": "24-घंटे का इंटरैक्टिव AQI वक्र",
    "aqi.good": "अच्छा",
    "aqi.satisfactoryLegend": "संतोषजनक",
    "aqi.moderateLegend": "मध्यम",
    "aqi.poor": "खराब",
    "aqi.detectingLiveGps": "लाइव जीपीएस स्थान और वायु गुणवत्ता का पता लगाया जा रहा है...",
    "aqi.retryLiveGps": "लाइव जीपीएस पुनः प्रयास करें",
    "common.hoursAbbr": "घंटे",
    "dental.deleteReadingQ": "रीडिंग हटाएं?",
    "dental.deleteReadingConfirm": "क्या आप वाकई इस स्टेन रीडिंग को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
    "dental.yesDelete": "हाँ, हटाएं",
    "common.off": "बंद",
    "common.stop": "रोकें",
    "common.stopSpeaking": "बोलना बंद करें",
    "common.tapToListen": "म्यूट (सुनने के लिए टैप करें)",
    "common.tapToMute": "आवाज़ सक्रिय (म्यूट करने के लिए टैप करें)"
  }
};

['en', 'ta', 'te', 'kn', 'hi'].forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  const keys = newKeys[lang];
  let linesToAdd = [];
  for (const [k, v] of Object.entries(keys)) {
    if (!content.includes(`"${k}":`)) {
      linesToAdd.push(`  "${k}": ${JSON.stringify(v)},`);
    }
  }

  if (linesToAdd.length > 0) {
    const lastBraceIndex = content.lastIndexOf('};');
    if (lastBraceIndex !== -1) {
      const updated = content.slice(0, lastBraceIndex) +
        '\n  // --- SUPPLEMENTARY BATCH ---\n' +
        linesToAdd.join('\n') + '\n' +
        content.slice(lastBraceIndex);
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`[${lang}] Added ${linesToAdd.length} keys.`);
    }
  } else {
    console.log(`[${lang}] All keys already present.`);
  }
});
