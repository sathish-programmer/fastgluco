import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Flame,
  Server,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Eye
} from 'lucide-react';

interface AdminOtpLogsProps {
  apiUrl: string;
  token: string;
}

interface OtpLogItem {
  _id: string;
  timestamp: string;
  eventType: 'REQUEST' | 'VERIFY';
  channel: 'sms' | 'email' | 'both' | 'mock' | 'firebase';
  status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED';
  errorCategory?: string | null;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceModel: string;
  maskedTarget: string;
  durationMs?: number;

  phoneNumber?: string | null;
  email?: string | null;
  smsProvider?: string;
  smsStatus?: string;
  smsGatewayResponse?: any;
  emailProvider?: string;
  emailStatus?: string;
  emailGatewayResponse?: any;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  effectiveVerificationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  verifiedAt?: string | null;
  attemptsCount?: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  fallbackReason?: string | null;
  failureCategory?: string | null;
  verifiedVia?: string | null;
  apnsStatus?: string | null;
  recaptchaStatus?: string | null;
}

interface OtpLogResponse {
  success: boolean;
  logs: OtpLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  kpis: {
    totalRequests: number;
    totalVerifications: number;
    totalVerified: number;
    totalPendingActive: number;
    totalFailed: number;
    verificationRate: number;
    emailDeliveryCount: number;
    smsDeliveryCount: number;
    providerStats: {
      firebase: number;
      fast2smsQuick: number;
      fast2smsOtp: number;
      titanGodaddySmtp: number;
      brevoSmtp: number;
    };
    smtpConfig: {
      host: string;
      user: string;
      activeProvider: string;
    };
  };
}

export const AdminOtpLogs: React.FC<AdminOtpLogsProps> = ({ apiUrl, token }) => {
  const [data, setData] = useState<OtpLogResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Auto Refresh
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<OtpLogItem | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (activeSearch) params.append('q', activeSearch);
      if (providerFilter !== 'all') params.append('provider', providerFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (verificationFilter !== 'all') params.append('verificationStatus', verificationFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (dateRangeFilter !== 'all') params.append('dateRange', dateRangeFilter);

      const res = await fetch(`${apiUrl}/admin/otp-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json: OtpLogResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch OTP audit logs:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [apiUrl, token, page, limit, activeSearch, providerFilter, statusFilter, verificationFilter, channelFilter, platformFilter, dateRangeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedTarget(id);
    setTimeout(() => setCopiedTarget(null), 2000);
  };

  const copyRawJson = () => {
    if (!selectedLog || !navigator.clipboard) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const exportToCsv = () => {
    if (!data?.logs || data.logs.length === 0) return;
    const headers = [
      'Timestamp',
      'Phone Number',
      'Email',
      'Channel',
      'SMS Provider',
      'SMS Status',
      'Email Provider',
      'Email Status',
      'Verification Status',
      'Verified At',
      'Platform',
      'App Version',
      'Attempts',
      'IP Address'
    ];

    const rows = data.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      `"${log.phoneNumber || log.maskedTarget || ''}"`,
      `"${log.email || ''}"`,
      log.channel,
      log.smsProvider || 'none',
      log.smsStatus || 'NOT_ATTEMPTED',
      log.emailProvider || 'none',
      log.emailStatus || 'NOT_ATTEMPTED',
      log.effectiveVerificationStatus || log.verificationStatus || 'PENDING',
      log.verifiedAt ? new Date(log.verifiedAt).toISOString() : '',
      log.platform,
      log.appVersion,
      log.attemptsCount || 0,
      log.ipAddress || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `otp_auth_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return isoDate;
    }
  };

  const getSmsProviderBadge = (provider?: string) => {
    switch (provider) {
      case 'firebase':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            Firebase Phone
          </span>
        );
      case 'fast2sms_quick':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
            Fast2SMS (Quick 'q')
          </span>
        );
      case 'fast2sms_otp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Key className="w-3 h-3 text-indigo-600" />
            Fast2SMS (OTP/DLT)
          </span>
        );
      case 'fast2sms_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            Fast2SMS (Rejected)
          </span>
        );
      default:
        return (
          <span className="text-slate-400 text-xs italic">
            Not Sent
          </span>
        );
    }
  };

  const getEmailProviderBadge = (provider?: string) => {
    switch (provider) {
      case 'titan_godaddy_smtp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Mail className="w-3 h-3 text-blue-600" />
            Titan GoDaddy SMTP
          </span>
        );
      case 'brevo_smtp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Mail className="w-3 h-3 text-sky-600" />
            Brevo SMTP
          </span>
        );
      case 'google_smtp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Mail className="w-3 h-3 text-emerald-600" />
            Google SMTP
          </span>
        );
      default:
        if (provider && provider.startsWith('smtp_')) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Server className="w-3 h-3 text-slate-600" />
              {provider.replace('smtp_', 'SMTP: ')}
            </span>
          );
        }
        return (
          <span className="text-slate-400 text-xs italic">
            None
          </span>
        );
    }
  };

  const getVerificationBadge = (status?: string, durationMs?: number) => {
    switch (status) {
      case 'VERIFIED':
        const sec = durationMs ? Math.round(durationMs / 1000) : 0;
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified {sec > 0 ? `(${sec}s)` : ''}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Waiting for Code
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Expired (&gt;10m)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed / Blocked
          </span>
        );
      default:
        return (
          <span className="text-slate-500 text-xs font-medium">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getVerifiedViaBadge = (via?: string | null, fallbackReason?: string | null) => {
    if (via === 'FIREBASE_PHONE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
          <Smartphone className="w-3 h-3 text-emerald-600" />
          via Firebase Native
        </span>
      );
    }
    if (via === 'FAST2SMS_FALLBACK' || fallbackReason) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
          <Zap className="w-3 h-3 text-purple-600" />
          via Fast2SMS Fallback
        </span>
      );
    }
    if (via === 'EMAIL_OTP') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
          <Mail className="w-3 h-3 text-blue-600" />
          via Email OTP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
        <Check className="w-3 h-3 text-slate-600" />
        via Backend OTP
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                OTP &amp; Authentication Audit Logs
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full delivery tracking for Titan Mail (GoDaddy SMTP), Brevo, Firebase Phone Auth, and Fast2SMS routes
              </p>
            </div>
          </div>
          {data?.kpis?.smtpConfig && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-500" />
                Active SMTP: <span className="font-bold text-primary">{data.kpis.smtpConfig.activeProvider}</span> ({data.kpis.smtpConfig.host})
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Sender: <span className="font-mono text-slate-900">{data.kpis.smtpConfig.user}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Auto-refresh every 10 seconds"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            Auto-refresh: {autoRefresh ? 'ON (10s)' : 'OFF'}
          </button>

          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={exportToCsv}
            disabled={!data?.logs?.length}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Funnel Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Dispatched</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {data?.kpis?.totalRequests ?? 0}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Total OTP codes requested</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-white to-blue-50/30">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Email Delivered</span>
          <h3 className="text-2xl font-black text-blue-900 mt-1">
            {data?.kpis?.emailDeliveryCount ?? 0}
          </h3>
          <p className="text-[11px] text-blue-600/80 mt-1">Titan / Brevo SMTP sent</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs bg-gradient-to-br from-white to-purple-50/30">
          <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">SMS Delivered</span>
          <h3 className="text-2xl font-black text-purple-900 mt-1">
            {data?.kpis?.smsDeliveryCount ?? 0}
          </h3>
          <p className="text-[11px] text-purple-600/80 mt-1">Firebase + Fast2SMS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Verified Logins</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">
            {data?.kpis?.totalVerified ?? 0}
          </h3>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            {data?.kpis?.verificationRate ?? 100}% Success Rate
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Awaiting Code</span>
          <h3 className="text-2xl font-black text-amber-800 mt-1">
            {data?.kpis?.totalPendingActive ?? 0}
          </h3>
          <p className="text-[11px] text-amber-600/80 mt-1">Active pending (&lt;10m)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-gradient-to-br from-white to-rose-50/30">
          <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Delivery Failures</span>
          <h3 className="text-2xl font-black text-rose-700 mt-1">
            {data?.kpis?.totalFailed ?? 0}
          </h3>
          <p className="text-[11px] text-rose-600/80 mt-1">Gateway or limit errors</p>
        </div>
      </div>

      {/* Provider Quick Breakdown Pills */}
      {data?.kpis?.providerStats && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Routes Breakdown:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setProviderFilter('firebase'); setPage(1); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                providerFilter === 'firebase'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Flame className="w-3 h-3" />
              Firebase Phone Auth: <span className="font-black">{data.kpis.providerStats.firebase}</span>
            </button>

            <button
              onClick={() => { setProviderFilter('fast2sms_quick'); setPage(1); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                providerFilter === 'fast2sms_quick'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Zap className="w-3 h-3" />
              Fast2SMS Quick 'q' (iOS Fallback): <span className="font-black">{data.kpis.providerStats.fast2smsQuick}</span>
            </button>

            <button
              onClick={() => { setProviderFilter('titan_godaddy_smtp'); setPage(1); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                providerFilter === 'titan_godaddy_smtp'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Mail className="w-3 h-3" />
              Titan GoDaddy SMTP: <span className="font-black">{data.kpis.providerStats.titanGodaddySmtp}</span>
            </button>

            <button
              onClick={() => { setProviderFilter('brevo_smtp'); setPage(1); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                providerFilter === 'brevo_smtp'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <Mail className="w-3 h-3" />
              Brevo SMTP: <span className="font-black">{data.kpis.providerStats.brevoSmtp}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by recipient phone (+91 9876543210) or email address..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Provider:</span>
            <select
              value={providerFilter}
              onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Providers</option>
              <option value="firebase">Firebase Phone Auth</option>
              <option value="fast2sms_quick">Fast2SMS Quick 'q'</option>
              <option value="fast2sms_otp">Fast2SMS OTP/DLT</option>
              <option value="titan_godaddy_smtp">Titan GoDaddy SMTP</option>
              <option value="brevo_smtp">Brevo SMTP</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Auth Status:</span>
            <select
              value={verificationFilter}
              onChange={e => { setVerificationFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="VERIFIED">Verified (Success)</option>
              <option value="PENDING">Pending (Waiting Code)</option>
              <option value="EXPIRED">Expired (&gt;10m)</option>
              <option value="FAILED">Failed / Blocked</option>
            </select>
          </div>

          {/* Delivery Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Delivery:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Deliveries</option>
              <option value="SUCCESS">Delivered (Success)</option>
              <option value="FAILED">Delivery Failed</option>
              <option value="RATE_LIMITED">Rate Limited</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Channel:</span>
            <select
              value={channelFilter}
              onChange={e => { setChannelFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="email">Email Only</option>
              <option value="sms">SMS Only</option>
              <option value="both">Both (SMS + Email)</option>
              <option value="firebase">Firebase Phone</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Platform:</span>
            <select
              value={platformFilter}
              onChange={e => { setPlatformFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Devices</option>
              <option value="ios">Apple iOS</option>
              <option value="android">Android</option>
              <option value="web">Web Browser</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400">Time:</span>
            <select
              value={dateRangeFilter}
              onChange={e => { setDateRangeFilter(e.target.value); setPage(1); }}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
            </select>
          </div>

          {(providerFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all' || channelFilter !== 'all' || platformFilter !== 'all' || dateRangeFilter !== 'all' || activeSearch) && (
            <button
              onClick={() => {
                setProviderFilter('all');
                setStatusFilter('all');
                setVerificationFilter('all');
                setChannelFilter('all');
                setPlatformFilter('all');
                setDateRangeFilter('all');
                setActiveSearch('');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs font-bold text-primary hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Target Recipient</th>
                <th className="py-3 px-4">Providers Dispatched</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Verification / Login</th>
                <th className="py-3 px-4">Device &amp; Client</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading && !data?.logs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading authentication logs...
                  </td>
                </tr>
              ) : data?.logs?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Key className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No matching authentication logs found.
                  </td>
                </tr>
              ) : (
                data?.logs?.map((log) => {
                  const effectiveStatus = log.effectiveVerificationStatus || log.verificationStatus;
                  const displayPhone = log.phoneNumber || (log.maskedTarget?.includes('@') ? null : log.maskedTarget);
                  const displayEmail = log.email || (log.maskedTarget?.includes('@') ? log.maskedTarget : null);

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatRelativeTime(log.timestamp)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {displayPhone && (
                            <div className="flex items-center gap-1.5 font-mono text-slate-900 font-bold">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>{displayPhone}</span>
                              <button
                                onClick={() => copyToClipboard(displayPhone, log._id + '_phone')}
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                                title="Copy Phone Number"
                              >
                                {copiedTarget === log._id + '_phone' ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {displayEmail && (
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{displayEmail}</span>
                              <button
                                onClick={() => copyToClipboard(displayEmail, log._id + '_email')}
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                                title="Copy Email"
                              >
                                {copiedTarget === log._id + '_email' ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Providers Dispatched */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {/* SMS Provider */}
                          {(log.smsProvider && log.smsProvider !== 'none') || log.channel === 'sms' || log.channel === 'both' || log.channel === 'firebase' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 w-10">SMS:</span>
                              {getSmsProviderBadge(log.smsProvider || (log.channel === 'firebase' ? 'firebase' : undefined))}
                            </div>
                          ) : null}

                          {/* Email Provider */}
                          {(log.emailProvider && log.emailProvider !== 'none') || log.channel === 'email' || log.channel === 'both' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 w-10">Email:</span>
                              {getEmailProviderBadge(log.emailProvider)}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3.5 px-4">
                        {log.status === 'SUCCESS' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Delivered
                            </span>
                            {log.emailGatewayResponse && typeof log.emailGatewayResponse === 'string' && (
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]" title={log.emailGatewayResponse}>
                                {log.emailGatewayResponse}
                              </div>
                            )}
                          </div>
                        ) : log.status === 'RATE_LIMITED' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Rate Limited
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Delivery Failed
                            </span>
                            {log.errorCategory && (
                              <div className="text-[10px] text-rose-600 font-bold truncate max-w-[180px]">
                                {log.errorCategory}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getVerificationBadge(effectiveStatus, log.durationMs)}
                          {effectiveStatus === 'VERIFIED' && (
                            <div>
                              {getVerifiedViaBadge(log.verifiedVia, log.fallbackReason)}
                            </div>
                          )}
                          {log.attemptsCount && log.attemptsCount > 0 ? (
                            <div className="text-[10px] text-slate-400">
                              Attempts: {log.attemptsCount}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Device & Client */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {log.platform === 'ios' ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-black uppercase">
                                iOS
                              </span>
                            ) : log.platform === 'android' ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase">
                                Android
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-600 text-white text-[9px] font-black uppercase">
                                Web
                              </span>
                            )}
                            <span>v{log.appVersion}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {log.deviceModel || log.osVersion || 'Unknown Device'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          Trace
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing page <span className="font-bold text-slate-900">{page}</span> of{' '}
              <span className="font-bold text-slate-900">{data.pagination.totalPages}</span> ({data.pagination.total} total logs)
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 shadow-2xs transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 shadow-2xs transition-all"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Authentication Audit Trace
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: <span className="font-mono">{selectedLog._id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Recipient Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Recipient</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Phone Number</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {selectedLog.phoneNumber || selectedLog.maskedTarget || 'Not Recorded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address</span>
                    <span className="font-bold text-sm text-slate-900">
                      {selectedLog.email || 'Not Recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Providers Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Delivery */}
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Email Gateway</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Provider:</span>
                    <div className="mt-0.5">{getEmailProviderBadge(selectedLog.emailProvider)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Status:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLog.emailStatus || 'NOT_ATTEMPTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">SMTP Response / MessageID:</span>
                    <div className="mt-0.5 p-2 bg-white rounded-xl border border-blue-200 font-mono text-[11px] text-slate-700 break-all">
                      {selectedLog.emailGatewayResponse && typeof selectedLog.emailGatewayResponse === 'object'
                        ? JSON.stringify(selectedLog.emailGatewayResponse)
                        : (selectedLog.emailGatewayResponse || (selectedLog.emailStatus === 'DELIVERED' ? 'Queued and delivered via SMTP Relay' : 'No SMTP response logged'))}
                    </div>
                  </div>
                </div>

                {/* SMS Delivery */}
                <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span>SMS Gateway</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Provider:</span>
                    <div className="mt-0.5">{getSmsProviderBadge(selectedLog.smsProvider)}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Status:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLog.smsStatus || 'NOT_ATTEMPTED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Gateway Response / Reason:</span>
                    <div className="mt-0.5 p-2 bg-white rounded-xl border border-purple-200 font-mono text-[11px] text-slate-700 break-all">
                      {selectedLog.smsGatewayResponse && typeof selectedLog.smsGatewayResponse === 'object'
                        ? JSON.stringify(selectedLog.smsGatewayResponse)
                        : (selectedLog.smsGatewayResponse || (selectedLog.smsStatus === 'DELIVERED' ? 'Delivered successfully via SMS Gateway' : 'SMS route not requested for this client platform'))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Lifecycle & Succeeded Channel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Authentication Lifecycle &amp; Succeeded Channel
                  </span>
                  {selectedLog.effectiveVerificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Backend Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Lifecycle Status</span>
                    <div className="mt-1">
                      {getVerificationBadge(selectedLog.effectiveVerificationStatus || selectedLog.verificationStatus, selectedLog.durationMs)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Succeeded Channel</span>
                    <div className="mt-1">
                      {selectedLog.effectiveVerificationStatus === 'VERIFIED' ? (
                        getVerifiedViaBadge(selectedLog.verifiedVia, selectedLog.fallbackReason)
                      ) : (
                        <span className="text-slate-400 text-xs italic">Awaiting Verification</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Requested At</span>
                    <span className="font-bold text-slate-900 block mt-1">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Verified At</span>
                    <span className="font-bold text-slate-900 block mt-1">
                      {selectedLog.verifiedAt ? new Date(selectedLog.verifiedAt).toLocaleString() : 'Pending'}
                    </span>
                  </div>
                </div>

                {selectedLog.effectiveVerificationStatus === 'VERIFIED' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Verification Resolution:</strong> Succeeded via{' '}
                      <span className="font-bold text-slate-900">
                        {selectedLog.verifiedVia === 'FIREBASE_PHONE'
                          ? 'Firebase Native Phone Auth'
                          : (selectedLog.fallbackReason ? 'Fast2SMS SMS Fallback OTP' : 'Backend OTP')}
                      </span>{' '}
                      and successfully validated by the backend authentication server.
                    </span>
                  </div>
                )}
              </div>

              {/* Verification Pipeline: Initial Attempt vs Fallback */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Verification Pipeline &amp; Channel Disambiguation
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1: Initial Attempt */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">1. Initial Attempt</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {selectedLog.platform === 'ios' ? 'iOS Firebase' : selectedLog.platform === 'android' ? 'Android Firebase' : 'Web'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Silent APNs:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {selectedLog.apnsStatus || (selectedLog.platform === 'ios' && selectedLog.fallbackReason ? 'Timed out / Unavailable' : 'Token Active')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">reCAPTCHA Enterprise:</span>
                      <span className={`text-[11px] font-bold ${selectedLog.fallbackReason === 'FIREBASE_VERIFICATION_FAILED' ? 'text-amber-700' : 'text-slate-700'}`}>
                        {selectedLog.recaptchaStatus || (selectedLog.fallbackReason === 'FIREBASE_VERIFICATION_FAILED' ? 'SDK not linked in build (Fixed in v6.1.8+)' : 'Verified / Not Needed')}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Fallback Route */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">2. Fallback Route</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedLog.fallbackReason ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedLog.fallbackReason ? 'Triggered' : 'Not Needed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Trigger Reason:</span>
                      <span className="text-[11px] font-bold text-slate-800 truncate block" title={selectedLog.fallbackReason || 'None'}>
                        {selectedLog.fallbackReason || 'Direct Authentication Succeeded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Dispatched Providers:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {selectedLog.fallbackReason ? 'Fast2SMS (SMS) + Brevo (Email)' : 'Direct Firebase Channel'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Final Authentication */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">3. Succeeded Channel</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedLog.effectiveVerificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedLog.effectiveVerificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Winning Channel:</span>
                      <span className="text-[11px] font-black text-slate-900 block mt-0.5">
                        {selectedLog.effectiveVerificationStatus === 'VERIFIED' ? (
                          selectedLog.verifiedVia === 'FIREBASE_PHONE'
                            ? 'Firebase Native Phone Auth'
                            : (selectedLog.fallbackReason ? 'Fast2SMS SMS Fallback OTP' : 'Backend OTP')
                        ) : 'Not Yet Verified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Backend Confirmation:</span>
                      <span className="text-[11px] font-medium text-emerald-700">
                        {selectedLog.effectiveVerificationStatus === 'VERIFIED' ? '✅ Confirmed by API' : '⏳ Pending confirmation'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device and Audit Metadata */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Client Context &amp; Network</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Platform</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedLog.platform}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">App Version</span>
                    <span className="font-bold text-slate-900">v{selectedLog.appVersion} (build {selectedLog.buildNumber})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Device / OS</span>
                    <span className="font-bold text-slate-900">{selectedLog.deviceModel} ({selectedLog.osVersion})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Client IP</span>
                    <span className="font-mono font-bold text-slate-900">{selectedLog.ipAddress || 'Not Recorded'}</span>
                  </div>
                </div>
                {selectedLog.fallbackReason && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[11px]">iOS Fallback Trigger Details:</span>
                    <span className="font-bold text-amber-700">Reason: {selectedLog.fallbackReason} • Category: {selectedLog.failureCategory || 'NONE'}</span>
                  </div>
                )}
              </div>

              {/* Raw JSON Trace */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Raw Telemetry Document</span>
                  <button
                    onClick={copyRawJson}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                  >
                    {copiedRaw ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedRaw ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
