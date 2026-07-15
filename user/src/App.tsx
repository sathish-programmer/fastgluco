import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Login } from './pages/Login';
import { RecommendedFoodsScreen } from './screens/RecommendedFoodsScreen';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { NonCancerDashboard } from './pages/NonCancerDashboard';
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
import {
  Home,
  FileText,
  Utensils,
  Activity,
  UserCircle2,
  Heart,
  BookOpen,
  Moon,
  Sun,
  Calendar
} from 'lucide-react';
import { GlobalAICoachPopup } from './components/GlobalAICoachPopup';
import { NotificationBell } from './components/NotificationBell';
import { OnboardingTour } from './components/OnboardingTour';

import { DeleteAccount } from './pages/DeleteAccount';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, token, apiUrl, logout, branding, user } = useAuth();
  const { setTheme, isDark } = useTheme();

  // Navigation tabs: 'Home' | 'Reports' | 'Food Log' | 'Analysis' | 'Profile'
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setResetToken(tokenParam);
      // Remove query parameter from browser address bar silently
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Reset tab to Home and trigger onboarding tour for new users upon successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('Home');
      const completed = localStorage.getItem('fastgluco_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  // Scroll to top when active tab changes
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeTab]);


  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [checkingSub, setCheckingSub] = useState<boolean>(false);
  const [basicPlan, setBasicPlan] = useState<string>('Basic');
  const [planFeatures, setPlanFeatures] = useState<any>(null);

  useEffect(() => {
    const checkSubscription = async () => {
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
          } else {
            setIsSubscribed(false);
          }
        }
      } catch (err) {
        console.error(err);
        if (Capacitor.getPlatform() === 'ios') {
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false); // Default to restrictive instead of bypass
        }
      } finally {
        setCheckingSub(false);
      }
    };
    checkSubscription();
  }, [isAuthenticated, token, apiUrl]);

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

  if (isLoading || checkingSub) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-primary">
        <div className="flex flex-col items-center space-y-3">
          <Heart className="h-10 w-10 fill-primary animate-pulse" />
          <span className="font-bold text-slate-700 text-sm animate-pulse">{branding.appName} Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        resetToken={resetToken}
        onClearResetToken={() => setResetToken(null)}
      />
    );
  }

  if (isAuthenticated && !user?.name) {
    return <Register onNavigateToLogin={logout} />;
  }

  if (isSubscribed === false && branding.enableSubscriptions !== false) {
    return (
      <Subscription
        onBack={logout}
        onSuccess={() => setIsSubscribed(true)}
        isBlocking={true}
      />
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 h-full flex flex-col justify-between relative transition-colors duration-300">
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => {
            localStorage.setItem('fastgluco_onboarding_completed', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
      {/* Dynamic Header with safe area padding for mobile notches */}
      <header className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-10 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-w-5xl w-full mx-auto flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center space-x-2">
          {branding.appLogoUrl ? (
            <img src={branding.appLogoUrl} alt={branding.appName} className="h-6 w-auto object-contain max-w-[40px]" />
          ) : (
            <Heart className="h-5 w-5 fill-primary text-primary" />
          )}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight">{branding.appName}</h1>
              {branding.enableSubscriptions !== false && (
                <span className="text-[8px] font-bold bg-primary-light text-primary px-1.5 py-0.5 rounded-full">
                  {basicPlan}
                </span>
              )}
            </div>
            {branding.appTagline && (
              <span className="text-[9px] text-slate-500 leading-none mt-0.5">{branding.appTagline}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
        </div>
      </header>

      {/* Main Tab Screen Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {activeTab === 'Home' && (
          (user?.cancerJourney as string) === 'TREATMENT' || (user?.cancerJourney as string) === 'SECONDARY_PREVENTION' || (user?.cancerJourney as string) === 'CANCER TREATMENT' || (user?.cancerJourney as string) === 'CANCER SECONDARY PREVENTION [PREVIOUS HISTORY OF CANCER]'
            ? <Dashboard onNavigateToTab={setActiveTab} />
            : <NonCancerDashboard onNavigateToTab={setActiveTab} />
        )}
        {activeTab === 'Reports' && <Reports features={planFeatures} />}
        {activeTab === 'Food Log' && <FoodLog features={planFeatures} onNavigateToTab={setActiveTab} />}
        {activeTab === 'Recommended Foods' && <RecommendedFoodsScreen onBack={() => setActiveTab('Food Log')} />}
        {activeTab === 'Analysis' && <Analysis features={planFeatures} />}
        {activeTab === 'Profile' && <Profile />}
        {activeTab === 'Subscription' && <Subscription onBack={() => setActiveTab('Dashboard')} />}
        {activeTab === 'Educational' && <Educational />}
        {activeTab === 'Coaching' && <Coaching features={planFeatures} />}
        {activeTab === 'Book Appointment' && <BookAppointmentScreen />}
        {activeTab === 'Shop Orders' && <ShopOrdersHistoryScreen />}
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
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Home' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Home className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Home</span>
          </button>

          {/* Reports Tab */}
          {user?.cancerJourney !== 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Reports')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Reports' ? 'text-primary' : 'text-slate-400'}`}
            >
              <FileText className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Reports</span>
            </button>
          )}

          {/* Food Log Tab */}
          {user?.cancerJourney !== 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Food Log')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Food Log' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Utensils className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Food Log</span>
            </button>
          )}

          {/* Analysis Tab */}
          {user?.cancerJourney !== 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Analysis')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Analysis' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Activity className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Analysis</span>
            </button>
          )}

          {/* Educational Tab for Prevention Users */}
          {user?.cancerJourney === 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Educational')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Educational' ? 'text-primary' : 'text-slate-400'}`}
            >
              <BookOpen className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Learn</span>
            </button>
          )}

          {/* Book Appointment Tab */}
          {user?.cancerJourney === 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Book Appointment')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Book Appointment' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Calendar className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">Book Appointment</span>
            </button>
          )}

          {/* Shop Orders Tab — Non-cancer patients only */}
          {user?.cancerJourney === 'PREVENTION' && (
            <button
              onClick={() => setActiveTab('Shop Orders')}
              className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Shop Orders' ? 'text-primary' : 'text-slate-400'}`}
            >
              <Activity className="h-5.5 w-5.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">My Orders</span>
            </button>
          )}

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('Profile')}
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Profile' ? 'text-primary' : 'text-slate-400'}`}
          >
            <UserCircle2 className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Profile</span>
          </button>
        </div>
      </nav>
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
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
