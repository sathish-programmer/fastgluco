import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShoppingBag, Calendar, RefreshCw, FileText, CheckCircle2, Zap, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HabitsService } from '../services/habitsService';
import { normalizeLang } from '../data/miaData';
import {
  GIA_SHORTCUT_GUIDES,
  getGuidedQuickRepliesFallback,
  getGuidedOncogeneticReplyFallback
} from '../data/giaData';
import { speakText, stopSpeaking } from '../utils/ttsHelper';

interface GeneticRiskAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToShop?: (query: string) => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isAssessment?: boolean;
  options?: string[];
}

const GIA_STORAGE_KEY = (userId?: string, lang: string = 'en') => `mito_gia_ai_${userId || 'guest'}_${lang}`;

export const GeneticRiskAIChatModal: React.FC<GeneticRiskAIChatModalProps> = ({
  isOpen,
  onClose,
  onBookAppointment,
  onNavigateToShop
}) => {
  const { apiUrl, token, user } = useAuth();
  const { t, language } = useLanguage();
  const curLang = normalizeLang(language);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [exchangeCount, setExchangeCount] = useState<number>(0);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showQuickShortcuts, setShowQuickShortcuts] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [collectedData, setCollectedData] = useState<{
    status?: string;
    cancers?: string[];
    age?: string;
    relatives?: string[];
    ancestry?: string;
  }>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  const triggerShortcutGuide = (guideType: 'brca' | 'lynch' | 'family_tree') => {
    setShowQuickShortcuts(false);
    const guide = GIA_SHORTCUT_GUIDES[curLang]?.[guideType] || GIA_SHORTCUT_GUIDES.en[guideType];

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: guide.userTitle };
    setMessages(prev => [
      ...prev,
      userMsg,
      {
        id: `guide-${Date.now()}`,
        role: 'ai',
        text: `### ${guide.cardTitle}\n\n${guide.introText}\n\n` + guide.tipsList.map(t => `• ${t}`).join('\n') + `\n\n💡 *${t('gia.askFollowupOrBook', 'Ask Gia any follow-up question or book a counselor below for professional panel ordering.')}*`
      }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      try {
        const savedRaw = localStorage.getItem(GIA_STORAGE_KEY(user?.id, curLang)) || localStorage.getItem(`mito_gene_ai_${user?.id || 'guest'}_${curLang}`);
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          if (saved.messages && saved.messages.length > 0) {
            const firstMsgText = saved.messages[0]?.text || '';
            if (!firstMsgText.includes('Gene')) {
              setMessages(saved.messages);
              setExchangeCount(saved.exchangeCount || 0);
              setQuickReplies(saved.quickReplies || []);
              setCollectedData(saved.collectedData || {});
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error loading saved Gia chat session:', err);
      }
      startChatSession();
    } else {
      stopSpeaking();
      setSpeakingMsgId(null);
    }
  }, [isOpen, curLang]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          GIA_STORAGE_KEY(user?.id, curLang),
          JSON.stringify({ messages, exchangeCount, quickReplies, collectedData })
        );
      } catch (err) {}
    }
  }, [messages, exchangeCount, quickReplies, collectedData, user?.id, curLang]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startChatSession = () => {
    setExchangeCount(0);
    setCollectedData({});
    stopSpeaking();
    setSpeakingMsgId(null);

    try {
      localStorage.removeItem(`mito_gene_ai_${user?.id || 'guest'}_${curLang}`);
    } catch (e) {}

    const userName = user?.name ? user.name.split(' ')[0] : (curLang === 'ta' ? 'அன்பரே' : curLang === 'te' ? 'మిత్రమా' : curLang === 'kn' ? 'ಸ್ನೇಹಿತರೆ' : curLang === 'hi' ? 'साथी' : 'there');
    const rawGreeting = t('gia.greeting', `Hello {name}, I am **Gia** — your genetic AI counselor at MitoReboot Care.\n\nRoughly **10% of cancers** have an underlying hereditary genetic component. Based on **NCCN v2.2025** and **ASCO 2024 guidelines**, I can help evaluate whether germline genetic testing is recommended for you or your family.\n\nTo begin — are you here because of a **personal cancer diagnosis**, a **family history of cancer**, or **both**?`);
    const greeting = rawGreeting.replace(/\{name\}/g, userName);

    const initialOptions = [
      t('gia.optPersonal', 'Personal cancer diagnosis'),
      t('gia.optFamily', 'Family history only'),
      t('gia.optBoth', 'Both — personal + family history'),
      t('gia.optCancerFree', 'Cancer-free but want to assess risk')
    ];

    setMessages([
      {
        id: 'msg-init-gia',
        role: 'ai',
        text: greeting,
        options: initialOptions
      }
    ]);

    setQuickReplies(initialOptions);
  };

  const restartChatSession = () => {
    try {
      localStorage.removeItem(GIA_STORAGE_KEY(user?.id, curLang));
      localStorage.removeItem(`mito_gene_ai_${user?.id || 'guest'}_${curLang}`);
    } catch (e) {}
    startChatSession();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setQuickReplies([]);
    setShowQuickShortcuts(false);
    setIsTyping(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    // Update collected history keywords
    const updatedData = { ...collectedData };
    const lower = text.toLowerCase();
    if (lower.includes('personal') || lower.includes('family')) updatedData.status = text;
    if (lower.includes('breast') || lower.includes('ovarian') || lower.includes('colon') || lower.includes('prostate') || lower.includes('pancreatic')) {
      updatedData.cancers = [...(updatedData.cancers || []), text];
    }
    setCollectedData(updatedData);

    // Save Habit log into DB ONCE per assessment session so damage calculation is recorded
    if (!collectedData.status && token && apiUrl) {
      try {
        const lowerText = text.toLowerCase();
        const hasGeneticLink = lowerText.includes('personal') || lowerText.includes('family') || lowerText.includes('both') || lowerText.includes('breast') || lowerText.includes('ovarian') || lowerText.includes('colorectal') || lowerText.includes('cancer');
        
        HabitsService.logHabit(apiUrl, token, 'Genetic', {
          geneticLink: hasGeneticLink,
          choice: text,
          source: 'ai_gia'
        }).catch(e => console.error('Error saving AI genetic habit log:', e));
      } catch (e) {}
    }

    try {
      const res = await fetch(`${apiUrl}/ai/genetic-risk-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          language: curLang,
          exchangeCount: newCount,
          history: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });

      let replyText = '';
      let responseOptions: string[] | undefined = undefined;

      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.message;
        if (Array.isArray(data.options) && data.options.length > 0) {
          responseOptions = data.options;
        }
      } else {
        replyText = getGuidedOncogeneticReplyFallback(newCount, curLang);
        responseOptions = getGuidedQuickRepliesFallback(newCount, curLang);
      }

      setIsTyping(false);
      const isFinal = newCount >= 5 || replyText.includes('RECOMMENDED') || replyText.includes('indicated') || replyText.includes('Gene Panel') || replyText.includes('பரிந்துரைக்கப்படுகிறது') || replyText.includes('ಶಿಫಾರಸು') || replyText.includes('सिफारिश') || replyText.includes('సిఫార్సు');

      const optionsForStep = !isFinal ? (responseOptions || getGuidedQuickRepliesFallback(newCount, curLang)) : undefined;

      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', text: replyText, isAssessment: isFinal, options: optionsForStep }
      ]);

      if (!isFinal && optionsForStep) {
        setQuickReplies(optionsForStep);
      }

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallbackReply = getGuidedOncogeneticReplyFallback(newCount, curLang);
      const isFinal = newCount >= 5;
      const optionsForStep = !isFinal ? getGuidedQuickRepliesFallback(newCount, curLang) : undefined;

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: fallbackReply, isAssessment: isFinal, options: optionsForStep }]);
      if (!isFinal && optionsForStep) setQuickReplies(optionsForStep);
    }
  };

  if (!isOpen) return null;

  // Identify ID of the latest AI message in the conversation
  const aiMessages = messages.filter(m => m.role === 'ai');
  const latestAiMsgId = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].id : null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden font-sans transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
      
      {/* Top Header - Full Width Clean Notch-Capable Alignment */}
      <div 
        className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
            🧬
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                Gia
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60 uppercase tracking-wider">
                {t('gia.geneticAiCounselor', 'Genetic AI Counselor')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>{t('gia.guidelinesAdherence', 'NCCN v2.2025 & ASCO 2024 Guidelines')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={restartChatSession}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title={t('gia.restartAssessment', 'Restart')}
          >
            <RefreshCw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">{t('gia.restartAssessment', 'Restart')}</span>
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

      {/* Guidelines Strip */}
      <div className="bg-purple-50/60 dark:bg-purple-950/30 border-b border-purple-100/60 dark:border-purple-900/40 px-4 py-2 sm:px-6 flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200 shrink-0">
        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        <span className="truncate">{t('gia.guidelines', 'Guidelines: NCCN v2.2025 · ASCO 2024 · SEOM Oncogenetics')}</span>
      </div>

      {/* Message Container - Full Screen */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/50 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-600 flex items-center justify-center text-xs text-white shrink-0 mt-1 shadow-xs border border-purple-400/30">
                🧬
              </div>
            )}

            <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white font-medium rounded-tr-xs shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
            }`}>
              <div className="flex items-start justify-between gap-2">
                {msg.text && (
                  <div 
                    className="space-y-1.5 flex-1 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-purple-700 dark:[&_h3]:text-purple-300 [&_strong]:font-black [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                )}
                {msg.role === 'ai' && msg.text && (
                  <button
                    onClick={() => handleSpeak(msg.id, msg.text)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer shrink-0 mt-0.5"
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

              {/* Inline Option Buttons Directly Below Question */}
              {msg.role === 'ai' && (() => {
                const isLatestAi = msg.id === latestAiMsgId;
                const optionsToDisplay = (msg.options && msg.options.length > 0)
                  ? msg.options
                  : (isLatestAi && quickReplies && quickReplies.length > 0 ? quickReplies : undefined);

                if (!optionsToDisplay || optionsToDisplay.length === 0) return null;

                return (
                  <div className="mt-3.5 pt-3 border-t border-purple-100 dark:border-purple-900/40 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      ⚡ {t('gia.selectOptionToReply', 'SELECT AN OPTION TO REPLY:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {optionsToDisplay.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          disabled={!isLatestAi || isTyping}
                          onClick={() => handleSendMessage(opt)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border text-center active:scale-95 ${
                            isLatestAi && !isTyping
                              ? 'bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80 shadow-2xs cursor-pointer'
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

              {/* Structured Next Steps Actions Card */}
              {msg.isAssessment && (
                <div className="mt-3.5 pt-3 border-t border-purple-100 dark:border-purple-900/40 space-y-3">
                  <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>{t('recommendedNextSteps')}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                      {t('gia.assessmentNextStepsDesc', "A genetic counselor will review your full pedigree, order the precise multi-gene panel, and interpret findings for your family's prevention plan.")}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          onClose();
                          onBookAppointment?.('Genetic Counselor Consultation');
                        }}
                        className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5" /> {t('bookGeneticCounselor')}
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToShop?.('Genetic');
                        }}
                        className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> {t('browseGeneTestingKits')}
                      </button>
                    </div>
                  </div>

                  {/* Preparation Checklist */}
                  <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3 text-[11px] space-y-1.5 text-amber-900 dark:text-amber-200">
                    <span className="font-extrabold block text-amber-800 dark:text-amber-300">
                      {t('gia.whatToPrepare', '💡 What to prepare for your consultation:')}
                    </span>
                    <ul className="list-disc pl-4 space-y-1 font-semibold opacity-90">
                      <li>{t('nextStepsItem1')}</li>
                      <li>{t('nextStepsItem2')}</li>
                      <li>{t('nextStepsItem3')}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-600 flex items-center justify-center text-xs text-white shrink-0 shadow-xs border border-purple-400/30">
              🧬
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></span>
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
              <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t('gia.quickToolsTitle', "Gia's Genetic Counseling Quick Tools")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickShortcuts(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              {t('common.close')}
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Section 1: Hereditary Risk Checkers */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1.5">
                {t('gia.highRiskSyndromeGuides', '🧬 High-Risk Syndrome Guides')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => triggerShortcutGuide('brca')}
                  className="p-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1">
                    <span>{t('promptBrcaRisk')}</span>
                  </div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium mt-0.5">
                    {t('gia.brcaDesc', 'Hereditary breast & ovarian cancer red flags')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerShortcutGuide('lynch')}
                  className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                    <span>{t('promptLynchCheck')}</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium mt-0.5">
                    {t('gia.lynchDesc', 'Colorectal & uterine hereditary risk factors')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => triggerShortcutGuide('family_tree')}
                  className="p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    <span>{t('prompt3GenPedigree')}</span>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                    {t('gia.pedigreeDesc', 'How to prepare family medical history tree')}
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Fast Topic Jumps */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1.5">
                {t('gia.jumpToQuestion', '⚡ Jump to Specific Genetic Question')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: `🧬 ${t('gia.jumpPanelTest', 'What panel test do I need?')}`, text: t('gia.jumpPanelTestPrompt', 'Which multi-gene panel testing should I consider based on my family tree?') },
                  { label: `🛡️ ${t('gia.jumpGinaProtection', 'Genetic Discrimination Protection (GINA)')}`, text: t('gia.jumpGinaProtectionPrompt', 'Explain genetic discrimination protection laws and health insurance implications.') },
                  { label: `🧪 ${t('gia.jumpDtcVsClinical', 'Direct-to-Consumer vs Clinical Gene Testing')}`, text: t('gia.jumpDtcVsClinicalPrompt', 'What is the difference between 23andMe DTC tests and clinical diagnostic germline testing?') },
                  { label: `🩺 ${t('gia.jumpVariantMeaning', 'Pathogenic Variant Meaning')}`, text: t('gia.jumpVariantMeaningPrompt', 'What is a Variant of Uncertain Significance (VUS) vs Pathogenic Mutation?') }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowQuickShortcuts(false);
                      handleSendMessage(item.text);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Direct Specialist & Shop Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setShowQuickShortcuts(false);
                  onClose();
                  onBookAppointment?.('Genetic Counselor Consultation');
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('bookGeneticCounselor')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickShortcuts(false);
                  onClose();
                  onNavigateToShop?.('Genetic');
                }}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{t('browseGeneTestingKits')}</span>
              </button>
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
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 font-black'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-bold'
            }`}
            title={t('gia.shortcuts', 'Shortcuts')}
          >
            <Zap className={`h-4 w-4 ${showQuickShortcuts ? 'fill-current text-amber-300 animate-pulse' : 'text-purple-600 dark:text-purple-400'}`} />
            <span className="text-[11px]">{t('gia.shortcuts', 'Shortcuts')}</span>
          </button>

          {/* Text Input with Left Sparkles Icon */}
          <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-within:border-purple-500 dark:focus-within:border-purple-500 rounded-2xl transition-colors min-w-0">
            <Sparkles className="h-4 w-4 text-purple-500 ml-3 shrink-0" />
            <input
              type="text"
              placeholder={t('gia.inputPlaceholder', "Ask Gia about cancer genes, guidelines, or risk...")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 min-w-0 bg-transparent border-none px-2.5 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isTyping || !inputText.trim()}
            className="w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2 font-semibold">
          {t('gia.disclaimer', 'Gia is an AI educational counselor — not a substitute for clinical genetics consultation.')}
        </p>
      </div>
    </div>
  );
};
