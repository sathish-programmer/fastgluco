import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Mic, Bot, User, Loader2, AlertCircle, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

interface TopicItem {
  _id?: string;
  title: string;
  category: string;
  suggestedPrompt: string;
  icon?: string;
}

interface AskMitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const DEFAULT_TOPIC_PROMPTS: TopicItem[] = [
  { title: 'CGM & Glucose Report Guide', category: 'CGM', suggestedPrompt: 'How do I read my CGM report?', icon: '📈' },
  { title: 'Anti-Cancer Nutrition & Cell Defence', category: 'Nutrition', suggestedPrompt: 'What foods help reduce cancer risk?', icon: '🧬' },
  { title: 'Circadian Fasting & Autophagy', category: 'Fasting', suggestedPrompt: 'What is circadian intermittent fasting?', icon: '⚡' },
  { title: 'Sleep & Mitochondrial Repair', category: 'Sleep', suggestedPrompt: 'How does sleep affect mitochondrial health?', icon: '💤' },
  { title: 'Physician Consultation Checklist', category: 'Doctor', suggestedPrompt: 'What questions should I ask my doctor?', icon: '🩺' },
  { title: 'Stress, Cortisol & Immune Health', category: 'Stress', suggestedPrompt: 'How does stress affect cellular health?', icon: '🫁' },
  { title: 'Environmental Toxin Defense', category: 'Environment', suggestedPrompt: 'How do environmental toxins affect cellular health?', icon: '🛡️' },
  { title: 'Mito_Reboot App Guidance', category: 'Features', suggestedPrompt: 'Help me understand Mito_Reboot features', icon: '💡' }
];

const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const cleanTitle = (rawTitle: string): string => {
  if (!rawTitle) return '';
  return rawTitle.replace(/^[\p{Emoji}\s]+/u, '').trim() || rawTitle;
};

export const AskMitoDrawer: React.FC<AskMitoDrawerProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [topics, setTopics] = useState<TopicItem[]>(DEFAULT_TOPIC_PROMPTS);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch dynamic Ask Mito topics from Backend MongoDB Knowledge Workflows
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch(`${apiUrl}/ask-mito/topics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setTopics(data);
          }
        }
      } catch (err) {
        console.warn('Using default topics fallback:', err);
      }
    };
    if (token) fetchTopics();
  }, [apiUrl, token]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm Mito 👋 Your AI Health & Clinical Companion. Ask me anything about cancer prevention, metabolic health, CGM data, lab reports, fasting, stress, or choose a topic below!",
        ts: ts()
      }]);
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      setIsListening(false);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);

    const userMsgText = text.trim();
    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', text: userMsgText, ts: ts() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: m.text
        }));

      const res = await fetch(`${apiUrl}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: userMsgText, history })
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: data.answer || "I'm Mito, your health companion. Ask me about CGM reports, anti-cancer foods, fasting, or physician checklists!",
        ts: ts()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please select a quick topic below or try your question again.",
        ts: ts()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const requestMicPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      console.warn('Microphone permission request error:', e);
    }
  };

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome or Safari.');
      return;
    }

    await requestMicPermission();

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let recognizedText = '';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      const combined = final || interim;
      if (combined) {
        recognizedText = combined;
        setInput(combined);
      }
    };

    rec.onerror = (err: any) => {
      console.warn('[AskMito] Speech recognition error:', err);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      const txt = recognizedText.trim();
      recognizedText = '';
      if (txt) {
        setInput('');
        sendMessage(txt);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        const old = recognitionRef.current;
        old.onstart = null; old.onresult = null; old.onerror = null; old.onend = null;
        old.stop();
        old.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Filter out system meta topics like 'General' and 'Support' (e.g. Welcome & Greeting, Help Overview)
  const userPriorityTopics = topics.filter(t => 
    t.category !== 'General' && 
    t.category !== 'Support' && 
    !t.title.toLowerCase().includes('welcome') && 
    !t.title.toLowerCase().includes('overview')
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl z-10 border-t border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
        style={{ height: '88dvh' }}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Ask Mito</span>
                <span className="flex items-center gap-1 text-[8px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">AI Health & Clinical Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTopicsMenu(!showTopicsMenu)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                showTopicsMenu 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Compass className="h-3 w-3" />
              <span>Topics</span>
            </button>
            <button 
              onClick={onClose} 
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
            >
              <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mx-4 mt-2.5 p-2 px-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[9.5px] text-blue-700 dark:text-blue-300 font-medium leading-tight">
            <strong>Educational Companion:</strong> Mito provides evidence-based metabolic health insights. It does not replace direct consultation with your healthcare provider.
          </p>
        </div>

        {/* Expandable Topics Menu Overlay */}
        <AnimatePresence>
          {showTopicsMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shrink-0 z-20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Quick Health Topics</span>
                <button onClick={() => setShowTopicsMenu(false)} className="text-[10px] text-blue-600 font-bold">Close</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {userPriorityTopics.map((tp, idx) => (
                  <button
                    key={tp._id || idx}
                    onClick={() => {
                      setShowTopicsMenu(false);
                      sendMessage(tp.suggestedPrompt);
                    }}
                    className="text-left p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{tp.icon || '💡'} {cleanTitle(tp.title)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/80 rounded-tl-xs shadow-xs'
                }`}>
                  {msg.text}
                  <div className={`text-[8.5px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-right text-blue-100' : 'text-slate-400'}`}>
                    {msg.ts}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-700 dark:text-slate-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-start">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mito is analyzing...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Listening Visualizer Banner */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-4 my-1.5 p-2.5 bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between shadow-xs shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-7 w-7 rounded-full bg-rose-500/30 animate-ping" />
                  <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xs z-10">
                    <Mic className="h-3.5 w-3.5 animate-bounce text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 leading-tight">Listening to your voice...</p>
                    <div className="flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_100ms]" style={{ height: '60%' }} />
                      <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_300ms]" style={{ height: '100%' }} />
                      <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_200ms]" style={{ height: '40%' }} />
                      <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_infinite_400ms]" style={{ height: '80%' }} />
                    </div>
                  </div>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">Speak your question clearly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[9.5px] font-bold rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-2xs hover:bg-rose-50 transition-all cursor-pointer"
              >
                Done Speaking
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ALWAYS-ACCESSIBLE QUICK TOPICS CHIPS BAR ABOVE INPUT */}
        <div className="px-4 py-1.5 shrink-0 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1">Topics:</span>
            {userPriorityTopics.map((p, idx) => (
              <button
                key={p._id || idx}
                onClick={() => sendMessage(p.suggestedPrompt)}
                disabled={loading}
                className="text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                {p.icon || '💡'} {cleanTitle(p.title)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-end gap-2">
            {/* MIC BUTTON: Un-slashed Mic with glowing red when listening; slate Mic when idle */}
            <button
              type="button"
              onClick={toggleListening}
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50 shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isListening ? 'Listening now... tap to stop' : 'Tap to speak your question'}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'animate-bounce text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening to your voice...' : 'Ask Mito anything about your health...'}
              rows={1}
              className={`flex-1 resize-none border rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all leading-relaxed ${
                isListening 
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400'
              }`}
              style={{ maxHeight: '96px' }}
            />

            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
