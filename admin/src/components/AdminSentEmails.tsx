import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  Search,
  RefreshCw,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Server,
  Filter,
  Calendar,
  RotateCcw,
  Paperclip,
  ShieldCheck,
  FileText,
  Code
} from 'lucide-react';

interface AdminSentEmailsProps {
  apiUrl: string;
  token: string;
}

interface SentEmailItem {
  _id: string;
  recipient: string;
  recipientName?: string;
  userId?: string;
  sender: string;
  subject: string;
  textBody?: string;
  category: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  messageId?: string;
  gatewayResponse?: string;
  errorMessage?: string;
  attempts: number;
  hasAttachments: boolean;
  attachmentNames?: string[];
  metadata?: any;
  sentAt: string;
  createdAt: string;
}

interface SentEmailDetail extends SentEmailItem {
  htmlBody: string;
}

interface ApiResponse {
  success: boolean;
  emails: SentEmailItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalSent: number;
    sentToday: number;
    sentThisMonth: number;
    totalFailed: number;
    activeProvider: string;
    smtpHost: string;
    fromAddress: string;
  };
}

export const AdminSentEmails: React.FC<AdminSentEmailsProps> = ({ apiUrl, token }) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Inspector Modal State
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<SentEmailDetail | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'preview' | 'text' | 'headers'>('preview');

  // Resend State
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendOverrideRecipient, setResendOverrideRecipient] = useState<string>('');
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);
  const [resendErrorMsg, setResendErrorMsg] = useState<string | null>(null);
  const [showResendInput, setShowResendInput] = useState<boolean>(false);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch email list
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (category && category !== 'ALL') params.append('category', category);
      if (status && status !== 'ALL') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${apiUrl}/admin/sent-emails?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('[AdminSentEmails] Fetch error:', err);
      setError(err.message || 'Failed to load sent emails list');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, page, limit, debouncedSearch, category, status, startDate, endDate]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Fetch full email for inspector modal
  const handleOpenInspector = async (id: string) => {
    setSelectedEmailId(id);
    setSelectedEmail(null);
    setModalLoading(true);
    setActiveModalTab('preview');
    setShowResendInput(false);
    setResendSuccessMsg(null);
    setResendErrorMsg(null);

    try {
      const res = await fetch(`${apiUrl}/admin/sent-emails/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load email details');
      }
      const json = await res.json();
      setSelectedEmail(json.email);
      setResendOverrideRecipient(json.email.recipient);
    } catch (err: any) {
      console.error('[AdminSentEmails] Detail error:', err);
      alert(err.message || 'Failed to open email inspector');
      setSelectedEmailId(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Resend email handler
  const handleResend = async (id: string, overrideRecipient?: string) => {
    setResendingId(id);
    setResendSuccessMsg(null);
    setResendErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/admin/sent-emails/${id}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ overrideRecipient: overrideRecipient?.trim() || undefined })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to resend email');
      }
      setResendSuccessMsg(json.message || 'Email successfully queued and resent!');
      setShowResendInput(false);
      fetchEmails();
    } catch (err: any) {
      console.error('[AdminSentEmails] Resend error:', err);
      setResendErrorMsg(err.message || 'Resend operation failed');
    } finally {
      setResendingId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('ALL');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'OTP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            OTP Code
          </span>
        );
      case 'AUTOPAY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            AutoPay Mandate
          </span>
        );
      case 'SUBSCRIPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Subscription
          </span>
        );
      case 'APPOINTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Appointment
          </span>
        );
      case 'LAB_TEST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            Lab Test
          </span>
        );
      case 'SHOP_ORDER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Shop Order
          </span>
        );
      case 'SECURITY':
      case 'ACCOUNT_QUARANTINE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Security Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {cat}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner / Header (Clean White Admin Theme) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Outbound Sent Emails
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Centralized audit logs, delivered messages, and full HTML inspection for all user communications
              </p>
            </div>
          </div>

          {data?.stats && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                Active SMTP: <span className="font-bold text-blue-600">{data.stats.activeProvider}</span> ({data.stats.smtpHost})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Sender: <span className="font-mono text-slate-900">{data.stats.fromAddress}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchEmails()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchEmails()} className="underline text-xs font-bold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Cards (Matching Admin Clean Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Emails Logged</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {data?.stats?.totalSent?.toLocaleString() ?? '—'}
              </h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">All outbound transactions</p>
        </div>

        {/* Sent Today */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Sent Today</span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {data?.stats?.sentToday?.toLocaleString() ?? '—'}
              </h3>
            </div>
            <div className="p-2 bg-emerald-100/70 rounded-xl text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-2">Since 12:00 AM IST</p>
        </div>

        {/* Sent This Month */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Sent This Month</span>
              <h3 className="text-2xl font-black text-blue-900 mt-1">
                {data?.stats?.sentThisMonth?.toLocaleString() ?? '—'}
              </h3>
            </div>
            <div className="p-2 bg-blue-100/70 rounded-xl text-blue-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-blue-600/80 mt-2">Current billing cycle</p>
        </div>

        {/* Delivery Failures */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Delivery Failures</span>
              <h3 className={`text-2xl font-black mt-1 ${data?.stats?.totalFailed ? 'text-rose-700' : 'text-slate-800'}`}>
                {data?.stats?.totalFailed?.toLocaleString() ?? 0}
              </h3>
            </div>
            <div className="p-2 bg-rose-100/70 rounded-xl text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-2">Bounce or SMTP rejects</p>
        </div>

        {/* Active Gateway */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Active SMTP Relay</span>
              <h3 className="text-sm font-black text-purple-900 mt-1.5 truncate">
                {data?.stats?.activeProvider ?? 'Brevo SMTP'}
              </h3>
            </div>
            <div className="p-2 bg-purple-100/70 rounded-xl text-purple-700">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] font-mono text-purple-700/80 mt-2 truncate">
            {data?.stats?.fromAddress || 'support@mitoreboot.in'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient email, name, subject, or message ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-52">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            >
              <option value="ALL">All Categories</option>
              <option value="OTP">OTP / Auth Codes</option>
              <option value="AUTOPAY">AutoPay Mandates</option>
              <option value="SUBSCRIPTION">Subscriptions</option>
              <option value="APPOINTMENT">Appointments</option>
              <option value="LAB_TEST">Lab Tests</option>
              <option value="SHOP_ORDER">Shop Orders</option>
              <option value="ACCOUNT_QUARANTINE">Account Security</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-40">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            >
              <option value="ALL">All Status</option>
              <option value="SENT">Delivered (SENT)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Reset button */}
          {(search || category !== 'ALL' || status !== 'ALL' || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 flex items-center gap-1.5 transition whitespace-nowrap self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter by Date Range:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs font-bold text-rose-600 hover:underline ml-auto"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card (Clean White Admin Theme) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-4">Sent Time</th>
                <th scope="col" className="px-5 py-4">Recipient</th>
                <th scope="col" className="px-5 py-4">Subject & Category</th>
                <th scope="col" className="px-5 py-4">Status / Message ID</th>
                <th scope="col" className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !data ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                    <p className="text-xs font-bold text-slate-600">Loading outbound sent emails...</p>
                  </td>
                </tr>
              ) : data?.emails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="p-3 bg-slate-50 rounded-2xl w-fit mx-auto mb-3 border border-slate-100">
                      <Mail className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No sent emails recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {search || category !== 'ALL' || status !== 'ALL' || startDate
                        ? 'No emails match the active search or filter criteria.'
                        : 'Outgoing emails dispatched via Brevo/Titan SMTP will be logged and listed here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                data?.emails.map((email) => (
                  <tr
                    key={email._id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => handleOpenInspector(email._id)}
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs">
                        {formatDate(email.sentAt)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {getRelativeTime(email.sentAt)}
                      </div>
                    </td>

                    {/* Recipient */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs select-all">
                          {email.recipient}
                        </span>
                        <button
                          onClick={() => handleCopy(email.recipient, `recip-${email._id}`)}
                          title="Copy email"
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          {copiedId === `recip-${email._id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {email.recipientName && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {email.recipientName}
                        </div>
                      )}
                    </td>

                    {/* Subject & Category */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getCategoryBadge(email.category)}
                        {email.hasAttachments && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                            <Paperclip className="w-3 h-3 text-slate-500" />
                            {email.attachmentNames?.length || 1} attachment
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                        {email.subject}
                      </div>
                      {email.textBody && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                          {email.textBody.substring(0, 80)}...
                        </div>
                      )}
                    </td>

                    {/* Status / Message-ID */}
                    <td className="px-5 py-4">
                      {email.status === 'SENT' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            DELIVERED
                          </span>
                          {email.messageId && (
                            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={email.messageId}>
                              ID: {email.messageId.replace(/[<>]/g, '')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            FAILED
                          </span>
                          {email.errorMessage && (
                            <div className="text-[11px] text-rose-600 truncate max-w-[200px]" title={email.errorMessage}>
                              {email.errorMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenInspector(email._id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 shadow-2xs transition"
                          title="Inspect email content"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          Inspect
                        </button>

                        <button
                          onClick={() => handleResend(email._id)}
                          disabled={resendingId === email._id}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition disabled:opacity-50"
                          title="Resend this email"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${resendingId === email._id ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                          Resend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Showing</span>
                <span className="font-bold text-slate-900">
                  {data.pagination.total === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, data.pagination.total)}
                </span>
                <span>of</span>
                <span className="font-bold text-slate-900">{data.pagination.total}</span>
                <span>records</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">| Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 font-bold rounded-lg px-2 py-0.5 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-2xs">
                  Page {page} of {data.pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RICH INSPECTOR MODAL (Clean White Admin Theme) */}
      {selectedEmailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedEmail && getCategoryBadge(selectedEmail.category)}
                  {selectedEmail?.status === 'SENT' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sent via SMTP
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> Delivery Failed
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedEmail ? formatDate(selectedEmail.sentAt) : ''}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedEmail?.subject || 'Loading email preview...'}
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>To: <strong className="text-slate-800">{selectedEmail?.recipient}</strong></span>
                  {selectedEmail?.recipientName && (
                    <span className="text-slate-500">({selectedEmail.recipientName})</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedEmailId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Alerts */}
            {resendSuccessMsg && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {resendSuccessMsg}
                </div>
                <button onClick={() => setResendSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {resendErrorMsg && (
              <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs font-bold text-rose-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {resendErrorMsg}
                </div>
                <button onClick={() => setResendErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Tabs Bar */}
            <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalTab('preview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeModalTab === 'preview'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  HTML Preview
                </button>
                <button
                  onClick={() => setActiveModalTab('text')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeModalTab === 'text'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Plain Text / Code
                </button>
                <button
                  onClick={() => setActiveModalTab('headers')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeModalTab === 'headers'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Gateway Headers
                </button>
              </div>

              {/* Action buttons on tab bar */}
              <div className="flex items-center gap-2">
                {!showResendInput ? (
                  <button
                    onClick={() => setShowResendInput(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3 h-3 text-blue-600" />
                    Resend Email...
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-blue-400 shadow-xs">
                    <input
                      type="email"
                      value={resendOverrideRecipient}
                      onChange={(e) => setResendOverrideRecipient(e.target.value)}
                      placeholder="Recipient email"
                      className="bg-transparent px-2 py-0.5 text-xs text-slate-900 font-semibold focus:outline-none w-48"
                    />
                    <button
                      onClick={() => handleResend(selectedEmail!._id, resendOverrideRecipient)}
                      disabled={resendingId === selectedEmail?._id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-50"
                    >
                      {resendingId === selectedEmail?._id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Send
                    </button>
                    <button
                      onClick={() => setShowResendInput(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-5 bg-slate-50/50 min-h-[420px]">
              {modalLoading ? (
                <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-bold">Fetching email content...</p>
                </div>
              ) : !selectedEmail ? (
                <div className="h-96 flex items-center justify-center text-slate-500 text-xs font-bold">
                  Failed to load email details.
                </div>
              ) : activeModalTab === 'preview' ? (
                <div className="w-full h-full min-h-[550px] bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200">
                  <iframe
                    title="Email Preview"
                    srcDoc={selectedEmail.htmlBody || '<p style="padding:20px;color:#888;">No HTML content available</p>'}
                    className="w-full h-[550px] border-0"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              ) : activeModalTab === 'text' ? (
                <div className="space-y-4">
                  {selectedEmail.textBody ? (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Plain Text Content</h4>
                      <pre className="p-4 bg-white rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-auto shadow-xs">
                        {selectedEmail.textBody}
                      </pre>
                    </div>
                  ) : null}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Raw HTML Source Code</h4>
                      <button
                        onClick={() => handleCopy(selectedEmail.htmlBody, 'raw-html')}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copiedId === 'raw-html' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copy HTML
                      </button>
                    </div>
                    <pre className="p-4 bg-white rounded-2xl border border-slate-200 text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-auto select-all shadow-xs">
                      {selectedEmail.htmlBody}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 font-mono shadow-xs">
                    <div>
                      <span className="text-slate-400 font-bold">Record ID:</span>{' '}
                      <span className="text-slate-800">{selectedEmail._id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Recipient:</span>{' '}
                      <span className="text-slate-900 font-bold">{selectedEmail.recipient}</span>
                    </div>
                    {selectedEmail.recipientName && (
                      <div>
                        <span className="text-slate-400 font-bold">Recipient Name:</span>{' '}
                        <span className="text-slate-900">{selectedEmail.recipientName}</span>
                      </div>
                    )}
                    {selectedEmail.userId && (
                      <div>
                        <span className="text-slate-400 font-bold">User ID:</span>{' '}
                        <span className="text-blue-600">{selectedEmail.userId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 font-bold">Sender:</span>{' '}
                      <span className="text-slate-700">{selectedEmail.sender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Message-ID:</span>{' '}
                      <span className="text-emerald-700 font-bold">{selectedEmail.messageId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">SMTP Gateway Response:</span>{' '}
                      <span className="text-slate-700">{selectedEmail.gatewayResponse || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Dispatch Attempts:</span>{' '}
                      <span className="text-slate-800">{selectedEmail.attempts}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Has Attachments:</span>{' '}
                      <span className="text-slate-800">{selectedEmail.hasAttachments ? 'Yes' : 'No'}</span>
                    </div>
                    {selectedEmail.attachmentNames && selectedEmail.attachmentNames.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-bold">Attachment List:</span>{' '}
                        <span className="text-slate-800">{selectedEmail.attachmentNames.join(', ')}</span>
                      </div>
                    )}
                    {selectedEmail.errorMessage && (
                      <div className="text-rose-600">
                        <span className="text-slate-400 font-bold">Error:</span> {selectedEmail.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Rendered securely inside an isolated sandbox iframe</span>
              </div>
              <button
                onClick={() => setSelectedEmailId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition shadow-2xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
