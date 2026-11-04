import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Bot,
  Users,
  Building,
  ShieldAlert,
  FileText,
  Settings,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Landmark,
  Search,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface RevenueAnalyticsHubProps {
  apiUrl: string;
  token: string;
  initialSubmenu?: string;
  onOpenOrder?: (orderId: string) => void;
  onOpenUser?: (userId: string) => void;
}

export const RevenueAnalyticsHub: React.FC<RevenueAnalyticsHubProps> = ({
  apiUrl,
  token,
  initialSubmenu = 'overview',
  onOpenOrder,
  onOpenUser
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>(initialSubmenu);

  useEffect(() => {
    if (initialSubmenu) {
      setActiveTab(initialSubmenu);
    }
  }, [initialSubmenu]);
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [transactionsData, setTransactionsData] = useState<any>(null);
  const [subscriptionsData, setSubscriptionsData] = useState<any>(null);
  const [userPaymentsData, setUserPaymentsData] = useState<any>(null);
  const [askMitoData, setAskMitoData] = useState<any>(null);
  const [shopSalesData, setShopSalesData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any>(null);
  const [refundsData, setRefundsData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);

  // Selected Transaction Modal
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Selected User Payment Drawer
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState<boolean>(false);

  // Transactions Filter States
  const [txPage, setTxPage] = useState<number>(1);
  const [txDepartment, setTxDepartment] = useState<string>('all');
  const [txStatus, setTxStatus] = useState<string>('all');
  const [txSearch, setTxSearch] = useState<string>('');

  // User Payments Filter
  const [userPage, setUserPage] = useState<number>(1);
  const [userSearch, setUserSearch] = useState<string>('');

  // Chart Type Toggle
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');

  const baseApi = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

  // Fetch Overview Data
  const fetchOverview = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      if (dateRange === 'custom') {
        if (customStart) params.append('customStart', customStart);
        if (customEnd) params.append('customEnd', customEnd);
      }
      const res = await fetch(`${baseApi}/admin/revenue-analytics/overview?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOverviewData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange, customStart, customEnd]);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(txPage),
        limit: '20',
        department: txDepartment,
        status: txStatus,
        q: txSearch
      });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setTransactionsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, txPage, txDepartment, txStatus, txSearch]);

  // Fetch Subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSubscriptionsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch User Payments
  const fetchUserPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(userPage),
        limit: '20',
        q: userSearch
      });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/user-payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUserPaymentsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, userPage, userSearch]);

  // Fetch Ask Mito
  const fetchAskMito = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/ask-mito?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAskMitoData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch Shop Sales
  const fetchShopSales = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/shop-sales?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setShopSalesData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/departments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDepartmentData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch Payment Methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/payment-methods?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPaymentMethodsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch Refunds
  const fetchRefunds = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`${baseApi}/admin/revenue-analytics/refunds?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRefundsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token, dateRange]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${baseApi}/admin/revenue-analytics/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSettingsData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [baseApi, token]);

  // Master Refresher
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchTransactions(),
      fetchSubscriptions(),
      fetchUserPayments(),
      fetchAskMito(),
      fetchShopSales(),
      fetchDepartments(),
      fetchPaymentMethods(),
      fetchRefunds(),
      fetchSettings()
    ]);
    setRefreshing(false);
    setLoading(false);
  }, [
    fetchOverview,
    fetchTransactions,
    fetchSubscriptions,
    fetchUserPayments,
    fetchAskMito,
    fetchShopSales,
    fetchDepartments,
    fetchPaymentMethods,
    fetchRefunds,
    fetchSettings
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Load User Details
  const handleOpenUserDetails = async (userId: string) => {
    setLoadingUserDetail(true);
    try {
      const res = await fetch(`${baseApi}/admin/revenue-analytics/user-payments/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedUserDetail(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Download Report Trigger
  const handleExport = (format: 'csv' | 'pdf', reportType: string = 'revenue_overview') => {
    const url = `${baseApi}/admin/revenue-analytics/reports/export?format=${format}&reportType=${reportType}&range=${dateRange}&token=${token}`;
    window.open(url, '_blank');
  };

  // Submenu Tabs definition
  const submenus = [
    { id: 'overview', label: 'Revenue Overview', icon: TrendingUp },
    { id: 'transactions', label: 'All Transactions', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Layers },
    { id: 'user-payments', label: 'User Payments', icon: Users },
    { id: 'ask-mito', label: 'Ask Mito Revenue', icon: Bot },
    { id: 'shop-sales', label: 'Shop & Product Sales', icon: ShoppingBag },
    { id: 'departments', label: 'Department Revenue', icon: Building },
    { id: 'payment-methods', label: 'Payment Methods', icon: Landmark },
    { id: 'refunds-failed', label: 'Refunds & Failed', icon: ShieldAlert },
    { id: 'reports', label: 'Revenue Reports', icon: FileText },
    { id: 'settings', label: 'Payment Settings', icon: Settings }
  ];

  const kpis = overviewData?.kpis;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* TOP HEADER & GLOBAL CONTROLS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Landmark className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Revenue &amp; Business Analytics
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                  Real-time
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized financial intelligence across Subscriptions, Shop Orders, Ask Mito, Consultations, and Bank Settlements
              </p>
            </div>
          </div>
        </div>

        {/* Global Date Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Range Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer pr-2"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 text-slate-800 rounded font-semibold text-xs border-none outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-slate-800 rounded font-semibold text-xs border-none outline-none"
              />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Refresh financial data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf', 'executive_revenue_report')}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Report
          </button>

          {/* CSV Export */}
          <button
            onClick={() => handleExport('csv', 'transactions_ledger')}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* SUBMENU TAB BAR */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {submenus.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TAB 1: REVENUE OVERVIEW DASHBOARD
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 12 Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 1. Total Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Revenue</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  ₹{kpis?.totalRevenue?.toLocaleString('en-IN') ?? '0'}
                </span>
                {kpis?.growth?.revenueGrowth !== undefined && (
                  <span className={`inline-flex items-center text-xs font-black ${kpis.growth.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.growth.revenueGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {kpis.growth.revenueGrowth >= 0 ? `+${kpis.growth.revenueGrowth}%` : `${kpis.growth.revenueGrowth}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Gross billing across all channels</p>
            </div>

            {/* 2. Amount Collected */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Amount Collected</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  ₹{kpis?.totalAmountCollected?.toLocaleString('en-IN') ?? '0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Gross customer payments received</p>
            </div>

            {/* 3. Net Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Net Revenue</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  ₹{kpis?.netRevenue?.toLocaleString('en-IN') ?? '0'}
                </span>
                {kpis?.growth?.netRevenueGrowth !== undefined && (
                  <span className={`inline-flex items-center text-xs font-black ${kpis.growth.netRevenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.growth.netRevenueGrowth >= 0 ? `+${kpis.growth.netRevenueGrowth}%` : `${kpis.growth.netRevenueGrowth}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Collections after deducting refunds</p>
            </div>

            {/* 4. Actual Settled to Bank */}
            <div className="bg-emerald-900 text-white p-5 rounded-3xl border border-emerald-800 shadow-md space-y-2">
              <span className="text-[11px] font-black uppercase text-emerald-300 tracking-wider">Settled to Bank</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">
                  ₹{kpis?.actualSettledToBank?.toLocaleString('en-IN') ?? '0'}
                </span>
                <Landmark className="w-4 h-4 text-emerald-300" />
              </div>
              <p className="text-[11px] text-emerald-200">Net payout after gateway deductions</p>
            </div>

            {/* 5. Pending Settlements */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Pending Settlements</span>
              <span className="text-2xl font-black text-amber-600 block">
                ₹{kpis?.pendingSettlements?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Rolling T+2 bank payout pipeline</p>
            </div>

            {/* 6. Total Transactions */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Transactions</span>
              <span className="text-2xl font-black text-slate-900 block">
                {kpis?.totalTransactions ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Checkout sessions initiated</p>
            </div>

            {/* 7. Successful Payments */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Successful Payments</span>
              <span className="text-2xl font-black text-emerald-600 block">
                {kpis?.successfulPayments ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Captured and verified orders</p>
            </div>

            {/* 8. Failed Payments */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Failed Payments</span>
              <span className="text-2xl font-black text-rose-600 block">
                {kpis?.failedPayments ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Abandoned or bank declined</p>
            </div>

            {/* 9. Total Refunds */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Refunds</span>
              <span className="text-2xl font-black text-rose-500 block">
                ₹{kpis?.totalRefunds?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Reversed customer payments</p>
            </div>

            {/* 10. Active Paid Subscribers */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Paid Subs</span>
              <span className="text-2xl font-black text-primary block">
                {kpis?.activePaidSubscribers ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Excludes trial &amp; expired</p>
            </div>

            {/* 11. Total Paying Users */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Paying Customers</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {kpis?.totalPayingUsers ?? '0'}
                </span>
                {kpis?.growth?.payingUsersGrowth !== undefined && (
                  <span className="text-xs font-black text-emerald-600">
                    +{kpis.growth.payingUsersGrowth}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Unique patients who made purchases</p>
            </div>

            {/* 12. ARPPU */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">ARPPU</span>
              <span className="text-2xl font-black text-indigo-600 block">
                ₹{kpis?.arppu?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Avg Revenue Per Paying User</p>
            </div>
          </div>

          {/* REVENUE GROWTH CHARTS WITH TOGGLES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Revenue Growth Analytics</h3>
                <p className="text-xs text-slate-500">Gross revenue vs net customer collections over time</p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartType === 'area' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartType === 'line' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Line
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {overviewData?.timeline && overviewData.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={overviewData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      />
                      <Bar dataKey="gross" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Gross Collections" />
                      <Bar dataKey="net" fill="#10B981" radius={[6, 6, 0, 0]} name="Net Revenue" />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={overviewData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      />
                      <Line type="monotone" dataKey="gross" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Gross Collections" />
                      <Line type="monotone" dataKey="net" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Net Revenue" />
                    </LineChart>
                  ) : (
                    <AreaChart data={overviewData.timeline}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      />
                      <Area type="monotone" dataKey="gross" stroke="#3B82F6" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2.5} name="Gross" />
                      <Area type="monotone" dataKey="net" stroke="#10B981" fillOpacity={1} fill="url(#colorNet)" strokeWidth={2.5} name="Net" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                  No transaction data available for the selected period.
                </div>
              )}
            </div>
          </div>

          {/* 10-POINT FINANCIAL RECONCILIATION CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                  Actual Revenue vs Bank Settlement Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive audit trail distinguishing gross customer payments, gateway deductions, and net platform earnings
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                Audited Formula
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Gross Billing</span>
                <span className="text-base font-bold text-white">₹{kpis?.totalRevenue?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">2. Coupons / Discounts</span>
                <span className="text-base font-bold text-emerald-400">-₹{(kpis?.totalRevenue - kpis?.totalAmountCollected)?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Customer Collections</span>
                <span className="text-base font-bold text-white">₹{kpis?.totalAmountCollected?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-400 block">4. Total Refunds</span>
                <span className="text-base font-bold text-rose-400">-₹{kpis?.totalRefunds?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">5. Net Collections</span>
                <span className="text-base font-bold text-white">₹{kpis?.netRevenue?.toLocaleString('en-IN') ?? '0'}</span>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">6. Est. Gateway Fees</span>
                <span className="text-base font-bold text-amber-400">~₹{kpis?.estimatedGatewayFees?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">7. Vendor/Doctor Payable</span>
                <span className="text-base font-bold text-white">₹{kpis?.vendorPayable?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">8. Settled to Bank</span>
                <span className="text-base font-black text-emerald-400">₹{kpis?.actualSettledToBank?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">9. Pending Settlement</span>
                <span className="text-base font-bold text-amber-400">₹{kpis?.pendingSettlements?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-300 block">10. Mito Platform Earnings</span>
                <span className="text-lg font-black text-emerald-300">₹{kpis?.actualPlatformEarnings?.toLocaleString('en-IN') ?? '0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 2: ALL TRANSACTIONS
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search TX ID, Razorpay ID, User, or Item..."
                  value={txSearch}
                  onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Department Filter */}
              <select
                value={txDepartment}
                onChange={(e) => { setTxDepartment(e.target.value); setTxPage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Departments</option>
                <option value="Subscription Plans">Subscription Plans</option>
                <option value="Shop & Product Sales">Shop &amp; Product Sales</option>
                <option value="Ask Mito">Ask Mito</option>
              </select>

              {/* Status Filter */}
              <select
                value={txStatus}
                onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <button
              onClick={() => handleExport('csv', 'transactions')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Table CSV
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3.5 px-4">TX ID &amp; Gateway</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Department / Item</th>
                    <th className="py-3.5 px-4 text-right">Gross</th>
                    <th className="py-3.5 px-4 text-right">Discount</th>
                    <th className="py-3.5 px-4 text-right">Net Paid</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactionsData?.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 italic">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    transactionsData?.transactions?.map((t: any) => (
                      <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{t.transactionId}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {t.gatewayPaymentId !== '--' ? t.gatewayPaymentId : t.gatewayOrderId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{t.userName}</span>
                          <span className="text-[10px] text-slate-400 block">{t.userEmail}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-0.5 ${
                            t.department === 'Subscription Plans'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : t.department === 'Shop & Product Sales'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {t.department}
                          </span>
                          <div className="font-bold text-slate-800 truncate max-w-[200px]" title={t.itemTitle}>
                            {t.itemTitle}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                          ₹{t.grossAmount?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {t.discountAmount > 0 ? `-₹${t.discountAmount.toFixed(2)}` : '₹0.00'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{t.netAmount?.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            t.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : t.status === 'refunded'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {t.status === 'failed' && <XCircle className="w-3 h-3 text-rose-600" />}
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedTx(t)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {transactionsData?.pagination && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Showing page <span className="font-bold text-slate-900">{txPage}</span> of{' '}
                  <span className="font-bold text-slate-900">{transactionsData.pagination.totalPages || 1}</span> ({transactionsData.pagination.total} transactions)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={txPage <= 1}
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </button>
                  <button
                    disabled={txPage >= transactionsData.pagination.totalPages}
                    onClick={() => setTxPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 3: SUBSCRIPTIONS REVENUE & MRR
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Subscriptions Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">MRR</span>
              <span className="text-2xl font-black text-primary block">
                ₹{subscriptionsData?.kpis?.mrr?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Monthly Recurring Revenue</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">ARR</span>
              <span className="text-2xl font-black text-slate-900 block">
                ₹{subscriptionsData?.kpis?.arr?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Annualized Run-Rate</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active Paid Subs</span>
              <span className="text-2xl font-black text-emerald-600 block">
                {subscriptionsData?.kpis?.activePaidSubscribers ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Current paying members</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Churn Rate</span>
              <span className="text-2xl font-black text-amber-600 block">
                {subscriptionsData?.kpis?.churnRate ?? '0'}%
              </span>
              <p className="text-[11px] text-slate-400">Cancelled / Active ratio</p>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Active &amp; Historical Subscriptions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Plan / Cycle</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Auto-Renew</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {subscriptionsData?.subscriptions?.map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{s.userName}</span>
                        <span className="text-[10px] text-slate-400">{s.userEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{s.planName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{s.billingCycle}</span>
                      </td>
                      <td className="py-3 px-4">{new Date(s.startDate).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">{new Date(s.endDate).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                          s.status === 'cancelled' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${s.autoRenew ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {s.autoRenew ? 'ON' : 'OFF'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 4: USER PAYMENTS & REVENUE PROFILES
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'user-payments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search paying patient by name, email or mobile..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total Paying Customers: <span className="text-slate-900 font-black">{userPaymentsData?.pagination?.total ?? 0}</span>
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3.5 px-4">Patient Profile</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">Transactions</th>
                    <th className="py-3.5 px-4 text-right">Lifetime Paid</th>
                    <th className="py-3.5 px-4">Last Payment</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {userPaymentsData?.users?.map((u: any) => (
                    <tr key={u.userId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 block">{u.email}</span>
                        <span className="text-[10px] text-slate-400">{u.phone}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {u.transactionsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                        ₹{u.totalSpent?.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(u.lastPaymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenUserDetails(u.userId)}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          Payment History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 5: ASK MITO REVENUE
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'ask-mito' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Ask Mito Revenue</span>
              <span className="text-2xl font-black text-purple-600 block">
                ₹{askMitoData?.kpis?.totalRevenue?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">All-time medical consultation fees</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Period Revenue</span>
              <span className="text-2xl font-black text-slate-900 block">
                ₹{askMitoData?.kpis?.periodRevenue?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">In selected date filter</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Paid Consultations</span>
              <span className="text-2xl font-black text-emerald-600 block">
                {askMitoData?.kpis?.totalPaidQueries ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">₹{askMitoData?.kpis?.feePerQuery || 100} / Question</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Free Quota Used</span>
              <span className="text-2xl font-black text-slate-500 block">
                {askMitoData?.kpis?.totalFreeQuotaQueries ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Included with Membership</p>
            </div>
          </div>

          {/* Ask Mito Queries Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Recent Ask Mito Clinical Queries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Question Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {askMitoData?.recentQueries?.map((q: any) => (
                    <tr key={q._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {q.userName}
                        <span className="text-[10px] text-slate-400 block">{q.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 truncate max-w-[200px]" title={q.subject}>
                        {q.subject}
                      </td>
                      <td className="py-3 px-4">{q.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.isFreeQuotaUsed ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {q.isFreeQuotaUsed ? 'Subscription Quota' : 'Paid Consultation'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{q.amountPaid?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          q.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(q.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 6: SHOP & PRODUCT SALES REVENUE
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'shop-sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Gross Product Sales</span>
              <span className="text-2xl font-black text-slate-900 block">
                ₹{shopSalesData?.kpis?.grossProductSales?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Total customer cart checkouts</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Mito Platform Retention</span>
              <span className="text-2xl font-black text-emerald-600 block">
                ₹{shopSalesData?.kpis?.platformCommission?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">30% Platform commission share</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Vendor Payables</span>
              <span className="text-2xl font-black text-slate-700 block">
                ₹{shopSalesData?.kpis?.vendorPayables?.toLocaleString('en-IN') ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Payable to Arivu &amp; partner brands</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Successful Orders</span>
              <span className="text-2xl font-black text-primary block">
                {shopSalesData?.kpis?.successfulOrders ?? '0'}
              </span>
              <p className="text-[11px] text-slate-400">Completed order shipments</p>
            </div>
          </div>

          {/* Vendor-wise breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Vendor Sales &amp; Commission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3 px-4">Vendor Partner</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Gross Sales</th>
                    <th className="py-3 px-4 text-right">Vendor Share (70%)</th>
                    <th className="py-3 px-4 text-right">Mito Commission (30%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {shopSalesData?.vendorBreakdown?.map((v: any) => (
                    <tr key={v.vendorName} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.vendorName}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{v.orderCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{v.grossSales?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">₹{v.vendorPayable?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">₹{v.platformCommission?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 7: DEPARTMENT-WISE REVENUE
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-black text-slate-900">Department Revenue Matrix</h3>
            <p className="text-xs text-slate-500">
              Total Net Revenue in selected period: <span className="font-bold text-slate-900">₹{departmentData?.grandTotalNet?.toLocaleString('en-IN') ?? '0'}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentData?.departments?.map((dept: any) => (
              <div key={dept.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-black text-slate-900">{dept.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{dept.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white font-black text-xs">
                    {dept.contributionPercentage}%
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Revenue:</span>
                    <span className="font-black text-slate-900">₹{dept.netRevenue?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paying Users:</span>
                    <span className="font-bold text-slate-800">{dept.payingUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Transactions:</span>
                    <span className="font-bold text-slate-800">{dept.transactionsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discounts Applied:</span>
                    <span className="font-semibold text-emerald-600">-₹{dept.discounts?.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTxDepartment(dept.name);
                    setActiveTab('transactions');
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  View Department Transactions
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 8: PAYMENT METHODS ANALYTICS
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethodsData?.methods?.map((m: any) => (
              <div key={m.method} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{m.method}</span>
                <span className="text-2xl font-black text-slate-900 block">
                  ₹{m.collected?.toLocaleString('en-IN')}
                </span>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Share: <strong className="text-slate-800">{m.contributionPercentage}%</strong></span>
                  <span>Transactions: <strong className="text-slate-800">{m.count}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 9: REFUNDS & FAILED PAYMENTS
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'refunds-failed' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs uppercase font-bold text-slate-400 block">Failed Checkouts</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {refundsData?.failedCount ?? 0}
              </span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs uppercase font-bold text-slate-400 block">Processed Refunds</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">
                {refundsData?.refundCount ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Recent Failed Checkout Attempts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-left">
                  <tr>
                    <th className="py-3 px-4">Identifier</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {refundsData?.failedTransactions?.map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{f.identifier}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{f.userName}</span>
                        <span className="text-[10px] text-slate-400">{f.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{f.amount?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{f.failureReason}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 10: REVENUE REPORTS & ONE-CLICK EXPORTS
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-base font-black text-slate-900">Downloadable Business Financial Reports</h3>
            <p className="text-xs text-slate-500">
              One-click instant report exports with verified calculations, taxes, discounts, and audit totals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'daily_revenue_report', name: 'Daily Revenue Report', desc: 'Granular breakdown of daily collections and refunds.' },
              { id: 'monthly_revenue_report', name: 'Monthly Executive Report', desc: 'Complete monthly financial audit for executive review.' },
              { id: 'department_revenue_report', name: 'Department-wise Report', desc: 'Revenue matrix across Subscriptions, Shop, and Consultations.' },
              { id: 'subscriptions_report', name: 'Subscriptions & MRR Report', desc: 'Recurring revenue, subscriber growth, and churn metrics.' },
              { id: 'vendor_sales_report', name: 'Vendor & Shop Sales Report', desc: 'Arivu Foods orders, commissions, shipping, and vendor payables.' },
              { id: 'refunds_report', name: 'Refunds & Chargebacks Report', desc: 'Full audit ledger of reversed payments and cancellation fees.' }
            ].map((report) => (
              <div key={report.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-black text-slate-900">{report.name}</h4>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">{report.desc}</p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleExport('pdf', report.id)}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('csv', report.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 11: PAYMENT SETTINGS & RAZORPAY INTEGRATION
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Razorpay Integration &amp; Settlement Synchronization
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage payment keys, verify webhook status, and trigger live settlement sync with Razorpay
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              settingsData?.isSandbox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {settingsData?.isSandbox ? 'Sandbox Mode' : 'Production Live'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-slate-500 block">Razorpay Key ID:</span>
              <span className="font-mono font-bold text-sm text-slate-900">{settingsData?.razorpayKeyIdMasked || 'Configured'}</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-slate-500 block">Webhook URL:</span>
              <span className="font-mono text-xs text-slate-800 break-all">{settingsData?.webhookUrl}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-emerald-900">Synchronize Bank Settlements from Razorpay API</h4>
              <p className="text-[11px] text-emerald-700">
                Pulls the latest bank transfer references and settlement status from Razorpay's servers.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${baseApi}/admin/revenue-analytics/sync-razorpay`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  const json = await res.json();
                  alert(json.success ? `Successfully synced ${json.count} settlements from Razorpay.` : json.message);
                } catch (e: any) {
                  alert('Error syncing settlements: ' + e.message);
                }
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Sync Settlements Now
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: TRANSACTION DETAILS
      ───────────────────────────────────────────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.transactionId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">{selectedTx.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Razorpay Order ID:</span>
                  <span className="font-mono text-slate-800">{selectedTx.gatewayOrderId || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Razorpay Payment ID:</span>
                  <span className="font-mono text-slate-800">{selectedTx.gatewayPaymentId || '--'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer:</span>
                <span className="font-bold text-slate-900 text-sm block">{selectedTx.userName}</span>
                <span className="text-slate-500 block">{selectedTx.userEmail} • {selectedTx.userPhone}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Item / Plan:</span>
                <span className="font-bold text-slate-800">{selectedTx.itemTitle}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Amount:</span>
                  <span className="font-bold text-slate-900">₹{selectedTx.grossAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount ({selectedTx.couponCode || 'None'}):</span>
                  <span className="font-semibold text-emerald-600">-₹{selectedTx.discountAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax (18% GST Included):</span>
                  <span className="font-semibold text-slate-700">₹{selectedTx.taxAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100">
                  <span className="text-slate-900">Net Paid:</span>
                  <span className="text-emerald-600">₹{selectedTx.netAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              {onOpenOrder && selectedTx.referenceId && (
                <button
                  onClick={() => {
                    onOpenOrder(selectedTx.referenceId);
                    setSelectedTx(null);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-all"
                >
                  View Order
                </button>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading User Detail Overlay */}
      {loadingUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-2xs flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-bold text-slate-700">Loading user financial records...</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          DRAWER: USER FINANCIAL PROFILE
      ───────────────────────────────────────────────────────────────── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedUserDetail.user.name}</h3>
                <p className="text-xs text-slate-500">{selectedUserDetail.user.email} • {selectedUserDetail.user.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenUser && selectedUserDetail.user?._id && (
                  <button
                    onClick={() => {
                      onOpenUser(selectedUserDetail.user._id);
                      setSelectedUserDetail(null);
                    }}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                  >
                    Clinical Profile
                  </button>
                )}
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spent</span>
                <span className="text-lg font-black text-slate-900">₹{selectedUserDetail.summary.totalSpent?.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Refunds</span>
                <span className="text-lg font-black text-rose-500">₹{selectedUserDetail.summary.totalRefunds?.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Lifetime</span>
                <span className="text-lg font-black text-emerald-600">₹{selectedUserDetail.summary.netSpent?.toFixed(2)}</span>
              </div>
            </div>

            {/* Transactions History */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400">Payment Transactions ({selectedUserDetail.transactions?.length ?? 0})</h4>
              <div className="space-y-2">
                {selectedUserDetail.transactions?.map((t: any) => (
                  <div key={t._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{t.planId?.name || 'Subscription'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.gatewayOrderId}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">₹{t.amount?.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold">{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders History */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400">Shop Orders ({selectedUserDetail.orders?.length ?? 0})</h4>
              <div className="space-y-2">
                {selectedUserDetail.orders?.map((o: any) => (
                  <div key={o._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{o.vendorId?.name || 'Arivu Foods'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">₹{o.totalAmount?.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
