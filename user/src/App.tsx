import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { FoodLog } from './pages/FoodLog';
import { Analysis } from './pages/Analysis';
import { Profile } from './pages/Profile';
import { Subscription } from './pages/Subscription';
import { Legal } from './pages/Legal';
import { Educational } from './pages/Educational';
import { Coaching } from './pages/Coaching';
import {
  Home,
  FileText,
  Utensils,
  Activity,
  UserCircle2,
  Heart
} from 'lucide-react';
import { GlobalAICoachPopup } from './components/GlobalAICoachPopup';
import { NotificationBell } from './components/NotificationBell';
import { OnboardingTour } from './components/OnboardingTour';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, token, apiUrl, logout } = useAuth();

  // Navigation tabs: 'Home' | 'Reports' | 'Food Log' | 'Analysis' | 'Profile'
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
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
            setIsSubscribed(!!hasActive);
          } else {
            setIsSubscribed(true);
          }
        } else {
          // Fallback to checking if they require sub
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error(err);
        setIsSubscribed(false); // Default to restrictive instead of bypass
      } finally {
        setCheckingSub(false);
      }
    };
    checkSubscription();
  }, [isAuthenticated, token, apiUrl]);

  if (isLoading || checkingSub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-primary">
        <div className="flex flex-col items-center space-y-3">
          <Heart className="h-10 w-10 fill-primary animate-pulse" />
          <span className="font-bold text-slate-700 text-sm animate-pulse">Mito Reboot Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onNavigateToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login 
        onNavigateToRegister={() => setAuthView('register')} 
        resetToken={resetToken}
        onClearResetToken={() => setResetToken(null)}
      />
    );
  }

  if (isSubscribed === false) {
    return (
      <Subscription
        onBack={logout}
        onSuccess={() => setIsSubscribed(true)}
        isBlocking={true}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => {
            localStorage.setItem('fastgluco_onboarding_completed', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
      {/* Dynamic Header with safe area padding for mobile notches */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-10 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 max-w-lg w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 fill-primary text-primary" />
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Mito Reboot</h1>
          <span className="text-[9px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
            {basicPlan}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationBell />
        </div>
      </header>

      {/* Main Tab Screen Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom)+70px)]">
        {activeTab === 'Home' && <Dashboard onNavigateToTab={(tab) => setActiveTab(tab)} features={planFeatures} />}
        {activeTab === 'Reports' && <Reports onNavigateToTab={(tab) => setActiveTab(tab)} features={planFeatures} />}
        {activeTab === 'Food Log' && <FoodLog />}
        {activeTab === 'Analysis' && <Analysis onNavigateToTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'Coaching' && <Coaching onNavigateToTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'Educational' && <Educational />}
        {activeTab === 'Profile' && <Profile onNavigateToTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'PrivacyPolicy' && <Legal type="PrivacyPolicy" />}
        {activeTab === 'TermsOfService' && <Legal type="TermsOfService" />}
      </main>

      <GlobalAICoachPopup />

      {/* Accessability-first Bottom Tab Navigation Menu with safe area padding */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-lg">
        <div className="max-w-lg mx-auto flex justify-around items-center">

          {/* Home Tab */}
          <button
            onClick={() => setActiveTab('Home')}
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Home' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Home className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Home</span>
          </button>

          {/* Reports Tab */}
          <button
            onClick={() => setActiveTab('Reports')}
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Reports' ? 'text-primary' : 'text-slate-400'}`}
          >
            <FileText className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Reports</span>
          </button>

          {/* Food Log Tab */}
          <button
            onClick={() => setActiveTab('Food Log')}
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Food Log' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Utensils className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Food Log</span>
          </button>

          {/* Analysis Tab */}
          <button
            onClick={() => setActiveTab('Analysis')}
            className={`flex flex-col items-center space-y-0.5 text-center ${activeTab === 'Analysis' ? 'text-primary' : 'text-slate-400'}`}
          >
            <Activity className="h-5.5 w-5.5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Analysis</span>
          </button>

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
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
