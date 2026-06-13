import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, User as UserIcon, Loader2 } from 'lucide-react';

interface CoachingProps {
  onNavigateToTab?: (tab: string) => void;
}

export const Coaching: React.FC<CoachingProps> = () => {
  const { token, apiUrl } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/coaching/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSessions(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (sessionId: string) => {
    if (!token) return;
    const content = replyText[sessionId];
    if (!content || !content.trim()) return;

    setSendingId(sessionId);
    try {
      const response = await fetch(`${apiUrl}/coaching/sessions/${sessionId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSessions(prev => prev.map(s => s._id === sessionId ? updatedSession : s));
        setReplyText({ ...replyText, [sessionId]: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="font-semibold text-xs">Loading Coaching Sessions...</span>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Title */}
      <div className="mb-6 flex items-center space-x-3">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Assistant</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Personalized coaching based on your meal spikes
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sessions.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100 shadow-sm">
            <Bot className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">No Active Coaching</h3>
            <p className="text-xs text-slate-500 font-medium">Your glucose levels are looking great! If you log a meal that causes a high spike, the AI Assistant will reach out to help.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session._id} className="bg-cardBg rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Triggered By</span>
                  <span className="text-xs font-bold text-slate-700">{session.foodName || session.foodLogId?.name || 'Meal Log'}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Peak Glucose</span>
                  <span className="text-xs font-extrabold text-red-500">{session.peakGlucose} mg/dL</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {session.messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.role === 'assistant' && (
                        <div className="bg-gradient-to-br from-primary to-primary-dark p-1.5 rounded-full shrink-0 mr-2 self-end mb-1 shadow-md border border-white">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      <div className={`p-3 text-[13px] leading-relaxed shadow-sm ${
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

              {session.status === 'active' && (
                <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-3 rounded-b-3xl">
                  <input
                    type="text"
                    value={replyText[session._id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [session._id]: e.target.value })}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(session._id)}
                  />
                  <button
                    onClick={() => handleReply(session._id)}
                    disabled={sendingId === session._id || !replyText[session._id]?.trim()}
                    className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-all disabled:opacity-50 shrink-0"
                  >
                    {sendingId === session._id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4.5 w-4.5 ml-0.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
