import fs from 'fs';
import path from 'path';

const additionalTranslations = {
  // common
  "common.today": {
    en: "Today",
    ta: "இன்று",
    te: "ఈ రోజు",
    kn: "ಇಂದು",
    hi: "आज"
  },
  "common.customRange": {
    en: "Custom Range",
    ta: "தனிப்பயன் வரம்பு",
    te: "అనుకూల శ్రేణి",
    kn: "ಕಸ್ಟಮ್ ಶ್ರೇಣಿ",
    hi: "कस्टम रेंज"
  },
  "common.7Days": {
    en: "7 Days",
    ta: "7 நாட்கள்",
    te: "7 రోజులు",
    kn: "7 ದಿನಗಳು",
    hi: "7 दिन"
  },
  "common.30Days": {
    en: "30 Days",
    ta: "30 நாட்கள்",
    te: "30 రోజులు",
    kn: "30 ದಿನಗಳು",
    hi: "30 दिन"
  },
  "common.other": {
    en: "Other",
    ta: "மற்றவை",
    te: "ఇతర",
    kn: "ಇತರ",
    hi: "अन्य"
  },

  // foodLog
  "foodLog.sevenDaysAgo": {
    en: "7 Days Ago",
    ta: "7 நாட்களுக்கு முன்பு",
    te: "7 రోజుల క్రితం",
    kn: "7 ದಿನಗಳ ಹಿಂದೆ",
    hi: "7 दिन पहले"
  },

  // dashboard
  "dashboard.glucoseCurve": {
    en: "Glucose Curve",
    ta: "குளுக்கோஸ் வளைவு",
    te: "గ్లూకోజ్ వక్రరేఖ",
    kn: "ಗ್ಲೂಕೋಸ್ ವಕ್ರರೇಖೆ",
    hi: "ग्लूकोज वक्र"
  },
  "dashboard.day": {
    en: "Day",
    ta: "நாள்",
    te: "రోజు",
    kn: "ದಿನ",
    hi: "दिन"
  },
  "dashboard.week": {
    en: "Week",
    ta: "வாரம்",
    te: "వారం",
    kn: "ವಾರ",
    hi: "सप्ताह"
  },
  "dashboard.month": {
    en: "Month",
    ta: "மாதம்",
    te: "నెల",
    kn: "ತಿಂಗಳು",
    hi: "माह"
  },
  "dashboard.custom": {
    en: "Custom",
    ta: "தனிப்பயன்",
    te: "అనుకూల",
    kn: "ಕಸ್ಟಮ್",
    hi: "कस्टम"
  },
  "dashboard.noDataAvailableFor": {
    en: "No Data Available for",
    ta: "தரவு எதுவும் கிடைக்கவில்லை -",
    te: "డేటా అందుబాటులో లేదు -",
    kn: "ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ -",
    hi: "के लिए कोई डेटा उपलब्ध नहीं है -"
  },
  "dashboard.thisWeek": {
    en: "This Week",
    ta: "இந்த வாரம்",
    te: "ఈ వారం",
    kn: "ಈ ವಾರ",
    hi: "इस सप्ताह"
  },
  "dashboard.thisMonth": {
    en: "This Month",
    ta: "இந்த மாதம்",
    te: "ఈ నెల",
    kn: "ಈ ತಿಂಗಳು",
    hi: "इस माह"
  },
  "dashboard.selectedDate": {
    en: "Selected Date",
    ta: "தேர்ந்தெடுக்கப்பட்ட தேதி",
    te: "ఎంచుకున్న తేదీ",
    kn: "ಆಯ್ಕೆಮಾಡಿದ ದಿನಾಂಕ",
    hi: "चयनित तिथि"
  },

  // insight
  "insight.walkingAfterMeals": {
    en: "Walking for 10-15 minutes after major meals helps clear circulating glucose, reducing the severity of peak spikes. Try swapping white rice for millets.",
    ta: "முக்கிய உணவுக்குப் பிறகு 10-15 நிமிடங்கள் நடைப்பயிற்சி செய்வது இரத்தத்தில் உள்ள குளுக்கோஸை விரைவாக எரிக்க உதவுகிறது. வெள்ளை அரிசிக்கு பதிலாக சிறுதானியங்களை பயன்படுத்த முயற்சிக்கவும்.",
    te: "భోజనం తర్వాత 10-15 నిమిషాలు నడవడం వల్ల రక్తంలోని గ్లూకోజ్ త్వరగా ఖర్చవుతుంది. తెల్ల అన్నానికి బదులుగా చిరుధాన్యాలను వాడటానికి ప్రయత్నించండి.",
    kn: "ಪ್ರಮುಖ ಊಟದ ನಂತರ 10-15 ನಿಮಿಷಗಳ ಕಾಲ ನಡೆಯುವುದು ರಕ್ತದಲ್ಲಿನ ಗ್ಲೂಕೋಸ್ ಅನ್ನು ತೆರವುಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಬಿಳಿ ಅನ್ನದ ಬದಲಿಗೆ ಸಿರಿಧಾನ್ಯಗಳನ್ನು ಬಳಸಲು ಪ್ರಯತ್ನಿಸಿ.",
    hi: "मुख्य भोजन के बाद 10-15 मिनट टहलने से रक्त शर्करा को नियंत्रित करने में मदद मिलती है। सफेद चावल के स्थान पर बाजरा/मिलेट्स अपनाने का प्रयास करें।"
  },
  "insight.stayingHydrated": {
    en: "Staying hydrated is key! Drinking water before meals can help reduce post-meal glucose spikes and support metabolism.",
    ta: "போதுமான நீர் குடிப்பது மிகவும் அவசியம்! உணவுக்கு முன் தண்ணீர் குடிப்பது இரத்த சர்க்கரை உயர்வை குறைத்து வளர்சிதை மாற்றத்தை ஆதரிக்கிறது.",
    te: "తగినంత నీరు త్రాగడం చాలా ముఖ్యం! భోజనానికి ముందు నీరు త్రాగడం గ్లూకోజ్ పెరుగుదలను తగ్గించడంలో సహాయపడుతుంది.",
    kn: "ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯುವುದು ಮುಖ್ಯ! ಊಟಕ್ಕೆ ಮುಂಚೆ ನೀರು ಕುಡಿಯುವುದು ಗ್ಲೂಕೋಸ್ ಏರಿಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಮತ್ತು ಚಯಾಪಚಯವನ್ನು ಬೆಂಬಲಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    hi: "पर्याप्त पानी पीना आवश्यक है! भोजन से पहले पानी पीने से भोजन के बाद ग्लूकोज के स्पाइक को कम करने और चयापचय में मदद मिलती है।"
  },
  "insight.pairCarbsWithProtein": {
    en: "Pair your carbohydrates with healthy fats or proteins (like nuts, avocado, or eggs) to slow down absorption and blunt the glucose curve.",
    ta: "கார்போஹைட்ரேட்டுகளுடன் ஆரோக்கியமான கொழுப்புகள் அல்லது புரதங்களை (கொட்டைகள், வெண்ணெய் பழம் அல்லது முட்டை போன்றவை) சேர்த்து உட்கொள்வது செரிமானத்தை மெதுவாக்கி சர்க்கரை உயர்வைத் தடுக்கும்.",
    te: "కార్బోహైడ్రేట్‌లతో పాటు ఆరోగ్యకరమైన కొవ్వులు లేదా ప్రొటీన్‌లను (గింజలు, అవోకాడో లేదా గుడ్లు వంటివి) తీసుకోవడం వల్ల శోషణ మందగించి గ్లూకోజ్ పెరుగుదల తగ్గుతుంది.",
    kn: "ಕಾರ್ಬೋಹೈಡ್ರೇಟ್‌ಗಳೊಂದಿಗೆ ಆರೋಗ್ಯಕರ ಕೊಬ್ಬುಗಳು ಅಥವಾ ಪ್ರೋಟೀನ್‌ಗಳನ್ನು (ಬೀಜಗಳು, ಆವಕಾಡೊ ಅಥವಾ ಮೊಟ್ಟೆಗಳಂತಹವು) ಸೇವಿಸುವುದರಿಂದ ಜೀರ್ಣಕ್ರಿಯೆ ನಿಧಾನವಾಗಿ ಗ್ಲೂಕೋಸ್ ಏರಿಕೆಯನ್ನು ತಡೆಯುತ್ತದೆ.",
    hi: "कार्बोहाइड्रेट के साथ स्वस्थ वसा या प्रोटीन (जैसे मेवे, एवोकाडो या अंडे) का सेवन करें ताकि अवशोषण धीमा हो और ग्लूकोज वक्र स्थिर रहे।"
  },
  "insight.qualitySleepInsulin": {
    en: "Getting 7-8 hours of quality sleep per night improves insulin sensitivity and helps stabilize fasting glucose levels.",
    ta: "இரவில் 7-8 மணிநேரம் ஆழ்ந்து தூங்குவது இன்சுலின் உணர்திறனை மேம்படுத்தி காலை நேர சர்க்கரை அளவை சீராக வைக்க உதவுகிறது.",
    te: "రాత్రి 7-8 గంటల నాణ్యమైన నిద్ర ఇన్సులిన్ సున్నితత్వాన్ని మెరుగుపరుస్తుంది మరియు ఉపవాస గ్లూకోజ్ స్థాయిలను స్థిరీకరించడానికి సహాయపడుతుంది.",
    kn: "ರಾತ್ರಿ 7-8 ಗಂಟೆಗಳ ಉತ್ತಮ ನಿದ್ರೆಯು ಇನ್ಸುಲಿನ್ ಸೂಕ್ಷ್ಮತೆಯನ್ನು ಸುಧಾರಿಸುತ್ತದೆ ಮತ್ತು ಉಪವಾಸದ ಗ್ಲೂಕೋಸ್ ಮಟ್ಟವನ್ನು ಸ್ಥಿರಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    hi: "रात में 7-8 घंटे की अच्छी नींद लेने से इंसुलिन संवेदनशीलता में सुधार होता है और फास्टिंग ग्लूकोज स्तर स्थिर रहता है।"
  },
  "insight.stressCortisolGlucose": {
    en: "High stress releases cortisol, which can raise glucose levels even without food. Practice deep breathing for 5 minutes when stressed.",
    ta: "அதிக மன அழுத்தம் கார்டிசோலை வெளியிட்டு உணவு இல்லாமலேயே சர்க்கரை அளவை உயர்த்தும். மன அழுத்தம் ஏற்படும் போது 5 நிமிடங்கள் ஆழமான சுவாசப் பயிற்சி செய்யுங்கள்.",
    te: "అధిక ఒత్తిడి కార్టిసాల్‌ను విడుదల చేస్తుంది, ఇది ఆహారం లేకుండా కూడా గ్లూకోజ్ స్థాయిలను పెంచుతుంది. ఒత్తిడి వచ్చినప్పుడు 5 నిమిషాలు లోతైన శ్వాస తీసుకోండి.",
    kn: "ಹೆಚ್ಚಿನ ಒತ್ತಡವು ಕಾರ್ಟಿಸೋಲ್ ಅನ್ನು ಬಿಡುಗಡೆ ಮಾಡುತ್ತದೆ, ಇದು ಆಹಾರವಿಲ್ಲದಿದ್ದರೂ ಗ್ಲೂಕೋಸ್ ಮಟ್ಟವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ. ಒತ್ತಡವಿದ್ದಾಗ 5 ನಿಮಿಷ ಆಳವಾದ ಉಸಿರಾಟವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ.",
    hi: "अत्यधिक तनाव से कोर्टिसोल निकलता है, जो बिना भोजन के भी ग्लूकोज बढ़ा सकता है। तनाव होने पर 5 मिनट गहरी सांस लेने का अभ्यास करें।"
  },
  "insight.eatMealsInOrder": {
    en: "Try to eat your meals in this order: vegetables first, then protein and fats, and carbohydrates last to minimize spike peaks.",
    ta: "உணவை இந்த வரிசையில் சாப்பிட முயற்சிக்கவும்: முதலில் காய்கறிகள், பின் புரதம் மற்றும் கொழுப்புகள், இறுதியாக கார்போஹைட்ரேட்டுகள். இது சர்க்கரை உயர்வை பெருமளவில் குறைக்கும்.",
    te: "ఆహారాన్ని ఈ క్రమంలో తినడానికి ప్రయత్నించండి: మొదట కూరగాయలు, తర్వాత ప్రొటీన్ మరియు కొవ్వులు, చివరగా కార్బోహైడ్రేట్లు. ఇది గ్లూకోజ్ పెరుగుదలను తగ్గిస్తుంది.",
    kn: "ಊಟವನ್ನು ಈ ಕ್ರಮದಲ್ಲಿ ಸೇವಿಸಲು ಪ್ರಯತ್ನಿಸಿ: ಮೊದಲು ತರಕಾರಿಗಳು, ನಂತರ ಪ್ರೋಟೀನ್ ಮತ್ತು ಕೊಬ್ಬುಗಳು, ಕೊನೆಯಲ್ಲಿ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್‌ಗಳು. ಇದು ಗ್ಲೂಕೋಸ್ ಸ್ಪೈಕ್ ಅನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
    hi: "भोजन इस क्रम में करने का प्रयास करें: पहले सब्जियां, फिर प्रोटीन और वसा, और अंत में कार्बोहाइड्रेट ताकि ग्लूकोज स्पाइक कम से कम हो।"
  },

  // appointment
  "appointment.upcomingAndPastVisits": {
    en: "Upcoming & Past Visits",
    ta: "வரவிருக்கும் & கடந்த ஆலோசனைகள்",
    te: "రాబోయే & గత సంప్రదింపులు",
    kn: "ಮುಂಬರುವ ಮತ್ತು ಹಿಂದಿನ ಭೇಟಿಗಳು",
    hi: "आगामी और पिछली मुलाकातें"
  },
  "appointment.paymentFailed": {
    en: "Payment Failed",
    ta: "பணம் செலுத்துதல் தோல்வியுற்றது",
    te: "చెల్లింపు విఫలమైంది",
    kn: "ಪಾವತಿ ವಿಫಲವಾಗಿದೆ",
    hi: "भुगतान विफल"
  },
  "appointment.expired": {
    en: "Expired",
    ta: "காலாவதியானது",
    te: "గడువు ముగిసింది",
    kn: "ಅವಧಿ ಮುಗಿದಿದೆ",
    hi: "समाप्त"
  },
  "appointment.confirmed": {
    en: "Confirmed",
    ta: "உறுதி செய்யப்பட்டது",
    te: "ధృవీకరించబడింది",
    kn: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    hi: "पुष्टीकृत"
  },
  "appointment.pending": {
    en: "Pending",
    ta: "நிலுவையில் உள்ளது",
    te: "పెండింగ్‌లో ఉంది",
    kn: "ಬಾಕಿ ಇದೆ",
    hi: "लंबित"
  },
  "appointment.completed": {
    en: "Completed",
    ta: "முடிந்தது",
    te: "పూర్తయింది",
    kn: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    hi: "पूर्ण"
  },
  "appointment.cancelled": {
    en: "Cancelled",
    ta: "ரத்து செய்யப்பட்டது",
    te: "రద్దు చేయబడింది",
    kn: "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ",
    hi: "रद्द"
  },
  "appointment.online": {
    en: "Online",
    ta: "ஆன்லைன்",
    te: "ఆన్‌లైన్",
    kn: "ಆನ್‌ಲೈನ್",
    hi: "ऑनलाइन"
  },
  "appointment.offline": {
    en: "Offline",
    ta: "நேரடி",
    te: "ఆఫ్‌లైన్",
    kn: "ಆಫ್‌ಲೈನ್",
    hi: "ऑफलाइन"
  },
  "appointment.generalConsultation": {
    en: "General Consultation",
    ta: "பொது மருத்துவ ஆலோசனை",
    te: "సాధారణ సంప్రదింపులు",
    kn: "ಸಾಮಾನ್ಯ ಸಮಾಲೋಚನೆ",
    hi: "सामान्य परामर्श"
  },
  "appointment.diabetesConsultation": {
    en: "Diabetes Consultation",
    ta: "நீரிழிவு ஆலோசனை",
    te: "మధుమేహం సంప్రదింపులు",
    kn: "ಮಧುಮೇಹ ಸಮಾಲೋಚನೆ",
    hi: "मधुमेह परामर्श"
  },
  "appointment.endocrinologistConsultation": {
    en: "Endocrinologist Consultation",
    ta: "நாளமில்லா சுரப்பி நிபுணர் ஆலோசனை",
    te: "ఎండోక్రినాలజిస్ట్ సంప్రదింపులు",
    kn: "ಎಂಡೋಕ್ರೈನಾಲಜಿಸ್ಟ್ ಸಮಾಲೋಚನೆ",
    hi: "एंडोक्रिनोलॉजिस्ट परामर्श"
  },
  "appointment.dentistConsultation": {
    en: "Dentist Consultation",
    ta: "பல் மருத்துவர் ஆலோசனை",
    te: "దంతవైద్యుని సంప్రదింపులు",
    kn: "ದಂತವೈದ್ಯರ ಸಮಾಲೋಚನೆ",
    hi: "दंत चिकित्सक परामर्श"
  },
  "appointment.gastricSpecialistConsultation": {
    en: "Gastric Specialist Consultation",
    ta: "இரைப்பை குடல் நிபுணர் ஆலோசனை",
    te: "గ్యాస్ట్రిక్ స్పెషలిస్ట్ సంప్రదింపులు",
    kn: "ಜಠರಗರುಳಿನ ತಜ್ಞರ ಸಮಾಲೋಚನೆ",
    hi: "गैस्ट्रिक विशेषज्ञ परामर्श"
  },
  "appointment.geneticCounselorConsultation": {
    en: "Genetic Counselor Consultation",
    ta: "மரபியல் ஆலோசகர் ஆலோசனை",
    te: "జెనెటిక్ కౌన్సిలర్ సంప్రదింపులు",
    kn: "ಜೆನೆಟಿಕ್ ಕೌನ್ಸಿಲರ್ ಸಮಾಲೋಚನೆ",
    hi: "आनुवंशिक परामर्शदाता परामर्श"
  },
  "appointment.sleepIssues": {
    en: "Sleep Issues",
    ta: "தூக்கப் பிரச்சினைகள்",
    te: "నిద్ర సమస్యలు",
    kn: "ನಿದ್ರೆಯ ಸಮಸ್ಯೆಗಳು",
    hi: "नींद की समस्याएं"
  },
  "appointment.smoking": {
    en: "Smoking",
    ta: "புகைபிடித்தல்",
    te: "ధూమపానం",
    kn: "ಧೂಮಪಾನ",
    hi: "धूम्रपान"
  },
  "appointment.sexHealth": {
    en: "Sex Health",
    ta: "பாலியல் ஆரோக்கியம்",
    te: "లైంగిక ఆరోగ్యం",
    kn: "ಲೈಂಗಿಕ ಆರೋಗ್ಯ",
    hi: "यौन स्वास्थ्य"
  },

  // shop
  "shop.deliveryUnavailableForPincode": {
    en: "Delivery is currently unavailable for pincode {{pincode}}.",
    ta: "{{pincode}} பின்கோடிற்கு டெலிவரி தற்போது கிடைக்கவில்லை.",
    te: "{{pincode}} పిన్‌కోడ్‌కు ప్రస్తుతం డెలివరీ అందుబాటులో లేదు.",
    kn: "{{pincode}} ಪಿನ್‌ಕೋಡ್‌ಗೆ ಪ್ರಸ್ತುತ ವಿತರಣೆ ಲಭ್ಯವಿಲ್ಲ.",
    hi: "पिनकोड {{pincode}} के लिए डिलीवरी वर्तमान में उपलब्ध नहीं है।"
  },
  "shop.standardNationalDelivery": {
    en: "Standard National Delivery",
    ta: "தேசிய அளவிலான விநியோகம்",
    te: "ప్రామాణిక జాతీయ డెలివరీ",
    kn: "ಪ್ರಮಾಣಿತ ರಾಷ್ಟ್ರೀಯ ವಿತರಣೆ",
    hi: "मानक राष्ट्रीय डिलीवरी"
  },
  "shop.serviceableZone": {
    en: "Serviceable Zone",
    ta: "விநியோக சேவை உள்ள பகுதி",
    te: "సేవ అందుబాటులో ఉన్న ప్రాంతం",
    kn: "ವಿತರಣಾ ಸೇವಾ ವಲಯ",
    hi: "डिलीवरी योग्य क्षेत्र"
  },
  "shop.deliveryUnavailable": {
    en: "Delivery Unavailable",
    ta: "டெலிவரி கிடைக்கவில்லை",
    te: "డెలివరీ అందుబాటులో లేదు",
    kn: "ವಿತರಣೆ ಲಭ್ಯವಿಲ್ಲ",
    hi: "डिलीवरी उपलब्ध नहीं है"
  },
  "shop.freeShipping": {
    en: "FREE Shipping",
    ta: "இலவச டெலிவரி",
    te: "ఉచిత షిప్పింగ్",
    kn: "ಉಚಿತ ಶಿಪ್ಪಿಂಗ್",
    hi: "मुफ्त शिपिंग"
  },
  "shop.standardCourier": {
    en: "Standard Courier",
    ta: "வழக்கமான கூரியர்",
    te: "ప్రామాణిక కొరియర్",
    kn: "ಪ್ರಮಾಣಿತ ಕೊರಿಯರ್",
    hi: "मानक कूरियर"
  },
  "shop.estimatedShort": {
    en: "Est:",
    ta: "மதிப்பீடு:",
    te: "అంచనా:",
    kn: "ಅಂದಾಜು:",
    hi: "अनुमानित:"
  },
  "shop.kmFromWarehouse": {
    en: "km from Warehouse",
    ta: "கி.மீ கிடங்கிலிருந்து",
    te: "కి.మీ గిడ్డంగి నుండి",
    kn: "ಕಿ.ಮೀ ಗೋದಾಮಿನಿಂದ",
    hi: "किमी गोदाम से"
  },

  // Indian Cancers - Names
  "cancer.Lip, oral cavity": {
    en: "Lip, oral cavity",
    ta: "உதடு, வாய் குழி",
    te: "పెదవి, నోటి కుహరం",
    kn: "ತುಟಿ, ಬಾಯಿಯ ಕುಹರ",
    hi: "होंठ, मुख गुहा"
  },
  "cancer.Lung": {
    en: "Lung",
    ta: "நுரையீரல்",
    te: "ఊపిరితిత్తులు",
    kn: "ಶ್ವಾಸಕೋಶ",
    hi: "फेफड़े"
  },
  "cancer.Colorectum": {
    en: "Colorectum",
    ta: "பெருங்குடல் & மலக்குடல்",
    te: "పెద్దప్రేగు & మలద్వారం",
    kn: "ದೊಡ್ಡ ಕರುಳು ಮತ್ತು ಗುದನಾಳ",
    hi: "बड़ी आंत और मलाशय"
  },
  "cancer.Stomach": {
    en: "Stomach",
    ta: "வயிறு",
    te: "కడుపు",
    kn: "ಹೊಟ್ಟೆ",
    hi: "पेट"
  },
  "cancer.Prostate": {
    en: "Prostate",
    ta: "புரோஸ்டேட்",
    te: "ప్రోస్టేట్",
    kn: "ಪ್ರೊಸ್ಟೇಟ್",
    hi: "प्रोस्टेट"
  },
  "cancer.Other cancers": {
    en: "Other cancers",
    ta: "பிற புற்றுநோய்கள்",
    te: "ఇతర క్యాన్సర్లు",
    kn: "ಇತರ ಕ್ಯಾನ್ಸರ್‌ಗಳು",
    hi: "अन्य कैंसर"
  },
  "cancer.Breast": {
    en: "Breast",
    ta: "மார்பகம்",
    te: "రొమ్ము",
    kn: "ಸ್ತನ",
    hi: "स्तन"
  },
  "cancer.Cervix uteri": {
    en: "Cervix uteri",
    ta: "கருப்பை வாய்",
    te: "గర్భాశయ ముఖద్వారం",
    kn: "ಗರ್ಭಕಂಠ",
    hi: "गर्भाशय ग्रीवा"
  },
  "cancer.Ovary": {
    en: "Ovary",
    ta: "கருப்பை சினைப்பை",
    te: "అండాశయం",
    kn: "ಅಂಡಾಶಯ",
    hi: "अंडाशय"
  },

  // Indian Cancers - Risk factors
  "cancerRisk.Tobacco chewing (gutka/khaini)": {
    en: "Tobacco chewing (gutka/khaini)",
    ta: "புகையிலை மெல்லுதல் (குட்கா/கைனி)",
    te: "పొగాకు నమలడం (గుట్కా/ఖైనీ)",
    kn: "ತಂಬಾಕು ಅಗಿಯುವುದು (ಗುಟ್ಕಾ/ಖೈನಿ)",
    hi: "तंबाकू चबाना (गुटखा/खैनी)"
  },
  "cancerRisk.Betel nut (paan)": {
    en: "Betel nut (paan)",
    ta: "பாக்கு (பான்)",
    te: "పోక చెక్క (పాన్)",
    kn: "ಅಡಿಕೆ (ಪಾನ್)",
    hi: "सुपारी (पान)"
  },
  "cancerRisk.Smoking": {
    en: "Smoking",
    ta: "புகைபிடித்தல்",
    te: "ధూమపానం",
    kn: "ಧೂಮಪಾನ",
    hi: "धूम्रपान"
  },
  "cancerRisk.Alcohol": {
    en: "Alcohol",
    ta: "மதுபானம்",
    te: "మద్యం",
    kn: "ಮದ್ಯಪಾನ",
    hi: "शराब"
  },
  "cancerRisk.Secondhand smoke": {
    en: "Secondhand smoke",
    ta: "மறைமுக புகை",
    te: "పరోక్ష ధూమపానం",
    kn: "ಪರೋಕ್ಷ ಧೂಮಪಾನ",
    hi: "अप्रत्यक्ष धूम्रपान"
  },
  "cancerRisk.Air pollution": {
    en: "Air pollution",
    ta: "காற்று மாசுபாடு",
    te: "గాలి కాలుష్యం",
    kn: "ವಾಯು ಮಾಲಿನ್ಯ",
    hi: "वायु प्रदूषण"
  },
  "cancerRisk.Occupational exposure (asbestos, silica)": {
    en: "Occupational exposure (asbestos, silica)",
    ta: "தொழில்சார் வெளிப்பாடு (அஸ்பெஸ்டாஸ், சிலிக்கா)",
    te: "వృత్తిపరమైన ప్రభావం (ఆస్బెస్టాస్, సిలికా)",
    kn: "ಉದ್ಯೋಗ ಸಂಬಂಧಿತ ಮಾನ್ಯತೆ (ಕಲ್ನಾರು, ಸಿಲಿಕಾ)",
    hi: "व्यावसायिक संपर्क (एस्बेस्टस, सिलिका)"
  },
  "cancerRisk.Red/processed meat": {
    en: "Red/processed meat",
    ta: "பதப்படுத்தப்பட்ட இறைச்சி",
    te: "ప్రాసెస్ చేసిన మాంసం",
    kn: "ಸಂಸ್ಕರಿಸಿದ ಮಾಂಸ",
    hi: "लाल/प्रसंस्कृत मांस"
  },
  "cancerRisk.Low-fibre diet": {
    en: "Low-fibre diet",
    ta: "குறைந்த நார்ச்சத்து உணவு",
    te: "తక్కువ పీచు పదార్ధాల ఆహారం",
    kn: "ಕಡಿಮೆ ನಾರಿನಂಶದ ಆಹಾರ",
    hi: "कम फाइबर युक्त आहार"
  },
  "cancerRisk.Obesity": {
    en: "Obesity",
    ta: "உடல் பருமன்",
    te: "ఊబకాయం",
    kn: "ಬೊಜ್ಜು",
    hi: "मोटापा"
  },
  "cancerRisk.Sedentary lifestyle": {
    en: "Sedentary lifestyle",
    ta: "உடற்பயிற்சியற்ற வாழ்க்கை",
    te: "నిష్క్రియ జీవనశైలి",
    kn: "ಜಡ ಜೀವನಶೈಲಿ",
    hi: "गतिहीन जीवनशैली"
  },
  "cancerRisk.H. pylori infection": {
    en: "H. pylori infection",
    ta: "H. பைலோரி தொற்று",
    te: "H. పైలోరీ ఇన్ఫెక్షన్",
    kn: "H. ಪೈಲೋರಿ ಸೋಂಕು",
    hi: "एच. पाइलोरी संक्रमण"
  },
  "cancerRisk.Salted/smoked/pickled foods": {
    en: "Salted/smoked/pickled foods",
    ta: "அதிக உப்பு / ஊறுகாய் உணவுகள்",
    te: "ఉప్పు ఎక్కువగా ఉన్న / ఊరగాయ ఆహారాలు",
    kn: "ಉಪ್ಪು ಹೆಚ್ಚಿರುವ / ಉಪ್ಪಿನಕಾಯಿ ಆಹಾರಗಳು",
    hi: "नमकीन/धूम्रित/अचार वाले खाद्य पदार्थ"
  },
  "cancerRisk.Tobacco": {
    en: "Tobacco",
    ta: "புகையிலை",
    te: "పొగాకు",
    kn: "ತಂಬಾಕು",
    hi: "तंबाकू"
  },
  "cancerRisk.Low fruit & vegetable intake": {
    en: "Low fruit & vegetable intake",
    ta: "குறைந்த பழங்கள் & காய்கறி உட்கொள்ளல்",
    te: "తక్కువ పండ్లు & కూరగాయల వినియోగం",
    kn: "ಕಡಿಮೆ ಹಣ್ಣು ಮತ್ತು ತರಕಾರಿ ಸೇವನೆ",
    hi: "कम फल और सब्जियों का सेवन"
  },
  "cancerRisk.Age": {
    en: "Age",
    ta: "வயது",
    te: "వయస్సు",
    kn: "ವಯಸ್ಸು",
    hi: "आयु"
  },
  "cancerRisk.Family history": {
    en: "Family history",
    ta: "குடும்ப வரலாறு",
    te: "కుటుంబ చరిత్ర",
    kn: "ಕುಟುಂಬದ ಇತಿಹಾಸ",
    hi: "पारिवारिक इतिहास"
  },
  "cancerRisk.Hormonal factors": {
    en: "Hormonal factors",
    ta: "ஹார்மோன் காரணிகள்",
    te: "హార్మోన్ల కారకాలు",
    kn: "ಹಾರ್ಮೋನ್ ಅಂಶಗಳು",
    hi: "हार्मोनल कारक"
  },
  "cancerRisk.High-fat diet": {
    en: "High-fat diet",
    ta: "அதிக கொழுப்பு உணவு",
    te: "ఎక్కువ కొవ్వు ఉన్న ఆహారం",
    kn: "ಅಧಿಕ ಕೊಬ್ಬಿನ ಆಹಾರ",
    hi: "उच्च वसायुक्त आहार"
  },
  "cancerRisk.Leukaemia": {
    en: "Leukaemia",
    ta: "ரத்தப் புற்றுநோய் (லுகேமியா)",
    te: "రక్త క్యాన్సర్ (లుకేమియా)",
    kn: "ಲ್ಯುಕೇಮಿಯಾ",
    hi: "ल्यूकेमिया (रक्त कैंसर)"
  },
  "cancerRisk.Oesophagus": {
    en: "Oesophagus",
    ta: "உணவுக்குழாய்",
    te: "అన్నవాహిక",
    kn: "ಅನ್ನನಾಳ",
    hi: "ग्रासनली"
  },
  "cancerRisk.Liver": {
    en: "Liver",
    ta: "கல்லீரல்",
    te: "కాలేయం",
    kn: "ಯಕೃತ್ತು",
    hi: "यकृत (लिवर)"
  },
  "cancerRisk.NHL": {
    en: "NHL",
    ta: "என்.எச்.எல்",
    te: "ఎన్‌హెచ్‌ఎల్",
    kn: "ಎನ್‌ಹೆಚ್‌ಎಲ್",
    hi: "एनएचएल"
  },
  "cancerRisk.Bladder": {
    en: "Bladder",
    ta: "சிறுநீர்ப்பை",
    te: "మూత్రాశయం",
    kn: "ಮೂತ್ರಕೋಶ",
    hi: "मूत्राशय"
  },
  "cancerRisk.And 25+ other sites": {
    en: "And 25+ other sites",
    ta: "மற்றும் 25+ பிற உறுப்புகள்",
    te: "మరియు 25+ ఇతర భాగాలు",
    kn: "ಮತ್ತು 25+ ಇತರ ಅಂಗಗಳು",
    hi: "और 25+ अन्य अंग"
  },
  "cancerRisk.Late childbirth/no breastfeeding": {
    en: "Late childbirth/no breastfeeding",
    ta: "தாமதமான பிரசவம்/தாய்ப்பால் கொடுக்காமை",
    te: "ఆలస్యంగా ప్రసవం/తల్లిపాలు ఇవ్వకపోవడం",
    kn: "ತಡವಾದ ಹೆರಿಗೆ/ತಾಯಿಯ ಹಾಲು ನೀಡದಿರುವುದು",
    hi: "देर से प्रसव/स्तनपान न कराना"
  },
  "cancerRisk.Hormone therapy": {
    en: "Hormone therapy",
    ta: "ஹார்மோன் சிகிச்சை",
    te: "హార్మోన్ థెరపీ",
    kn: "ಹಾರ್ಮೋನ್ ಚಿಕಿತ್ಸೆ",
    hi: "हार्मोन थेरेपी"
  },
  "cancerRisk.Physical inactivity": {
    en: "Physical inactivity",
    ta: "உடற்பயிற்சியின்மை",
    te: "శారీరక శ్రమ లేకపోవడం",
    kn: "ದೈಹಿಕ ಚಟುವಟಿಕೆಯ ಕೊರತೆ",
    hi: "शारीरिक निष्क्रियता"
  },
  "cancerRisk.HPV infection": {
    en: "HPV infection",
    ta: "HPV வைரஸ் தொற்று",
    te: "హెచ్‌పివి ఇన్ఫెక్షన్",
    kn: "ಎಚ್‌ಪಿವಿ ಸೋಂಕು",
    hi: "एचपीवी संक्रमण"
  },
  "cancerRisk.Lack of Pap/HPV screening": {
    en: "Lack of Pap/HPV screening",
    ta: "பேப்/HPV பரிசோதனை செய்யாமை",
    te: "పాప్/హెచ్‌పివి స్క్రీనింగ్ లేకపోవడం",
    kn: "ಪ್ಯಾಪ್/ಎಚ್‌ಪಿವಿ ತಪಾಸಣೆಯ ಕೊರತೆ",
    hi: "पैप/एचपीवी जांच का अभाव"
  },
  "cancerRisk.Early marriage": {
    en: "Early marriage",
    ta: "இளம் வயது திருமணம்",
    te: "బాల్య వివాహం",
    kn: "ಬಾಲ್ಯ ವಿವಾಹ",
    hi: "कम उम्र में विवाह"
  },
  "cancerRisk.Multiple pregnancies": {
    en: "Multiple pregnancies",
    ta: "பல கர்ப்பங்கள்",
    te: "ఎక్కువ గర్భధారణలు",
    kn: "ಹೆಚ್ಚಿನ ಗರ್ಭಧಾರಣೆಗಳು",
    hi: "एकाधिक गर्भधारण"
  },
  "cancerRisk.Tobacco chewing (gutka, betel nut)": {
    en: "Tobacco chewing (gutka, betel nut)",
    ta: "புகையிலை மெல்லுதல் (குட்கா, பாக்கு)",
    te: "పొగాకు నమలడం (గుట్కా, పోక)",
    kn: "ತಂಬಾಕು ಅಗಿಯುವುದು (ಗುಟ್ಕಾ, ಅಡಿಕೆ)",
    hi: "तंबाकू चबाना (गुटखा, सुपारी)"
  },
  "cancerRisk.Family history/BRCA mutation": {
    en: "Family history/BRCA mutation",
    ta: "குடும்ப வரலாறு / BRCA மரபணு மாற்றம்",
    te: "కుటుంబ చరిత్ర / BRCA జన్యు మార్పు",
    kn: "ಕುಟುಂಬದ ಇತಿಹಾಸ / BRCA ರೂಪಾಂತರ",
    hi: "पारिवारिक इतिहास / बीआरसीए म्यूटेशन"
  },
  "cancerRisk.Nulliparity": {
    en: "Nulliparity",
    ta: "குழந்தையின்மை",
    te: "సంతానం లేకపోవడం",
    kn: "ಸಂತಾನಹೀನತೆ",
    hi: "निःसंतानता"
  },
  "cancerRisk.Endometriosis": {
    en: "Endometriosis",
    ta: "எண்டோமெட்ரியோசிஸ்",
    te: "ఎండోమెట్రియోసిస్",
    kn: "ಎಂಡೊಮೆಟ್ರಿಯೊಸಿಸ್",
    hi: "एंडोमेट्रियोसिस"
  },
  "cancerRisk.Corpus uteri": {
    en: "Corpus uteri",
    ta: "கருப்பை உடற்பகுதி",
    te: "గర్భాశయ శరీరం",
    kn: "ಗರ್ಭಾಶಯ ದೇಹ",
    hi: "गर्भाशय शरीर"
  },

  // Indian Cancers - Descriptions
  "cancerDesc.Lip, oral cavity": {
    en: "Lip and oral cavity cancers represent a highly prevalent group of malignancies in India, driven predominantly by chewing and smoking tobacco products.",
    ta: "புகையிலை மெல்லுதல் மற்றும் புகைபிடித்தல் காரணமாக இந்தியாவில் உதடு மற்றும் வாய்க்குழி புற்றுநோய்கள் அதிக அளவில் காணப்படுகின்றன.",
    te: "పొగాకు నమలడం మరియు ధూమపానం కారణంగా భారతదేశంలో పెదవి మరియు నోటి క్యాన్సర్లు ఎక్కువగా సంభవిస్తున్నాయి.",
    kn: "ತಂಬಾಕು ಅಗಿಯುವುದು ಮತ್ತು ಧೂಮಪಾನದಿಂದಾಗಿ ಭಾರತದಲ್ಲಿ ತುಟಿ ಮತ್ತು ಬಾಯಿಯ ಕ್ಯಾನ್ಸರ್‌ಗಳು ವ್ಯಾಪಕವಾಗಿ ಕಂಡುಬರುತ್ತವೆ.",
    hi: "तंबाकू चबाने और धूम्रपान के कारण भारत में होंठ और मुख गुहा के कैंसर अत्यधिक प्रचलित हैं।"
  },
  "cancerDesc.Lung": {
    en: "Lung cancer remains a leading cause of cancer-related mortality, heavily linked to smoking and rising ambient air pollution.",
    ta: "புகைபிடித்தல் மற்றும் அதிகரித்து வரும் காற்று மாசுபாட்டின் காரணமாக நுரையீரல் புற்றுநோய் ஒரு முக்கிய இறப்புக் காரணியாக உள்ளது.",
    te: "ధూమపానం మరియు పెరుగుతున్న వాయు కాలుష్యం కారణంగా ఊపిరితిత్తుల క్యాన్సర్ మరణాలకు ప్రధాన కారణాలలో ఒకటిగా ఉంది.",
    kn: "ಧೂಮಪಾನ ಮತ್ತು ಹೆಚ್ಚುತ್ತಿರುವ ವಾಯು ಮಾಲಿನ್ಯದಿಂದಾಗಿ ಶ್ವಾಸಕೋಶದ ಕ್ಯಾನ್ಸರ್ ಮರಣಕ್ಕೆ ಪ್ರಮುಖ ಕಾರಣವಾಗಿದೆ.",
    hi: "धूम्रपान और बढ़ते वायु प्रदूषण के कारण फेफड़ों का कैंसर मृत्यु का एक प्रमुख कारण बना हुआ है।"
  },
  "cancerDesc.Colorectum": {
    en: "Colorectal cancers are rising rapidly due to modern lifestyle shifts, high intake of ultra-processed foods, and physical inactivity.",
    ta: "நவீன வாழ்க்கை முறை மாற்றங்கள், பதப்படுத்தப்பட்ட உணவுகள் மற்றும் உடற்பயிற்சியின்மை காரணமாக பெருங்குடல் புற்றுநோய்கள் வேகமாக அதிகரித்து வருகின்றன.",
    te: "ఆధునిక జీవనశైలి మార్పులు, అల్ట్రా-ప్రాసెస్ చేసిన ఆహారాలు మరియు శారీరక శ్రమ లేకపోవడం వల్ల పెద్దప్రేగు క్యాన్సర్లు వేగంగా పెరుగుతున్నాయి.",
    kn: "ಆಧುನಿಕ ಜೀವನಶೈಲಿ, ಅಲ್ಟ್ರಾ-ಸಂಸ್ಕರಿಸಿದ ಆಹಾರಗಳು ಮತ್ತು ದೈಹಿಕ ಚಟುವಟಿಕೆಯ ಕೊರತೆಯಿಂದಾಗಿ ದೊಡ್ಡ ಕರುಳಿನ ಕ್ಯಾನ್ಸರ್‌ಗಳು ವೇಗವಾಗಿ ಹೆಚ್ಚುತ್ತಿವೆ.",
    hi: "आधुनिक जीवनशैली में बदलाव, प्रसंस्कृत खाद्य पदार्थों और शारीरिक निष्क्रियता के कारण कोलोरेक्टल कैंसर तेजी से बढ़ रहा है।"
  },
  "cancerDesc.Stomach": {
    en: "Stomach cancer has high regional variation in India, associated with dietary habits like high salt consumption and H. pylori bacteria.",
    ta: "அதிக உப்பு உட்கொள்ளல் மற்றும் ஹெச். பைலோரி பாக்டீரியா தொற்று போன்ற உணவுப் பழக்கவழக்கங்களுடன் தொடர்புடைய வயிற்றுப் புற்றுநோய் இந்தியாவில் பரவலாகக் காணப்படுகிறது.",
    te: "అధిక ఉప్పు వినియోగం మరియు హెచ్. పైలోరీ బ్యాక్టీరియా వంటి ఆహారపు అలవాట్లతో ముడిపడి ఉన్న కడుపు క్యాన్సర్ ప్రాంతాల వారీగా మారుతూ ఉంటుంది.",
    kn: "ಹೆಚ್ಚಿನ ಉಪ್ಪಿನ ಸೇವನೆ ಮತ್ತು ಎಚ್. ಪೈಲೋರಿ ಬ್ಯಾಕ್ಟೀರಿಯಾದಂತಹ ಆಹಾರ ಪದ್ಧತಿಗಳೊಂದಿಗೆ ಹೊಟ್ಟೆಯ ಕ್ಯಾನ್ಸರ್ ಸಂಬಂಧ ಹೊಂದಿದೆ.",
    hi: "पेट का कैंसर उच्च नमक की खपत और एच. पाइलोरी बैक्टीरिया जैसे खान-पान की आदतों से गहराई से जुड़ा हुआ है।"
  },
  "cancerDesc.Prostate": {
    en: "Prostate cancer increases in incidence with age, and screening options are recommended for high-risk profiles.",
    ta: "புரோஸ்டேட் புற்றுநோய் வயதுக்கு ஏற்ப அதிகரிக்கிறது, அதிக ஆபத்துள்ள நபர்களுக்கு ஆரம்பகால பரிசோதனை பரிந்துரைக்கப்படுகிறது.",
    te: "వయస్సు పెరిగే కొద్దీ ప్రోస్టేట్ క్యాన్సర్ వచ్చే ప్రమాదం పెరుగుతుంది, అధిక ప్రమాదం ఉన్నవారికి స్క్రీనింగ్ సిఫార్సు చేయబడింది.",
    kn: "ವಯಸ್ಸಾದಂತೆ ಪ್ರಾಸ್ಟೇಟ್ ಕ್ಯಾನ್ಸರ್ ಹೆಚ್ಚಾಗುತ್ತದೆ ಮತ್ತು ಹೆಚ್ಚಿನ ಅಪಾಯವಿರುವವರಿಗೆ ತಪಾಸಣೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.",
    hi: "उम्र के साथ प्रोस्टेट कैंसर का खतरा बढ़ता है, और उच्च जोखिम वाले व्यक्तियों के लिए जांच की सिफारिश की जाती है।"
  },
  "cancerDesc.Other cancers": {
    en: "Represents the collective share of other cancer sites in females.",
    ta: "மற்ற பல்வேறு புற்றுநோய்களின் கூட்டுப் பங்கு ஆகும், ஒவ்வொன்றும் மொத்த எண்ணிக்கையில் சிறிய பங்கை வகிக்கின்றன.",
    te: "ఇతర వివిధ క్యాన్సర్ల సమిష్టి భాగం, వీటిలో ప్రతి ఒక్కటి మొత్తం సంఖ్యలో తక్కువ వాటాను కలిగి ఉంటాయి.",
    kn: "ಇತರ ವಿವಿಧ ಕ್ಯಾನ್ಸರ್‌ಗಳ ಸಾಮೂಹಿಕ ಪಾಲು, ಪ್ರತಿಯೊಂದೂ ಒಟ್ಟು ಸಂಖ್ಯೆಯಲ್ಲಿ ಸಣ್ಣ ಪಾಲನ್ನು ಹೊಂದಿದೆ.",
    hi: "अन्य विभिन्न कैंसरों का सामूहिक हिस्सा, जिनमें से प्रत्येक का कुल मामलों में अपेक्षाकृत कम अनुपात होता है।"
  },
  "cancerDesc.Breast": {
    en: "Breast cancer is the single most common cancer among Indian women, showing an alarmingly high incidence in urban areas.",
    ta: "இந்தியப் பெண்களிடையே மார்பகப் புற்றுநோய் மிகவும் பொதுவான ஒன்றாக உள்ளது, நகர்ப்புறங்களில் இது மிக வேகமாக அதிகரித்து வருகிறது.",
    te: "భారతీయ మహిళల్లో రొమ్ము క్యాన్సర్ అత్యంత సాధారణమైనది, పట్టణ ప్రాంతాల్లో దీని సంభావ్యత గణనీయంగా పెరుగుతోంది.",
    kn: "ಭಾರತೀಯ ಮಹಿಳೆಯರಲ್ಲಿ ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ಅತ್ಯಂತ ಸಾಮಾನ್ಯವಾಗಿದ್ದು, ನಗರ ಪ್ರದೇಶಗಳಲ್ಲಿ ಇದರ ಪ್ರಮಾಣ ಹೆಚ್ಚುತ್ತಿದೆ.",
    hi: "भारतीय महिलाओं में स्तन कैंसर सबसे आम कैंसर है, जो शहरी क्षेत्रों में तेजी से बढ़ रहा है।"
  },
  "cancerDesc.Cervix uteri": {
    en: "Cervical cancer is highly preventable through timely HPV vaccination and periodic cervical screening (Pap smear / HPV test).",
    ta: "கருப்பை வாய் புற்றுநோயை சரியான நேரத்தில் HPV தடுப்பூசி மற்றும் வழக்கமான பரிசோதனை (பேப் ஸ்மியர்) மூலம் முழுமையாகத் தடுக்க முடியும்.",
    te: "సకాలంలో హెచ్‌పివి వ్యాక్సినేషన్ మరియు రెగ్యులర్ స్క్రీనింగ్ (పాప్ స్మియర్) ద్వారా గర్భాశయ ముఖద్వార క్యాన్సర్‌ను నివారించవచ్చు.",
    kn: "ಸಮಯೋಚಿತ ಎಚ್‌ಪಿವಿ ಲಸಿಕೆ ಮತ್ತು ನಿಯಮಿತ ತಪಾಸಣೆಯ (ಪ್ಯಾಪ್ ಸ್ಮಿಯರ್) ಮೂಲಕ ಗರ್ಭಕಂಠದ ಕ್ಯಾನ್ಸರ್ ಅನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತಡೆಗಟ್ಟಬಹುದು.",
    hi: "समय पर एचपीवी टीकाकरण और नियमित जांच (पैप स्मीयर) के माध्यम से गर्भाशय ग्रीवा के कैंसर की पूरी तरह रोकथाम संभव है।"
  },
  "cancerDesc.Ovary": {
    en: "Ovarian cancers are often diagnosed at later stages, highlighting the need for prompt evaluation of persistent abdominal symptoms.",
    ta: "சினைப்பை புற்றுநோய்கள் பெரும்பாலும் பிந்தைய கட்டங்களிலேயே கண்டறியப்படுகின்றன, எனவே தொடர்ந்து இருக்கும் வயிற்று அசௌகரியங்களை உடனடியாக பரிசோதிக்க வேண்டும்.",
    te: "అండాశయ క్యాన్సర్లు తరచుగా చివరి దశల్లో నిర్ధారించబడతాయి, కాబట్టి కడుపు సమస్యలను వెంటనే వైద్యుని వద్ద పరీక్షించాలి.",
    kn: "ಅಂಡಾಶಯದ ಕ್ಯಾನ್ಸರ್‌ಗಳನ್ನು ತಡವಾದ ಹಂತಗಳಲ್ಲಿ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ನಿರಂತರ ಹೊಟ್ಟೆಯ ರೋಗಲಕ್ಷಣಗಳನ್ನು ತಕ್ಷಣ ತಪಾಸಣೆ ಮಾಡಿಸಬೇಕು.",
    hi: "अंडाशय के कैंसर का निदान अक्सर बाद के चरणों में होता है, इसलिए लगातार पेट के लक्षणों की तुरंत जांच आवश्यक है।"
  }
};

const locales = ['en', 'ta', 'te', 'kn', 'hi'];
const localesDir = path.resolve('src/i18n/locales');

for (const lang of locales) {
  const filePath = path.join(localesDir, `${lang}.ts`);
  let content = fs.readFileSync(filePath, 'utf8');

  const closingIndex = content.lastIndexOf('} as const;');
  if (closingIndex === -1) {
    console.error(`Could not find '} as const;' in ${filePath}`);
    continue;
  }

  let additions = '\n  // Added user reported missing translations\n';
  let count = 0;

  for (const [key, trans] of Object.entries(additionalTranslations)) {
    const keyPattern = new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`);
    if (!keyPattern.test(content)) {
      const val = trans[lang] || trans['en'];
      const escapedVal = val.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      additions += `  "${key}": "${escapedVal}",\n`;
      count++;
    }
  }

  const updatedContent = content.slice(0, closingIndex) + additions + content.slice(closingIndex);
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Updated ${lang}.ts: added ${count} keys.`);
}
