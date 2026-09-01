import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, HeartHandshake, Calendar, RefreshCw, LayoutGrid, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HabitsService } from '../services/habitsService';

interface DeStressAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onBookAppointment?: (reason: string) => void;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isSpecialistCard?: boolean;
  isRelaxCard?: boolean;
  category?: string;
}

const CATEGORIES = [
  { id: 'general', label: '💬 General', name: 'General Support' },
  { id: 'worklife', label: '💼 Work-Life Balance', name: 'Work-Life Balance' },
  { id: 'relationship', label: '💔 Relationship', name: 'Relationships' },
  { id: 'loss', label: '🕊️ Loss & Grief', name: 'Loss & Grief' },
  { id: 'hormonal', label: '🌙 Hormonal Mood', name: 'Hormonal Mood' },
  { id: 'sexual', label: '❤️ Sexual Health', name: 'Sexual Health' },
  { id: 'others', label: '🌀 Others', name: 'Other Concerns' },
];

const QUICK_REPLIES_MAP: Record<string, string[]> = {
  general:      ["I'm feeling overwhelmed","I'm sad but don't know why","I just need to talk","Work is getting to me","I feel empty"],
  worklife:     ["I work 12+ hours daily","I have no time for myself","I feel burnt out","My boss is the problem","I feel undervalued"],
  relationship: ["We keep fighting","I feel lonely in my relationship","I'm going through a breakup","Family conflict is draining me","I feel misunderstood"],
  loss:         ["I lost someone close recently","I'm still grieving an old loss","I don't know how to cope","I feel numb","I feel guilty"],
  hormonal:     ["PMS is affecting my mood","I think I'm perimenopausal","I feel irritable and can't control it","My sleep is disturbed","I cry without reason"],
  sexual:       ["I'm not satisfied in my relationship","I feel disconnected from my partner","I have concerns I'm embarrassed to share","I don't know who to talk to"],
  others:       ["Financial stress","Health anxiety","Loneliness","Fear about the future","I'm just exhausted"],
};

const RELAXATION_TECHNIQUES: Record<string, { icon: string; text: string }[]> = {
  worklife: [
    { icon: '🕐', text: '5-4-3-2-1 Grounding: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.' },
    { icon: '🌬️', text: 'Box breathing: Breathe in 4s, hold 4s, out 4s, hold 4s — repeat 4 times.' },
    { icon: '🚶', text: '10-Minute Reset Walk: Step outside for 10 minutes — even around your building.' },
    { icon: '📓', text: 'Control List: Write down 3 things that are in your control right now.' }
  ],
  relationship: [
    { icon: '💌', text: 'Unsent Letter: Write a letter to the person — you don\'t have to send it. Just get it out.' },
    { icon: '🧘', text: 'Body Scan Meditation: Lie down and slowly notice each part of your body.' },
    { icon: '🎵', text: 'Soul Music: Put on music that makes you feel understood.' },
    { icon: '🛁', text: 'Warm Bath: A warm bath or shower can physically lower cortisol levels.' }
  ],
  loss: [
    { icon: '🕯️', text: 'Memory Candle: Light a candle and sit with your memories for a few minutes — it\'s okay to cry.' },
    { icon: '🌿', text: 'Fresh Air: Step outside and breathe fresh air — grief is heavy; let your body move.' },
    { icon: '📖', text: 'Fond Memory: Write one memory of them that made you smile.' },
    { icon: '🤝', text: 'Shared Grief: Call one person who loved them too — shared grief is lighter grief.' }
  ],
  hormonal: [
    { icon: '🥗', text: 'Dietary Adjustment: Reduce sugar and caffeine in the 10 days before your period.' },
    { icon: '🏃', text: 'Gentle Exercise: Even 20 minutes of walking raises serotonin and progesterone.' },
    { icon: '🌙', text: 'Sleep Priority: Prioritise 8 hours of sleep — hormonal mood is worse with poor sleep.' },
    { icon: '🍫', text: 'Magnesium Relief: Dark chocolate (85%+) contains magnesium which reduces PMS symptoms.' }
  ],
  sexual: [
    { icon: '💆', text: 'Self-Compassion: Body image stress responds well to daily self-compassion journaling.' },
    { icon: '🛀', text: 'Self-Care Ritual: Create a self-care ritual that makes you feel comfortable in your body.' },
    { icon: '🗣️', text: 'Open Conversation: When you\'re ready, one honest conversation can change a relationship.' },
    { icon: '🧘', text: 'Mindfulness Practice: Mindfulness practices reduce performance anxiety significantly.' }
  ],
  general: [
    { icon: '🌬️', text: '4-7-8 Breathing: In for 4, hold 7, out for 8 — activates your parasympathetic nervous system.' },
    { icon: '🌿', text: 'Nature Break: Step outside for 10 minutes and look at something natural.' },
    { icon: '📓', text: 'Free Flow Writing: Write freely for 5 minutes — no editing, just pour it out.' },
    { icon: '🎵', text: 'Mood Music: Music that matches your mood first, then gradually shift to something calming.' }
  ],
  others: [
    { icon: '🌬️', text: 'Slow Breath: Slow your breath right now — 4 counts in, 6 counts out. Do this 5 times.' },
    { icon: '✍️', text: 'One Small Action: Write down the one thing worrying you most, then one small thing you can do.' },
    { icon: '🌿', text: 'Grounding: Walk barefoot on grass for 5 minutes — grounding reduces cortisol measurably.' },
    { icon: '📞', text: 'Safe Connection: Call someone who makes you feel safe — even just to hear their voice.' }
  ]
};

const STORAGE_KEY = (userId?: string) => `mito_destress_ai_${userId || 'guest'}`;

export const DeStressAIChatModal: React.FC<DeStressAIChatModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'general',
  onBookAppointment
}) => {
  const { apiUrl, token, user } = useAuth();

  const [activeCat, setActiveCat] = useState<string>(initialCategory);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [exchangeCount, setExchangeCount] = useState<number>(0);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showCategoryGrid, setShowCategoryGrid] = useState<boolean>(false);
  const [loggedCats, setLoggedCats] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEY(user?.id));
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          if (saved.messages && saved.messages.length > 0) {
            setMessages(saved.messages);
            setExchangeCount(saved.exchangeCount || 0);
            setQuickReplies(saved.quickReplies || []);
            setActiveCat(saved.activeCat || initialCategory);
            return;
          }
        }
      } catch (err) {
        console.error('Error loading saved destress chat session:', err);
      }
      startChatSession(initialCategory);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY(user?.id),
          JSON.stringify({ messages, exchangeCount, quickReplies, activeCat })
        );
      } catch (err) {}
    }
  }, [messages, exchangeCount, quickReplies, activeCat, user?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startChatSession = (catId: string) => {
    setExchangeCount(0);
    setQuickReplies(QUICK_REPLIES_MAP[catId] || QUICK_REPLIES_MAP.general);
    
    const categoryObj = CATEGORIES.find(c => c.id === catId);
    const greetingText = `Hello ${user?.name ? user.name.split(' ')[0] : ''} 👋 I am **Mia**, your AI wellness companion here at Mito Reboot Care.\n\nI'm here with you to focus on **${categoryObj?.name || 'how you are feeling'}**. Would you like to share what's been going on today?`;

    setMessages([
      {
        id: 'msg-init-mia',
        role: 'ai',
        text: greetingText,
        category: catId
      }
    ]);
  };

  const restartChatSession = (catId: string = activeCat) => {
    try {
      localStorage.removeItem(STORAGE_KEY(user?.id));
    } catch (e) {}
    setLoggedCats({});
    startChatSession(catId);
  };

  const handleCategorySwitch = (catId: string) => {
    setActiveCat(catId);
    setShowCategoryGrid(false);
    setExchangeCount(0);
    setQuickReplies(QUICK_REPLIES_MAP[catId] || QUICK_REPLIES_MAP.general);
    const categoryObj = CATEGORIES.find(c => c.id === catId);
    
    setMessages([
      {
        id: `msg-cat-${Date.now()}`,
        role: 'ai',
        text: `I'm here with you. I've switched to focus on **${categoryObj?.name}**. Would you like to share what's been going on?`,
        category: catId
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setQuickReplies([]);
    setIsTyping(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    // Save Habit log into DB ONCE per category session to avoid duplicates
    if (!loggedCats[activeCat] && token && apiUrl) {
      setLoggedCats(prev => ({ ...prev, [activeCat]: true }));
      try {
        const catObj = CATEGORIES.find(c => c.id === activeCat);
        HabitsService.logHabit(apiUrl, token, 'Stress', {
          faceId: 'stressed',
          label: catObj?.name || 'Stress Support',
          emoji: '😫',
          subOption: activeCat,
          option: text,
          source: 'ai_mia'
        }).catch(e => console.error('Error saving AI stress habit log:', e));
      } catch (e) {}
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
          category: activeCat,
          history: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.message;
      } else {
        replyText = generateMiaEmpatheticResponse(text, activeCat, newCount);
      }

      setIsTyping(false);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: replyText }]);

      // Trigger Relaxation Techniques Card after 3 exchanges
      if (newCount >= 3 && newCount % 3 === 0) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { id: `relax-${Date.now()}`, role: 'ai', text: '', isRelaxCard: true }
          ]);
        }, 500);
      }

      // Trigger Specialist Recommendation Card after 4+ exchanges
      if (newCount >= 4) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { id: `spec-${Date.now()}`, role: 'ai', text: '', isSpecialistCard: true }
          ]);
        }, 1000);
      }

      if (newCount === 1) {
        setQuickReplies(["Tell me more", "I've felt this way for a while", "It just started recently", "I don't know where to start"]);
      } else if (newCount === 2) {
        setQuickReplies(["Yes, that's exactly it", "Not quite — it's more like...", "I've tried but it doesn't help", "What should I do?"]);
      } else {
        setQuickReplies(["I want to try that", "Can you suggest more?", "I think I need professional help", "I feel a little better now"]);
      }

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallbackMsg = generateMiaEmpatheticResponse(text, activeCat, newCount);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: fallbackMsg }]);
    }
  };

  const generateMiaEmpatheticResponse = (userText: string, cat: string, _count: number): string => {
    const lower = userText.toLowerCase();
    
    if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('counselor') || lower.includes('help')) {
      return `What you're feeling matters deeply. Sometimes talking to a trained professional makes all the difference — it's a sign of strength, not weakness. You can connect with our Mito Reboot specialists right below.`;
    }

    if (cat === 'worklife') {
      return `Work demands can feel overwhelming when personal boundaries blur. Take a slow breath. Have you been able to set a shutdown ritual or take micro-breaks for yourself today?`;
    } else if (cat === 'relationship') {
      return `Relationship stress weighs heavily on the heart. Your feelings are completely valid. Focusing on clear, calm expression and giving yourself space can bring comfort.`;
    } else if (cat === 'loss') {
      return `Grief is love with nowhere to go. I am holding space for you. Please take this one hour at a time and allow yourself to rest.`;
    } else if (cat === 'hormonal') {
      return `Hormonal mood shifts are real, physiological experiences. Be deeply compassionate with your body today — rest, hydration, and gentle movement can soothe your nervous system.`;
    } else if (cat === 'sexual') {
      return `These are deeply personal concerns. Know that your privacy and dignity are completely respected here. Self-compassion practices and open communication can ease performance stress.`;
    }

    return `I am here with you. Please take a slow deep breath — in for 4 counts, hold for 4, out for 6. You are not alone. What else is on your mind?`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden font-sans transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
      
      {/* Top Header - Full Width Clean Alignment */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
            🤍
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                Mia
              </h3>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60 uppercase tracking-wider">
                Mito Reboot Care
              </span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>AI Wellness Companion · Always Here</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={() => restartChatSession(activeCat)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Restart Conversation"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close Chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category Strip below Header */}
      <div className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 sm:px-6 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 relative">
        <button
          onClick={() => setShowCategoryGrid(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1.5 shrink-0 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-all cursor-pointer shadow-2xs"
          title="View All Topics Grid"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>All Topics</span>
        </button>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategorySwitch(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCat === cat.id
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-750'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* All Topics Modal Grid Overlay */}
      {showCategoryGrid && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Choose a Wellness Topic</h4>
              </div>
              <button
                onClick={() => setShowCategoryGrid(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySwitch(cat.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    activeCat === cat.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-extrabold shadow-2xs'
                      : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xs font-bold">{cat.label}</span>
                  {activeCat === cat.id && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Container - Expanded Full Screen */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/50 scrollbar-thin">
        {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs text-white shrink-0 mt-1 shadow-xs">
                  🤍
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white font-medium rounded-tr-xs shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs'
              }`}>
                {msg.text && (
                  <div 
                    className="space-y-1 [&_strong]:font-extrabold [&_strong]:text-indigo-950 dark:[&_strong]:text-indigo-300"
                    dangerouslySetInnerHTML={{
                      __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
                    }}
                  />
                )}

                {/* Relaxation Techniques Card */}
                {msg.isRelaxCard && (
                  <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-3.5 space-y-2 text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800 dark:text-emerald-300">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span>🌿 Things that can help right now</span>
                    </div>
                    <div className="space-y-2 text-[11px] font-semibold pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      {(RELAXATION_TECHNIQUES[activeCat] || RELAXATION_TECHNIQUES.general).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="shrink-0">{item.icon}</span>
                          <span className="leading-snug">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialist Recommendation Card */}
                {msg.isSpecialistCard && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200">💜 You deserve professional support</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                      What you are feeling matters deeply. Speaking with a certified mental health specialist or counselor can provide personalized guidance.
                    </p>

                    <button
                      onClick={() => {
                        onClose();
                        onBookAppointment?.('Mental Health Specialist / De-Stress Counseling');
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book Mental Health Specialist →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs text-white shrink-0 shadow-xs">
                🤍
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

        {/* Quick Replies Strip */}
        {quickReplies.length > 0 && (
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qr)}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0"
              >
                {qr}
              </button>
            ))}
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
            <input
              type="text"
              placeholder="Share what's on your mind..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />

            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2 font-semibold">
            Mito AI provides emotional wellness support. For medical emergencies, contact emergency services or your doctor.
          </p>
        </div>
    </div>
  );
};
