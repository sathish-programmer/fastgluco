import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, HeartHandshake, Calendar, RefreshCw, Moon, PhoneCall, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HabitsService } from '../services/habitsService';

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

const MIA_STORAGE_KEY = (userId?: string) => `mito_mia_state_${userId || 'guest'}`;
const MIA_FOLLOWUP_KEY = (userId?: string) => `mr_mia_followup_${userId || 'guest'}`;

const SPECIFIC_TIPS: Record<string, string[]> = {
  worklife: [
    'Set a firm 7pm shutdown — close laptop, silence work notifications completely.',
    'Take a 5-minute micro-break every 90 minutes — walk outside or stretch.',
    'Write down 3 things that went well today before bed.',
    'One screen-free morning per week to reset your nervous system.'
  ],
  relationship: [
    'Write what you feel before you say it — it removes the emotional charge.',
    'Choose one 10-minute conversation this week with no phones present.',
    'Ask "what do you need right now?" instead of giving unsolicited advice.',
    'Weekly check-in ritual: 5 minutes of undivided attention each way.'
  ],
  loss: [
    'Allow yourself 10 timed minutes to grieve each day — then gently close it.',
    'Write one memory that made you smile — keep it somewhere you will see it.',
    'Call one person who loved them too — shared grief is lighter.',
    'Create a small weekly ritual to honour them — it keeps the connection.'
  ],
  hormonal: [
    'Track your cycle with an app — awareness reduces the surprise of mood shifts.',
    'Cut refined sugar and caffeine in the 10 days before your period.',
    'Add magnesium-rich foods daily: dark chocolate (85%+), almonds, leafy greens.',
    '20-minute daily walk — it raises serotonin even when you feel sluggish.'
  ],
  sexual: [
    'Write one kind thing about your body each morning — body image is trainable.',
    'Schedule intimacy-free closeness — a warm hug, a conversation, zero pressure.',
    'Open a 5-minute partner check-in weekly: "how are you really?"',
    'Pelvic floor relaxation breathing: deep belly breath in, fully release out.'
  ],
  general: [
    '4-7-8 breathing: inhale 4s, hold 7s, exhale 8s — do this 4 times when stressed.',
    '10 minutes outside in nature daily — cortisol drops measurably.',
    '5-minute free-flow journaling — no editing, just empty your mind onto paper.',
    'One thing you are looking forward to, planned each week — anticipation heals.'
  ],
  sleep_stress: [
    'Strict shutdown routine — no screens 45 min before bed, dim lights at 9pm.',
    'Write a "worry dump" — 10 min journaling all worries before bed so brain releases them.',
    '4-7-8 breathing in bed (inhale 4s, hold 7s, exhale 8s) — activates parasympathetic system.',
    'Keep a consistent wake time even on weekends — anchors the circadian rhythm.'
  ],
  sleep_disorder: [
    'Sleep restriction therapy — go to bed ONLY when sleepy, not at a fixed time.',
    'Get up if awake >20 min — do something calm in dim light, return when sleepy.',
    'Morning bright light exposure (10 min sunlight within 30 min of waking) — resets melatonin.',
    'Remove the bedroom clock — clock-watching increases arousal and worsens insomnia.'
  ],
  sleep_apnea: [
    'Sleep on your side, not your back — tennis ball in back of pyjama pocket trick.',
    'Avoid alcohol within 3 hours of bed — it worsens airway collapse.',
    'Elevate head of bed by 10-15 degrees.',
    'Refer urgently to a sleep specialist for polysomnography (sleep study).'
  ]
};

export const DeStressAIChatModal: React.FC<DeStressAIChatModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'stress',
  initialCategory = 'general',
  onBookAppointment
}) => {
  const { apiUrl, token, user } = useAuth();
  const { t } = useLanguage();

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

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Check saved followup state
      try {
        const savedFollowup = localStorage.getItem(MIA_FOLLOWUP_KEY(user?.id));
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
    }
  }, [isOpen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showReturningUserFlow = (savedData: any) => {
    setExchangeCount(4);
    setLifestyleGiven(true);
    setFollowupShown(true);
    setPhase('followup');

    const greeting = `Welcome back 💙 I've been thinking about you. Yesterday we talked about what was going on with **${savedData.issueLabel || 'your wellbeing'}** and I suggested 4 personalized steps to try.\n\nHow are you feeling today compared to yesterday?`;
    const options = [
      'I feel noticeably better',
      'About the same — no real change',
      'I feel worse actually',
      'I tried some things but not all'
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
      localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id));
    } catch (e) {}
    startChatSession(newMode);
  };

  const restartChatSession = () => {
    try {
      localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id));
      localStorage.removeItem(MIA_STORAGE_KEY(user?.id));
    } catch (e) {}
    startChatSession(mode);
  };

  const detectIssueKey = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes('work') || t.includes('burn') || t.includes('job') || t.includes('boss')) return 'worklife';
    if (t.includes('relation') || t.includes('partner') || t.includes('family') || t.includes('conflict')) return 'relationship';
    if (t.includes('loss') || t.includes('grief') || t.includes('death') || t.includes('loved one')) return 'loss';
    if (t.includes('hormon') || t.includes('pms') || t.includes('menopaus') || t.includes('period')) return 'hormonal';
    if (t.includes('sexual') || t.includes('intimac') || t.includes('sex') || t.includes('libido')) return 'sexual';
    if (t.includes('snore') || t.includes('breath') || t.includes('apnea')) return 'sleep_apnea';
    if (t.includes('worry') || t.includes('racing') || t.includes('mind')) return 'sleep_stress';
    if (t.includes('quiet') || t.includes('clock') || t.includes('disorder')) return 'sleep_disorder';
    return 'general';
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

    const detectedCat = detectIssueKey(text);
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

    // Handle Followup choices
    const lower = text.toLowerCase();
    const isBetter = lower.includes('better') || lower.includes('good') || lower.includes('improved') || lower.includes('helped');
    const isWorse = lower.includes('worse') || lower.includes('same') || lower.includes('no change') || lower.includes('still') || lower.includes('struggling');

    if (phase === 'followup' || followupShown) {
      if (isBetter && !isWorse) {
        setIsTyping(false);
        setPhase('continue');
        try { localStorage.removeItem(MIA_FOLLOWUP_KEY(user?.id)); } catch (e) {}
        
        const contOpts = ['Thank you! I will keep going', 'What if I slip up?', 'Can I add more changes?'];
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
          ? `I'm sorry the lifestyle changes haven't brought full relief yet. That tells me your nervous system and body need more targeted specialist support.`
          : `I'm sorry you're still struggling. Admitting that takes real courage, and it shows you deserve dedicated, professional care.`;

        const specData = getSpecialistCardData(detectedCat || identifiedIssue, mode);

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
          history: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.message;
      } else {
        replyText = generateGuidedReply(text, newCount, mode, detectedCat || identifiedIssue);
      }

      setIsTyping(false);

      // Phase 2: Lifestyle Advice Card (at step 2 or 3)
      if ((newCount === 2 && mode === 'stress') || (newCount === 3 && mode === 'sleep')) {
        setLifestyleGiven(true);
        setPhase('lifestyle');
        
        const catKey = detectedCat || identifiedIssue || 'general';
        const tipsList = SPECIFIC_TIPS[catKey] || SPECIFIC_TIPS.general;

        setMessages(prev => [
          ...prev,
          {
            id: `life-${Date.now()}`,
            role: 'ai',
            text: '',
            isLifestyleCard: true,
            lifestyleData: {
              title: `🌿 4 Personalised Changes for You`,
              intro: replyText,
              tips: tipsList,
              outro: `📅 Try these 4 steps today and come back tomorrow to tell me how you feel.`
            }
          }
        ]);

        // Save Followup state
        saveFollowupToStorage(catKey);

        // Append Followup Check-in Card
        setTimeout(() => {
          setFollowupShown(true);
          setPhase('followup');
          const folOpts = ['I feel noticeably better', 'Still struggling / Feeling worse'];
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
      const stepOptions = getStepQuickReplies(newCount, mode);
      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', text: replyText, options: stepOptions }
      ]);
      setActiveQuickReplies(stepOptions || []);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallback = generateGuidedReply(text, newCount, mode, detectedCat || identifiedIssue);
      const stepOptions = getStepQuickReplies(newCount, mode);
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

  const getStepQuickReplies = (count: number, currentMode: 'stress' | 'sleep'): string[] => {
    if (currentMode === 'stress') {
      switch (count) {
        case 1:
          return ["It's been going on for months", "Started recently", "I feel completely overwhelmed", "It's affecting my sleep too"];
        case 2:
          return ["Yes, that's exactly it", "It's more complicated than that", "I just feel stuck", "I don't know where to start"];
        default:
          return ["Tell me more", "I want to try that", "I need professional help"];
      }
    } else {
      switch (count) {
        case 1:
          return ["Racing thoughts and worry", "My mind is quiet but I just can't sleep", "Both worry and physical restlessness", "I overthink everything at night"];
        case 2:
          return ["Exhausted all day but can't sleep at night", "Okay during the day actually", "Falling asleep at wrong times"];
        case 3:
          return ["Yes, I snore quite a lot", "My partner says I stop breathing", "No, I don't snore", "Not sure"];
        default:
          return ["Tell me more", "I want to try that", "I need professional help"];
      }
    }
  };

  const generateGuidedReply = (_text: string, count: number, currentMode: 'stress' | 'sleep', catKey: string): string => {
    if (currentMode === 'stress') {
      if (count === 1) {
        return `Thank you for sharing that with me. Understanding what is driving your stress is the first step toward relief.\n\nIs it the daily workload itself, or feeling unrecognised and unsupported that hurts the most?`;
      }
      return `Got it. Thank you for opening up. Based on what you shared, here are 4 specific lifestyle steps tailored for your ${catKey} stress.`;
    } else {
      if (count === 1) {
        return `Got it. Next, when you lie in bed and can't sleep, what is going through your mind — worries and racing thoughts, or is your mind fairly quiet?`;
      }
      if (count === 2) {
        return `Understood. How would you describe your daytime energy — do you feel exhausted but can't sleep at night, or do you feel reasonably okay during the day?`;
      }
      return `Thank you. Here are 4 targeted sleep changes based on your assessment.`;
    }
  };

  const getSpecialistCardData = (issueKey: string, currentMode: 'stress' | 'sleep') => {
    if (currentMode === 'sleep') {
      return {
        title: '💜 Specialist Sleep Assessment Recommended',
        body: 'Lifestyle changes are a vital foundation, but persistent sleep disruption benefits greatly from specialist evaluation.',
        primaryBtnLabel: 'Consult Sleep Specialist (Somnologist)',
        primaryReason: 'Sleep Specialist Consultation',
        secondaryBtnLabel: 'Consult Psychiatrist / Counsellor',
        secondaryReason: 'Mental Health Specialist Consultation'
      };
    }

    if (issueKey === 'hormonal') {
      return {
        title: '🩺 Gynaecologist Consultation Recommended',
        body: 'Hormonal fluctuations (PMS/PMDD or perimenopause) respond best to targeted medical & lifestyle protocols.',
        primaryBtnLabel: 'Consult Gynaecologist',
        primaryReason: 'Gynaecologist Consultation'
      };
    }
    if (issueKey === 'sexual') {
      return {
        title: '❤️ Sexual Health Specialist Recommended',
        body: 'Intimacy and sexual wellness are deeply tied to emotional and physiological balance. Dedicated guidance helps.',
        primaryBtnLabel: 'Consult Sexual Health Specialist',
        primaryReason: 'Sexual Health Specialist Consultation'
      };
    }
    return {
      title: '💜 Certified Counselor / Psychologist Recommended',
      body: 'Speaking with a trained mental health specialist provides a safe, confidential space to process deep stress and find clarity.',
      primaryBtnLabel: 'Book Mental Health Specialist',
      primaryReason: 'Mental Health Specialist Consultation'
    };
  };

  const triggerShortcutExercise = (exerciseType: 'breathing' | 'grounding' | 'worry_dump') => {
    setShowQuickShortcuts(false);
    
    let userTitle = '';
    let exerciseCardTitle = '';
    let exerciseCardText = '';
    let steps: string[] = [];

    if (exerciseType === 'breathing') {
      userTitle = "Guide me through 4-7-8 Breathing";
      exerciseCardTitle = "🫁 4-7-8 Deep Breathing Technique";
      exerciseCardText = "This proven parasympathetic breathing pattern lowers heart rate, eases anxiety, and preps your mind for rest.";
      steps = [
        "Inhale quietly through your nose for 4 seconds.",
        "Hold your breath gently for 7 seconds.",
        "Exhale completely through your mouth with a whoosh for 8 seconds.",
        "Repeat for 4 full cycles until your shoulders relax."
      ];
    } else if (exerciseType === 'grounding') {
      userTitle = "Start 5-4-3-2-1 Sensory Grounding";
      exerciseCardTitle = "🌿 5-4-3-2-1 Sensory Grounding Technique";
      exerciseCardText = "When your mind is racing or feeling overwhelmed, anchoring your 5 physical senses pulls you back into the present moment.";
      steps = [
        "👁️ 5 Things: Look around and name 5 distinct objects you can see.",
        "✋ 4 Things: Touch 4 different textures (clothing, desk, phone screen, floor).",
        "👂 3 Things: Listen closely and identify 3 subtle ambient sounds.",
        "👃 2 Things: Notice 2 smells around you (coffee, fresh air, perfume).",
        "👅 1 Thing: Focus on 1 taste in your mouth right now."
      ];
    } else {
      userTitle = "Guide me through a 10-Min Worry Dump";
      exerciseCardTitle = "📓 10-Minute Brain & Worry Dump";
      exerciseCardText = "Transferring racing thoughts from your head onto paper signals to your brain that your worries are documented and safe to set aside.";
      steps = [
        "Grab a pen & paper or open your notes app.",
        "Set a timer for 10 minutes.",
        "Write every thought, fear, task, or stressor continuously without editing.",
        "When 10 mins are up, close the notebook — give yourself permission to rest."
      ];
    }

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: userTitle };
    setMessages(prev => [
      ...prev,
      userMsg,
      {
        id: `ex-${Date.now()}`,
        role: 'ai',
        text: '',
        isLifestyleCard: true,
        lifestyleData: {
          title: exerciseCardTitle,
          intro: exerciseCardText,
          tips: steps,
          outro: "✨ Take a deep breath. Mia is here whenever you need another exercise."
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
              {msg.text && (
                <div 
                  className="space-y-1.5 [&_strong]:font-black [&_strong]:text-slate-900 dark:[&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              )}

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
                    <span>{t('followUpCheckInTitle')}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    I've saved your personalised 4-step plan. Please try these steps today and return tomorrow to check in with me. We'll decide your next steps together!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleSendMessage('I feel noticeably better')}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      I feel better!
                    </button>

                    <button
                      onClick={() => handleSendMessage('Still struggling / Feeling worse')}
                      className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      Still struggling
                    </button>
                  </div>
                </div>
              )}

              {/* Celebration / Progress Card */}
              {msg.isContinueCard && (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-center space-y-2 mt-2">
                  <h4 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-400">That's wonderful — you're making real progress!</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Keep going with your 4 lifestyle changes for the next <strong className="text-slate-900 dark:text-white font-black">2 full weeks</strong>. Small consistent steps create lasting change at the cellular level.<br /><br />
                    Come back anytime you need support. You are doing brilliantly! 💚
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
                  { label: "💼 Work-Life Stress", text: "I want help with Work & Career Stress" },
                  { label: "❤️ Relationship Conflict", text: "I want help with Relationship & Communication Stress" },
                  { label: "🌧️ Grief & Loss", text: "I am dealing with Grief and emotional loss" },
                  { label: "🌸 Hormonal Mood Shifts", text: "I feel stressed due to Hormonal shifts (PMS/Perimenopause)" },
                  { label: "🔥 Sexual Health & Intimacy", text: "I want guidance on Sexual health & Intimacy stress" },
                  { label: "🌙 Sleep & Insomnia", text: "I want to assess my Sleep and Insomnia" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowQuickShortcuts(false);
                      if (item.label.includes('Sleep')) {
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
