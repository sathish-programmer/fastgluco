import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShoppingBag, Calendar, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HabitsService } from '../services/habitsService';

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
}

const GENE_STORAGE_KEY = (userId?: string) => `mito_gene_ai_${userId || 'guest'}`;

export const GeneticRiskAIChatModal: React.FC<GeneticRiskAIChatModalProps> = ({
  isOpen,
  onClose,
  onBookAppointment,
  onNavigateToShop
}) => {
  const { apiUrl, token, user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [exchangeCount, setExchangeCount] = useState<number>(0);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [collectedData, setCollectedData] = useState<{
    status?: string;
    cancers?: string[];
    age?: string;
    relatives?: string[];
    ancestry?: string;
  }>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedRaw = localStorage.getItem(GENE_STORAGE_KEY(user?.id));
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          if (saved.messages && saved.messages.length > 0) {
            setMessages(saved.messages);
            setExchangeCount(saved.exchangeCount || 0);
            setQuickReplies(saved.quickReplies || []);
            setCollectedData(saved.collectedData || {});
            return;
          }
        }
      } catch (err) {
        console.error('Error loading saved gene chat session:', err);
      }
      startChatSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          GENE_STORAGE_KEY(user?.id),
          JSON.stringify({ messages, exchangeCount, quickReplies, collectedData })
        );
      } catch (err) {}
    }
  }, [messages, exchangeCount, quickReplies, collectedData, user?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startChatSession = () => {
    setExchangeCount(0);
    setCollectedData({});

    const greeting = `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}, I am **Gene** — your oncogenetics risk advisor at MitoReboot Care.\n\nRoughly **10% of cancers** have an underlying hereditary genetic component. Based on **NCCN v2.2025** and **ASCO 2024 guidelines**, I can help evaluate whether germline genetic testing is recommended for you or your family.\n\nTo begin — are you here because of a **personal cancer diagnosis**, a **family history of cancer**, or **both**?`;

    setMessages([
      {
        id: 'msg-init-gene',
        role: 'ai',
        text: greeting
      }
    ]);

    setQuickReplies([
      'Personal cancer diagnosis',
      'Family history only',
      'Both — personal + family history',
      'Cancer-free but want to assess risk'
    ]);
  };

  const restartChatSession = () => {
    try {
      localStorage.removeItem(GENE_STORAGE_KEY(user?.id));
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
          source: 'ai_gene'
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
          exchangeCount: newCount,
          history: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.message;
      } else {
        replyText = generateGuidedOncogeneticReply(text, newCount);
      }

      setIsTyping(false);
      const isFinal = newCount >= 5 || replyText.includes('RECOMMENDED') || replyText.includes('indicated') || replyText.includes('Gene Panel');

      setMessages(prev => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', text: replyText, isAssessment: isFinal }
      ]);

      if (!isFinal) {
        setQuickReplies(getGuidedQuickReplies(newCount));
      }

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallbackReply = generateGuidedOncogeneticReply(text, newCount);
      const isFinal = newCount >= 5;
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: fallbackReply, isAssessment: isFinal }]);
      if (!isFinal) setQuickReplies(getGuidedQuickReplies(newCount));
    }
  };

  const getGuidedQuickReplies = (count: number): string[] => {
    switch (count) {
      case 1:
        return ['Breast cancer', 'Ovarian cancer', 'Colorectal cancer', 'Endometrial cancer', 'Pancreatic cancer', 'Prostate cancer', 'Multiple cancers'];
      case 2:
        return ['Under 35 years', '35–45 years', '46–50 years', '51–60 years', 'Over 60 years'];
      case 3:
        return ['Mother / Sister', 'Father / Brother', 'Maternal aunt / grandmother', 'Paternal relative', 'Multiple relatives on same side'];
      case 4:
        return ['Ashkenazi Jewish ancestry', 'South Asian / Indian', 'Yes, family member tested positive', 'No prior testing in family'];
      default:
        return ['Tell me more about BRCA', 'What is Lynch Syndrome?', 'Book Genetic Counseling'];
    }
  };

  const generateGuidedOncogeneticReply = (_text: string, count: number): string => {
    if (count === 1) {
      return `Thank you. Understanding cancer types across generations is crucial for guideline evaluations.\n\nWhich specific type(s) of cancer were diagnosed in yourself or your family members?`;
    }
    if (count === 2) {
      return `Thank you. Age at diagnosis is one of the strongest indicators of hereditary risk under NCCN guidelines (e.g. Breast cancer diagnosed ≤50, Colorectal ≤50, or Ovarian at any age).\n\nAt what age was the cancer first diagnosed?`;
    }
    if (count === 3) {
      return `Got it. Next, which specific family relatives were affected, and on which side of the family (maternal or paternal)? Prompt: Think broadly across first, second, and third-degree relatives.`;
    }
    if (count === 4) {
      return `Understood. Are there any known genetic test results in the family (e.g. BRCA1/2 mutation positive), or Ashkenazi Jewish ancestry?`;
    }

    // Final Assessment Output
    return `### 🧬 NCCN v2.2025 Oncogenetic Risk Assessment\n\nBased on the history shared, **germline hereditary cancer testing is RECOMMENDED** under current NCCN & ASCO guidelines.\n\n**Candidate Syndromes & Gene Panels to Evaluate:**\n- **HBOC Panel (BRCA1, BRCA2, PALB2, ATM, CHEK2)**: Indicated for early-onset breast, ovarian, pancreatic, or high-risk prostate cancer.\n- **Lynch Syndrome Panel (MLH1, MSH2, MSH6, PMS2, EPCAM)**: Indicated for early colorectal, endometrial, or gastric clusters.\n\n**Next Steps:**\n1. Consult a certified Genetic Counselor for a comprehensive 3-generation pedigree review.\n2. Order a clinical multi-gene panel blood/saliva test as determined by your counselor.`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden font-sans transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
      
      {/* Top Header - Full Width Clean Alignment */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
            🧬
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                Gene
              </h3>
              <span className="text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60 uppercase tracking-wider">
                Germline Risk Advisor
              </span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0"></span>
              <span>MitoReboot Oncogenetics</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={restartChatSession}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Restart Assessment"
          >
            <RefreshCw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
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

      {/* Guidelines Strip */}
      <div className="bg-purple-50/60 dark:bg-purple-950/30 border-b border-purple-100/60 dark:border-purple-900/40 px-4 py-2 sm:px-6 flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200 shrink-0">
        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        <span className="truncate">Guidelines: NCCN v2.2025 · ASCO 2024 · SEOM Oncogenetics</span>
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
                {msg.text && (
                  <div 
                    className="space-y-1.5 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-purple-700 dark:[&_h3]:text-purple-300 [&_strong]:font-black [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                )}

                {/* Structured Next Steps Actions Card */}
                {msg.isAssessment && (
                  <div className="mt-3.5 pt-3 border-t border-purple-100 dark:border-purple-900/40 space-y-3">
                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3.5 space-y-2.5">
                      <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>Recommended MitoReboot Next Steps</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                        A genetic counselor will review your full pedigree, order the precise multi-gene panel, and interpret findings for your family's prevention plan.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            onClose();
                            onBookAppointment?.('Genetic Counselor Consultation');
                          }}
                          className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" /> Book Counselor
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToShop?.('Genetic');
                          }}
                          className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Browse Gene Tests
                        </button>
                      </div>
                    </div>

                    {/* Preparation Checklist */}
                    <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-3 text-[11px] space-y-1.5 text-amber-900 dark:text-amber-200">
                      <span className="font-extrabold block text-amber-800 dark:text-amber-300">💡 What to prepare for your consultation:</span>
                      <ul className="list-disc pl-4 space-y-1 font-semibold opacity-90">
                        <li>Medical records & pathology reports (ER/PR/HER2, MSI/dMMR)</li>
                        <li>3-generation family tree with cancer types and diagnosis ages</li>
                        <li>Any prior genetic test reports from relatives</li>
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
              placeholder="Tell Gene about your family history..."
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
            Gene is an educational oncogenetics advisor based on NCCN guidelines. Always confirm with a certified genetic counselor.
          </p>
        </div>
    </div>
  );
};
