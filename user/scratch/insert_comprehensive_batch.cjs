const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/locales/en.ts');
const taPath = path.join(__dirname, '../src/i18n/locales/ta.ts');
const knPath = path.join(__dirname, '../src/i18n/locales/kn.ts');
const hiPath = path.join(__dirname, '../src/i18n/locales/hi.ts');

const newTranslations = {
  en: {
    // Habits & Condition UI
    "habits.stressLevelToday": "Stress level today",
    "habits.calmRelaxed": "Calm / Relaxed",
    "habits.overwhelmed": "Overwhelmed",
    "habits.minimal": "Minimal",
    "habits.severe": "Severe",
    "habits.stressImpact": "Chronic high stress elevates cortisol and blood sugar levels.",

    // Appointment
    "appointment.consultSpecialist": "Consult Your {{specialty}}",

    // Protocols & Parkinson
    "protocols.moodDopamineSupport": "Mood & Dopamine Support",
    "protocols.lovedActivitySub": "Singing, drawing, gardening, or hobbies",
    "protocols.lovedActivityPlaceholder": "What activity did you enjoy?",
    "protocols.ateDarkChocolate": "Ate dark chocolate (>70% cacao) today?",
    "protocols.selectDopamineBoosters": "Select Dopamine Boosters Experienced Today:",
    "protocols.huggedLovedOne": "Hugged a loved one",
    "protocols.receivedKindWords": "Received / gave kind words",
    "protocols.morningSunlight": "Morning sunlight exposure",
    "protocols.favouriteMusic": "Listened to favourite music",
    "protocols.gentleMassage": "Gentle massage / stretch",
    "protocols.watchedComedy": "Laughed / watched comedy",
    "protocols.tremorSeverity": "Tremor Severity",
    "protocols.rigiditySeverity": "Muscle Rigidity / Stiffness",
    "protocols.bradykinesiaSeverity": "Bradykinesia (Slowness of Movement)",
    "protocols.noMedicationDoses": "No medication doses logged today. Enter your dose details above to track schedule adherence.",
    "protocols.doseScheduleAdherence": "Daily dose timings & adherence",
    "protocols.closeSchedule": "Close Schedule",
    "protocols.manage": "Manage",
    "protocols.minimal": "Minimal",
    "protocols.severe": "Severe",
    "protocols.neurologist": "Neurologist",
    "protocols.parkinsonDoctorNote": "Monitor motor fluctuations and schedule optimization with your neurologist.",

    // Educational & Learning
    "learn.guides": "Guides",
    "learn.videos": "Videos",
    "learn.videoTutorials": "Video Tutorials",
    "learn.minRead": "min read",
    "learn.optimalFastingTitle": "Optimal Fasting Window Tips",
    "learn.understandingGiTitle": "Understanding Glycaemic Index (GI)",
    "learn.cgmSensorTitle": "How to Attach and Pair Abbott CGM Sensor",
    "learn.cgmSensorDesc": "A step-by-step video guide explaining sensor application, cleaning the skin site, and scanning to activate.",
    "learn.cgmGuideBadge": "CGM Guide",

    // Kitchen & Habit screens
    "kitchen.damageKitchenAudit": "Kitchen Microplastics & Utensils Audit",
    "kitchen.checkYourKitchen": "Audit Your Kitchen Utensils",
    "kitchen.riskFlagged": "Risk Flagged",
    "kitchen.q1Text": "Do you use non-stick cookware with scratches or PTFE coatings?",
    "kitchen.q2Text": "Do you store or microwave hot food in plastic containers?",
    "kitchen.q3Text": "Do you use plastic cutting boards or synthetic cooking utensils?",
    "kitchen.naturalGuidelines": "Switch to cast iron, stainless steel, clay, or wooden alternatives.",
    "kitchen.lookingForPlasticFree": "Looking for certified plastic-free cookware?",
    "kitchen.saveKitchenLog": "Save Kitchen Log",

    // Obesity
    "obesity.damageBreadcrumb": "Weight & Metabolic Assessment",
    "obesity.knowYourBmiDesc": "Calculate your BMI and track healthy metabolic weight goals.",
    "obesity.difficultyLosingWeight": "Having difficulty losing weight despite healthy habits?",
    "obesity.endocrinologistDesc": "Consult an Endocrinologist or Lifestyle Specialist for personalized metabolic therapy.",
    "obesity.weeklyWeightDesc": "Log your weight weekly at the same time in the morning.",

    // Sleep
    "sleep.advisoryDesc": "Restful 7-8 hour sleep supports cell autophagy and glucose regulation.",
    "sleep.option2": "Difficulty falling or staying asleep",
    "sleep.notStressed": "No Sleep Issues",
    "sleep.bookSleepSpecialist": "Consult Sleep Specialist",

    // Stress Log
    "mia.stressHeading": "Stress Management & Mood Log",
    "stress.stressSubtext": "Tracking daily stress helps identify triggers and restores hormonal balance.",
    "stress.tapAFace": "Tap an emotion that matches your mood today:",
    "stress.logToday": "Log Today's Stress",
    "stress.chatOrConsultDesc": "Feeling overwhelmed? Chat with Mia AI or consult a mental health expert.",
    "stress.chatWithMito": "Chat with Mia AI",
    "stress.bookSpecialist": "Book Mental Health Expert",
    "stress.calm": "Calm",
    "stress.steady": "Steady",
    "stress.mildStress": "Mild Stress",
    "stress.tense": "Tense",
    "stress.moderateStress": "Moderate Stress",
    "stress.maxed": "High Stress",
    "stress.stressed": "Overwhelmed",

    // Common missing
    "common.confirmed": "Confirmed",
    "common.great": "Great",
    "common.call": "Call Helpline",
    "common.add": "Add",
    "common.live": "LIVE",
    "common.detectingGps": "Detecting live GPS location & air quality data...",

    // Diagnostics & Payment
    "payment.checkoutAndPay": "Checkout & Pay",
    "payment.trialOffer": "Trial Special Offer",
    "payment.useCode": "Use the code",
    "payment.freeCodeDesc": "at checkout to book this test fully free for testing purposes!",
    "payment.codeApplied": "Code applied! Booking fee discounted to 0.",
    "payment.discountApplied": "100% discount applied",
    "payment.dateTime": "Date & Time",
    "payment.processing": "Processing..."
  },
  ta: {
    // Habits & Condition UI
    "habits.stressLevelToday": "இன்றைய மன அழுத்த நிலை",
    "habits.calmRelaxed": "அமைதி / தளர்வு",
    "habits.overwhelmed": "அதிக அழுத்தம்",
    "habits.minimal": "குறைவு",
    "habits.severe": "தீவிரம்",
    "habits.stressImpact": "நீண்டகால மன அழுத்தம் கார்டிசோல் மற்றும் ரத்த சர்க்கரை அளவை உயர்த்துகிறது.",

    // Appointment
    "appointment.consultSpecialist": "உங்கள் {{specialty}} மருத்துவரிடம் ஆலோசிக்கவும்",

    // Protocols & Parkinson
    "protocols.moodDopamineSupport": "மனநிலை & டோபமைன் ஆதரவு",
    "protocols.lovedActivitySub": "பாடல், ஓவியம், தோட்டம் அல்லது பொழுதுபோக்குகள்",
    "protocols.lovedActivityPlaceholder": "நீங்கள் என்ன செயலை ரசித்து செய்தீர்கள்?",
    "protocols.ateDarkChocolate": "இன்று டார்க் சாக்லேட் (>70% கொக்கோ) சாப்பிட்டீர்களா?",
    "protocols.selectDopamineBoosters": "இன்று அனுபவித்த டோபமைன் ஊக்கிகளைத் தேர்ந்தெடுக்கவும்:",
    "protocols.huggedLovedOne": "அன்பானவரை கட்டிப்பிடித்தல்",
    "protocols.receivedKindWords": "இனிய வார்த்தைகளைப் பெறுதல் / பேசுதல்",
    "protocols.morningSunlight": "காலை சூரிய ஒளி பெறுதல்",
    "protocols.favouriteMusic": "பிடித்த இசையைக் கேட்டல்",
    "protocols.gentleMassage": "மென்மையான மசாஜ் / நீட்சி",
    "protocols.watchedComedy": "சிரித்தல் / நகைச்சுவை பார்த்தல்",
    "protocols.tremorSeverity": "நடுக்கத்தின் தீவிரம்",
    "protocols.rigiditySeverity": "தசை இறுக்கம் / கடினத்தன்மை",
    "protocols.bradykinesiaSeverity": "பிராடிகினீசியா (இயக்க மந்தநிலை)",
    "protocols.noMedicationDoses": "இன்று மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை. அட்டவணைப் பதிவைக் கண்காணிக்க மேலே உள்ள விவரங்களை உள்ளிடவும்.",
    "protocols.doseScheduleAdherence": "தினசரி மருந்து நேரங்கள் & பின்பற்றுதல்",
    "protocols.closeSchedule": "அட்டவணையை மூடு",
    "protocols.manage": "நிர்வகி",
    "protocols.minimal": "குறைவு",
    "protocols.severe": "தீவிரம்",
    "protocols.neurologist": "நரம்பியல் நிபுணர்",
    "protocols.parkinsonDoctorNote": "இயக்க ஏற்ற இறக்கங்களைக் கண்காணித்து மருந்து அளவுகளை சரிசெய்ய உங்கள் நரம்பியல் மருத்துவரிடம் கலந்தாலோசிக்கவும்.",

    // Educational & Learning
    "learn.guides": "வழிகாட்டிகள்",
    "learn.videos": "வீடியோக்கள்",
    "learn.videoTutorials": "வீடியோ பயிற்சிகள்",
    "learn.minRead": "நிமிட வாசிப்பு",
    "learn.optimalFastingTitle": "சிறந்த விரத நேரக் குறிப்புகள்",
    "learn.understandingGiTitle": "கிளைசெமிக் குறியீட்டைப் (GI) புரிந்துகொள்ளுதல்",
    "learn.cgmSensorTitle": "அபோட் CGM சென்சாரை பொருத்துவது மற்றும் இணைப்பது எப்படி",
    "learn.cgmSensorDesc": "சென்சார் பொருத்துதல், தோலை சுத்தம் செய்தல் மற்றும் ஸ்கேன் செய்து செயல்படுத்துவதை விளக்கும் படி படியான வீடியோ வழிகாட்டி.",
    "learn.cgmGuideBadge": "CGM வழிகாட்டி",

    // Kitchen & Habit screens
    "kitchen.damageKitchenAudit": "சமையலறை மைக்ரோபிளாஸ்டிக் & பாத்திரங்கள் தணிக்கை",
    "kitchen.checkYourKitchen": "உங்கள் சமையலறை பாத்திரங்களை தணிக்கை செய்யுங்கள்",
    "kitchen.riskFlagged": "ஆபத்து கண்டறியப்பட்டது",
    "kitchen.q1Text": "கீறல்கள் அல்லது PTFE பூச்சு கொண்ட நான்-ஸ்டிக் பாத்திரங்களைப் பயன்படுத்துகிறீர்களா?",
    "kitchen.q2Text": "பிளாஸ்டிக் பாத்திரங்களில் சூடான உணவை சேமிக்கிறீர்களா அல்லது மைக்ரோவேவ் செய்கிறீர்களா?",
    "kitchen.q3Text": "பிளாஸ்டிக் நறுக்கும் பலகைகள் அல்லது செயற்கை சமையல் கரண்டிகளைப் பயன்படுத்துகிறீர்களா?",
    "kitchen.naturalGuidelines": "வார்ப்பிரும்பு, துருப்பிடிக்காத எஃகு, களிமண் அல்லது மரப் பாத்திரங்களுக்கு மாறுங்கள்.",
    "kitchen.lookingForPlasticFree": "சான்றளிக்கப்பட்ட பிளாஸ்டிக் இல்லாத பாத்திரங்களைத் தேடுகிறீர்களா?",
    "kitchen.saveKitchenLog": "சமையலறை பதிவை சேமிக்கவும்",

    // Obesity
    "obesity.damageBreadcrumb": "எடை & வளர்சிதை மாற்ற மதிப்பீடு",
    "obesity.knowYourBmiDesc": "உங்கள் BMI ஐக் கணக்கிட்டு ஆரோக்கியமான வளர்சிதை மாற்ற இலக்குகளைக் கண்காணிக்கவும்.",
    "obesity.difficultyLosingWeight": "நல்ல பழக்கவழக்கங்கள் இருந்தும் எடையைக் குறைப்பதில் சிரமம் உள்ளதா?",
    "obesity.endocrinologistDesc": "தனிப்பயனாக்கப்பட்ட சிகிச்சைக்காக நாளமில்லா சுரப்பி நிபுணரை அணுகவும்.",
    "obesity.weeklyWeightDesc": "வாரத்திற்கு ஒருமுறை காலையில் உங்கள் எடையைப் பதிவு செய்யவும்.",

    // Sleep
    "sleep.advisoryDesc": "7-8 மணி நேர ஆழ்ந்த தூக்கம் செல் புதுப்பித்தல் மற்றும் சர்க்கரை கட்டுப்பாட்டிற்கு உதவுகிறது.",
    "sleep.option2": "தூங்குவதில் அல்லது தூக்கத்தை தொடர்வதில் சிரமம்",
    "sleep.notStressed": "தூக்கப் பிரச்சினைகள் இல்லை",
    "sleep.bookSleepSpecialist": "தூக்க நிபுணரை அணுகவும்",

    // Stress Log
    "mia.stressHeading": "மன அழுத்த மேலாண்மை & மனநிலை பதிவு",
    "stress.stressSubtext": "தினசரி மன அழுத்தத்தைக் கண்காணிப்பது காரணங்களைக் கண்டறிந்து ஹார்மோன் சமநிலையை மீட்க உதவுகிறது.",
    "stress.tapAFace": "இன்றைய உங்கள் மனநிலைக்கு ஏற்ற முகத்தைத் தொடவும்:",
    "stress.logToday": "இன்றைய மன அழுத்தத்தைப் பதிவு செய்யவும்",
    "stress.chatOrConsultDesc": "அழுத்தமாக உணர்கிறீர்களா? மியா AI உடன் அரட்டையடிக்கவும் அல்லது நிபுணரை அணுகவும்.",
    "stress.chatWithMito": "மியா AI உடன் அரட்டையடிக்கவும்",
    "stress.bookSpecialist": "மனநல நிபுணரை முன்பதிவு செய்யவும்",
    "stress.calm": "அமைதி",
    "stress.steady": "சீரான",
    "stress.mildStress": "லேசான அழுத்தம்",
    "stress.tense": "பதற்றம்",
    "stress.moderateStress": "மிதமான அழுத்தம்",
    "stress.maxed": "அதிக அழுத்தம்",
    "stress.stressed": "மிகுந்த மன அழுத்தம்",

    // Common missing
    "common.confirmed": "உறுதிப்படுத்தப்பட்டது",
    "common.great": "அற்புதம்",
    "common.call": "உதவி எண்ணை அழைக்கவும்",
    "common.add": "சேர்",
    "common.live": "நேரலை",
    "common.detectingGps": "நேரடி GPS இருப்பிடம் & காற்றின் தரம் கண்டறியப்படுகிறது...",

    // Diagnostics & Payment
    "payment.checkoutAndPay": "பணம் செலுத்த தொடரவும்",
    "payment.trialOffer": "சோதனை சிறப்பு சலுகை",
    "payment.useCode": "குறியீட்டைப் பயன்படுத்தவும்",
    "payment.freeCodeDesc": "சோதனை நோக்கங்களுக்காக இந்த பரிசோதனையை இலவசமாக முன்பதிவு செய்ய இந்த குறியீட்டை உள்ளிடவும்!",
    "payment.codeApplied": "குறியீடு பயன்படுத்தப்பட்டது! முன்பதிவு கட்டணம் 0 ஆக குறைக்கப்பட்டது.",
    "payment.discountApplied": "100% தள்ளுபடி பயன்படுத்தப்பட்டது",
    "payment.dateTime": "தேதி & நேரம்",
    "payment.processing": "செயலாக்குகிறது..."
  },
  kn: {
    // Habits & Condition UI
    "habits.stressLevelToday": "ಇಂದಿನ ಒತ್ತಡದ ಮಟ್ಟ",
    "habits.calmRelaxed": "ಶಾಂತ / ನಿರಾಳ",
    "habits.overwhelmed": "ಅತಿಯಾದ ಒತ್ತಡ",
    "habits.minimal": "ಕನಿಷ್ಠ",
    "habits.severe": "ತೀವ್ರ",
    "habits.stressImpact": "ದೀರ್ಘಕಾಲದ ಒತ್ತಡವು ಕಾರ್ಟಿಸೋಲ್ ಮತ್ತು ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ ಮಟ್ಟವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.",

    // Appointment
    "appointment.consultSpecialist": "ನಿಮ್ಮ {{specialty}} ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ",

    // Protocols & Parkinson
    "protocols.moodDopamineSupport": "ಮನಸ್ಥಿತಿ & ಡೋಪಮೈನ್ ಬೆಂಬಲ",
    "protocols.lovedActivitySub": "ಹಾಡುಗಾರಿಕೆ, ಚಿತ್ರಕಲೆ, ತೋಟಗಾರಿಕೆ ಅಥವಾ ಹವ್ಯಾಸಗಳು",
    "protocols.lovedActivityPlaceholder": "ನೀವು ಯಾವ ಚಟುವಟಿಕೆಯನ್ನು ಆನಂದಿಸಿದ್ದೀರಿ?",
    "protocols.ateDarkChocolate": "ಇಂದು ಡಾರ್ಕ್ ಚಾಕೊಲೇಟ್ (>70% ಕೋಕೋ) ಸೇವಿಸಿದ್ದೀರಾ?",
    "protocols.selectDopamineBoosters": "ಇಂದು ಅನುಭವಿಸಿದ ಡೋಪಮೈನ್ ಬೂಸ್ಟರ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
    "protocols.huggedLovedOne": "ಪ್ರೀತಿಪಾತ್ರರನ್ನು ಅಪ್ಪಿಕೊಳ್ಳುವುದು",
    "protocols.receivedKindWords": "ಒಳ್ಳೆಯ ಮಾತುಗಳನ್ನು ಕೇಳುವುದು / ಹೇಳುವುದು",
    "protocols.morningSunlight": "ಬೆಳಗಿನ ಸೂರ್ಯನ ಬೆಳಕು ಪಡೆಯುವುದು",
    "protocols.favouriteMusic": "ನೆಚ್ಚಿನ ಸಂಗೀತವನ್ನು ಆಲಿಸುವುದು",
    "protocols.gentleMassage": "ಮೃದುವಾದ ಮಸಾಜ್ / ಸ್ಟ್ರೆಚಿಂಗ್",
    "protocols.watchedComedy": "ನಗುವುದು / ಹಾಸ್ಯ ನೋಡುವುದು",
    "protocols.tremorSeverity": "ನಡುಕದ ತೀವ್ರತೆ",
    "protocols.rigiditySeverity": "ಸ್ನಾಯು ಬಿಗಿತ / ಜಡತ್ವ",
    "protocols.bradykinesiaSeverity": "ಬ್ರಾಡಿಕಿನೇಶಿಯಾ (ಚಲನೆಯ ನಿಧಾನತೆ)",
    "protocols.noMedicationDoses": "ಇಂದು ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿಲ್ಲ. ವೇಳಾಪಟ್ಟಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ.",
    "protocols.doseScheduleAdherence": "ದೈನಂದಿನ ಔಷಧಿ ಸಮಯಗಳು & ಪಾಲನೆ",
    "protocols.closeSchedule": "ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮುಚ್ಚಿ",
    "protocols.manage": "ನಿರ್ವಹಿಸಿ",
    "protocols.minimal": "ಕನಿಷ್ಠ",
    "protocols.severe": "ತೀವ್ರ",
    "protocols.neurologist": "ನರಶಾಸ್ತ್ರಜ್ಞ",
    "protocols.parkinsonDoctorNote": "ಚಲನೆಯ ಏರಿಳಿತಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ಮತ್ತು ಔಷಧಿ ಪ್ರಮಾಣವನ್ನು ಸರಿಹೊಂದಿಸಲು ನಿಮ್ಮ ನರಶಾಸ್ತ್ರಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",

    // Educational & Learning
    "learn.guides": "ಮಾರ್ಗದರ್ಶಿಗಳು",
    "learn.videos": "ವೀಡಿಯೊಗಳು",
    "learn.videoTutorials": "ವೀಡಿಯೊ ಟ್ಯುಟೋರಿಯಲ್ಗಳು",
    "learn.minRead": "ನಿಮಿಷಗಳ ಓದು",
    "learn.optimalFastingTitle": "ಉಪವಾಸ ಸಮಯದ ಅತ್ಯುತ್ತಮ ಸಲಹೆಗಳು",
    "learn.understandingGiTitle": "ಗ್ಲೈಸೆಮಿಕ್ ಇಂಡೆಕ್ಸ್ (GI) ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು",
    "learn.cgmSensorTitle": "ಅಬಾಟ್ CGM ಸಂವೇದಕವನ್ನು ಜೋಡಿಸುವುದು ಮತ್ತು ಸಂಪರ್ಕಿಸುವುದು ಹೇಗೆ",
    "learn.cgmSensorDesc": "ಸಂವೇದಕ ಅನ್ವಯಿಸುವಿಕೆ, ಸ್ವಚ್ಛಗೊಳಿಸುವಿಕೆ ಮತ್ತು ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆಯನ್ನು ವಿವರಿಸುವ ವೀಡಿಯೊ ಮಾರ್ಗದರ್ಶಿ.",
    "learn.cgmGuideBadge": "CGM ಮಾರ್ಗದರ್ಶಿ",

    // Kitchen & Habit screens
    "kitchen.damageKitchenAudit": "ಅಡುಗೆಮನೆಯ ಮೈಕ್ರೋಪ್ಲಾಸ್ಟಿಕ್ & ಪಾತ್ರೆಗಳ ಪರಿಶೀಲನೆ",
    "kitchen.checkYourKitchen": "ನಿಮ್ಮ ಅಡುಗೆಮನೆಯ ಪಾತ್ರೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    "kitchen.riskFlagged": "ಅಪಾಯ ಗುರುತಿಸಲಾಗಿದೆ",
    "kitchen.q1Text": "ನೀವು ಗೀರುಗಳು ಅಥವಾ PTFE ಲೇಪನ ಹೊಂದಿರುವ ನಾನ್-ಸ್ಟಿಕ್ ಪಾತ್ರೆಗಳನ್ನು ಬಳಸುತ್ತೀರಾ?",
    "kitchen.q2Text": "ಬಿಸಿ ಆಹಾರವನ್ನು ಪ್ಲಾಸ್ಟಿಕ್ ಪಾತ್ರೆಗಳಲ್ಲಿ ಸಂಗ್ರಹಿಸುತ್ತೀರಾ ಅಥವಾ ಮೈಕ್ರೋವೇವ್ ಮಾಡುತ್ತೀರಾ?",
    "kitchen.q3Text": "ಪ್ಲಾಸ್ಟಿಕ್ ಕಟಿಂಗ್ ಬೋರ್ಡ್‌ಗಳು ಅಥವಾ ಸಿಂಥೆಟಿಕ್ ಅಡುಗೆ ಪಾತ್ರೆಗಳನ್ನು ಬಳಸುತ್ತೀರಾ?",
    "kitchen.naturalGuidelines": "ಕಾಸ್ಟ್ ಐರನ್, ಸ್ಟೇನ್‌ಲೆಸ್ ಸ್ಟೀಲ್, ಮಣ್ಣಿನ ಅಥವಾ ಮರದ ಪಾತ್ರೆಗಳಿಗೆ ಬದಲಾಯಿಸಿ.",
    "kitchen.lookingForPlasticFree": "ಪ್ರಮಾಣೀಕೃತ ಪ್ಲಾಸ್ಟಿಕ್-ಮುಕ್ತ ಪಾತ್ರೆಗಳನ್ನು ಹುಡುಕುತ್ತಿರುವಿರಾ?",
    "kitchen.saveKitchenLog": "ಅಡುಗೆಮನೆಯ ದಾಖಲೆಯನ್ನು ಉಳಿಸಿ",

    // Obesity
    "obesity.damageBreadcrumb": "ತೂಕ & ಚಯಾಪಚಯ ಮೌಲ್ಯಮಾಪನ",
    "obesity.knowYourBmiDesc": "ನಿಮ್ಮ BMI ಲೆಕ್ಕಹಾಕಿ ಮತ್ತು ಆರೋಗ್ಯಕರ ಚಯಾಪಚಯ ಗುರಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    "obesity.difficultyLosingWeight": "ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳಿದ್ದರೂ ತೂಕ ಇಳಿಸಿಕೊಳ್ಳಲು ಕಷ್ಟವಾಗುತ್ತಿದೆಯೇ?",
    "obesity.endocrinologistDesc": "ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸೆಗಾಗಿ ಅಂತಃಸ್ರಾವಶಾಸ್ತ್ರಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "obesity.weeklyWeightDesc": "ವಾರಕ್ಕೊಮ್ಮೆ ಬೆಳಿಗ್ಗೆ ನಿಮ್ಮ ತೂಕವನ್ನು ದಾಖಲಿಸಿ.",

    // Sleep
    "sleep.advisoryDesc": "7-8 ಗಂಟೆಗಳ ಆಳವಾದ ನಿದ್ರೆ ಜೀವಕೋಶಗಳ ಪುನರ್ಯೌವನ ಮತ್ತು ಸಕ್ಕರೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಸಹಕಾರಿ.",
    "sleep.option2": "ನಿದ್ರಿಸಲು ಅಥವಾ ನಿದ್ರೆ ಮುಂದುವರಿಸಲು ತೊಂದರೆ",
    "sleep.notStressed": "ನಿದ್ರೆಯ ಸಮಸ್ಯೆಗಳಿಲ್ಲ",
    "sleep.bookSleepSpecialist": "ನಿದ್ರಾ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ",

    // Stress Log
    "mia.stressHeading": "ಒತ್ತಡ ನಿರ್ವಹಣೆ & ಮನಸ್ಥಿತಿ ಲಾಗ್",
    "stress.stressSubtext": "ದೈನಂದಿನ ಒತ್ತಡವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದರಿಂದ ಹಾರ್ಮೋನ್ ಸಮತೋಲನವನ್ನು ಮರಳಿ ಪಡೆಯಬಹುದು.",
    "stress.tapAFace": "ಇಂದಿನ ನಿಮ್ಮ ಮನಸ್ಥಿತಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಮುಖವನ್ನು ಸ್ಪರ್ಶಿಸಿ:",
    "stress.logToday": "ಇಂದಿನ ಒತ್ತಡವನ್ನು ದಾಖಲಿಸಿ",
    "stress.chatOrConsultDesc": "ಒತ್ತಡ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಾ? ಮಿಯಾ AI ಜೊತೆ ಚಾಟ್ ಮಾಡಿ ಅಥವಾ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "stress.chatWithMito": "ಮಿಯಾ AI ಜೊತೆ ಚಾಟ್ ಮಾಡಿ",
    "stress.bookSpecialist": "ಮಾನಸಿಕ ಆರೋಗ್ಯ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ",
    "stress.calm": "ಶಾಂತ",
    "stress.steady": "ಸ್ಥಿರ",
    "stress.mildStress": "ಸೌಮ್ಯ ಒತ್ತಡ",
    "stress.tense": "ಆತಂಕ",
    "stress.moderateStress": "ಮಧ್ಯಮ ಒತ್ತಡ",
    "stress.maxed": "ಹೆಚ್ಚಿನ ಒತ್ತಡ",
    "stress.stressed": "ಅತಿಯಾದ ಒತ್ತಡ",

    // Common missing
    "common.confirmed": "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    "common.great": "ಉತ್ತಮ",
    "common.call": "ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ",
    "common.add": "ಸೇರಿಸಿ",
    "common.live": "ಲೈವ್",
    "common.detectingGps": "ಲೈವ್ ಜಿಪಿಎಸ್ ಸ್ಥಳ & ವಾಯು ಗುಣಮಟ್ಟ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",

    // Diagnostics & Payment
    "payment.checkoutAndPay": "ಪಾವತಿಸಲು ಮುಂದುವರಿಯಿರಿ",
    "payment.trialOffer": "ಪ್ರಾಯೋಗಿಕ ವಿಶೇಷ ಕೊಡುಗೆ",
    "payment.useCode": "ಕೋಡ್ ಬಳಸಿ",
    "payment.freeCodeDesc": "ಪರೀಕ್ಷಾರ್ಥವಾಗಿ ಈ ತಪಾಸಣೆಯನ್ನು ಉಚಿತವಾಗಿ ಕಾಯ್ದಿರಿಸಲು ಈ ಕೋಡ್ ಬಳಸಿ!",
    "payment.codeApplied": "ಕೋಡ್ ಅನ್ವಯಿಸಲಾಗಿದೆ! ಶುಲ್ಕ 0 ಕ್ಕೆ ಇಳಿದಿದೆ.",
    "payment.discountApplied": "100% ರಿಯಾಯಿತಿ ಅನ್ವಯಿಸಲಾಗಿದೆ",
    "payment.dateTime": "ದಿನಾಂಕ & ಸಮಯ",
    "payment.processing": "ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ..."
  },
  hi: {
    // Habits & Condition UI
    "habits.stressLevelToday": "आज का तनाव स्तर",
    "habits.calmRelaxed": "शांत / तनावमुक्त",
    "habits.overwhelmed": "अत्यधिक तनाव",
    "habits.minimal": "न्यूनतम",
    "habits.severe": "गंभीर",
    "habits.stressImpact": "लगातार तनाव कोर्टिसोल और रक्त शर्करा के स्तर को बढ़ाता है।",

    // Appointment
    "appointment.consultSpecialist": "अपने {{specialty}} से परामर्श लें",

    // Protocols & Parkinson
    "protocols.moodDopamineSupport": "मूड & डोपामाइन सहायता",
    "protocols.lovedActivitySub": "गायन, पेंटिंग, बागवानी या पसंदीदा शौक",
    "protocols.lovedActivityPlaceholder": "आपने किस गतिविधि का आनंद लिया?",
    "protocols.ateDarkChocolate": "क्या आज डार्क चॉकलेट (>70% कोको) खाई?",
    "protocols.selectDopamineBoosters": "आज अनुभव किए गए डोपामाइन बूस्टर चुनें:",
    "protocols.huggedLovedOne": "प्रियजन को गले लगाना",
    "protocols.receivedKindWords": "अच्छे शब्द सुनना / बोलना",
    "protocols.morningSunlight": "सुबह की धूप लेना",
    "protocols.favouriteMusic": "पसंदीदा संगीत सुनना",
    "protocols.gentleMassage": "हल्की मालिश / स्ट्रेचिंग",
    "protocols.watchedComedy": "हंसना / कॉमेडी देखना",
    "protocols.tremorSeverity": "कंपकंपी की गंभीरता",
    "protocols.rigiditySeverity": "मांसपेशियों में अकड़न / कठोरता",
    "protocols.bradykinesiaSeverity": "ब्रेडिकाइनेशिया (गति में धीमापन)",
    "protocols.noMedicationDoses": "आज कोई दवा दर्ज नहीं की गई। समय सारिणी ट्रैक करने के लिए ऊपर विवरण दर्ज करें।",
    "protocols.doseScheduleAdherence": "दैनिक दवा का समय & अनुपालन",
    "protocols.closeSchedule": "शेड्यूल बंद करें",
    "protocols.manage": "प्रबंधित करें",
    "protocols.minimal": "न्यूनतम",
    "protocols.severe": "गंभीर",
    "protocols.neurologist": "न्यूरोलॉजिस्ट",
    "protocols.parkinsonDoctorNote": "गति के उतार-चढ़ाव की निगरानी और खुराक समायोजन के लिए अपने न्यूरोलॉजिस्ट से परामर्श करें।",

    // Educational & Learning
    "learn.guides": "गाइड",
    "learn.videos": "वीडियो",
    "learn.videoTutorials": "वीडियो ट्यूटोरियल",
    "learn.minRead": "मिनट का पठन",
    "learn.optimalFastingTitle": "सर्वोत्तम उपवास समय के सुझाव",
    "learn.understandingGiTitle": "ग्लाइसेमिक इंडेक्स (GI) को समझना",
    "learn.cgmSensorTitle": "एबट सीजीएम सेंसर को कैसे लगाएं और जोड़ें",
    "learn.cgmSensorDesc": "सेंसर लगाने, त्वचा साफ करने और सक्रिय करने की चरण-दर-चरण वीडियो गाइड।",
    "learn.cgmGuideBadge": "CGM गाइड",

    // Kitchen & Habit screens
    "kitchen.damageKitchenAudit": "रसोई माइक्रोप्लास्टिक & बर्तन ऑडिट",
    "kitchen.checkYourKitchen": "अपने रसोई के बर्तनों की जांच करें",
    "kitchen.riskFlagged": "जोखिम चिन्हित",
    "kitchen.q1Text": "क्या आप खरोंच वाले या PTFE कोटेड नॉन-स्टिक बर्तनों का उपयोग करते हैं?",
    "kitchen.q2Text": "क्या आप प्लास्टिक के बर्तनों में गर्म खाना रखते हैं या माइक्रोवेव करते हैं?",
    "kitchen.q3Text": "क्या आप प्लास्टिक कटिंग बोर्ड या सिंथेटिक बर्तनों का उपयोग करते हैं?",
    "kitchen.naturalGuidelines": "कास्ट आयरन, स्टेनलेस स्टील, मिट्टी या लकड़ी के बर्तनों पर स्विच करें।",
    "kitchen.lookingForPlasticFree": "प्रमाणित प्लास्टिक-मुक्त बर्तन खोज रहे हैं?",
    "kitchen.saveKitchenLog": "रसोई लॉग सहेजें",

    // Obesity
    "obesity.damageBreadcrumb": "वजन & चयापचय मूल्यांकन",
    "obesity.knowYourBmiDesc": "अपना बीएमआई जांचें और स्वस्थ चयापचय लक्ष्यों को ट्रैक करें।",
    "obesity.difficultyLosingWeight": "स्वस्थ आदतों के बावजूद वजन घटाने में कठिनाई हो रही है?",
    "obesity.endocrinologistDesc": "व्यक्तिगत चिकित्सा के लिए एंडोक्रिनोलॉजिस्ट से परामर्श लें।",
    "obesity.weeklyWeightDesc": "सप्ताह में एक बार सुबह अपना वजन दर्ज करें।",

    // Sleep
    "sleep.advisoryDesc": "7-8 घंटे की गहरी नींद कोशिकाओं की मरम्मत और ग्लूकोज नियंत्रण में मदद करती है।",
    "sleep.option2": "सोने या नींद बनाए रखने में कठिनाई",
    "sleep.notStressed": "नींद की कोई समस्या नहीं",
    "sleep.bookSleepSpecialist": "स्लीप स्पेशलिस्ट से परामर्श लें",

    // Stress Log
    "mia.stressHeading": "तनाव प्रबंधन & मूड लॉग",
    "stress.stressSubtext": "दैनिक तनाव को ट्रैक करने से कारणों को समझने और हार्मोनल संतुलन बनाने में मदद मिलती है।",
    "stress.tapAFace": "आज के अपने मूड से मेल खाते चेहरे पर टैप करें:",
    "stress.logToday": "आज का तनाव दर्ज करें",
    "stress.chatOrConsultDesc": "तनाव महसूस हो रहा है? मिया AI से चैट करें या विशेषज्ञ से परामर्श लें।",
    "stress.chatWithMito": "मिया AI से चैट करें",
    "stress.bookSpecialist": "मानसिक स्वास्थ्य विशेषज्ञ बुक करें",
    "stress.calm": "शांत",
    "stress.steady": "स्थिर",
    "stress.mildStress": "हल्का तनाव",
    "stress.tense": "तनावग्रस्त",
    "stress.moderateStress": "मध्यम तनाव",
    "stress.maxed": "उच्च तनाव",
    "stress.stressed": "अत्यधिक तनाव",

    // Common missing
    "common.confirmed": "पुष्टि की गई",
    "common.great": "बहुत बढ़िया",
    "common.call": "हेल्पलाइन पर कॉल करें",
    "common.add": "जोड़ें",
    "common.live": "लाइव",
    "common.detectingGps": "लाइव जीपीएस स्थान & वायु गुणवत्ता की जांच हो रही है...",

    // Diagnostics & Payment
    "payment.checkoutAndPay": "चेकआउट और भुगतान",
    "payment.trialOffer": "ट्रायल विशेष ऑफर",
    "payment.useCode": "कोड का उपयोग करें",
    "payment.freeCodeDesc": "परीक्षण के लिए इस टेस्ट को पूरी तरह से मुफ्त बुक करने के लिए यह कोड डालें!",
    "payment.codeApplied": "कोड लागू! बुकिंग शुल्क घटकर 0 हो गया।",
    "payment.discountApplied": "100% छूट लागू",
    "payment.dateTime": "दिनांक & समय",
    "payment.processing": "प्रक्रिया जारी है..."
  }
};

function insertKeysIntoFile(filePath, keysObj) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lastBraceIdx = content.lastIndexOf('} as const;');
  if (lastBraceIdx === -1) {
    console.error(`Could not find closing brace in ${filePath}`);
    return;
  }

  let injection = '\n  // --- NEW LOCALIZATION BATCH ---\n';
  for (const [k, v] of Object.entries(keysObj)) {
    const escapedVal = JSON.stringify(v);
    injection += `  ${JSON.stringify(k)}: ${escapedVal},\n`;
  }

  const before = content.slice(0, lastBraceIdx);
  const after = content.slice(lastBraceIdx);
  fs.writeFileSync(filePath, before + injection + after, 'utf8');
  console.log(`Updated ${filePath} with ${Object.keys(keysObj).length} keys.`);
}

insertKeysIntoFile(enPath, newTranslations.en);
insertKeysIntoFile(taPath, newTranslations.ta);
insertKeysIntoFile(knPath, newTranslations.kn);
insertKeysIntoFile(hiPath, newTranslations.hi);
