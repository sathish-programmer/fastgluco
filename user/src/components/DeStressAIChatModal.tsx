import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, HeartHandshake, Calendar, RefreshCw, Moon, PhoneCall, Zap, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HabitsService } from '../services/habitsService';
import {
  normalizeLang,
  MIA_SPECIFIC_TIPS,
  getGuidedReplyFallback,
  getStepQuickRepliesFallback,
  getSpecialistCardDataLocalized,
  getShortcutExerciseDataLocalized,
  detectIssueKeyMultilingual
} from '../data/miaData';
import { speakText, stopSpeaking } from '../utils/ttsHelper';

interface DeStressAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'stress' | 'sleep';
  initialCategory?: string;
  onBookAppointment?: (reason: string) => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  options?: string[];
  isLifestyleCard?: boolean;
  lifestyleData?: {
    title: string;
    intro?: string;
    tips: string[];
    outro: string;
  };
  isFollowupCard?: boolean;
  isContinueCard?: boolean;
  isSpecialistCard?: boolean;
  specialistData?: {
    title: string;
    body: string;
    primaryBtnLabel: string;
    primaryReason: string;
    secondaryBtnLabel?: string;
    secondaryReason?: string;
  };
}

const MIA_STORAGE_KEY = (userId?: string, lang: string = 'en') => `mito_mia_state_${userId || 'guest'}_${lang}`;
const MIA_FOLLOWUP_KEY = (userId?: string, lang: string = 'en') => `mr_mia_followup_${userId || 'guest'}_${lang}`;

export const DeStressAIChatModal: React.FC<DeStressAIChatModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'stress',
  initialCategory = 'general',
  onBookAppointment
}) => {
  const { apiUrl, token, user } = useAuth();
  const { t, language } = useLanguage();
  const curLang = normalizeLang(language);

  const [mode, setMode] = useState<'stress' | 'sleep'>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [exchangeCount, setExchangeCount] = useState<number>(0);
  const [identifiedIssue, setIdentifiedIssue] = useState<string>(initialCategory);
  const [, setLifestyleGiven] = useState<boolean>(false);
  const [followupShown, setFollowupShown] = useState<boolean>(false);
  const [phase, setPhase] = useState<'identify' | 'lifestyle' | 'followup' | 'continue' | 'specialist'>('identify');
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);
  const [showQuickShortcuts, setShowQuickShortcuts] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Check saved followup state
      try {
        const savedFollowup = localStorage.getItem(MIA_FOLLOWUP_KEY(user?.id, curLang));
        if (savedFollowup) {
          const parsed = JSON.parse(savedFollowup);
          const hoursAgo = (Date.now() - (parsed.ts || 0)) / 3600000;
          if (parsed.awaitingFollowup && hoursAgo >= 18) {
            setMode(parsed.mode || 'stress');
            setIdentifiedIssue(parsed.issue || 'general');
            showReturningUserFlow(parsed);
            return;
          }
        }
      } catch (err) {}

      startChatSession(initialMode);
    } else {
      stopSpeaking();
      setSpeakingMsgId(null);
    }
  }, [isOpen, curLang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSpeak = (msgId: string, textToSpeak: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }
    setSpeakingMsgId(msgId);
    speakText({
      text: textToSpeak,
      language: curLang,
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null)
    });
  };

  const showReturningUserFlow = (savedData: any) => {
    setExchangeCount(4);
    setLifestyleGiven(true);
    setFollowupShown(true);
    setPhase('followup');

    const greeting = curLang === 'ta'
      ? `மீண்டும் வருக 💙 உங்களை நினைத்துக் கொண்டிருந்தேன். நேற்று நாம் பேசிய **${savedData.issueLabel || 'உங்கள் நல்வாழ்வு'}** அடிப்படையில் 4 தனிப்பயனாக்கப்பட்ட வாழ்க்கைமுறை படிகளை பரிந்துரைத்தேன்.\n\nநேற்றைய தினத்துடன் ஒப்பிடும்போது இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?`
      : curLang === 'kn'
      ? `ಮರಳಿ ಸ್ವಾಗತ 💙 ನಿಮ್ಮ ಬಗ್ಗೆ ಯೋಚಿಸುತ್ತಿದ್ದೆ. ನಿನ್ನೆ ನಾವು ಚರ್ಚಿಸಿದ **${savedData.issueLabel || 'ನಿಮ್ಮ ಕ್ಷೇಮ'}** ಆಧಾರದ ಮೇಲೆ 4 ಜೀವನಶೈಲಿ ಕ್ರಮಗಳನ್ನು ಸೂಚಿಸಿದ್ದೆ.\n\nನಿನ್ನೆಗೆ ಹೋಲಿಸಿದರೆ ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?`
      : curLang === 'hi'
      ? `पुनः स्वागत है 💙 मैं आपके बारे में ही सोच रही थी। कल हमने **${savedData.issueLabel || 'आपकी सेहत'}** के बारे में बात की थी और 4 उपाय सुझाए थे।\n\nकल की तुलना में आज आप कैसा महसूस कर रहे हैं?`
      : curLang === 'te'
      ? `తిరిగి స్వాగతం 💙 నేను మీ గురించే ఆలోచిస్తున్నాను. నిన్న మనం చర్చించిన **${savedData.issueLabel || 'మీ శ్రేయస్సు'}** ఆధారంగా 4 జీవనశైలి మార్పులను సూచించాను.\n\nనిన్నటితో పోలిస్తే ఈ రోజు మీరు ఎలా ఉన్నారు?`
      : `Welcome back 💙 I've been thinking about you. Yesterday we talked about what was going on with **${savedData.issueLabel || 'your wellbeing'}** and I suggested 4 personalized steps to try.\n\nHow are you feeling today compared to yesterday?`;

    const options = [
      t('mia.returningBetter', 'I feel noticeably better'),
      t('mia.returningSame', 'About the same — no real change'),
      t('mia.returningWorse', 'I feel worse actually'),
      t('mia.returningSome', 'I tried some things but not all')
    ];

    setMessages([
      {
        id: `ret-${Date.now()}`,
        role: 'ai',
        text: greeting,
        options
      }
    ]);
    setActiveQuickReplies(options);
  };

  const startChatSession = (currentMode: 'stress' | 'sleep' = mode) => {
    setMode(currentMode);
    setExchangeCount(0);
    setLifestyleGiven(false);
    setFollowupShown(false);
    setPhase('identify');
    setIdentifiedIssue('general');
    setShowQuickShortcuts(false);
    stopSpeaking();
    setSpeakingMsgId(null);

    if (currentMode === 'stress') {
      const greeting = t('mia.greetingStress', `Hello 💙 I'm **Mia**, your Mental Health AI Expert at Mito Reboot. I can see you're going through a tough time. I want to really understand what's going on for you — not give you generic advice.\n\nWhich of these is weighing on you most right now?`);
      const options = [
        t('mia.worklifeBurnout', 'Work-life balance & burnout'),
        t('mia.relationshipConflict', 'Relationship conflict'),
        t('mia.lossOfLovedOne', 'Loss of a loved one'),
        t('mia.hormonalMoodSwings', 'Premenstrual / hormonal mood swings'),
        t('mia.sexualHealthConcerns', 'Sexual health concerns'),
        t('mia.somethingElse', 'Something else entirely')
      ];
      setMessages([
        {
          id: `msg-init-mia-${Date.now()}`,
          role: 'ai',
          text: greeting,
          options
        }
      ]);
      setActiveQuickReplies(options);
    } else {
      const greeting = t('mia.greetingSleep', `Hello 🌙 I'm **Mia**, your Sleep Health & Mental Wellbeing expert. I'm going to ask a few questions to understand exactly what's affecting your sleep — and then give you targeted advice based on your specific situation.\n\nTo start: how long have you been struggling with sleep, and what happens when you try to sleep?`);
      const options = [
        t('mia.troubleFallingAsleep', 'Trouble falling asleep for weeks'),
        t('mia.fallAsleepWake34am', 'I fall asleep but wake up at 3-4am'),
        t('mia.wakeTooEarly', "I wake too early and can't go back"),
        t('mia.allPoorSleep', 'All of the above — just poor sleep'),
        t('mia.startedRecently', 'Started recently — last few days')
      ];
      setMessages([
        {
          id: `msg-init-mia-sleep-${Date.now()}`,
          role: 'ai',
          text: greeting,
          options
        }
      ]);
      setActiveQuickReplies(options);
    }
  };

  const switchMode = (newMode: 'stress' | 'sleep') => {
    if (newMode === mode) return;
    try {
      localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id, curLang));
    } catch (e) {}
    startChatSession(newMode);
  };

  const restartChatSession = () => {
    try {
      localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id, curLang));
      localStorage.removeItem(MIA_STORAGE_KEY(user?.id, curLang));
    } catch (e) {}
    startChatSession(mode);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setActiveQuickReplies([]);
    setShowQuickShortcuts(false);
    setIsTyping(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    const detectedCat = detectIssueKeyMultilingual(text);
    if (newCount === 1) {
      setIdentifiedIssue(detectedCat);
    }

    // Save Habit log into DB ONCE
    if (newCount === 1 && token && apiUrl) {
      HabitsService.logHabit(apiUrl, token, mode === 'stress' ? 'Stress' : 'Sleep', {
        faceId: 'stressed',
        label: mode === 'stress' ? 'Mental Health AI Check' : 'Sleep Assessment',
        emoji: mode === 'stress' ? '🤍' : '🌙',
        subOption: detectedCat,
        option: text,
        source: 'ai_mia'
      }).catch(e => console.error('Error saving Mia habit log:', e));
    }

    // Handle Followup choices in all 5 languages
    const lower = text.toLowerCase();
    const isBetter = lower.includes('better') || lower.includes('good') || lower.includes('improved') || lower.includes('helped') ||
      lower.includes('நன்று') || lower.includes('மேம்பட்ட') || lower.includes('தேவல') ||
      lower.includes('ಉತ್ತಮ') || lower.includes('ಸುಧಾರಣೆ') ||
      lower.includes('बेहतर') || lower.includes('अच्छा') || lower.includes('सुधार') ||
      lower.includes('మెరుగైన') || lower.includes('నయమైంది') || lower.includes('బాగుంది');

    const isWorse = lower.includes('worse') || lower.includes('same') || lower.includes('no change') || lower.includes('still') || lower.includes('struggling') ||
      lower.includes('மோசம்') || lower.includes('மாற்றமில்லை') || lower.includes('சிரமம்') ||
      lower.includes('ಕೆಟ್ಟ') || lower.includes('ಬದಲಾವಣೆ ಇಲ್ಲ') || lower.includes('ಕಷ್ಟ') ||
      lower.includes('खराब') || lower.includes('कोई बदलाव नहीं') || lower.includes('मुश्किल') ||
      lower.includes('తీవ్రం') || lower.includes('మార్పు లేదు') || lower.includes('కష్టం');

    if (phase === 'followup' || followupShown) {
      if (isBetter && !isWorse) {
        setIsTyping(false);
        setPhase('continue');
        try { localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id)); } catch (e) {}
        
        const contOpts = curLang === 'ta'
          ? ['நன்றி! நான் தொடர்ந்து செய்வேன்', 'இடைவெளி ஏற்பட்டால் என்ன செய்வது?', 'மேலும் மாற்றங்களை சேர்க்கலாமா?']
          : curLang === 'kn'
          ? ['ಧನ್ಯವಾದಗಳು! ನಾನು ಮುಂದುವರಿಸುತ್ತೇನೆ', 'ತಪ್ಪಿದರೆ ಏನು ಮಾಡುವುದು?', 'ಇನ್ನಷ್ಟು ಬದಲಾವಣೆಗಳನ್ನು ಸೇರಿಸಬಹುದೇ?']
          : curLang === 'hi'
          ? ['धन्यवाद! मैं इसे जारी रखूँगा', 'यदि कोई नियम छूट जाए तो?', 'क्या मैं और बदलाव जोड़ सकता हूँ?']
          : curLang === 'te'
          ? ['ధన్యవాదాలు! నేను కొనసాగిస్తాను', 'ఒకవేళ మిస్ అయితే ఏమి చేయాలి?', 'మరిన్ని మార్పులు జోడించవచ్చా?']
          : ['Thank you! I will keep going', 'What if I slip up?', 'Can I add more changes?'];

        setMessages(prev => [
          ...prev,
          {
            id: `cont-${Date.now()}`,
            role: 'ai',
            text: '',
            isContinueCard: true,
            options: contOpts
          }
        ]);
        setActiveQuickReplies(contOpts);
        return;
      } else if (isWorse || (!isBetter && newCount >= 4)) {
        setIsTyping(false);
        setPhase('specialist');
        try { localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id)); } catch (e) {}

        const compassion = mode === 'sleep'
          ? (curLang === 'ta'
              ? `வாழ்க்கைமுறை மாற்றங்கள் முழு நிவாரணம் அளிக்கவில்லை என்பது வருத்தமளிக்கிறது. உங்கள் உடலுக்கும் நரம்பு மண்டலத்திற்கும் சிறப்பு மருத்துவ உதவி தேவை என்பதை இது காட்டுகிறது.`
              : curLang === 'kn'
              ? `ಜೀವನಶೈಲಿಯ ಬದಲಾವಣೆಗಳು ಸಂಪೂರ್ಣ ಪರಿಹಾರ ನೀಡಿಲ್ಲದಿರುವುದು ವಿಷಾದನೀಯ. ನಿಮ್ಮ ನರಮಂಡಲಕ್ಕೆ ತಜ್ಞರ ವೈದ್ಯಕೀಯ ಬೆಂಬಲದ ಅಗತ್ಯವಿದೆ.`
              : curLang === 'hi'
              ? `मुझे खेद है कि जीवनशैली में बदलाव से पूरा आराम नहीं मिला। इसका संकेत है कि आपके शरीर और तंत्रिका तंत्र को विशेषज्ञ के समर्थन की आवश्यकता है।`
              : curLang === 'te'
              ? `జీవనశైలి మార్పులు పూర్తి ఉపశమనాన్ని ఇవ్వనందుకు చింతిస్తున్నాను. మీ నాడీ వ్యవస్థకు నిపుణుల వైద్య మద్దతు అవసరమని ఇది సూచిస్తుంది.`
              : `I'm sorry the lifestyle changes haven't brought full relief yet. That tells me your nervous system and body need more targeted specialist support.`)
          : (curLang === 'ta'
              ? `நீங்கள் இன்னும் சிரமப்படுகிறீர்கள் என்பது வருத்தமளிக்கிறது. அதை வெளிப்படையாக ஒப்புக்கொள்வது பெரும் துணிச்சல். உங்களுக்கு அர்ப்பணிப்புள்ள மருத்துவப் பராமரிப்பு அவசியம்.`
              : curLang === 'kn'
              ? `ನೀವು ಇನ್ನೂ ಕಷ್ಟಪಡುತ್ತಿದ್ದೀರಿ ಎಂಬುದು ಬೇಸರದ ಸಂಗತಿ. ಅದನ್ನು ಮುಕ್ತವಾಗಿ ಒಪ್ಪಿಕೊಳ್ಳಲು ನಿಜವಾದ ಧೈರ್ಯ ಬೇಕು. ನಿಮಗೆ ಸೂಕ್ತ ವೃತ್ತಿಪರ ಆರೈಕೆ ಸಿಗಬೇಕು.`
              : curLang === 'hi'
              ? `मुझे खेद है कि आप अभी भी संघर्ष कर रहे हैं। इसे स्वीकार करना वास्तविक साहस दिखाता है, और आप समर्पित पेशेवर देखभाल के हकदार हैं।`
              : curLang === 'te'
              ? `మీరు ఇంకా ఇబ్బంది పడుతున్నందుకు చింతిస్తున్నాను. దాన్ని అంగీకరించడం నిజమైన ధైర్యం, మీకు నిపుణుల ప్రత్యేక సంరక్షణ అవసరం.`
              : `I'm sorry you're still struggling. Admitting that takes real courage, and it shows you deserve dedicated, professional care.`);

        const specData = getSpecialistCardDataLocalized(detectedCat || identifiedIssue, mode, curLang);

        setMessages(prev => [
          ...prev,
          { id: `comp-${Date.now()}`, role: 'ai', text: compassion },
          { id: `spec-${Date.now()}`, role: 'ai', text: '', isSpecialistCard: true, specialistData: specData }
        ]);
        return;
      }
    }

    try {
      const res = await fetch(`${apiUrl}/ai/de-stress-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          mode,
          exchangeCount: newCount,
          identifiedIssue: detectedCat || identifiedIssue,
          language: curLang,
          history: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });

      let replyText = '';
      let responseOptions: string[] | undefined = undefined;
      let responseTips: string[] | undefined = undefined;

      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.message;
        if (Array.isArray(data.options) && data.options.length > 0) {
          responseOptions = data.options;
        }
        if (Array.isArray(data.tips) && data.tips.length > 0) {
          responseTips = data.tips;
        }
      } else {
        replyText = getGuidedReplyFallback(newCount, mode, detectedCat || identifiedIssue, curLang);
        responseOptions = getStepQuickRepliesFallback(newCount, mode, curLang);
      }

      setIsTyping(false);

      // Phase 2: Lifestyle Advice Card (at step 2 or 3)
      if ((newCount === 2 && mode === 'stress') || (newCount === 3 && mode === 'sleep')) {
        setLifestyleGiven(true);
        setPhase('lifestyle');
        
        const catKey = detectedCat || identifiedIssue || 'general';
        const tipsList = responseTips && responseTips.length > 0
          ? responseTips
          : (MIA_SPECIFIC_TIPS[curLang]?.[catKey] || MIA_SPECIFIC_TIPS[curLang]?.general || MIA_SPECIFIC_TIPS.en[catKey] || MIA_SPECIFIC_TIPS.en.general);

        const lifestyleTitle = t('mia.lifestyleTitle', '🌿 4 Personalised Changes for You');
        const lifestyleOutro = t('mia.lifestyleOutro', '📅 Try these 4 steps today and come back tomorrow to tell me how you feel.');

        setMessages(prev => [
          ...prev,
          {
            id: `life-${Date.now()}`,
            role: 'ai',
            text: '',
            isLifestyleCard: true,
            lifestyleData: {
              title: lifestyleTitle,
              intro: replyText,
              tips: tipsList,
              outro: lifestyleOutro
            }
          }
        ]);

        // Save Followup state
        saveFollowupToStorage(catKey);

        // Append Followup Check-in Card
        setTimeout(() => {
          setFollowupShown(true);
          setPhase('followup');
          const folOpts = [
            t('mia.feelBetterChoice', 'I feel noticeably better'),
            t('mia.stillStrugglingChoice', 'Still struggling / Feeling worse')
          ];
          setMessages(prev => [
            ...prev,
            {
              id: `fol-${Date.now()}`,
              role: 'ai',
              text: '',
              isFollowupCard: true,
              options: folOpts
            }
          ]);
          setActiveQuickReplies(folOpts);
        }, 800);

        return;
      }

      // Regular question step
      const stepOptions = responseOptions || getStepQuickRepliesFallback(newCount, mode, curLang);
      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', text: replyText, options: stepOptions }
      ]);
      setActiveQuickReplies(stepOptions || []);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallback = getGuidedReplyFallback(newCount, mode, detectedCat || identifiedIssue, curLang);
      const stepOptions = getStepQuickRepliesFallback(newCount, mode, curLang);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: fallback, options: stepOptions }]);
      setActiveQuickReplies(stepOptions || []);
    }
  };

  const saveFollowupToStorage = (issueKey: string) => {
    const labels: Record<string, string> = {
      worklife: 'work-life balance', relationship: 'relationship stress',
      loss: 'grief and loss', hormonal: 'hormonal mood shifts',
      sexual: 'sexual health', sleep_stress: 'stress-driven sleep',
      sleep_disorder: 'sleep cycle', sleep_apnea: 'sleep breathing', general: 'your wellbeing'
    };
    try {
      localStorage.setItem(
        MIA_FOLLOWUP_KEY(user?.id),
        JSON.stringify({
          mode,
          issue: issueKey,
          issueLabel: labels[issueKey] || 'your wellbeing',
          awaitingFollowup: true,
          ts: Date.now()
        })
      );
    } catch (e) {}
  };

  const triggerShortcutExercise = (exerciseType: 'breathing' | 'grounding' | 'worry_dump') => {
    setShowQuickShortcuts(false);
    const exerciseData = getShortcutExerciseDataLocalized(exerciseType, curLang);

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: exerciseData.userTitle };
    setMessages(prev => [
      ...prev,
      userMsg,
      {
        id: `ex-${Date.now()}`,
        role: 'ai',
        text: '',
        isLifestyleCard: true,
        lifestyleData: {
          title: exerciseData.cardTitle,
          intro: exerciseData.cardIntro,
          tips: exerciseData.steps,
          outro: exerciseData.outro
        }
      }
    ]);
  };

  if (!isOpen) return null;

  const aiMessages = messages.filter(m => m.role === 'ai');
  const latestAiMsgId = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].id : null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden font-sans transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Header - Theme Adaptive Light/Dark */}
      <div 
        className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 flex flex-col shrink-0 gap-2.5 shadow-2xs"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {/* Mode Switcher Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100/80 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => switchMode('stress')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'stress'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 shadow-2xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <span>{t('mia.stressSupport', 'Stress Support')}</span>
          </button>

          <button
            onClick={() => switchMode('sleep')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'sleep'
                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 shadow-2xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <span>{t('mia.sleepAssessment', 'Sleep Assessment')}</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-sm ${
              mode === 'stress' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {mode === 'stress' ? '🤍' : '🌙'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  Mia
                </h3>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  mode === 'stress'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/60'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/60'
                }`}>
                  {t('mia.mentalHealthAiExpert', 'Mental Health AI Expert')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${mode === 'stress' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                <span>{t('mia.alwaysHere', 'Mito Reboot Care · Always Here')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={restartChatSession}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title={t('mia.restart', 'Restart')}
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t('mia.restart', 'Restart')}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Container - Light Theme Adaptive */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/50 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0 mt-1 shadow-xs ${
                mode === 'stress' ? 'bg-rose-600' : 'bg-blue-600'
              }`}>
                {mode === 'stress' ? '🤍' : '🌙'}
              </div>
            )}

            <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
              msg.role === 'user'
                ? mode === 'stress' ? 'bg-rose-600 text-white font-medium rounded-tr-xs shadow-xs' : 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
            }`}>
              <div className="flex items-start justify-between gap-2">
                {msg.text && (
                  <div 
                    className="space-y-1.5 flex-1 [&_strong]:font-black [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                )}
                {msg.role === 'ai' && (msg.text || msg.lifestyleData?.intro) && (
                  <button
                    onClick={() => handleSpeak(msg.id, msg.text || msg.lifestyleData?.intro || '')}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0 mt-0.5"
                    title={speakingMsgId === msg.id ? t('common.stopAudio', 'Stop Audio') : t('common.listenAudio', 'Listen')}
                  >
                    {speakingMsgId === msg.id ? (
                      <VolumeX className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Inline Options Directly Below Question */}
              {msg.role === 'ai' && (() => {
                const isLatestAi = msg.id === latestAiMsgId;
                const optionsToDisplay = (msg.options && msg.options.length > 0)
                  ? msg.options
                  : (isLatestAi && activeQuickReplies && activeQuickReplies.length > 0 ? activeQuickReplies : undefined);

                if (!optionsToDisplay || optionsToDisplay.length === 0) return null;

                return (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {t('mia.selectOptionToReply', '⚡ SELECT AN OPTION TO REPLY:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {optionsToDisplay.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          disabled={!isLatestAi || isTyping}
                          onClick={() => handleSendMessage(opt)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border text-center active:scale-95 ${
                            isLatestAi && !isTyping
                              ? mode === 'stress'
                                ? 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 shadow-2xs cursor-pointer'
                                : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 shadow-2xs cursor-pointer'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Structured 4-Step Personalised Lifestyle Card */}
              {msg.isLifestyleCard && msg.lifestyleData && (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 space-y-3 text-emerald-900 dark:text-emerald-200 mt-2">
                  <div className="flex items-center gap-2 font-black text-xs text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{msg.lifestyleData.title}</span>
                  </div>
                  
                  {msg.lifestyleData.intro && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {msg.lifestyleData.intro}
                    </p>
                  )}

                  <div className="space-y-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    {msg.lifestyleData.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed font-semibold text-slate-800 dark:text-slate-200">{tip}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold italic text-center">
                    {msg.lifestyleData.outro}
                  </div>
                </div>
              )}

              {/* Followup Check-in Card */}
              {msg.isFollowupCard && (
                <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 space-y-3 mt-3">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-800 dark:text-amber-300">
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t('followUpCheckInTitle', '📅 Follow-Up Check-In')}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {t('mia.followUpCardDesc', "I've saved your personalised 4-step plan. Please try these steps today and return tomorrow to check in with me. We'll decide your next steps together!")}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleSendMessage(t('mia.feelBetterChoice', 'I feel noticeably better'))}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {t('mia.feelBetter', 'I feel better!')}
                    </button>

                    <button
                      onClick={() => handleSendMessage(t('mia.stillStrugglingChoice', 'Still struggling / Feeling worse'))}
                      className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {t('mia.stillStruggling', 'Still struggling')}
                    </button>
                  </div>
                </div>
              )}

              {/* Celebration / Progress Card */}
              {msg.isContinueCard && (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-center space-y-2 mt-2">
                  <h4 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-400">
                    {t('mia.continueCardTitle', "That's wonderful — you're making real progress!")}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {t('mia.continueCardDesc', "Keep going with your 4 lifestyle changes for the next 2 full weeks. Small consistent steps create lasting change at the cellular level. Come back anytime you need support. You are doing brilliantly! 💚")}
                  </p>
                </div>
              )}

              {/* Specialist Recommendation Card */}
              {msg.isSpecialistCard && msg.specialistData && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 space-y-3 mt-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-300">{msg.specialistData.title}</h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {msg.specialistData.body}
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onBookAppointment?.(msg.specialistData?.primaryReason || 'Mental Health Specialist Consultation');
                      }}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{msg.specialistData.primaryBtnLabel}</span>
                    </button>

                    {msg.specialistData.secondaryBtnLabel && (
                      <button
                        onClick={() => {
                          onClose();
                          onBookAppointment?.(msg.specialistData?.secondaryReason || 'Sleep Specialist Consultation');
                        }}
                        className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/50"
                      >
                        <Moon className="h-3.5 w-3.5" />
                        <span>{msg.specialistData.secondaryBtnLabel}</span>
                      </button>
                    )}

                    <a
                      href="tel:9152987821"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all block text-center"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('mia.freeHelpline', 'iCall Free Helpline: 9152987821')}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0 shadow-xs ${
              mode === 'stress' ? 'bg-rose-600' : 'bg-blue-600'
            }`}>
              {mode === 'stress' ? '🤍' : '🌙'}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-xs">
              <span className={`w-2 h-2 rounded-full animate-bounce ${mode === 'stress' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${mode === 'stress' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${mode === 'stress' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Shortcuts Overlay Drawer */}
      {showQuickShortcuts && (
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200 shrink-0 shadow-xl max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t('mia.quickToolsTitle', "Mia's Quick Tools & Relief Shortcuts")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickShortcuts(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              {t('common.close', 'Close')}
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Section 1: Instant Micro-Relief Exercises */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5">
                🧘 {t('mia.instantCalmTitle', 'Instant Calm & Mind Exercises')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => triggerShortcutExercise('breathing')}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <span>🫁 {t('mia.breathingGuide', '4-7-8 Breathing Guide')}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                    {t('mia.breathingDesc', '2-min guided breathwork for instant calm')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerShortcutExercise('grounding')}
                  className="p-2.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <span>🌿 {t('mia.groundingGuide', '5-4-3-2-1 Grounding')}</span>
                  </div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium mt-0.5">
                    {t('mia.groundingDesc', 'Quick sensory reset for panic & racing mind')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerShortcutExercise('worry_dump')}
                  className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <span>📓 {t('mia.worryDumpGuide', '10-Min Worry Dump')}</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium mt-0.5">
                    {t('mia.worryDumpDesc', 'Structured journal exercise to quiet thoughts')}
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Fast Topic Jumps */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1.5">
                ⚡ {t('mia.jumpToTopic', 'Jump to Specific Wellness Topic')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: `💼 ${t('mia.worklifeBurnout', 'Work-life balance & burnout')}`, text: t('mia.worklifeBurnout', 'Work-life balance & burnout') },
                  { label: `❤️ ${t('mia.relationshipConflict', 'Relationship conflict')}`, text: t('mia.relationshipConflict', 'Relationship conflict') },
                  { label: `🌧️ ${t('mia.lossOfLovedOne', 'Loss of a loved one')}`, text: t('mia.lossOfLovedOne', 'Loss of a loved one') },
                  { label: `🌸 ${t('mia.hormonalMoodSwings', 'Premenstrual / hormonal mood swings')}`, text: t('mia.hormonalMoodSwings', 'Premenstrual / hormonal mood swings') },
                  { label: `🔥 ${t('mia.sexualHealthConcerns', 'Sexual health concerns')}`, text: t('mia.sexualHealthConcerns', 'Sexual health concerns') },
                  { label: `🌙 ${t('mia.sleepAssessment', 'Sleep Assessment')}`, text: t('mia.sleepAssessment', 'Sleep Assessment') }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowQuickShortcuts(false);
                      if (item.label.includes('🌙') || item.label.includes('Sleep') || item.label.includes('தூக்கம்') || item.label.includes('ನಿದ್ರೆ') || item.label.includes('नींद') || item.label.includes('నిద్ర')) {
                        switchMode('sleep');
                      } else {
                        handleSendMessage(item.text);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Professional & Helpline */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setShowQuickShortcuts(false);
                  onClose();
                  onBookAppointment?.('Mental Health Specialist Consultation');
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('mia.bookSpecialistConsultation', 'Book Specialist Consultation')}</span>
              </button>

              <a
                href="tel:9152987821"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-rose-100 transition-all"
              >
                <PhoneCall className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <span>{t('mia.freeHelpline', 'iCall Free Helpline: 9152987821')}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Bottom Left Shortcuts Button */}
          <button
            type="button"
            onClick={() => setShowQuickShortcuts(prev => !prev)}
            className={`h-11 px-3.5 rounded-2xl flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer border ${
              showQuickShortcuts
                ? mode === 'stress'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 font-black'
                  : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 font-black'
                : mode === 'stress'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold'
            }`}
            title={t('mia.shortcuts', 'Shortcuts')}
          >
            <Zap className={`h-4 w-4 ${showQuickShortcuts ? 'fill-current text-amber-300 animate-pulse' : mode === 'stress' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="text-[11px]">{t('mia.shortcuts', 'Shortcuts')}</span>
          </button>

          {/* Text Input with Left Sparkles Icon */}
          <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 rounded-2xl transition-colors min-w-0">
            <Sparkles className={`h-4 w-4 ml-3 shrink-0 ${mode === 'stress' ? 'text-rose-500' : 'text-blue-500'}`} />
            <input
              type="text"
              placeholder={mode === 'stress' ? t('mia.shareWithMia', "Share what's on your mind with Mia...") : t('mia.describeSleepDifficulty', "Describe your sleep difficulty with Mia...")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 min-w-0 bg-transparent border-none px-2.5 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isTyping || !inputText.trim()}
            className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-40 shrink-0 ${
              mode === 'stress' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2 font-semibold">
          {t('mia.disclaimer', 'Mia is an AI companion — not a substitute for professional care · iCall Free Counselling: 9152987821')}
        </p>
      </div>
    </div>
  );
};
