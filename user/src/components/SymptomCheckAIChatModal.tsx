import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Stethoscope, Calendar, ExternalLink, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { RoboAvatar } from './RoboAvatar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SYMPTOM_QUESTIONS, SPECIALIST_MAP, getStoredSymptomCheckins, reconstructAnswers } from '../screens/HabitScreens/SymptomCheckinScreen';
import { HCG_HOSPITALS_URL } from '../screens/HabitScreens/CancerScreeningScreen';
import { speakText, stopSpeaking } from '../utils/ttsHelper';

interface SymptomCheckAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  answers?: Record<string, 'yes' | 'no' | 'na'>;
  latestScore?: number;
  onBookAppointment?: (reason?: string) => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  options?: string[];
  showActions?: boolean;
}

const formatMessageText = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\n/g, '<br />');
};

export const SymptomCheckAIChatModal: React.FC<SymptomCheckAIChatModalProps> = ({
  isOpen,
  onClose,
  answers,
  latestScore,
  onBookAppointment
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Helper to get freshest answers and score
  const getFreshestData = () => {
    const storedCheckins = getStoredSymptomCheckins();
    const latestCheckin = storedCheckins.length > 0 ? storedCheckins[storedCheckins.length - 1] : null;
    const resolvedAnswers = (answers && Object.keys(answers).length > 0)
      ? answers
      : (latestCheckin ? reconstructAnswers(latestCheckin) : {});

    const yesQuestions = SYMPTOM_QUESTIONS.filter(q => resolvedAnswers[q.id] === 'yes');
    const effectiveScore = latestScore !== undefined
      ? latestScore
      : (latestCheckin ? latestCheckin.score : yesQuestions.length);

    return { resolvedAnswers, yesQuestions, effectiveScore, hasStored: !!latestCheckin || Object.keys(resolvedAnswers).length > 0 };
  };

  const { effectiveScore: score } = getFreshestData();

  const handleSpeak = (msgId: string, textToSpeak: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }
    stopSpeaking();
    setSpeakingMsgId(msgId);
    speakText({
      text: textToSpeak.replace(/\*\*/g, '').replace(/•/g, '').trim(),
      language,
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null)
    });
  };

  const handleConsultSpecialist = async () => {
    try {
      await Browser.open({ url: HCG_HOSPITALS_URL });
    } catch {
      window.open(HCG_HOSPITALS_URL, '_blank', 'noopener,noreferrer');
    }
  };

  // Build initial greeting
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    const { resolvedAnswers, yesQuestions, effectiveScore, hasStored } = getFreshestData();

    let initialText = '';
    const initialOptions = [
      t('symptomCheck.aiQWhy3Weeks', 'Why is 3 weeks the critical timeline?'),
      t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?'),
      t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?'),
      t('symptomCheck.aiQReviewMine', 'Review my logged symptoms with me')
    ];

    const userName = user?.name ? user.name : '';

    if (effectiveScore > 0) {
      const symptomNames = yesQuestions.slice(0, 3).map(q => t(`symptomCheck.q_${q.id}_title`, q.t)).join(', ');
      initialText = t(
        'symptomCheck.aiGreetingYes',
        { name: userName, score: effectiveScore, symptoms: symptomNames }
      );
    } else if (hasStored && Object.keys(resolvedAnswers).length > 0) {
      initialText = t(
        'symptomCheck.aiGreetingClear',
        { name: userName }
      );
    } else {
      initialText = t(
        'symptomCheck.aiGreetingFresh',
        { name: userName }
      );
    }

    setMessages([
      {
        id: 'msg-init-1',
        role: 'ai',
        text: initialText,
        options: initialOptions,
        showActions: effectiveScore > 0
      }
    ]);
  }, [isOpen, language, answers, latestScore]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAIResponse = (userQuestion: string): { reply: string; showActions: boolean; options?: string[] } => {
    const { yesQuestions: currentYesQuestions, effectiveScore } = getFreshestData();
    const qLower = userQuestion.toLowerCase().trim();

    // 1. Why 3 weeks?
    const optWhy = t('symptomCheck.aiQWhy3Weeks', 'Why is 3 weeks the critical timeline?').toLowerCase();
    if (
      userQuestion.trim() === t('symptomCheck.aiQWhy3Weeks') ||
      qLower === optWhy ||
      qLower.includes('3 week') ||
      qLower.includes('why') ||
      qLower.includes('timeline') ||
      qLower.includes('காலம்') ||
      qLower.includes('3 வாரம்') ||
      qLower.includes('3 வாரங்கள்') ||
      qLower.includes('3 सप्ताह') ||
      qLower.includes('3 ವಾರ') ||
      qLower.includes('3 వారాలు') ||
      qLower.includes('ஏன்') ||
      qLower.includes('क्यों') ||
      qLower.includes('ಏಕೆ') ||
      qLower.includes('ఎందుకు')
    ) {
      return {
        reply: t('symptomCheck.aiAnsWhy3Weeks'),
        showActions: effectiveScore > 0,
        options: [
          t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?'),
          t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?')
        ]
      };
    }

    // 2. Which specialist?
    const optSpec = t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?').toLowerCase();
    if (
      userQuestion.trim() === t('symptomCheck.aiQWhichSpec') ||
      qLower === optSpec ||
      qLower.includes('specialist') ||
      qLower.includes('doctor') ||
      qLower.includes('மருத்துவர்') ||
      qLower.includes('நிபுணர்') ||
      qLower.includes('डॉक्टर') ||
      qLower.includes('विशेषज्ञ') ||
      qLower.includes('ತಜ್ಞ') ||
      qLower.includes('ವೈದ್ಯ') ||
      qLower.includes('నిపుణు') ||
      qLower.includes('వైద్యు')
    ) {
      if (currentYesQuestions.length > 0) {
        const specs = currentYesQuestions
          .map(q => `• **${t(`symptomCheck.q_${q.id}_title`, q.t)}** → ${t(`symptomCheck.spec_${q.id}`, SPECIALIST_MAP[q.id] || 'Specialist')}`)
          .join('\n');
        return {
          reply: t('symptomCheck.aiAnsSpecList', { list: specs }),
          showActions: true,
          options: [
            t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?'),
            t('symptomCheck.aiQWhy3Weeks', 'Why is 3 weeks the critical timeline?')
          ]
        };
      }
      return {
        reply: t('symptomCheck.aiAnsSpecGeneral'),
        showActions: true
      };
    }

    // 3. Review my logged symptoms
    const optReview = t('symptomCheck.aiQReviewMine', 'Review my logged symptoms with me').toLowerCase();
    if (
      userQuestion.trim() === t('symptomCheck.aiQReviewMine') ||
      qLower === optReview ||
      qLower.includes('review') ||
      qLower.includes('logged') ||
      qLower.includes('my symptom') ||
      qLower.includes('என்') ||
      qLower.includes('மதிப்பாய்வு') ||
      qLower.includes('பதிவு') ||
      qLower.includes('समीक्षा') ||
      qLower.includes('ದಾಖಲಾದ') ||
      qLower.includes('ಸಮೀಕ್ಷೆ') ||
      qLower.includes('సమీక్ష')
    ) {
      if (currentYesQuestions.length === 0) {
        return {
          reply: t('symptomCheck.aiAnsNoSymptomsLogged'),
          showActions: false
        };
      }
      const list = currentYesQuestions
        .map((q, i) => `${i + 1}. **${t(`symptomCheck.q_${q.id}_title`, q.t)}**\n   ${t(`symptomCheck.q_${q.id}_desc`, q.h)}${q.red === 1 ? ` — *(⚠️ ${t('symptomCheck.priorityReview', 'Priority Review')})*` : ''}`)
        .join('\n\n');
      return {
        reply: t('symptomCheck.aiAnsReviewList', { score: effectiveScore, list }),
        showActions: true,
        options: [
          t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?'),
          t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?')
        ]
      };
    }

    // 4. What to tell doctor?
    const optTell = t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?').toLowerCase();
    if (
      userQuestion.trim() === t('symptomCheck.aiQWhatToTell') ||
      qLower === optTell ||
      qLower.includes('tell') ||
      qLower.includes('prepare') ||
      qLower.includes('visit') ||
      qLower.includes('சொல்ல') ||
      qLower.includes('கேட்க') ||
      qLower.includes('बताएं') ||
      qLower.includes('ಹೇಳಬೇಕು') ||
      qLower.includes('చెప్పాలి')
    ) {
      return {
        reply: t('symptomCheck.aiAnsWhatToTell'),
        showActions: true,
        options: [
          t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?'),
          t('symptomCheck.aiQWhy3Weeks', 'Why is 3 weeks the critical timeline?')
        ]
      };
    }

    // Default medical AI screening response
    return {
      reply: t('symptomCheck.aiAnsDefault'),
      showActions: effectiveScore > 0,
      options: [
        t('symptomCheck.aiQWhy3Weeks', 'Why is 3 weeks the critical timeline?'),
        t('symptomCheck.aiQWhichSpec', 'Which specialist should I consult?'),
        t('symptomCheck.aiQWhatToTell', 'What should I tell my doctor?')
      ]
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const { reply, showActions, options } = generateAIResponse(text);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: reply,
        showActions,
        options
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-slate-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[92vh] sm:h-[680px] max-h-[100dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* THEME-ADAPTIVE MODERN HEADER */}
        <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 pt-3 pb-3 sm:px-5 sm:py-3.5 border-b border-slate-200/90 dark:border-slate-800 shrink-0 transition-colors">
          {/* Mobile top pull indicator (inside header, seamless) */}
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            {/* Left: Avatar + Title & Status */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/60 flex items-center justify-center p-1 shadow-2xs">
                  <RoboAvatar size={34} isSpeaking={!!speakingMsgId} />
                </div>
                {/* Active live indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                  {t('symptomCheck.aiModalTitle', 'Symptom Screening AI Specialist')}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  {score > 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/90 dark:border-rose-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                      <span>{t('symptomCheck.reportedCount', { count: score })}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{t('symptomCheck.allClearNoSymptoms', 'All Clear · 0 Symptoms')}</span>
                    </span>
                  )}
                  <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[10.5px] truncate">
                    {t('symptomCheck.tagline', 'Early Warning')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Sleek Minimal Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer shrink-0 shadow-2xs"
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div
                  className="space-y-1.5 leading-relaxed text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{
                    __html: formatMessageText(msg.text)
                  }}
                />

                {/* AI Voice Readout */}
                {msg.role === 'ai' && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px] font-medium">Mito Clinical Assistant</span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold cursor-pointer"
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* In-Chat Specialist Actions Card */}
              {msg.showActions && (
                <div className="w-[88%] sm:w-[82%] mt-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 text-xs font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{t('symptomCheck.yesWarning', 'If Yes to any symptom, consult a specialist for thorough evaluation.')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleConsultSpecialist}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{t('symptomCheck.consultSpecialist', 'Consult Specialist (HCG Virtual)')}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </button>
                    {onBookAppointment && (
                      <button
                        onClick={() => {
                          onClose();
                          onBookAppointment('symptom_checkin');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('symptomCheck.bookApptInApp', 'Book In App')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Prompt Pills */}
              {msg.options && msg.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleSendMessage(opt)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{t('symptomCheck.aiThinking', 'Analyzing clinical warning criteria...')}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 pb-[calc(env(safe-area-inset-bottom,8px)+12px)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('symptomCheck.aiInputPlaceholder', 'Ask anything about these 11 symptoms or specialists...')}
              className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-11 w-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            {t('symptomCheck.aiDisclaimer', 'AI guide for early detection education · In case of medical emergency, seek urgent care.')}
          </p>
        </div>
      </div>
    </div>
  );
};
