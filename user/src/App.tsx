import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConsultationProvider } from './context/ConsultationContext';
import { Login } from './pages/Login';
import { RecommendedFoodsScreen } from './screens/RecommendedFoodsScreen';
import { Register } from './pages/Register';
import { NonCancerDashboard } from './pages/NonCancerDashboard';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { FoodLog } from './pages/FoodLog';
import { Analysis } from './pages/Analysis';
import { Profile } from './pages/Profile';
import { Subscription } from './pages/Subscription';
import { Legal } from './pages/Legal';
import { Educational } from './pages/Educational';
import { Coaching } from './pages/Coaching';
import { BookAppointmentScreen } from './screens/Appointment/BookAppointmentScreen';
import { ShopOrdersHistoryScreen } from './screens/Shop/ShopOrdersHistoryScreen';
import { ProductRatingScreen } from './screens/Shop/ProductRatingScreen';
import {
  Home,
  FileText,
  Utensils,
  Activity,
  UserCircle2,
  Heart,
  BookOpen,
  Calendar,
  Headphones,
  X,
  Bot,
  Sparkles,
  Crown,
  ShieldCheck
} from 'lucide-react';
import { AskMitoDrawer } from './components/AskMitoDrawer';
import { GlobalAICoachPopup } from './components/GlobalAICoachPopup';
import { NotificationBell } from './components/NotificationBell';
import { WelcomeOnboardingModal } from './components/WelcomeOnboardingModal';
import { TermsAndConditionsAcceptancePage, CURRENT_TERMS_VERSION } from './components/TermsAndConditionsAcceptancePage';
import { DeleteAccount } from './pages/DeleteAccount';
import { initNotificationScheduler } from './utils/notificationScheduler';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, token, apiUrl, logout, branding, user, activeMode } = useAuth();
  // Theme toggle moved to Profile settings

  // Navigation tabs: 'Home' | 'Reports' | 'Food Log' | 'Analysis' | 'Profile'
  const [activeTab, _setActiveTab] = useState<string>('Home');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['Home']);

  const setActiveTab = (tab: string | ((prev: string) => string)) => {
    const nextTab = typeof tab === 'function' ? tab(activeTab) : tab;
    _setActiveTab(nextTab);
    setNavigationHistory(prev => {
      // Don't add duplicate consecutive tabs
      if (prev[prev.length - 1] === nextTab) return prev;
      return [...prev, nextTab];
    });
  };
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [rateOrderId, setRateOrderId] = useState<string | null>(null);
  const [showCancerCGMDashboard, setShowCancerCGMDashboardState] = useState<boolean>(() => {
    return localStorage.getItem('mito_show_cgm_dashboard') === 'true';
  });

  const setShowCancerCGMDashboard = (show: boolean) => {
    localStorage.setItem('mito_show_cgm_dashboard', show ? 'true' : 'false');
    setShowCancerCGMDashboardState(show);
  };
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAskMitoDrawer, setShowAskMitoDrawer] = useState<boolean>(false);
  const [inAppReminder, setInAppReminder] = useState<{ title: string; body: string; type?: string } | null>(null);

  useEffect(() => {
    const handleTriggered = (e: any) => {
      setInAppReminder(e.detail);
    };
    const handleOpenAskMito = () => setShowAskMitoDrawer(true);
    window.addEventListener('mito_reminder_triggered', handleTriggered);
    window.addEventListener('open_ask_mito', handleOpenAskMito);
    return () => {
      window.removeEventListener('mito_reminder_triggered', handleTriggered);
      window.removeEventListener('open_ask_mito', handleOpenAskMito);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setResetToken(tokenParam);
      // Remove query parameter from browser address bar silently
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const rateOrderParam = params.get('rateOrder');
    if (rateOrderParam) {
      setRateOrderId(rateOrderParam);
      setActiveTab('RateProduct');
    }
    // Initialize & verify background notification scheduler
    initNotificationScheduler();
  }, []);

  // Reset tab to Home and trigger onboarding modal for new users upon successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      _setActiveTab('Home');
      setNavigationHistory(['Home']);
      const completed = localStorage.getItem('mito_welcome_onboarding_completed') || localStorage.getItem('fastgluco_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  // Listen to subScreenChange events to track header visibility
  const [isSubScreenActive, setIsSubScreenActive] = useState<boolean>(false);
  useEffect(() => {
    const handleSubScreen = (e: any) => {
      setIsSubScreenActive(!!e.detail);
    };
    const handleNav = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('subScreenChange', handleSubScreen);
    window.addEventListener('navigateToTab', handleNav);
    return () => {
      window.removeEventListener('subScreenChange', handleSubScreen);
      window.removeEventListener('navigateToTab', handleNav);
    };
  }, []);

  // Scroll to top when active tab or sub-screen changes
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab, isSubScreenActive, showCancerCGMDashboard]);

  // Reset sub-screen active state when changing tabs
  useEffect(() => {
    setIsSubScreenActive(false);
  }, [activeTab]);

  // Listen to Android hardware back button for stack-based navigation
  useEffect(() => {
    let active = true;
    let listener: any = null;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        if (!active) return;

        const handle = await App.addListener('backButton', () => {
          if (!active) return;

          // If a child view (like Profile settings subview) has captured/intercepted the back button
          if (activeTab === 'Profile' && (window as any).profileSubViewActive) {
            window.dispatchEvent(new CustomEvent('appBackButton'));
            return;
          }

          // If the Cancer CGM dashboard sub-view is active
          if (activeTab === 'Home' && showCancerCGMDashboard) {
            setShowCancerCGMDashboard(false);
            return;
          }

          // If a sub-screen on the Home dashboard is active
          if (activeTab === 'Home' && (window as any).activeSubScreen) {
            window.dispatchEvent(new CustomEvent('appBackButton'));
            return;
          }

          if (navigationHistory.length > 1) {
            const newHistory = [...navigationHistory];
            newHistory.pop(); // Remove the current tab
            const previousTab = newHistory[newHistory.length - 1];
            setNavigationHistory(newHistory);
            _setActiveTab(previousTab);
          } else {
            // Already at the Home tab, exit the app
            App.exitApp();
          }
        });

        if (!active) {
          handle.remove();
        } else {
          listener = handle;
        }
      } catch (err) {
        // Not in Capacitor environment
      }
    };

    setupBackButton();

    return () => {
      active = false;
      if (listener) {
        listener.remove();
      }
    };
  }, [activeTab, navigationHistory, showCancerCGMDashboard]);


  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [checkingSub, setCheckingSub] = useState<boolean>(false);
  const [basicPlan, setBasicPlan] = useState<string>('Basic');
  const [planFeatures, setPlanFeatures] = useState<any>(null);

  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsSubscribed(null);
      setCheckingSub(false);
      return;
    }
    setCheckingSub(true);
    try {
      const response = await fetch(`${apiUrl}/subscriptions/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.plan && data.plan.name) {
          setBasicPlan(data.plan.name);
          setPlanFeatures(data.plan.features || null);
        }
        if (data.subscriptionsRequired) {
          const sub = data.subscription;
          const hasActive = sub && (
            sub.status === 'active' ||
            sub.status === 'trialing' ||
            (sub.status === 'cancelled' && new Date(sub.endDate) > new Date())
          );
          // Bypass paywall entirely on iOS to comply with App Store Guidelines
          if (Capacitor.getPlatform() === 'ios') {
            setIsSubscribed(true);
            setPlanFeatures({
              unlimitedReports: true,
              advancedAnalysis: true,
              premiumVideos: true,
              foodInsights: true,
              exportReports: true,
              notifications: true,
              aiCoaching: true,
              foodScanner: true
            });
          } else {
            setIsSubscribed(!!hasActive);
          }
        } else {
          setIsSubscribed(true);
          setPlanFeatures({
            unlimitedReports: true,
            advancedAnalysis: true,
            premiumVideos: true,
            foodInsights: true,
            exportReports: true,
            notifications: true,
            aiCoaching: true,
            foodScanner: true
          });
        }
      } else {
        // Fallback to checking if they require sub
        if (Capacitor.getPlatform() === 'ios') {
          setIsSubscribed(true);
          setPlanFeatures({
            unlimitedReports: true,
            advancedAnalysis: true,
            premiumVideos: true,
            foodInsights: true,
            exportReports: true,
            notifications: true,
            aiCoaching: true,
            foodScanner: true
          });
        } else {
          setIsSubscribed(false);
        }
      }
    } catch (err) {
      console.error(err);
      if (Capacitor.getPlatform() === 'ios') {
        setIsSubscribed(true);
        setPlanFeatures({
          unlimitedReports: true,
          advancedAnalysis: true,
          premiumVideos: true,
          foodInsights: true,
          exportReports: true,
          notifications: true,
          aiCoaching: true,
          foodScanner: true
        });
      } else {
        setIsSubscribed(false); // Default to restrictive instead of bypass
      }
    } finally {
      setCheckingSub(false);
    }
  }, [isAuthenticated, token, apiUrl]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    if (branding.enableExternalPayments || branding.enableSubscriptions) {
      if (!document.getElementById('razorpay-script')) {
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [branding.enableExternalPayments, branding.enableSubscriptions]);

  if (!isAuthenticated) {
    return (
      <Login 
        resetToken={resetToken}
        onClearResetToken={() => setResetToken(null)}
      />
    );
  }

  if (isLoading || checkingSub) {
    const logoSrc = branding.appLogoUrl 
      ? (branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`)
      : '/icon.png';
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-primary-light text-primary rounded-[2.5rem] shadow-soft animate-pulse">
            <img 
              src={logoSrc} 
              alt="Logo" 
              className="h-24 w-24 object-contain rounded-3xl" 
            />
          </div>
          <span className="font-extrabold text-slate-700 text-sm tracking-wide animate-pulse">{branding.appName}</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !user?.name) {
    return <Register onNavigateToLogin={logout} />;
  }

  const hasAcceptedTerms = user?.termsAccepted === true && user?.acceptedTermsVersion === CURRENT_TERMS_VERSION;
  if (isAuthenticated && !hasAcceptedTerms) {
    return <TermsAndConditionsAcceptancePage />;
  }

  if (isSubscribed === false && branding.enableSubscriptions !== false) {
    return (
      <Subscription
        onBack={logout}
        onSuccess={() => {
          setIsSubscribed(true);
          checkSubscription();
        }}
        isBlocking={true}
      />
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 h-full flex flex-col justify-between relative transition-colors duration-300">
      <WelcomeOnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          localStorage.setItem('mito_welcome_onboarding_completed', 'true');
          localStorage.setItem('fastgluco_onboarding_completed', 'true');
          setShowOnboarding(false);
        }}
      />
      {/* Dynamic Header with safe area padding for mobile notches */}
      {!isSubScreenActive && activeTab !== 'Subscription' && activeTab !== 'Recommended Foods' && (
        <header className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 z-20 px-3.5 sm:px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 max-w-5xl w-full mx-auto flex items-center justify-between gap-1.5 transition-all duration-300">
          {/* Brand Identity */}
          <div className="flex items-center gap-2 min-w-0">
            {branding.appLogoUrl ? (
              <img
                src={branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`}
                alt={branding.appName}
                className="h-6 w-auto object-contain max-w-[36px] shrink-0"
              />
            ) : (
              <Heart className="h-5 w-5 fill-primary text-primary shrink-0" />
            )}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[13.5px] sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
                  {branding.appName ? branding.appName.replace(/_/g, ' ') : 'Mito Reboot'}
                </span>
                {branding.enableSubscriptions !== false && (
                  <button
                    onClick={() => setActiveTab('Subscription')}
                    className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 border shadow-2xs shrink-0 leading-none -translate-y-[2px] cursor-pointer hover:opacity-95 active:scale-95 transition-all ${
                      /premium|pro/i.test(basicPlan)
                        ? 'bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-yellow-500/15 dark:from-amber-500/25 dark:via-amber-400/30 dark:to-yellow-500/25 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-600/70 shadow-amber-500/10'
                        : 'bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-500/15 dark:from-emerald-500/25 dark:via-teal-500/30 dark:to-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-600/70 shadow-emerald-500/10'
                    }`}
                    title="View / Upgrade Plan"
                  >
                    {/premium|pro/i.test(basicPlan) ? (
                      <Crown className="h-2.5 w-2.5 text-amber-500 fill-amber-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="translate-y-[0.5px]">{basicPlan}</span>
                  </button>
                )}
              </div>
              {branding.appTagline && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none truncate max-w-[120px] sm:max-w-[180px] mt-1.5">
                  {branding.appTagline}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Ask Mito Button */}
            <button
              onClick={() => setShowAskMitoDrawer(true)}
              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:opacity-95 active:scale-95 text-white rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 shadow-xs border border-white/20 cursor-pointer"
              title="Ask Mito • Doctor Consultation"
            >
              <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
              <span>Ask Mito</span>
            </button>

            {/* Support / Help */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Help & Support"
              aria-label="Help & Support"
            >
              <Headphones className="h-4.5 w-4.5" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </header>
      )}

      {/* Main Tab Screen Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {activeTab === 'Home' && (
          (activeMode === 'TREATMENT')
            ? (showCancerCGMDashboard 
                ? <Dashboard onNavigateToTab={setActiveTab} onBackToTugOfWar={() => setShowCancerCGMDashboard(false)} />
                : <NonCancerDashboard onNavigateToTab={setActiveTab} onGoToCGMDashboard={() => setShowCancerCGMDashboard(true)} />
              )
            : <NonCancerDashboard onNavigateToTab={setActiveTab} />
        )}
        {activeTab === 'Reports' && <Reports features={planFeatures} />}
        {activeTab === 'Food Log' && <FoodLog features={planFeatures} onNavigateToTab={setActiveTab} />}
        {activeTab === 'Recommended Foods' && <RecommendedFoodsScreen onBack={() => setActiveTab('Food Log')} />}
        {activeTab === 'Analysis' && <Analysis features={planFeatures} />}
        {activeTab === 'Profile' && <Profile onNavigateToTab={setActiveTab} />}
        {activeTab === 'Subscription' && (
          <Subscription 
            onBack={() => setActiveTab('Dashboard')} 
            onSuccess={() => {
              checkSubscription();
              setActiveTab('Home');
            }} 
          />
        )}
        {activeTab === 'Educational' && <Educational />}
        {activeTab === 'Coaching' && <Coaching features={planFeatures} />}
        {activeTab === 'Book Appointment' && <BookAppointmentScreen />}
        {activeTab === 'Shop Orders' && (
          <ShopOrdersHistoryScreen onRateOrder={(orderId) => {
            setRateOrderId(orderId);
            setActiveTab('RateProduct');
          }} />
        )}
        {activeTab === 'RateProduct' && rateOrderId && (
          <ProductRatingScreen orderId={rateOrderId} onBack={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('rateOrder');
            window.history.replaceState({}, document.title, url.pathname + url.search);
            setRateOrderId(null);
            setActiveTab('Home');
          }} />
        )}
        {['Terms of Service', 'Privacy Policy', 'Data Deletion', 'Disclaimer', 'Refund Policy', 'Contact Us'].includes(activeTab) && (
          <Legal type={activeTab as any} onBack={() => setActiveTab('Profile')} />
        )}
      </main>

      <GlobalAICoachPopup />

      {/* Accessability-first Bottom Tab Navigation Menu with safe area padding */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-10 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex justify-around items-center">

          {/* Home Tab */}
          <button
            onClick={() => setActiveTab('Home')}
            className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Home' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Home className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Home</span>
          </button>

          {/* Reports Tab */}
          {(activeMode === 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Reports')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Reports' ? 'text-primary' : 'text-slate-400'}`}
            >
              <FileText className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Reports</span>
            </button>
          )}

          {/* Food Log Tab */}
          {(activeMode === 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Food Log')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Food Log' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Utensils className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Food Log</span>
            </button>
          )}

          {/* Analysis Tab */}
          {(activeMode === 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Analysis')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Analysis' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Activity className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Analysis</span>
            </button>
          )}

          {/* Educational Tab for Prevention Users */}
          {(activeMode !== 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Educational')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Educational' ? 'text-primary' : 'text-slate-400'}`}
            >
              <BookOpen className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Learn</span>
            </button>
          )}

          {/* Book Appointment Tab */}
          {(activeMode !== 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Book Appointment')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Book Appointment' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Calendar className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Book Appt</span>
            </button>
          )}

          {/* Shop Orders Tab — Non-treatment patients only */}
          {(activeMode !== 'TREATMENT') && (
            <button
              onClick={() => setActiveTab('Shop Orders')}
              className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Shop Orders' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Activity className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">My Orders</span>
            </button>
          )}

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('Profile')}
            className={`flex-1 flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Profile' ? 'text-primary' : 'text-slate-400'}`}
          >
            <UserCircle2 className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Profile</span>
          </button>
        </div>
      </nav>

      {/* Floating In-App Reminder Alert Card (Dynamic Light & Dark Theme) */}
      {inAppReminder && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] max-w-md w-[92%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-2xl border border-blue-200/80 dark:border-blue-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{inAppReminder.title}</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">{inAppReminder.body}</p>
          </div>
          <button
            onClick={() => {
              const type = inAppReminder.type;
              setInAppReminder(null);
              if (type === 'REPORT_UPLOAD') {
                setActiveTab('Reports');
              } else if (type === 'FASTING') {
                setActiveTab('Home');
              } else {
                window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
              }
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shrink-0 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            {inAppReminder.type === 'REPORT_UPLOAD' ? 'Upload' : inAppReminder.type === 'FASTING' ? 'Fasting' : 'Check in'}
          </button>
          <button
            onClick={() => setInAppReminder(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-800 shadow-xl text-center relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Help & Support</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Have questions or need assistance? Reach out to our support team directly via email.
            </p>
            <a
              href="mailto:support@mitoreboot.in"
              onClick={() => setShowHelpModal(false)}
              className="block w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
            >
              Email support@mitoreboot.in
            </a>
          </div>
        </div>
      )}

      {/* Global Ask Mito / Doctor Consultation Drawer */}
      <AskMitoDrawer
        isOpen={showAskMitoDrawer}
        onClose={() => setShowAskMitoDrawer(false)}
        onNavigateToTab={setActiveTab}
      />
    </div>
  );
};

export default function App() {
  const path = window.location.pathname.toLowerCase();
  
  // Public static routes that bypass authentication completely
  if (path === '/delete-account') {
    return <DeleteAccount />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ConsultationProvider>
          <ToastProvider>
            <MainAppContent />
          </ToastProvider>
        </ConsultationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
