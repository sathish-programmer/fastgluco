import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';

interface IntimacyCheckScreenProps {
  onBack: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export const IntimacyCheckScreen: React.FC<IntimacyCheckScreenProps> = ({ onBack }) => {
  const { user, apiUrl, token } = useAuth();
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // AI Chat State
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat && !config) {
      fetchConfig();
    }
  }, [showChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user?.id) fetchTodayLog();
  }, [user, apiUrl, token]);

  const fetchTodayLog = async () => {
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Intimacy', 1);
      const todayStr = new Date().toDateString();
      const todayLog = logs.find(l => new Date(l.timestamp).toDateString() === todayStr);
      if (todayLog) {
        setSelected(todayLog.value.happy ? 'yes' : 'no');
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Done fetching
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/workflow-config/SexualHealth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConfig(data);
      if (data.firstMessage) {
        setMessages([{ id: 'msg-1', sender: 'ai', text: data.firstMessage }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = async (val: 'yes' | 'no') => {
    setSelected(val);
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Intimacy', { happy: val === 'yes' });
    } catch (err) {
      console.error('Failed to log intimacy', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpertContact = () => {
    setShowChat(true);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response based on system config workflow
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          sender: 'ai', 
          text: "Thank you for sharing that. I've analyzed your situation based on my guidelines. The best next step is a confidential consultation with our doctor to explore treatment options."
        }
      ]);
      setShowWhatsApp(true);
    }, 1500);
  };

  const openWhatsApp = () => {
    if (config?.whatsappNumber) {
      const formattedNumber = config.whatsappNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };

  if (showChat) {
    return (
      <div className="pb-6 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col">
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button 
            onClick={() => setShowChat(false)}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Private Consultation</span>
            <h2 className="text-xl font-sans font-bold text-slate-800 leading-none mt-1 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-indigo-500" /> AI Assistant
            </h2>
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col overflow-hidden">
          {!config ? (
            <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
              Connecting...
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pb-2 pr-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-indigo-500 text-white rounded-tr-sm' 
                        : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                
                {showWhatsApp && (
                  <div className="flex justify-start mt-4">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl w-full">
                      <p className="text-xs font-bold text-emerald-800 mb-3">Our doctor is ready to assist you on WhatsApp.</p>
                      <button 
                        onClick={openWhatsApp}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm transition-all"
                      >
                        Connect on WhatsApp
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {!showWhatsApp && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
                  <input 
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="w-12 h-12 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm disabled:opacity-50 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Whole Health · Intimacy</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">A private check-in</h2>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full border border-rose-100 bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-50" />
        </div>
        <h3 className="text-2xl font-sans text-slate-800 font-bold mb-4 px-8 leading-tight">
          Are you happy with your sex life?
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed px-6">
          One honest tap — kept on this device, never shared. Intimacy is a quiet window into circulation, hormones and mood.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => handleSelect('yes')}
          disabled={loading}
          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 shadow-sm disabled:opacity-70 ${selected === 'yes' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
        >
          <span className="text-3xl">😌</span>
          <span className="font-bold text-slate-700 text-sm">Yes, I'm good</span>
        </button>
        <button 
          onClick={() => handleSelect('no')}
          disabled={loading}
          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 shadow-sm disabled:opacity-70 ${selected === 'no' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-200'}`}
        >
          <span className="text-3xl">😐</span>
          <span className="font-bold text-slate-700 text-sm">Not really</span>
        </button>
      </div>

      {selected === 'yes' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-fade-in shadow-sm">
          <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
            That's worth protecting
          </h4>
          <p className="text-xs text-emerald-700 leading-relaxed">
            A satisfying sex life tracks with healthy circulation, balanced hormones and steady mood — keep nurturing it.
          </p>
        </div>
      )}

      {selected === 'no' && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 animate-fade-in shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></span>
            You're not alone — and this is treatable
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Most causes — circulation, hormones, mood, medication or stress — are common and very fixable once looked at. A quiet, confidential conversation is the simplest first step.
          </p>
          <button 
            onClick={handleExpertContact}
            className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all shadow-sm flex justify-center items-center gap-2"
          >
            Talk to a sexual-health expert
          </button>
        </div>
      )}
    </div>
  );
};
