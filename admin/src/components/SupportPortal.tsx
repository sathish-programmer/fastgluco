import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { HelpCircle, CheckCircle, Clock, Package, Beaker, Info, Send } from 'lucide-react';

export const SupportPortal: React.FC = () => {
  const { apiUrl, token } = useAdminAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Open' | 'Answered'>('Open');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/support/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text) {
      alert('Please enter a reply.');
      return;
    }
    setReplying(ticketId);
    try {
      const res = await fetch(`${apiUrl}/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: text })
      });
      if (res.ok) {
        alert('Reply sent successfully and marked as Answered.');
        setReplyText(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
      } else {
        alert('Failed to send reply.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setReplying(null);
    }
  };

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Support Tickets</h2>
          <p className="text-sm text-slate-500">Manage and reply to user support requests.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('Open')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'Open' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Open Tickets
        </button>
        <button 
          onClick={() => setActiveTab('Answered')}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'Answered' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Resolved Tickets
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No {activeTab} tickets found.</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map(ticket => (
            <div key={ticket._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 flex justify-between items-start border-b border-slate-100 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800">{ticket.name}</h3>
                    <span className="text-xs font-semibold text-slate-400">&lt;{ticket.email}&gt;</span>
                    {ticket.type === 'PRODUCT' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Package className="h-3 w-3"/> Product</span>}
                    {ticket.type === 'LAB_TEST' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Beaker className="h-3 w-3"/> Lab Test</span>}
                    {ticket.type === 'GENERAL' && <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Info className="h-3 w-3"/> General</span>}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ticket.createdAt).toLocaleString()}
                    {ticket.relatedId && <span className="ml-2 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">Ref: {ticket.relatedId}</span>}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${ticket.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {ticket.status === 'Open' ? <HelpCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  {ticket.status}
                </div>
              </div>
              <div className="p-5">
                <p className="text-slate-700 text-sm whitespace-pre-wrap font-medium">{ticket.question}</p>
                
                {ticket.status === 'Answered' && ticket.answer && (
                  <div className="mt-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Reply</div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{ticket.answer}</p>
                    <div className="text-[10px] text-slate-400 mt-2 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Replied on {new Date(ticket.answeredAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {ticket.status === 'Open' && (
                  <div className="mt-5 flex gap-3">
                    <textarea 
                      value={replyText[ticket._id] || ''}
                      onChange={e => setReplyText({ ...replyText, [ticket._id]: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-10 min-h-[40px]"
                      placeholder="Write your reply here..."
                      rows={1}
                    ></textarea>
                    <button 
                      onClick={() => handleReply(ticket._id)}
                      disabled={replying === ticket._id || !replyText[ticket._id]}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                    >
                      {replying === ticket._id ? 'Sending...' : <><Send className="h-4 w-4" /> Reply & Resolve</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
