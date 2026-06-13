import React, { useState, useEffect } from 'react';
import { Bot, Send, Loader2, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GlobalAICoachPopup: React.FC = () => {
  const { isAuthenticated, token, apiUrl } = useAuth();

  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isAuthenticated && token) {
      const fetchSessions = async () => {
        try {
          const res = await fetch(`${apiUrl}/coaching/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const active = data.filter((s: any) => s.status === 'active');

            if (active.length > 0 && !activeSession) {
              setActiveSession(active[0]);
              setIsOpen(true);
            }
            if (active.length === 0) {
              setIsOpen(false);
              setActiveSession(null);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      
      fetchSessions();
      interval = setInterval(fetchSessions, 10000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, token, apiUrl, activeSession]);

  const handleDismiss = async () => {
    if (!activeSession) return;
    setIsOpen(false);
    try {
      await fetch(`${apiUrl}/coaching/sessions/${activeSession._id}/dismiss`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Remove from local state so it doesn't reopen on next poll

      setActiveSession(null);
    } catch (err) {
      console.error(err);
    }
  };


  const handleReply = async () => {
    if (!replyText.trim() || !activeSession) return;
    setSending(true);

    try {
      const response = await fetch(`${apiUrl}/coaching/sessions/${activeSession._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setActiveSession(updatedSession);

        setReplyText('');
        // If session is now resolved, close popup after a short delay
        if (updatedSession.status === 'resolved') {
          setTimeout(() => {
            setIsOpen(false);
            setActiveSession(null);
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !activeSession) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 flex flex-col overflow-hidden max-h-[28rem] animate-in slide-in-from-bottom-5">
      <div className="bg-primary px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span className="font-bold text-sm">AI Assistant</span>
        </div>
        <button onClick={handleDismiss} title="Dismiss this session" className="hover:bg-white/20 p-1 rounded-full transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <div>
          <span className="block text-[9px] uppercase font-bold text-slate-400">Triggered By</span>
          <span className="text-xs font-bold text-slate-700">{activeSession.foodName || activeSession.foodLogId?.name || 'Meal Log'}</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] uppercase font-bold text-slate-400">Peak Glucose</span>
          <span className="text-xs font-extrabold text-red-500">{activeSession.peakGlucose} mg/dL</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-cardBg">
        {activeSession.messages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'assistant' && (
                <div className="bg-gradient-to-br from-primary to-primary-dark p-1.5 rounded-full shrink-0 mr-2 self-end mb-1 shadow-md border border-white">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              
              <div className={`p-3 text-[12px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-[20px] rounded-br-sm' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-[20px] rounded-bl-sm'
              }`}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="bg-slate-200 p-1.5 rounded-full shrink-0 ml-2 self-end mb-1 shadow-inner border border-white">
                  <UserIcon className="h-3 w-3 text-slate-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type response..."
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          onKeyDown={(e) => e.key === 'Enter' && handleReply()}
        />
        <button
          onClick={handleReply}
          disabled={sending || !replyText.trim()}
          className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-all disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
