import React, { useState, useEffect } from 'react';
import { useAuth, type FocusModeType } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronRight,
  LogOut,
  Sliders,
  Calculator,
  BookOpen,
  Sparkles,
  Save,
  CreditCard,
  Globe,
  Activity,
  Heart,
  Trash2,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Educational } from './Educational'; // import the sub-view
import { Subscription } from './Subscription';
import { Capacitor } from '@capacitor/core';

export const Profile: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const { user, token, apiUrl, logout, updateProfile, isLoading, error, branding, setActiveMode } = useAuth();
  const { showToast } = useToast();
  const { setTheme, isDark } = useTheme();
  const isIOSAppStoreBlocked = Capacitor.getPlatform() === 'ios';

  // Tabs for profile section: 'settings' or 'education' or 'subscription'
  const [subView, setSubView] = useState<'settings' | 'education' | 'subscription'>('settings');

  // Input states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobileNumber || '');
  const [age, setAge] = useState<string>(user?.age?.toString() || '30');
  const [height, setHeight] = useState<string>(user?.height?.toString() || '170');
  const [weight, setWeight] = useState<string>(user?.weight?.toString() || '70');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'Moderately active');
  const [spikeThreshold, setSpikeThreshold] = useState<string>(user?.spikeThreshold?.toString() || '140');
  const [currency, setCurrency] = useState<'INR' | 'USD'>((user?.currency as 'INR' | 'USD') || 'INR');
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 || '');
  const [addressCity, setAddressCity] = useState(user?.addressCity || '');
  const [addressState, setAddressState] = useState(user?.addressState || '');
  const [addressPinCode, setAddressPinCode] = useState(user?.addressPinCode || '');

  // Health Care Journey states
  const [cancerJourney, setCancerJourney] = useState<FocusModeType>(user?.cancerJourney || 'PREVENTION');
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(user?.cancerDisclaimerAccepted || false);

  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // LibreLinkUp states
  const [libreEmail, setLibreEmail] = useState(user?.libreEmail || '');
  const [librePassword, setLibrePassword] = useState(user?.librePassword || '');
  const [libreRegion, setLibreRegion] = useState(user?.libreRegion || 'ap');
  const [libreActive, setLibreActive] = useState(user?.libreActive || false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manage subView state signaling for Android hardware back button
  useEffect(() => {
    if (subView !== 'settings') {
      (window as any).profileSubViewActive = true;
    } else {
      (window as any).profileSubViewActive = false;
    }

    const handleBackEvent = () => {
      if (subView !== 'settings') {
        setSubView('settings');
      }
    };

    window.addEventListener('appBackButton', handleBackEvent);

    return () => {
      (window as any).profileSubViewActive = false;
      window.removeEventListener('appBackButton', handleBackEvent);
    };
  }, [subView]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclaimerAccepted) {
      showToast('You must accept the disclaimer to select this journey.', 'error');
      return;
    }
    setSaveSuccess(false);
    const success = await updateProfile({
      name,
      email,
      mobileNumber: mobile,
      age: parseInt(age, 10) || 30,
      height: parseFloat(height) || 170,
      weight: parseFloat(weight) || 70,
      gender,
      activityLevel,
      spikeThreshold: parseInt(spikeThreshold, 10) || 140,
      currency,
      addressLine1,
      addressCity,
      addressState,
      addressPinCode,
      libreEmail,
      librePassword,
      libreRegion,
      libreActive,
      cancerJourney,
      cancerDisclaimerAccepted: disclaimerAccepted,
      cancerDisclaimerAcceptedAt: disclaimerAccepted ? new Date().toISOString() : undefined
    });
    if (success) {
      if (setActiveMode) {
        await setActiveMode(cancerJourney);
      }
      showToast('Profile updated successfully!', 'success');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } else {
      showToast('Failed to update profile.', 'error');
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeletingAccount(true);
    try {
      const response = await fetch(`${apiUrl}/users/profile`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      showToast('Account successfully deleted.', 'success');
      logout();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete account. Please try again later or contact support.', 'error');
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${apiUrl}/users/profile/sync-libre`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'Sync completed successfully.', 'success');
      } else {
        showToast(data.message || 'Sync failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error during sync.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };
  void handleTriggerSync;
  void setLibreEmail;
  void setLibrePassword;
  void setLibreRegion;
  void setLibreActive;
  void isSyncing;
  void showGuide;
  void setShowGuide;

  if (subView === 'education') {
    return (
      <div>
        <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setSubView('settings')}
            className="text-sm font-semibold text-primary"
          >
            ← Back to Profile
          </button>
          <span className="font-bold text-slate-800 text-sm">Education Center</span>
          <div className="w-12"></div>
        </div>
        <Educational />
      </div>
    );
  }

  if (subView === 'subscription') {
    return (
      <Subscription onBack={() => setSubView('settings')} />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-slate-50/70 dark:bg-slate-950/70 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6 text-center"
      >
        <div className="inline-flex h-16 w-16 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full items-center justify-center text-2xl font-bold shadow-sm mb-3">
          {user?.name ? user.name.charAt(0) : 'P'}
        </div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">{user?.name || 'Patient'}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">{user?.email} {user?.mobileNumber && `• ${user.mobileNumber}`}</p>
        {user?.cancerJourney && (
          <div className="mt-2">
            <span className="inline-block px-3 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
              {user.cancerJourney === 'PREVENTION' && 'Cancer Prevention'}
              {user.cancerJourney === 'TREATMENT' && 'Active Cancer Treatment'}
              {user.cancerJourney === 'SECONDARY_PREVENTION' && 'Cancer Secondary Prevention'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Live CGM Tracking Feature Card (Coming Soon) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-6"
      >
        <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-slate-100 shadow-soft">
          {/* Background Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Live CGM Tracking
                </h4>
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Abbott Libre & Sugarfit Direct API</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 text-[9px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs">
              Coming Soon
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 relative z-10">
            Direct live continuous sensor syncing will be launching soon. In the meantime, you can seamlessly upload your CGM reports (CSV/PDF) to track glucose curves and meal spikes!
          </p>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Use Manual Report Upload</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('Reports');
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            >
              Upload CSV/PDF
            </button>
          </div>
        </div>
      </motion.div>

      {user?.pendingProfileEdits && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-3xl border border-amber-200 dark:border-amber-800/50 shadow-sm flex items-start space-x-3"
        >
          <div className="mt-0.5">
            <svg className="h-5 w-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Pending Review</h4>
            <p className="text-[10px] text-amber-700 dark:text-amber-400/80 font-semibold mt-0.5 leading-relaxed">
              Your recent profile updates are under review by our team. They will be applied once approved.
            </p>
          </div>
        </motion.div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm animate-in fade-in duration-200">
          Profile changes submitted for admin review successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-800/50 shadow-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* TDEE Recommendation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl shadow-[0_12px_24px_rgba(0,0,0,0.02)] mb-6 flex items-start space-x-3"
      >
        <Sparkles className="h-5 w-5 text-primary dark:text-primary-light shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-0.5">My Calorie Recommendation</h4>
          <span className="text-base font-bold text-slate-800 dark:text-slate-100 block">
            {user?.dailyCalorieTarget || 2000} kcal / day
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 leading-relaxed">
            Mifflin-St Jeor target calculated from your height, weight, and activity. <a href="https://pubmed.ncbi.nlm.nih.gov/15883556/" target="_blank" rel="noreferrer" className="text-primary dark:text-primary-light hover:underline" onClick={(e) => e.stopPropagation()}>[Source]</a>
          </p>
        </div>
      </motion.div>

      {/* Navigation Buttons for Subviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3 mb-6"
      >
        <button
          onClick={() => setSubView('education')}
          className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-4 w-4 text-primary dark:text-primary-light" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Educational Guides & Videos</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>

        {branding.enableSubscriptions !== false && !isIOSAppStoreBlocked && (
          <button
            onClick={() => setSubView('subscription')}
            className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-4 w-4 text-primary dark:text-primary-light" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">My Subscription & Billing</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        )}
      </motion.div>

      {/* Physical Profiling Update Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] mb-6"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
            <Sliders className="h-4 w-4 text-primary dark:text-primary-light" />
            <span>Profile Configuration</span>
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
          </div>


          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Activity className="h-3.5 w-3.5 text-primary dark:text-primary-light" />
              <span>Cancer Care Journey</span>
            </label>
            <select
              value={cancerJourney}
              onChange={(e: any) => {
                const val = e.target.value;
                setCancerJourney(val);
                setDisclaimerAccepted(false);
                setShowDisclaimer(true);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
            >
              <option value="PREVENTION">CANCER PREVENTION [NO HISTORY OF CANCER]</option>
              <option value="TREATMENT">CANCER TREATMENT</option>
              <option value="SECONDARY_PREVENTION">CANCER SECONDARY PREVENTION [PREVIOUS HISTORY OF CANCER]</option>
            </select>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
              <span className={disclaimerAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                {disclaimerAccepted ? '✓ Disclaimer Accepted' : '✗ Disclaimer Declined / Not Accepted'}
              </span>
              <button
                type="button"
                onClick={() => setShowDisclaimer(true)}
                className="text-primary dark:text-primary-light hover:underline"
              >
                Read Disclaimer
              </button>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-705 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age</label>
              <input
                type="number"
                step="any"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Height (cm)</label>
              <input
                type="number"
                step="any"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight (kg)</label>
              <input
                type="number"
                step="any"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e: any) => setActivityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
            >
              <option value="Sedentary">Sedentary (no exercise)</option>
              <option value="Lightly active">Lightly active (1-2 days/wk)</option>
              <option value="Moderately active">Moderately active (3-5 days/wk)</option>
              <option value="Very active">Very active (6-7 days/wk)</option>
            </select>
          </div>


          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calculator className="h-3.5 w-3.5 text-primary dark:text-primary-light" />
              <span>Spike Threshold (mg/dL)</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={spikeThreshold}
              onChange={(e) => setSpikeThreshold(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 leading-relaxed">
              Values above this peak will mark meals as "Moderate" or "Avoid". Default is 90 mg/dL.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency Preference</label>
            <select
              value={currency}
              onChange={(e: any) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          {cancerJourney === 'PREVENTION' && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Globe className="h-4 w-4 text-primary dark:text-primary-light" />
                <span>Default Shipping Address</span>
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Street Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Apartment, Suit, Road number"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Postal Code (PIN/ZIP)</label>
                <input
                  type="text"
                  value={addressPinCode}
                  onChange={(e) => setAddressPinCode(e.target.value)}
                  placeholder="e.g. 560001"
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                />
              </div>
            </div>
          )}

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              {isDark ? <Moon className="h-4 w-4 text-primary dark:text-primary-light" /> : <Sun className="h-4 w-4 text-primary dark:text-primary-light" />}
              <span>App Appearance</span>
            </h4>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!isDark ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${isDark ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Dark
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/95 dark:bg-primary-dark text-white font-bold py-3 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Update</span>
          </button>
        </form>
      </motion.div>

      {/* Legal & Agreements Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mb-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-3"
      >
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldCheck className="h-4 w-4 text-primary dark:text-primary-light" />
          <span>Legal & Agreement</span>
        </h4>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('Terms of Service')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-200/60 dark:border-slate-700/60 text-left"
          >
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Master Disclaimer, Privacy Notice & Terms of Use</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
          {user?.termsAccepted && (
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1 flex items-center space-x-1">
              <span>✓ Accepted on {user.termsAcceptedAt ? new Date(user.termsAcceptedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'File'} (v{user.acceptedTermsVersion || '1.0'})</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Logout button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={logout}
        className="w-full border border-rose-250 dark:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-4"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out Account</span>
      </motion.button>

      {/* Delete Account button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        onClick={() => setShowDeleteModal(true)}
        className="w-full text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-6 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/50"
      >
        <span>Request Account Deletion</span>
      </motion.button>

      {/* Disclaimer Modal Overlay */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-rose-500 dark:text-rose-400 fill-rose-500 dark:fill-rose-400/20" />
              <span>Medical Disclaimer</span>
            </h3>
            <div
              className="max-h-60 overflow-y-auto pr-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6 whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: cancerJourney === 'TREATMENT'
                  ? branding.cancerTreatmentDisclaimer
                  : cancerJourney === 'SECONDARY_PREVENTION'
                  ? branding.cancerSecondaryDisclaimer
                  : branding.cancerPreventionDisclaimer
              }}
            ></div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(false);
                  setShowDisclaimer(false);
                  setCancerJourney(user?.cancerJourney || 'PREVENTION');
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 dark:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft"
              >
                I Understand & Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400" />
              <span>Delete Account</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
              Are you sure you want to permanently delete your account? All your food logs, CGM reports, subscriptions, and health analysis data will be permanently erased. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
