import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  Key,
  Mail,
  Stethoscope,
  ShoppingCart,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  LogOut,
  Search,
  X,
  ChevronDown,
  Smartphone,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  HelpCircle,
  Bell,
  Video,
  Award
} from 'lucide-react';

interface AdminSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  setSearchQuery: (q: string) => void;
  paymentConfig: any;
  admin: any;
  logout: () => void;
  openGroups: { [key: string]: boolean };
  toggleGroup: (group: string) => void;
  activeDoctors?: any[];
  handleLaunchDoctorPortal?: (doc: any) => void;
  apiUrl?: string;
  token?: string;
  setActiveDoctors?: (docs: any[]) => void;
  setSelectedPatient?: (p: any) => void;
  pendingEditsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeView,
  setActiveView,
  setSearchQuery,
  paymentConfig,
  admin,
  logout,
  openGroups,
  toggleGroup,
  activeDoctors = [],
  handleLaunchDoctorPortal,
  apiUrl,
  token,
  setActiveDoctors,
  setSelectedPatient,
  pendingEditsCount = 0
}) => {
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [currentHash, setCurrentHash] = useState(() => 
    typeof window !== 'undefined' ? window.location.hash.replace(/^#\/?/, '').split('?')[0] : ''
  );

  useEffect(() => {
    const handleHashSync = () => {
      const h = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      setCurrentHash(h);
    };
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    setCurrentHash(viewId);
    setSearchQuery('');
    if (viewId === 'patient-activity' && setSelectedPatient) {
      setSelectedPatient(null);
    }
  };

  const renderSubItem = (
    viewId: string,
    label: string,
    badge?: string,
    badgeColor: 'emerald' | 'amber' | 'blue' = 'blue',
    icon?: React.ReactNode,
    onClickOverride?: () => void
  ) => {
    const query = sidebarSearch.trim().toLowerCase();
    if (query && !label.toLowerCase().includes(query) && !viewId.toLowerCase().includes(query)) return null;

    let isActive = false;
    if (viewId.includes('/')) {
      // Specific sub-route item (e.g. 'app-health/store-credentials', 'app-health/crashes', 'app-health/versions')
      isActive = currentHash === viewId;
    } else if (viewId === 'app-health') {
      // Base App Health Overview item: ONLY active if on app-health and not viewing a specific sub-tab
      isActive = activeView === 'app-health' && (!currentHash || currentHash === 'app-health' || currentHash === 'app-health/overview');
    } else {
      // Base portal routes
      isActive = activeView === viewId || currentHash === viewId;
    }

    return (
      <button
        key={viewId}
        type="button"
        onClick={() => {
          if (onClickOverride) {
            onClickOverride();
          } else {
            handleNavClick(viewId);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm shadow-blue-500/25 ring-1 ring-white/10'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-semibold'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon ? (
            icon
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-slate-600'}`} />
          )}
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
              badgeColor === 'emerald'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : badgeColor === 'amber'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const renderCollapsedIconItem = (
    viewId: string,
    label: string,
    icon: React.ReactNode,
    isActiveCheck?: () => boolean,
    badgeCount?: number
  ) => {
    const isActive = isActiveCheck ? isActiveCheck() : activeView === viewId;

    return (
      <button
        key={viewId}
        type="button"
        onClick={() => handleNavClick(viewId)}
        title={label}
        className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center relative transition-all cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/10'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
        }`}
      >
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-slate-900">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    );
  };

  const isGroupExpanded = (groupKey: string) => {
    if (sidebarSearch.trim()) return true;
    return openGroups[groupKey] !== false;
  };

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col shrink-0 bg-[#0c1322] text-slate-300 border-r border-slate-800/80 shadow-2xl z-30 transition-all duration-300 select-none ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b border-slate-800/80 flex items-center overflow-hidden bg-slate-900/40 shrink-0 ${
        sidebarCollapsed ? 'flex-col justify-center p-3 gap-2' : 'justify-between p-4 gap-2'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            {paymentConfig?.appLogoUrl ? (
              <img src={paymentConfig.appLogoUrl} alt="Logo" className="h-5 w-5 object-contain rounded-md" />
            ) : (
              <Activity className="h-4.5 w-4.5 text-white" />
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xs font-black text-white tracking-tight leading-tight truncate">
                {paymentConfig?.appName || 'Mito_Reboot'}
              </h1>
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">
                Clinical Admin
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-400 hover:text-white hidden md:flex items-center justify-center h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-xs font-bold">{sidebarCollapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Quick Menu Filter Input (Visible when expanded) */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              placeholder="Quick find menu..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-800/60 hover:bg-slate-800/90 text-xs text-white placeholder-slate-500 rounded-xl border border-slate-700/60 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Navigation Body */}
      <nav className={`flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin ${
        sidebarCollapsed ? 'p-2 space-y-2 flex flex-col items-center' : 'p-3 space-y-3.5'
      }`}>
        {/* COLLAPSED ICON DOCK (When sidebar is collapsed, show icons for all 9 sections) */}
        {sidebarCollapsed ? (
          <>
            {renderCollapsedIconItem('dashboard', 'Dashboard Overview', <LayoutDashboard className="h-5 w-5" />)}
            {renderCollapsedIconItem('patient-activity', 'Patient Activity Telemetry', <Activity className="h-5 w-5 text-emerald-400" />)}
            <div className="w-8 h-px bg-slate-800 my-1" />
            {renderCollapsedIconItem('users', 'Users & Clinical Staff', <Users className="h-5 w-5" />, () => ['users', 'otp-logs', 'sent-emails', 'pendingEdits', 'doctors-management', 'vendors-management', 'amazon-vendor', 'user-feedback'].includes(activeView), pendingEditsCount)}
            {renderCollapsedIconItem('appointments-upcoming', 'Appointments & Labs', <Calendar className="h-5 w-5" />, () => activeView.startsWith('appointments-') || ['screening-tests', 'partner-labs', 'consultation-analytics'].includes(activeView))}
            {renderCollapsedIconItem('store-products', 'Health Store & Orders', <ShoppingCart className="h-5 w-5" />, () => ['store-products', 'store-orders', 'store-reports', 'product-support'].includes(activeView) || activeView.startsWith('order-mgmt-'))}
            {renderCollapsedIconItem('revenue-overview', 'Revenue & Billing', <DollarSign className="h-5 w-5" />, () => activeView.startsWith('revenue-') || ['plans', 'coupons'].includes(activeView))}
            {renderCollapsedIconItem('foods', 'Content & Library', <FileText className="h-5 w-5" />, () => ['foods', 'recFoods', 'indian-cancers', 'videos', 'guides', 'notifications', 'faqs', 'healthInsights', 'tickets', 'stain-reviews'].includes(activeView))}
            {renderCollapsedIconItem('app-health', 'Telemetry & App Health', <Smartphone className="h-5 w-5" />, () => activeView.startsWith('app-health') || activeView === 'reports-analytics')}
            {renderCollapsedIconItem('payments', 'System Settings & AI', <Settings className="h-5 w-5" />, () => ['payments', 'daily-workflows', 'ask-mito-workflows', 'aicoach', 'founders', 'legal', 'app-user-terms'].includes(activeView))}
          </>
        ) : (
          /* EXPANDED FULL ACCORDION NAVIGATION */
          <>
            {/* 1. EXECUTIVE / CORE */}
            <div className="space-y-1">
              <p className="px-2 text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Executive
              </p>

              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/10'
                    : 'hover:bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Dashboard Overview</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('patient-activity')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'patient-activity'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/10'
                    : 'hover:bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Patient Activity Telemetry</span>
                </div>
              </button>
            </div>

            {/* 2. USERS & CLINICAL STAFF */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('users')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Users & Clinical
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingEditsCount > 0 && (
                    <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded">
                      {pendingEditsCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                      isGroupExpanded('users') ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isGroupExpanded('users') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('users', 'Patient Directory')}
                  {renderSubItem('otp-logs', 'OTP & Auth Logs', 'Live', 'amber', <Key className="w-3.5 h-3.5 text-amber-400" />)}
                  {renderSubItem('sent-emails', 'Sent Transaction Emails', 'Brevo', 'blue', <Mail className="w-3.5 h-3.5 text-blue-400" />)}
                  {renderSubItem('pendingEdits', 'Profile Edits', pendingEditsCount > 0 ? `${pendingEditsCount}` : undefined, 'amber')}
                  {renderSubItem('doctors-management', 'Doctors Management')}
                  {renderSubItem(
                    'doctor-portal-direct',
                    'Doctor Portal',
                    'Live',
                    'emerald',
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />,
                    async () => {
                      if (activeDoctors.length > 0 && handleLaunchDoctorPortal) {
                        handleLaunchDoctorPortal(activeDoctors[0]);
                      } else if (apiUrl && token && setActiveDoctors && handleLaunchDoctorPortal) {
                        try {
                          const res = await fetch(`${apiUrl}/admin/doctors`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            const docs = await res.json();
                            setActiveDoctors(docs);
                            if (docs.length > 0) {
                              handleLaunchDoctorPortal(docs[0]);
                              return;
                            }
                          }
                        } catch {}
                        handleNavClick('doctors-management');
                      } else {
                        handleNavClick('doctors-management');
                      }
                    }
                  )}
                  {renderSubItem('vendors-management', 'Vendors Management')}
                  {renderSubItem('amazon-vendor', 'Amazon Vendor Hub', 'Amazon', 'amber')}
                  {renderSubItem('user-feedback', 'User Feedback & Surveys')}
                </div>
              )}
            </div>

            {/* 3. APPOINTMENTS & DIAGNOSTICS */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('appointments')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Appointments & Labs
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('appointments') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('appointments') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('appointments-upcoming', 'Upcoming Consultations')}
                  {renderSubItem('appointments-calendar', 'Calendar View')}
                  {renderSubItem('appointments-completed', 'Completed History')}
                  {renderSubItem('appointments-cancelled', 'Cancelled Consultations')}
                  {renderSubItem('screening-tests', 'Screening Tests Directory')}
                  {renderSubItem('partner-labs', 'Partner Diagnostic Labs')}
                  {renderSubItem('consultation-analytics', 'Consultation Funnel')}
                </div>
              )}
            </div>

            {/* 4. HEALTH STORE & ORDERS */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('store')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Health Store & Orders
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('store') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('store') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('store-products', 'Products & Shipping Pincodes')}
                  {renderSubItem('store-orders', 'Store Orders Routing')}
                  {renderSubItem('order-mgmt-overview', 'Order Management Hub', 'Hub', 'emerald', <Package className="w-3.5 h-3.5 text-emerald-400" />)}
                  {renderSubItem('order-mgmt-orders', 'All Orders & Shipments')}
                  {renderSubItem('order-mgmt-refunds', 'Refunds & Cancellations')}
                  {renderSubItem('order-mgmt-support', 'Customer Support Inbox')}
                  {renderSubItem('store-reports', 'Sales Analytics Reports')}
                  {renderSubItem('product-support', 'Shop Product Support')}
                </div>
              )}
            </div>

            {/* 5. REVENUE & BILLING */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('revenueAnalytics')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Revenue & Billing
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('revenueAnalytics') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('revenueAnalytics') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('revenue-overview', 'Revenue Analytics Hub', 'Live', 'emerald', <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />)}
                  {renderSubItem('revenue-transactions', 'Invoices & Transactions')}
                  {renderSubItem('revenue-subscriptions', 'Subscriptions Analytics')}
                  {renderSubItem('revenue-user-payments', 'User Payments Log')}
                  {renderSubItem('revenue-refunds', 'Refunds & Failed Charges')}
                  {renderSubItem('revenue-settings', 'Payment & Tax Settings')}
                  {renderSubItem('payments', 'Payment Gateway (Razorpay/Cashfree)')}
                  {renderSubItem('plans', 'Subscription Plans & Tiers')}
                  {renderSubItem('coupons', 'Discounts & Promo Coupons')}
                </div>
              )}
            </div>

            {/* 6. CONTENT & CLINICAL LIBRARY */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('reports')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Content & Library
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('reports') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('reports') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('foods', 'Food Master Library')}
                  {renderSubItem('recFoods', 'Curated Food Protocols')}
                  {renderSubItem('indian-cancers', 'Indian Cancer Registry')}
                  {renderSubItem('videos', 'Educational Video Links', undefined, 'blue', <Video className="w-3.5 h-3.5 text-blue-400" />)}
                  {renderSubItem('guides', 'Educational Guides')}
                  {renderSubItem('notifications', 'Push Notifications Broadcast', undefined, 'blue', <Bell className="w-3.5 h-3.5 text-amber-400" />)}
                  {renderSubItem('faqs', 'FAQs Knowledgebase', undefined, 'blue', <HelpCircle className="w-3.5 h-3.5 text-slate-400" />)}
                  {renderSubItem('healthInsights', 'Health Insights', undefined, 'blue', <Award className="w-3.5 h-3.5 text-purple-400" />)}
                  {renderSubItem('tickets', 'Support Q&A Tickets')}
                  {renderSubItem('stain-reviews', 'Stain Photo Reviews')}
                </div>
              )}
            </div>

            {/* 7. TELEMETRY & APP HEALTH */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('telemetry')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Smartphone className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Telemetry & App Health
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('telemetry') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('telemetry') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('app-health', 'App Health Overview', 'Live', 'emerald', <Activity className="w-3.5 h-3.5 text-emerald-400" />)}
                  {renderSubItem('app-health/versions', 'Version Enforcement Rules', 'v6.3.3', 'blue', <Layers className="w-3.5 h-3.5 text-blue-400" />)}
                  {renderSubItem('app-health/crashes', 'Crash & ANR Diagnostics', undefined, 'amber', <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />)}
                  {renderSubItem('app-health/telemetry', 'Mobile Telemetry & Device Stats')}
                  {renderSubItem('app-health/store-credentials', 'Store Credentials & Keys')}
                  {renderSubItem('reports-analytics', 'Clinical Reports Analytics')}
                </div>
              )}
            </div>

            {/* 8. SYSTEM SETTINGS & AI WORKFLOWS */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('settings')}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-slate-500/10 text-slate-400">
                    <Settings className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    System Settings & AI
                  </span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${
                    isGroupExpanded('settings') ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isGroupExpanded('settings') && (
                <div className="pl-2 space-y-0.5 border-l-2 border-slate-800/80 ml-4 my-1">
                  {renderSubItem('payments', 'Payment Gateway & Branding', 'Config', 'emerald')}
                  {renderSubItem('daily-workflows', 'Daily Logging Workflows', 'Workflows', 'blue')}
                  {renderSubItem('ask-mito-workflows', 'Ask Mito • Patient Queries', 'AI', 'blue', <Sparkles className="w-3.5 h-3.5 text-indigo-400" />)}
                  {renderSubItem('aicoach', 'AI Coach & Clinical Rules')}
                  {renderSubItem('founders', 'Founders Section & Vision')}
                  {renderSubItem('legal', 'Legal Documents & Policies', undefined, 'blue', <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />)}
                  {renderSubItem('app-user-terms', 'App User Terms Acceptance')}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* User Profile & Sign Out Footer (Always Pinned to Bottom) */}
      <div className={`border-t border-slate-800/80 bg-slate-900/80 shrink-0 mt-auto ${
        sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
      }`}>
        {sidebarCollapsed ? (
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mb-1"
            title={admin?.name || 'Administrator'}
          >
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-white truncate leading-tight">
                {admin?.name || 'Administrator'}
              </span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                {admin?.role || 'Admin'}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className={`rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all cursor-pointer flex items-center justify-center ${
            sidebarCollapsed ? 'w-10 h-10' : 'w-full px-3 py-2 justify-start gap-2.5'
          }`}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
