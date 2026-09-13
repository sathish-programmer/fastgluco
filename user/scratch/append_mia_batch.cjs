const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');

const miaBatch = {
  en: {
    "mia.greetingStress": "Hello 💙 I'm **Mia**, your Mental Health AI Expert at Mito Reboot. I can see you're going through a tough time. I want to really understand what's going on for you — not give you generic advice.\n\nWhich of these is weighing on you most right now?",
    "mia.greetingSleep": "Hello 🌙 I'm **Mia**, your Sleep Health & Mental Wellbeing expert. I'm going to ask a few questions to understand exactly what's affecting your sleep — and then give you targeted advice based on your specific situation.\n\nTo start: how long have you been struggling with sleep, and what happens when you try to sleep?",
    "mia.worklifeBurnout": "Work-life balance & burnout",
    "mia.relationshipConflict": "Relationship conflict",
    "mia.lossOfLovedOne": "Loss of a loved one",
    "mia.hormonalMoodSwings": "Premenstrual / hormonal mood swings",
    "mia.sexualHealthConcerns": "Sexual health concerns",
    "mia.somethingElse": "Something else entirely",
    "mia.troubleFallingAsleep": "Trouble falling asleep for weeks",
    "mia.fallAsleepWake34am": "I fall asleep but wake up at 3-4am",
    "mia.wakeTooEarly": "I wake too early and can't go back",
    "mia.allPoorSleep": "All of the above — just poor sleep",
    "mia.startedRecently": "Started recently — last few days",
    "mia.returningBetter": "I feel noticeably better",
    "mia.returningSame": "About the same — no real change",
    "mia.returningWorse": "I feel worse actually",
    "mia.returningSome": "I tried some things but not all"
  },
  ta: {
    "mia.greetingStress": "வணக்கம் 💙 நான் **மியா**, மிட்டோ ரீபூட்டின் மனநல AI நிபுணர். நீங்கள் ஒரு கடினமான சூழ்நிலையைக் கடந்து கொண்டிருப்பதை உணர்கிறேன். பொதுவான அறிவுரைகளை வழங்காமல் உங்கள் பிரச்சனையை ஆழமாகப் புரிந்து கொள்ள விரும்புகிறேன்.\n\nஇவற்றில் எது இப்போது உங்களை அதிகம் பாதிக்கிறது?",
    "mia.greetingSleep": "வணக்கம் 🌙 நான் **மியா**, உங்கள் தூக்கம் மற்றும் மனநல AI நிபுணர். உங்கள் தூக்கத்தைப் பாதிக்கும் காரணங்களைச் சரியாகப் புரிந்துகொண்டு, அதற்கேற்ப இலக்கு ஆலோசனைகளை வழங்க சில கேள்விகளைக் கேட்கப் போகிறேன்.\n\nதொடங்குவதற்கு: நீங்கள் எவ்வளவு காலமாக தூக்கமின்மையால் பாதிக்கப்படுகிறீர்கள், தூங்க முயலும்போது என்ன நடக்கிறது?",
    "mia.worklifeBurnout": "வேலை-வாழ்க்கை சமநிலை & மன அழுத்தம்",
    "mia.relationshipConflict": "உறவுமுறை மோதல்கள்",
    "mia.lossOfLovedOne": "அன்புக்குரியவரின் இழப்பு",
    "mia.hormonalMoodSwings": "மாதவிடாய்க்கு முந்தைய / ஹார்மோன் மனநிலை மாற்றங்கள்",
    "mia.sexualHealthConcerns": "தாம்பத்திய / பாலியல் ஆரோக்கிய கவலைகள்",
    "mia.somethingElse": "முற்றிலும் வேறு ஒன்று",
    "mia.troubleFallingAsleep": "வாரக்கணக்காக தூங்குவதில் சிரமம்",
    "mia.fallAsleepWake34am": "தூங்கிவிடுகிறேன் ஆனால் அதிகாலை 3-4 மணிக்கு விழிப்பு வருகிறது",
    "mia.wakeTooEarly": "மிக சீக்கிரம் விழித்துவிடுகிறேன், மீண்டும் தூங்க முடிவதில்லை",
    "mia.allPoorSleep": "மேலே உள்ள அனைத்தும் — மிக மோசமான தூக்கம்",
    "mia.startedRecently": "சமீபத்தில் தொடங்கியது — கடந்த சில நாட்களாக",
    "mia.returningBetter": "நான் குறிப்பிடத்தக்க அளவில் நன்றாக உணர்கிறேன்",
    "mia.returningSame": "அதே நிலைதான் — பெரிய மாற்றம் இல்லை",
    "mia.returningWorse": "உண்மையில் மோசமாக உணர்கிறேன்",
    "mia.returningSome": "சில விஷயங்களை முயற்சித்தேன், எல்லாவற்றையும் அல்ல"
  },
  te: {
    "mia.greetingStress": "నమస్కారం 💙 నేను **మియా**, మిటో రీబూట్ మానసిక ఆరోగ్య AI నిపుణురాలిని. మీరు కష్ట సమయాన్ని ఎదుర్కొంటున్నారని నేను గ్రహించగలను. సాధారణ సలహాలు ఇవ్వడం కాకుండా మీ పరిస్థితిని లోతుగా అర్థం చేసుకోవాలనుకుంటున్నాను.\n\nవీటిలో ఏది ఇప్పుడు మిమ్మల్ని ఎక్కువగా బాధిస్తోంది?",
    "mia.greetingSleep": "నమస్కారం 🌙 నేను **మియా**, మీ నిద్ర మరియు మానసిక ఆరోగ్య నిపుణురాలిని. మీ నిద్రను ఏది ప్రభావితం చేస్తోందో ఖచ్చితంగా అర్థం చేసుకోవడానికి కొన్ని ప్రశ్నలు అడుగుతాను, ఆపై మీ పరిస్థితికి తగిన సలహాలు ఇస్తాను.\n\nప్రారంభించడానికి: మీరు ఎంతకాలంగా నిద్రలేమితో బాధపడుతున్నారు, పడుకోవడానికి ప్రయత్నించినప్పుడు ఏమి జరుగుతోంది?",
    "mia.worklifeBurnout": "పని-జీవిత సమతుల్యత & అలసట",
    "mia.relationshipConflict": "సంబంధాల మధ్య విభేదాలు",
    "mia.lossOfLovedOne": "ప్రియమైన వారిని కోల్పోవడం",
    "mia.hormonalMoodSwings": "పీరియడ్స్ ముందు / హార్మోన్ల హెచ్చుతగ్గులు",
    "mia.sexualHealthConcerns": "లైంగిక ఆరోగ్య సమస్యలు",
    "mia.somethingElse": "పూర్తిగా వేరే విషయం",
    "mia.troubleFallingAsleep": "వారాల తరబడి నిద్ర పట్టడంలో ఇబ్బంది",
    "mia.fallAsleepWake34am": "నిద్రపడుతుంది కానీ తెల్లవారుజామున 3-4 గంటలకు మెలకువ వస్తుంది",
    "mia.wakeTooEarly": "చాలా త్వరగా మెలకువ వస్తుంది, మళ్ళీ నిద్ర పట్టదు",
    "mia.allPoorSleep": "పైవన్నీ — నిద్ర చాలా అధ్వాన్నంగా ఉంది",
    "mia.startedRecently": "ఇటీవలే మొదలైంది — గత కొన్ని రోజులుగా",
    "mia.returningBetter": "నేను గుర్తించదగినంత మెరుగ్గా ఉన్నాను",
    "mia.returningSame": "అలాగే ఉంది — పెద్దగా మార్పు లేదు",
    "mia.returningWorse": "నిజానికి పరిస్థితి మరింత దిగజారింది",
    "mia.returningSome": "కొన్ని ప్రయత్నించాను, అన్నీ కాదు"
  },
  kn: {
    "mia.greetingStress": "ನಮಸ್ಕಾರ 💙 ನಾನು **ಮಿಯಾ**, ಮಿಟೊ ರಿಬೂಟ್‌ನ ಮಾನಸಿಕ ಆರೋಗ್ಯ AI ತಜ್ಞೆ. ನೀವು ಕಷ್ಟದ ಸಮಯವನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ ಎಂದು ನಾನು ಗ್ರಹಿಸಬಲ್ಲೆ. ಸಾಮಾನ್ಯ ಸಲಹೆಗಳನ್ನು ನೀಡುವ ಬದಲು ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಆಳವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ.\n\nಇವುಗಳಲ್ಲಿ ಯಾವುದು ನಿಮ್ಮನ್ನು ಈಗ ಹೆಚ್ಚು ಕಾಡುತ್ತಿದೆ?",
    "mia.greetingSleep": "ನಮಸ್ಕಾರ 🌙 ನಾನು **ಮಿಯಾ**, ನಿಮ್ಮ ನಿದ್ರಾರೋಗ್ಯ ಮತ್ತು ಮಾನಸಿಕ ಕ್ಷೇಮ ತಜ್ಞೆ. ನಿಮ್ಮ ನಿದ್ರೆಗೆ ಅಡ್ಡಿಯಾಗುತ್ತಿರುವ ಅಂಶಗಳನ್ನು ನಿಖರವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಂಡು ಸೂಕ್ತ ಸಲಹೆ ನೀಡಲು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಲಿದ್ದೇನೆ.\n\nಪ್ರಾರಂಭಿಸಲು: ನೀವು ಎಷ್ಟು ಸಮಯದಿಂದ ನಿದ್ರಾಹೀನತೆಯಿಂದ ಬಳಲುತ್ತಿದ್ದೀರಿ ಮತ್ತು ಮಲಗಲು ಪ್ರಯತ್ನಿಸಿದಾಗ ಏನಾಗುತ್ತದೆ?",
    "mia.worklifeBurnout": "ಕೆಲಸ-ಜೀವನದ ಸಮತೋಲನ & ಅತಿಯಾದ ಒತ್ತಡ",
    "mia.relationshipConflict": "ಸಂಬಂಧಗಳಲ್ಲಿ ಭಿನ್ನಾಭಿಪ್ರಾಯ",
    "mia.lossOfLovedOne": "ಆಪ್ತರ ಅಗಲಿಕೆ",
    "mia.hormonalMoodSwings": "ಮುಟ್ಟಿನ ಮುನ್ನ / ಹಾರ್ಮೋನ್ ಏರುಪೇರುಗಳ ಬದಲಾವಣೆ",
    "mia.sexualHealthConcerns": "ಲೈಂಗಿಕ ಆರೋಗ್ಯದ ಕಾಳಜಿಗಳು",
    "mia.somethingElse": "ಸಂಪೂರ್ಣವಾಗಿ ಬೇರೆ ವಿಷಯ",
    "mia.troubleFallingAsleep": "ವಾರಗಳಿಂದ ನಿದ್ರೆ ಬಾರದೆ ಕಷ್ಟಪಡುತ್ತಿರುವುದು",
    "mia.fallAsleepWake34am": "ನಿದ್ರೆ ಬರುತ್ತದೆ ಆದರೆ ಮುಂಜಾನೆ 3-4 ಗಂಟೆಗೆ ಎಚ್ಚರವಾಗುತ್ತದೆ",
    "mia.wakeTooEarly": "ತುಂಬಾ ಬೇಗ ಎಚ್ಚರವಾಗುತ್ತದೆ, ಮತ್ತೆ ನಿದ್ರೆ ಬರಲ್ಲ",
    "mia.allPoorSleep": "ಮೇಲಿನ ಎಲ್ಲವೂ — ನಿದ್ರೆ ತೀರಾ ಕಳಪೆಯಾಗಿದೆ",
    "mia.startedRecently": "ಇತ್ತೀಚೆಗೆ ಪ್ರಾರಂಭವಾಗಿದೆ — ಕಳೆದ ಕೆಲವು ದಿನಗಳಿಂದ",
    "mia.returningBetter": "ನಾನು ಗಮನಾರ್ಹವಾಗಿ ಉತ್ತಮವಾಗಿದ್ದೇನೆ",
    "mia.returningSame": "ಹಾಗೆಯೇ ಇದೆ — ಯಾವುದೇ ಬದಲಾವಣೆಯಿಲ್ಲ",
    "mia.returningWorse": "ವಾಸ್ತವವಾಗಿ ಪರಿಸ್ಥಿತಿ ಬಿಗಡಾಯಿಸಿದೆ",
    "mia.returningSome": "ಕೆಲವನ್ನು ಪ್ರಯತ್ನಿಸಿದೆ, ಎಲ್ಲವನ್ನೂ ಅಲ್ಲ"
  },
  hi: {
    "mia.greetingStress": "नमस्ते 💙 मैं **मिया** हूँ, माइटो रीबूट में आपकी मानसिक स्वास्थ्य AI विशेषज्ञ। मैं समझ सकती हूँ कि आप एक कठिन दौर से गुजर रहे हैं। मैं केवल सामान्य सलाह देने के बजाय आपकी स्थिति को गहराई से समझना चाहती हूँ।\n\nइनमें से कौन सी बात आपको इस समय सबसे ज्यादा परेशान कर रही है?",
    "mia.greetingSleep": "नमस्ते 🌙 मैं **मिया** हूँ, आपकी नींद और मानसिक स्वास्थ्य विशेषज्ञ। आपकी नींद को क्या प्रभावित कर रहा है, यह समझने के लिए मैं कुछ प्रश्न पूछूँगी और फिर आपकी स्थिति के अनुसार लक्षित सलाह दूँगी।\n\nशुरुआत करने के लिए: आप कब से नींद की समस्या से जूझ रहे हैं, और सोने की कोशिश करते समय क्या होता है?",
    "mia.worklifeBurnout": "कार्य-जीवन संतुलन और अत्यधिक तनाव",
    "mia.relationshipConflict": "संबंधों में टकराव या मनमुटाव",
    "mia.lossOfLovedOne": "किसी प्रियजन का बिछोह या नुकसान",
    "mia.hormonalMoodSwings": "मासिक धर्म पूर्व / हार्मोनल मूड स्विंग्स",
    "mia.sexualHealthConcerns": "यौन स्वास्थ्य संबंधी चिंताएं",
    "mia.somethingElse": "पूरी तरह से कुछ और",
    "mia.troubleFallingAsleep": "हफ्तों से नींद आने में परेशानी",
    "mia.fallAsleepWake34am": "नींद आ जाती है लेकिन रात 3-4 बजे आंख खुल जाती है",
    "mia.wakeTooEarly": "बहुत जल्दी आंख खुल जाती है और दोबारा नींद नहीं आती",
    "mia.allPoorSleep": "उपरोक्त सभी — बहुत खराब नींद",
    "mia.startedRecently": "हाल ही में शुरू हुआ — पिछले कुछ दिनों से",
    "mia.returningBetter": "मैं काफी बेहतर महसूस कर रहा हूँ",
    "mia.returningSame": "लगभग वैसा ही — कोई खास बदलाव नहीं",
    "mia.returningWorse": "वास्तव में स्थिति और खराब लग रही है",
    "mia.returningSome": "मैंने कुछ उपाय आजमाए, सारे नहीं"
  }
};

['en', 'ta', 'te', 'kn', 'hi'].forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  const keys = miaBatch[lang];
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
        '\n  // --- MIA AI GREETINGS & OPTIONS BATCH ---\n' +
        linesToAdd.join('\n') + '\n' +
        content.slice(lastBraceIndex);
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`[${lang}] Added ${linesToAdd.length} Mia keys.`);
    }
  } else {
    console.log(`[${lang}] All Mia keys already present.`);
  }
});
