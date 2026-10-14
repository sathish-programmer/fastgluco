import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Send,
  Lock,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';

interface SupportInboxPageProps {
  apiUrl: string;
  token: string;
  initialFilters?: any;
  onNavigateToOrder?: (orderId: string) => void;
}

export const SupportInboxPage: React.FC<SupportInboxPageProps> = ({
  apiUrl,
  token,
  initialFilters = {},
  onNavigateToOrder
}) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Selected Ticket for conversation pane
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category || 'all');
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority || 'all');
  const [search, setSearch] = useState(initialFilters.search || '');

  // Reply / Note Form
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Quick ticket metadata edits
  const [statusDraft, setStatusDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search
      });
      const res = await fetch(`${apiUrl}/admin/order-management/support/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.counts) setCounts(data.counts);
        if (data.tickets?.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search, apiUrl, token]);

  // Fetch single ticket details
  const fetchTicketDetails = async (id: string) => {
    setTicketDetailsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/support/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket);
        setStatusDraft(data.ticket.status || 'Open');
        setPriorityDraft(data.ticket.priority || 'Medium');
        setCategoryDraft(data.ticket.category || 'General');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  // Handle Reply or Internal Note send
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/support/tickets/${selectedTicketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternalNote,
          status: statusDraft,
          priority: priorityDraft,
          category: categoryDraft
        })
      });

      if (res.ok) {
        setReplyMessage('');
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      } else {
        const err = await res.json();
        alert(err.message || 'Error updating ticket');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle status / priority quick save
  const handleSaveMetadata = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/order-management/support/tickets/${selectedTicketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusDraft,
          priority: priorityDraft,
          category: categoryDraft
        })
      });
      if (res.ok) {
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Customer Support Inbox
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime customer assistance inbox linked with orders, internal team notes, and email replies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 shadow-sm transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets by subject, customer, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="Open">Open & Pending ({counts.open})</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
            <option value="Waiting for Vendor">Waiting for Vendor</option>
            <option value="Resolved">Resolved ({counts.resolved})</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Order Status">Order Status</option>
            <option value="Payment Issue">Payment Issue</option>
            <option value="Refund">Refund</option>
            <option value="Cancellation">Cancellation</option>
            <option value="Return">Return</option>
            <option value="Delivery">Delivery</option>
            <option value="Product Issue">Product Issue</option>
            <option value="Account/Login">Account / Login</option>
            <option value="OTP Problem">OTP Problem</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent 🔥</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Conversations ({tickets.length})</span>
            <span className="text-[10px] text-slate-400 font-semibold">{counts.open} Awaiting reply</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 font-medium">Loading inbox...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No tickets found.</p>
              </div>
            ) : (
              tickets.map(t => {
                const isSelected = selectedTicketId === t._id;
                const isOpen = ['Open', 'In Progress', 'Waiting for Customer'].includes(t.status);

                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicketId(t._id)}
                    className={`p-4 cursor-pointer transition text-xs ${
                      isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">{t.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOpen ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-slate-600 font-medium truncate mb-1">
                      {t.subject || t.question}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                        {t.category || t.type || 'General'}
                      </span>
                      <span>{new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>

                    {t.relatedId && (
                      <div className="mt-1 text-[9px] font-mono text-primary font-bold">
                        Ref: {t.relatedId}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Conversation & Reply Console */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {ticketDetailsLoading || !activeTicket ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-semibold">
              Select a conversation to view and reply
            </div>
          ) : (
            <>
              {/* Ticket Top Header & Metadata Controls */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        {activeTicket.subject || `Inquiry from ${activeTicket.name}`}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        #{activeTicket.ticketId || activeTicket._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {activeTicket.name} &lt;{activeTicket.email}&gt; {activeTicket.mobile && `• ${activeTicket.mobile}`}
                    </div>
                  </div>

                  {activeTicket.relatedId && onNavigateToOrder && (
                    <button
                      onClick={() => onNavigateToOrder(activeTicket.relatedId)}
                      className="px-2.5 py-1 bg-white border border-primary text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <LinkIcon className="h-3 w-3" />
                      View Order {activeTicket.relatedId}
                    </button>
                  )}
                </div>

                {/* Metadata Pills Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                    <select
                      value={statusDraft}
                      onChange={e => setStatusDraft(e.target.value)}
                      onBlur={handleSaveMetadata}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting for Customer">Waiting for Customer</option>
                      <option value="Waiting for Vendor">Waiting for Vendor</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Priority:</span>
                    <select
                      value={priorityDraft}
                      onChange={e => setPriorityDraft(e.target.value)}
                      onBlur={handleSaveMetadata}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent 🔥</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Category:</span>
                    <select
                      value={categoryDraft}
                      onChange={e => setCategoryDraft(e.target.value)}
                      onBlur={handleSaveMetadata}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
                    >
                      <option value="Order Status">Order Status</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Refund">Refund</option>
                      <option value="Cancellation">Cancellation</option>
                      <option value="Return">Return</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Product Issue">Product Issue</option>
                      <option value="Account/Login">Account/Login</option>
                      <option value="OTP Problem">OTP Problem</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Thread Messages Conversation Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 text-xs">
                {/* Initial Inquiry Message */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                    <span className="font-bold text-slate-800">{activeTicket.name} (Customer)</span>
                    <span>{new Date(activeTicket.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {activeTicket.question}
                  </p>
                </div>

                {/* Legacy answer if exists */}
                {activeTicket.answer && (!activeTicket.messages || activeTicket.messages.length === 0) && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-blue-700 font-bold mb-1">
                      <span>Administrator Reply</span>
                      <span className="font-normal text-[10px]">
                        {activeTicket.answeredAt ? new Date(activeTicket.answeredAt).toLocaleString('en-IN') : 'Resolved'}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{activeTicket.answer}</p>
                  </div>
                )}

                {/* Threaded messages */}
                {(activeTicket.messages || []).map((msg: any, idx: number) => {
                  const isNote = msg.isInternalNote;
                  const isAdmin = msg.sender === 'admin';

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 border space-y-1 shadow-sm ${
                        isNote
                          ? 'bg-amber-50/90 border-amber-200'
                          : isAdmin
                          ? 'bg-blue-50/90 border-blue-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className={isNote ? 'text-amber-800 flex items-center gap-1' : isAdmin ? 'text-primary' : 'text-slate-700'}>
                          {isNote && <Lock className="h-3 w-3" />}
                          {msg.senderName || (isAdmin ? 'Admin' : 'Customer')}
                          {isNote ? ' (Private Internal Note)' : ''}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {new Date(msg.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply / Private Note Composer */}
              <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        !isInternalNote ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Reply to Customer (Sends Email)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        isInternalNote ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Lock className="h-3 w-3" /> Private Internal Note
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isInternalNote ? 'Visible only to administrators' : `Email will be dispatched to ${activeTicket.email}`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Type private note for the admin team...'
                        : 'Type customer response (will send email notification to customer)...'
                    }
                    rows={2}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary focus:bg-white resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className={`px-4 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 self-end py-2.5 shadow-sm disabled:opacity-50 ${
                      isInternalNote ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary-dark'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingReply ? 'Sending...' : isInternalNote ? 'Save Note' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
