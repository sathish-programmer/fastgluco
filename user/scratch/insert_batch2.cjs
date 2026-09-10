const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

const batch2 = {
  en: {
    // Environmental
    "environmental.airPollutionScore": "Air Pollution Exposure",
    "environmental.waterCarcinogens": "Water Quality & Carcinogens",
    "environmental.pesticideExposure": "Pesticide & Produce Safety",
    "environmental.microplasticsExposure": "Microplastics & Cookware",
    "environmental.loggedToday": "Logged Today",
    "environmental.dailyCheckin": "Environmental Risk Assessment",
    "environmental.exposureScoreDesc": "Environmental toxins and heavy metals contribute to oxidative cellular stress.",
    "environmental.safeFeedback": "Low environmental risk detected. Maintain clean water and air habits!",
    "environmental.moderateFeedback": "Moderate risk. Consider carbon filtration and switching to non-toxic cookware.",
    "environmental.highFeedback": "Elevated toxic exposure risk. Take action to improve air and water quality.",
    "environmental.bookConsultation": "Consult Environmental Health Specialist",
    "environmental.outdoorAirTitle": "Outdoor Air & Passive Smoke",
    "environmental.airPassiveSmoke": "Frequent exposure to vehicle exhaust or secondhand smoke?",
    "environmental.airPassiveDesc": "PM2.5 particles penetrate deep into lung tissue causing systemic inflammation.",
    "environmental.waterContaminants": "Water Filtration Type",
    "environmental.carbonRo": "Activated Carbon + RO Filtered",
    "environmental.dualFiltration": "Dual Stage Multi-Layer Purified",
    "environmental.produceFarming": "Produce Washing & Organic Selection",
    "environmental.produceRisks": "Soaking vegetables in baking soda or ozonated water removes 90%+ pesticide residues.",
    "environmental.plasticContainers": "Plastic & Synthetic Utensils",
    "environmental.heatedContainers": "Heating food in plastic releases bisphenols and phthalates.",
    "environmental.saveExposureLog": "Save Environmental Log",

    // Genetic
    "genetic.damageBreadcrumb": "Hereditary & Familial Risk",
    "genetic.familyHistoryDesc": "Understanding your genetic background enables early and targeted screening.",
    "genetic.checkGeneticTendency": "Assess Familial Health History",
    "genetic.checkGeneticDesc": "First-degree relative history of metabolic or oncological conditions.",
    "genetic.bloodTest": "Preventive Genetic Panel",
    "genetic.familyCancerQuestion": "Any immediate family history of early-onset health conditions?",
    "genetic.consultRecommendDesc": "A genetic counsellor can help decode lineage risks and design personalized protocols.",

    // Indian Cancers
    "indianCancers.selectedSite": "Selected Cancer Profile",
    "indianCancers.majorRiskFactors": "Major Regional Risk Factors",
    "indianCancers.watchAwarenessVideos": "Awareness & Screening Guidelines",
    "indianCancers.dataAttributionDesc": "Incidence trends derived from ICMR & National Cancer Registry Programme (NCRP) data.",
    "indianCancers.disclaimerDesc": "For clinical and preventive awareness only. Consult an oncologist for medical evaluation.",

    // Food log extra nutrition
    "foodLog.calories": "Calories",
    "foodLog.carbs": "Carbs",
    "foodLog.protein": "Protein",
    "foodLog.fat": "Fat",
    "foodLog.fiber": "Fiber",
    "foodLog.breakfast": "Breakfast",
    "foodLog.lunch": "Lunch",
    "foodLog.dinner": "Dinner",
    "foodLog.snack": "Snack",
    "foodLog.portionSize": "Portion Size",
    "foodLog.nutritionalValues": "Nutritional Values",

    // Live AQI
    "aqi.satisfactory": "51 - 100 (Satisfactory)",
    "aqi.moderate": "101 - 150 (Moderate)",
    "aqi.hours": "hrs"
  },
  ta: {
    // Environmental
    "environmental.airPollutionScore": "காற்று மாசுபாட்டின் பாதிப்பு",
    "environmental.waterCarcinogens": "நீரின் தரம் & புற்றுநோய் காரணிகள்",
    "environmental.pesticideExposure": "பூச்சிக்கொல்லி & காய்கறி பாதுகாப்பு",
    "environmental.microplasticsExposure": "மைக்ரோபிளாஸ்டிக் & சமையல் பாத்திரங்கள்",
    "environmental.loggedToday": "இன்று பதிவு செய்யப்பட்டது",
    "environmental.dailyCheckin": "சுற்றுச்சூழல் அபாய மதிப்பீடு",
    "environmental.exposureScoreDesc": "சுற்றுச்சூழல் நச்சுகள் மற்றும் கன உலோகங்கள் செல்லுலார் அழுத்தத்தை அதிகரிக்கின்றன.",
    "environmental.safeFeedback": "குறைந்த சுற்றுச்சூழல் ஆபத்து. சுத்தமான நீர் மற்றும் காற்று பழக்கங்களைப் பேணுங்கள்!",
    "environmental.moderateFeedback": "மிதமான ஆபத்து. கார்பன் வடிகட்டுதல் மற்றும் நச்சு இல்லாத பாத்திரங்களைப் பயன்படுத்தவும்.",
    "environmental.highFeedback": "அதிக நச்சு ஆபத்து. காற்று மற்றும் நீரின் தரத்தை மேம்படுத்த உடனடி நடவடிக்கை எடுக்கவும்.",
    "environmental.bookConsultation": "சுற்றுச்சூழல் சுகாதார நிபுணரை அணுகவும்",
    "environmental.outdoorAirTitle": "வெளிப்புற காற்று & புகை வெளிப்பாடு",
    "environmental.airPassiveSmoke": "வாகனப் புகை அல்லது பிறர் புகைக்கும் புகைக்கு ஆளாகிறீர்களா?",
    "environmental.airPassiveDesc": "PM2.5 துகள்கள் நுரையீரலின் ஆழத்தில் நுழைந்து வீக்கத்தை ஏற்படுத்துகின்றன.",
    "environmental.waterContaminants": "நீர் வடிகட்டுதல் வகை",
    "environmental.carbonRo": "ஆக்டிவேட்டட் கார்பன் + RO வடிகட்டப்பட்டது",
    "environmental.dualFiltration": "இரட்டை அடுக்கு சுத்திகரிக்கப்பட்டது",
    "environmental.produceFarming": "காய்கறி கழுவுதல் & இயற்கை தேர்வு",
    "environmental.produceRisks": "பேக்கிங் சோடா நீரில் காய்கறிகளை ஊறவைப்பது 90%+ பூச்சிக்கொல்லிகளை நீக்குகிறது.",
    "environmental.plasticContainers": "பிளாஸ்டிக் & செயற்கை பாத்திரங்கள்",
    "environmental.heatedContainers": "பிளாஸ்டிக்கில் உணவை சூடாக்குவது நச்சு ரசாயனங்களை வெளியிடுகிறது.",
    "environmental.saveExposureLog": "சுற்றுச்சூழல் பதிவை சேமிக்கவும்",

    // Genetic
    "genetic.damageBreadcrumb": "பரம்பரை & குடும்ப ஆபத்து",
    "genetic.familyHistoryDesc": "உங்கள் மரபணு பின்னணியைப் புரிந்துகொள்வது ஆரம்பகால மற்றும் துல்லியமான பரிசோதனைக்கு உதவுகிறது.",
    "genetic.checkGeneticTendency": "குடும்ப சுகாதார வரலாற்றை மதிப்பிடுங்கள்",
    "genetic.checkGeneticDesc": "முதல் நிலை உறவினர்களிடையே வளர்சிதை மாற்ற அல்லது புற்றுநோய் பாதிப்பு.",
    "genetic.bloodTest": "தடுப்பு மரபணு பரிசோதனை",
    "genetic.familyCancerQuestion": "குடும்பத்தில் யாருக்காவது ஆரம்பகால உடல்நலப் பிரச்சினைகள் உள்ளதா?",
    "genetic.consultRecommendDesc": "மரபணு ஆலோசகர் உங்கள் குடும்ப அபாயங்களைப் பகுப்பாய்வு செய்து தனிப்பயனாக்கப்பட்ட திட்டங்களை வழங்க முடியும்.",

    // Indian Cancers
    "indianCancers.selectedSite": "தேர்ந்தெடுக்கப்பட்ட புற்றுநோய் சுயவிவரம்",
    "indianCancers.majorRiskFactors": "முக்கிய பிராந்திய ஆபத்து காரணிகள்",
    "indianCancers.watchAwarenessVideos": "விழிப்புணர்வு & பரிசோதனை வழிகாட்டுதல்கள்",
    "indianCancers.dataAttributionDesc": "ICMR & தேசிய புற்றுநோய் பதிவேட்டுத் திட்டத்தின் (NCRP) புள்ளிவிவரங்களின் அடிப்படையில் பெறப்பட்டது.",
    "indianCancers.disclaimerDesc": "மருத்துவ விழிப்புணர்வுக்காக மட்டுமே. மருத்துவ மதிப்பீட்டிற்கு புற்றுநோய் நிபுணரை அணுகவும்.",

    // Food log extra nutrition
    "foodLog.calories": "கலோரிகள்",
    "foodLog.carbs": "கார்போஹைட்ரேட்",
    "foodLog.protein": "புரதம்",
    "foodLog.fat": "கொழுப்பு",
    "foodLog.fiber": "நார்ச்சத்து",
    "foodLog.breakfast": "காலை உணவு",
    "foodLog.lunch": "மதிய உணவு",
    "foodLog.dinner": "இரவு உணவு",
    "foodLog.snack": "சிற்றுண்டி",
    "foodLog.portionSize": "பரிமாறும் அளவு",
    "foodLog.nutritionalValues": "ஊட்டச்சத்து மதிப்புகள்",

    // Live AQI
    "aqi.satisfactory": "51 - 100 (திருப்திகரமானது)",
    "aqi.moderate": "101 - 150 (மிதமானது)",
    "aqi.hours": "மணி"
  },
  kn: {
    // Environmental
    "environmental.airPollutionScore": "ವಾಯು ಮಾಲಿನ್ಯದ ಮಾನ್ಯತೆ",
    "environmental.waterCarcinogens": "ನೀರಿನ ಗುಣಮಟ್ಟ & ಕ್ಯಾನ್ಸರ್ ಕಾರಕಗಳು",
    "environmental.pesticideExposure": "ಕೀಟನಾಶಕ & ತರಕಾರಿ ಸುರಕ್ಷತೆ",
    "environmental.microplasticsExposure": "ಮೈಕ್ರೋಪ್ಲಾಸ್ಟಿಕ್ & ಅಡುಗೆ ಪಾತ್ರೆಗಳು",
    "environmental.loggedToday": "ಇಂದು ದಾಖಲಿಸಲಾಗಿದೆ",
    "environmental.dailyCheckin": "ಪರಿಸರ ಅಪಾಯದ ಮೌಲ್ಯಮಾಪನ",
    "environmental.exposureScoreDesc": "ಪರಿಸರ ವಿಷಗಳು ಮತ್ತು ಭಾರವಾದ ಲೋಹಗಳು ಕೋಶಗಳ ಒತ್ತಡವನ್ನು ಹೆಚ್ಚಿಸುತ್ತವೆ.",
    "environmental.safeFeedback": "ಕಡಿಮೆ ಪರಿಸರ ಅಪಾಯ. ಶುದ್ಧ ನೀರು ಮತ್ತು ಗಾಳಿಯ ಅಭ್ಯಾಸಗಳನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ!",
    "environmental.moderateFeedback": "ಮಧ್ಯಮ ಅಪಾಯ. ಕಾರ್ಬನ್ ಫಿಲ್ಟರೇಶನ್ ಮತ್ತು ವಿಷಮುಕ್ತ ಪಾತ್ರೆಗಳನ್ನು ಬಳಸಿ.",
    "environmental.highFeedback": "ಹೆಚ್ಚಿನ ವಿಷಕಾರಿ ಅಪಾಯ. ಗಾಳಿ ಮತ್ತು ನೀರಿನ ಗುಣಮಟ್ಟವನ್ನು ಸುಧಾರಿಸಲು ಕ್ರಮ ಕೈಗೊಳ್ಳಿ.",
    "environmental.bookConsultation": "ಪರಿಸರ ಆರೋಗ್ಯ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ",
    "environmental.outdoorAirTitle": "ಹೊರಾಂಗಣ ಗಾಳಿ & ಧೂಮಪಾನದ ಹೊಗೆ",
    "environmental.airPassiveSmoke": "ವಾಹನಗಳ ಹೊಗೆ ಅಥವಾ ಇತರರ ಧೂಮಪಾನದ ಹೊಗೆಗೆ ಒಡ್ಡಿಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?",
    "environmental.airPassiveDesc": "PM2.5 ಕಣಗಳು ಶ್ವಾಸಕೋಶದ ಆಳಕ್ಕೆ ಇಳಿದು ಉರಿಯೂತವನ್ನು ಉಂಟುಮಾಡುತ್ತವೆ.",
    "environmental.waterContaminants": "ನೀರಿನ ಫಿಲ್ಟರೇಶನ್ ಪ್ರಕಾರ",
    "environmental.carbonRo": "ಸಕ್ರಿಯ ಕಾರ್ಬನ್ + RO ಫಿಲ್ಟರ್ ಮಾಡಲಾಗಿದೆ",
    "environmental.dualFiltration": "ದ್ವಿ ಹಂತದ ಬಹು-ಪದರ ಶುದ್ಧೀಕರಿಸಲಾಗಿದೆ",
    "environmental.produceFarming": "ತರಕಾರಿ ತೊಳೆಯುವುದು & ಸಾವಯವ ಆಯ್ಕೆ",
    "environmental.produceRisks": "ಅಡುಗೆ ಸೋಡಾ ನೀರಿನಲ್ಲಿ ತರಕಾರಿ ನೆನೆಸುವುದರಿಂದ 90%+ ಕೀಟನಾಶಕಗಳು ನಿವಾರಣೆಯಾಗುತ್ತವೆ.",
    "environmental.plasticContainers": "ಪ್ಲಾಸ್ಟಿಕ್ & ಸಿಂಥೆಟಿಕ್ ಪಾತ್ರೆಗಳು",
    "environmental.heatedContainers": "ಪ್ಲಾಸ್ಟಿಕ್‌ನಲ್ಲಿ ಆಹಾರ ಬಿಸಿ ಮಾಡುವುದರಿಂದ ವಿಷಕಾರಿ ರಾಸಾಯನಿಕಗಳು ಬಿಡುಗಡೆಯಾಗುತ್ತವೆ.",
    "environmental.saveExposureLog": "ಪರಿಸರ ದಾಖಲೆಯನ್ನು ಉಳಿಸಿ",

    // Genetic
    "genetic.damageBreadcrumb": "ಆನುವಂಶಿಕ & ಕುಟುಂಬ ಅಪಾಯ",
    "genetic.familyHistoryDesc": "ನಿಮ್ಮ ಆನುವಂಶಿಕ ಹಿನ್ನೆಲೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ಆರಂಭಿಕ ತಪಾಸಣೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    "genetic.checkGeneticTendency": "ಕುಟುಂಬದ ಆರೋಗ್ಯ ಇತಿಹಾಸವನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ",
    "genetic.checkGeneticDesc": "ಮೊದಲ ಹಂತದ ಸಂಬಂಧಿಕರಲ್ಲಿ ಚಯಾಪಚಯ ಅಥವಾ ಕ್ಯಾನ್ಸರ್ ಇತಿಹಾಸ.",
    "genetic.bloodTest": "ತಡೆಗಟ್ಟುವ ಆನುವಂಶಿಕ ಪ್ಯಾನೆಲ್",
    "genetic.familyCancerQuestion": "ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಆರಂಭಿಕ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳ ಇತಿಹಾಸವಿದೆಯೇ?",
    "genetic.consultRecommendDesc": "ಆನುವಂಶಿಕ ಸಲಹೆಗಾರರು ನಿಮ್ಮ ಕುಟುಂಬದ ಅಪಾಯಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ವೈಯಕ್ತಿಕ ಪ್ರೋಟೋಕಾಲ್ ನೀಡಬಹುದು.",

    // Indian Cancers
    "indianCancers.selectedSite": "ಆಯ್ಕೆಮಾಡಿದ ಕ್ಯಾನ್ಸರ್ ಪ್ರೊಫೈಲ್",
    "indianCancers.majorRiskFactors": "ಪ್ರಮುಖ ಪ್ರಾದೇಶಿಕ ಅಪಾಯದ ಅಂಶಗಳು",
    "indianCancers.watchAwarenessVideos": "ಜಾಗೃತಿ & ತಪಾಸಣೆ ಮಾರ್ಗಸೂಚಿಗಳು",
    "indianCancers.dataAttributionDesc": "ICMR ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ಕ್ಯಾನ್ಸರ್ ನೋಂದಣಿ ಕಾರ್ಯಕ್ರಮದ (NCRP) ಅಂಕಿಅಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಪಡೆಯಲಾಗಿದೆ.",
    "indianCancers.disclaimerDesc": "ವೈದ್ಯಕೀಯ ಜಾಗೃತಿಗಾಗಿ ಮಾತ್ರ. ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ಆಂಕೊಲಾಜಿಸ್ಟ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.",

    // Food log extra nutrition
    "foodLog.calories": "ಕ್ಯಾಲೋರಿಗಳು",
    "foodLog.carbs": "ಕಾರ್ಬೋಹೈಡ್ರೇಟ್",
    "foodLog.protein": "ಪ್ರೋಟೀನ್",
    "foodLog.fat": "ಕೊಬ್ಬು",
    "foodLog.fiber": "ನಾರಿನಂಶ",
    "foodLog.breakfast": "ಬೆಳಗಿನ ಉಪಹಾರ",
    "foodLog.lunch": "ಮಧ್ಯಾಹ್ನದ ಊಟ",
    "foodLog.dinner": "ರಾತ್ರಿಯ ಊಟ",
    "foodLog.snack": "ತಿಂಡಿ",
    "foodLog.portionSize": "ಭಾಗದ ಗಾತ್ರ",
    "foodLog.nutritionalValues": "ಪೌಷ್ಟಿಕಾಂಶದ ಮೌಲ್ಯಗಳು",

    // Live AQI
    "aqi.satisfactory": "51 - 100 (ತೃಪ್ತಿದಾಯಕ)",
    "aqi.moderate": "101 - 150 (ಮಧ್ಯಮ)",
    "aqi.hours": "ಗಂಟೆ"
  },
  hi: {
    // Environmental
    "environmental.airPollutionScore": "वायु प्रदूषण का जोखिम",
    "environmental.waterCarcinogens": "पानी की गुणवत्ता & कैंसर कारक",
    "environmental.pesticideExposure": "कीटनाशक & सब्जियों की सुरक्षा",
    "environmental.microplasticsExposure": "माइक्रोप्लास्टिक & खाना पकाने के बर्तन",
    "environmental.loggedToday": "आज दर्ज किया गया",
    "environmental.dailyCheckin": "पर्यावरण जोखिम मूल्यांकन",
    "environmental.exposureScoreDesc": "पर्यावरणीय विषाक्त पदार्थ और भारी धातुएं कोशिकीय तनाव को बढ़ाती हैं।",
    "environmental.safeFeedback": "कम पर्यावरणीय जोखिम। स्वच्छ पानी और वायु की आदतें बनाए रखें!",
    "environmental.moderateFeedback": "मध्यम जोखिम। कार्बन निस्पंदन और गैर-विषैले बर्तनों का उपयोग करें।",
    "environmental.highFeedback": "उच्च विषाक्त जोखिम। वायु और पानी की गुणवत्ता सुधारने के लिए तुरंत कदम उठाएं।",
    "environmental.bookConsultation": "पर्यावरण स्वास्थ्य विशेषज्ञ से परामर्श लें",
    "environmental.outdoorAirTitle": "बाहरी वायु & अप्रत्यक्ष धूम्रपान",
    "environmental.airPassiveSmoke": "वाहनों के धुएं या दूसरों के धूम्रपान के संपर्क में आते हैं?",
    "environmental.airPassiveDesc": "PM2.5 कण फेफड़ों में गहराई तक जाकर सूजन पैदा करते हैं।",
    "environmental.waterContaminants": "जल शोधन का प्रकार",
    "environmental.carbonRo": "सक्रिय कार्बन + आरओ फ़िल्टर किया हुआ",
    "environmental.dualFiltration": "दोहरे चरण में बहु-स्तरीय शुद्ध",
    "environmental.produceFarming": "सब्जी धोना & जैविक चयन",
    "environmental.produceRisks": "बेकिंग सोडा के पानी में सब्जियां भिगोने से 90%+ कीटनाशक निकल जाते हैं।",
    "environmental.plasticContainers": "प्लास्टिक & सिंथेटिक बर्तन",
    "environmental.heatedContainers": "प्लास्टिक में खाना गर्म करने से हानिकारक रसायन निकलते हैं।",
    "environmental.saveExposureLog": "पर्यावरण लॉग सहेजें",

    // Genetic
    "genetic.damageBreadcrumb": "आनुवंशिक & पारिवारिक जोखिम",
    "genetic.familyHistoryDesc": "अपनी आनुवंशिक पृष्ठभूमि को समझने से शुरुआती जांच में मदद मिलती है।",
    "genetic.checkGeneticTendency": "पारिवारिक स्वास्थ्य इतिहास का मूल्यांकन करें",
    "genetic.checkGeneticDesc": "प्रथम श्रेणी के रिश्तेदारों में चयापचय या कैंसर की स्थिति।",
    "genetic.bloodTest": "निवारक आनुवंशिक पैनल",
    "genetic.familyCancerQuestion": "क्या परिवार में किसी को शुरुआती स्वास्थ्य समस्याओं का इतिहास है?",
    "genetic.consultRecommendDesc": "आनुवंशिक परामर्शदाता पारिवारिक जोखिमों का विश्लेषण कर व्यक्तिगत योजनाएं बना सकते हैं।",

    // Indian Cancers
    "indianCancers.selectedSite": "चयनित कैंसर प्रोफाइल",
    "indianCancers.majorRiskFactors": "प्रमुख क्षेत्रीय जोखिम कारक",
    "indianCancers.watchAwarenessVideos": "जागरूकता & स्क्रीनिंग दिशानिर्देश",
    "indianCancers.dataAttributionDesc": "ICMR और राष्ट्रीय कैंसर रजिस्ट्री कार्यक्रम (NCRP) के आंकड़ों के आधार पर।",
    "indianCancers.disclaimerDesc": "केवल चिकित्सा जागरूकता के लिए। चिकित्सीय मूल्यांकन के लिए ऑन्कोलॉजिस्ट से परामर्श लें।",

    // Food log extra nutrition
    "foodLog.calories": "कैलोरी",
    "foodLog.carbs": "कार्ब्स",
    "foodLog.protein": "प्रोटीन",
    "foodLog.fat": "फैट",
    "foodLog.fiber": "फाइबर",
    "foodLog.breakfast": "नाश्ता",
    "foodLog.lunch": "दोपहर का भोजन",
    "foodLog.dinner": "रात का भोजन",
    "foodLog.snack": "स्नैक",
    "foodLog.portionSize": "मात्रा",
    "foodLog.nutritionalValues": "पोषण मूल्य",

    // Live AQI
    "aqi.satisfactory": "51 - 100 (संतोषजनक)",
    "aqi.moderate": "101 - 150 (मध्यम)",
    "aqi.hours": "घंटे"
  }
};

function insertKeysIntoFile(filePath, keysObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lastBraceIdx = content.lastIndexOf('} as const;');
  if (lastBraceIdx === -1) {
    console.error(`Could not find closing brace in ${filePath}`);
    return;
  }

  let injection = '\n  // --- BATCH 2 LOCALIZATION ---\n';
  for (const [k, v] of Object.entries(keysObj)) {
    const escapedVal = JSON.stringify(v);
    injection += `  ${JSON.stringify(k)}: ${escapedVal},\n`;
  }

  const before = content.slice(0, lastBraceIdx);
  const after = content.slice(lastBraceIdx);
  fs.writeFileSync(filePath, before + injection + after, 'utf8');
  console.log(`Updated ${filePath} with ${Object.keys(keysObj).length} keys.`);
}

insertKeysIntoFile(enPath, batch2.en);
insertKeysIntoFile(taPath, batch2.ta);
insertKeysIntoFile(knPath, batch2.kn);
insertKeysIntoFile(hiPath, batch2.hi);
