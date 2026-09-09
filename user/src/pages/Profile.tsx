import React, { useState, useEffect } from 'react';
import { useAuth, type FocusModeType, type UserNotificationPreferences, type NotificationChannelPreferences } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import {
  ChevronRight,
  ArrowLeft,
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
  ShieldCheck,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Educational } from './Educational'; // import the sub-view
import { Subscription } from './Subscription';
import { Capacitor } from '@capacitor/core';
import { triggerTestNotification, scheduleDailyCheckinReminder, cancelDailyCheckinReminder } from '../utils/notificationScheduler';

const defaultNotifPrefs: UserNotificationPreferences = {
  push: {
    dailyCheckin: true,
    habitReminders: true,
    healthInsights: true,
    reportUpload: false,
    orderUpdates: true
  },
  email: {
    dailyCheckin: false,
    habitReminders: false,
    healthInsights: true,
    reportUpload: true,
    orderUpdates: true
  },
  sms: {
    dailyCheckin: false,
    habitReminders: false,
    healthInsights: false,
    reportUpload: false,
    orderUpdates: true
  }
};

export const Profile: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const { user, token, apiUrl, logout, updateProfile, isLoading, error, branding, setActiveMode } = useAuth();
  const { showToast } = useToast();
  const { setTheme, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isIOSAppStoreBlocked = Capacitor.getPlatform() === 'ios';

  // Tabs for profile section: 'settings' or 'education' or 'subscription' or 'notifications'
  const [subView, setSubView] = useState<'settings' | 'education' | 'subscription' | 'notifications'>('settings');

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

  // Dynamic Notification Preferences states
  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPreferences>(() => {
    if (user?.notificationPreferences?.push) {
      return {
        push: { ...defaultNotifPrefs.push, ...user.notificationPreferences.push },
        email: { ...defaultNotifPrefs.email, ...user.notificationPreferences.email },
        sms: { ...defaultNotifPrefs.sms, ...user.notificationPreferences.sms }
      };
    }
    const saved = localStorage.getItem('mito_notification_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          push: { ...defaultNotifPrefs.push, ...(parsed.push || {}) },
          email: { ...defaultNotifPrefs.email, ...(parsed.email || {}) },
          sms: { ...defaultNotifPrefs.sms, ...(parsed.sms || {}) }
        };
      } catch (e) {}
    }
    return defaultNotifPrefs;
  });

  const [checkinReminderTime, setCheckinReminderTime] = useState<string>(() => {
    return localStorage.getItem('mito_checkin_reminder_time') || '20:00';
  });
  const [isTestingNotif, setIsTestingNotif] = useState(false);

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

  const toggleChannelPref = (channel: 'push' | 'email' | 'sms', key: keyof NotificationChannelPreferences) => {
    setNotifPrefs(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key]
      }
    }));
  };

  const setAllChannelStatus = (channel: 'push' | 'email' | 'sms', enabled: boolean) => {
    setNotifPrefs(prev => ({
      ...prev,
      [channel]: {
        dailyCheckin: enabled,
        habitReminders: enabled,
        healthInsights: enabled,
        reportUpload: enabled,
        orderUpdates: enabled
      }
    }));
  };

  const setOnlyChannel = (onlyChannel: 'push' | 'email' | 'sms') => {
    setNotifPrefs({
      push: {
        dailyCheckin: onlyChannel === 'push',
        habitReminders: onlyChannel === 'push',
        healthInsights: onlyChannel === 'push',
        reportUpload: onlyChannel === 'push',
        orderUpdates: onlyChannel === 'push'
      },
      email: {
        dailyCheckin: onlyChannel === 'email',
        habitReminders: onlyChannel === 'email',
        healthInsights: onlyChannel === 'email',
        reportUpload: onlyChannel === 'email',
        orderUpdates: onlyChannel === 'email'
      },
      sms: {
        dailyCheckin: onlyChannel === 'sms',
        habitReminders: onlyChannel === 'sms',
        healthInsights: onlyChannel === 'sms',
        reportUpload: onlyChannel === 'sms',
        orderUpdates: onlyChannel === 'sms'
      }
    });
    showToast(`Set alerts to ${onlyChannel === 'push' ? 'Push Notifications' : onlyChannel.toUpperCase()} only.`, 'info');
  };

  const setEverywhereStatus = (enabled: boolean) => {
    setNotifPrefs({
      push: { dailyCheckin: enabled, habitReminders: enabled, healthInsights: enabled, reportUpload: enabled, orderUpdates: enabled },
      email: { dailyCheckin: enabled, habitReminders: enabled, healthInsights: enabled, reportUpload: enabled, orderUpdates: enabled },
      sms: { dailyCheckin: enabled, habitReminders: enabled, healthInsights: enabled, reportUpload: enabled, orderUpdates: enabled }
    });
    showToast(enabled ? 'All notification channels enabled.' : 'All alerts muted.', 'info');
  };

  const isChannelFullyActive = (channel: 'push' | 'email' | 'sms') => {
    return Object.values(notifPrefs[channel]).every(Boolean);
  };

  const isOnlyActiveChannel = (channel: 'push' | 'email' | 'sms') => {
    const isPushOn = Object.values(notifPrefs.push).some(Boolean);
    const isEmailOn = Object.values(notifPrefs.email).some(Boolean);
    const isSmsOn = Object.values(notifPrefs.sms).some(Boolean);
    if (channel === 'push') return isPushOn && !isEmailOn && !isSmsOn;
    if (channel === 'email') return isEmailOn && !isPushOn && !isSmsOn;
    if (channel === 'sms') return isSmsOn && !isPushOn && !isEmailOn;
    return false;
  };

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    try {
      await triggerTestNotification();
      showToast('Sent test notification! Sound & alert verified.', 'success');
    } catch (e) {
      showToast('Could not trigger test notification.', 'error');
    } finally {
      setTimeout(() => setIsTestingNotif(false), 800);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclaimerAccepted) {
      showToast('You must accept the disclaimer to select this journey.', 'error');
      return;
    }
    setSaveSuccess(false);

    // Save notification preferences locally and sync scheduler
    localStorage.setItem('mito_notification_preferences', JSON.stringify(notifPrefs));
    localStorage.setItem('mito_checkin_reminder_enabled', notifPrefs.push.dailyCheckin ? 'true' : 'false');
    localStorage.setItem('mito_checkin_reminder_time', checkinReminderTime);
    localStorage.setItem('mito_report_reminder_enabled', notifPrefs.push.reportUpload ? 'true' : 'false');

    if (notifPrefs.push.dailyCheckin) {
      scheduleDailyCheckinReminder(checkinReminderTime);
    } else {
      cancelDailyCheckinReminder();
    }

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
      cancerDisclaimerAcceptedAt: disclaimerAccepted ? new Date().toISOString() : undefined,
      notificationPreferences: notifPrefs,
      language
    });
    if (success) {
      if (setActiveMode) {
        await setActiveMode(cancerJourney);
      }
      showToast(t('profile.savedSuccessfully'), 'success');
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
            ← {t('backToProfileAria')}
          </button>
          <span className="font-bold text-slate-800 text-sm">{t('profile.educationCenter', 'Education Center')}</span>
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

  if (subView === 'notifications') {
    return (
      <div 
        className="pb-24 pt-4 px-4 max-w-4xl mx-auto bg-slate-50/70 dark:bg-slate-950/70 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        {/* Modern Subpage Top Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSubView('settings')}
              className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-all active:scale-95 cursor-pointer"
              aria-label="Back to Profile"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Notification Preferences
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Manage alerts across Push, Email & SMS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isTestingNotif}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{isTestingNotif ? 'Testing...' : 'Test Audio'}</span>
          </button>
        </div>

        {/* Quick Channel Selection Presets */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft mb-4 transition-colors">
          <div className="mb-3">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Preferred Delivery Mode
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Select a 1-click delivery preset, or fine-tune individual alerts below:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setOnlyChannel('push')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                isOnlyActiveChannel('push')
                  ? 'bg-primary/10 border-primary text-primary dark:text-primary-light shadow-xs ring-1 ring-primary'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-primary" />
              <span>{t('pushOnly')}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyChannel('email')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                isOnlyActiveChannel('email')
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>{t('emailOnly')}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyChannel('sms')}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                isOnlyActiveChannel('sms')
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>{t('smsOnly')}</span>
            </button>

            <button
              type="button"
              onClick={() => setEverywhereStatus(true)}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                isChannelFullyActive('push') && isChannelFullyActive('email') && isChannelFullyActive('sms')
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('allChannels')}</span>
            </button>

            <button
              type="button"
              onClick={() => setEverywhereStatus(false)}
              className="col-span-2 sm:col-span-1 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span>{t('muteAll')}</span>
            </button>
          </div>
        </div>

        {/* Matrix Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft mb-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Alert Matrix
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Customize each category per channel. Click channel header to toggle all.
              </p>
            </div>
          </div>
          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 sm:p-4 border border-slate-200/60 dark:border-slate-700/50 space-y-3">
            
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider items-center">
              <span className="col-span-6 sm:col-span-6">{t('profile.alertCategory', 'Alert Category')}</span>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setAllChannelStatus('push', !isChannelFullyActive('push'))}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                  title={t('togglePushTitle')}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>{t('pushLabel')}</span>
                </button>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setAllChannelStatus('email', !isChannelFullyActive('email'))}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-500 transition-colors cursor-pointer"
                  title={t('toggleEmailTitle')}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{t('emailLabel')}</span>
                </button>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setAllChannelStatus('sms', !isChannelFullyActive('sms'))}
                  className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-500 transition-colors cursor-pointer"
                  title={t('toggleSmsTitle')}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{t('smsLabel')}</span>
                </button>
              </div>
            </div>

            {/* Row 1: Daily Check-in */}
            <div className="grid grid-cols-12 gap-2 items-center py-2">
              <div className="col-span-6 sm:col-span-6 pr-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Daily Metabolic Check-in
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Scheduled prompts for daily oncology & metabolic habit logging
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{t('profile.timeLabel', 'Time:')}</span>
                  <input
                    type="time"
                    value={checkinReminderTime}
                    onChange={(e) => setCheckinReminderTime(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.push.dailyCheckin}
                  onChange={() => toggleChannelPref('push', 'dailyCheckin')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.email.dailyCheckin}
                  onChange={() => toggleChannelPref('email', 'dailyCheckin')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms.dailyCheckin}
                  onChange={() => toggleChannelPref('sms', 'dailyCheckin')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Row 2: Preventive Habits & Breathwork */}
            <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="col-span-6 sm:col-span-6 pr-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Habits & Breathwork
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Fasting windows, Box Breathing & stillness reminders
                </p>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.push.habitReminders}
                  onChange={() => toggleChannelPref('push', 'habitReminders')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.email.habitReminders}
                  onChange={() => toggleChannelPref('email', 'habitReminders')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms.habitReminders}
                  onChange={() => toggleChannelPref('sms', 'habitReminders')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Row 3: Clinical Health & Biomarkers */}
            <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="col-span-6 sm:col-span-6 pr-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Biomarkers & Spikes
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Glucose curve spikes, blood pressure & cycle alerts
                </p>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.push.healthInsights}
                  onChange={() => toggleChannelPref('push', 'healthInsights')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.email.healthInsights}
                  onChange={() => toggleChannelPref('email', 'healthInsights')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms.healthInsights}
                  onChange={() => toggleChannelPref('sms', 'healthInsights')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Row 4: Diagnostic & Medical Reports */}
            <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="col-span-6 sm:col-span-6 pr-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Report Upload Alerts
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Prompts to upload new blood tests & diagnostic records
                </p>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.push.reportUpload}
                  onChange={() => toggleChannelPref('push', 'reportUpload')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.email.reportUpload}
                  onChange={() => toggleChannelPref('email', 'reportUpload')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms.reportUpload}
                  onChange={() => toggleChannelPref('sms', 'reportUpload')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Row 5: Shop Orders & Deliveries */}
            <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="col-span-6 sm:col-span-6 pr-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Orders & Deliveries
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Order confirmation, shipment tracking & receipts
                </p>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.push.orderUpdates}
                  onChange={() => toggleChannelPref('push', 'orderUpdates')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.email.orderUpdates}
                  onChange={() => toggleChannelPref('email', 'orderUpdates')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-center">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms.orderUpdates}
                  onChange={() => toggleChannelPref('sms', 'orderUpdates')}
                  className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Dedicated Save Button */}
          <button
            type="button"
            onClick={async () => {
              localStorage.setItem('mito_notification_preferences', JSON.stringify(notifPrefs));
              localStorage.setItem('mito_checkin_reminder_enabled', notifPrefs.push.dailyCheckin ? 'true' : 'false');
              localStorage.setItem('mito_checkin_reminder_time', checkinReminderTime);
              localStorage.setItem('mito_report_reminder_enabled', notifPrefs.push.reportUpload ? 'true' : 'false');

              if (notifPrefs.push.dailyCheckin) {
                scheduleDailyCheckinReminder(checkinReminderTime);
              } else {
                cancelDailyCheckinReminder();
              }

              const success = await updateProfile({
                notificationPreferences: notifPrefs
              });

              if (success) {
                showToast('Notification preferences saved successfully!', 'success');
              } else {
                showToast('Preferences saved locally.', 'info');
              }
            }}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/95 dark:bg-primary-dark text-white font-bold py-3.5 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md disabled:opacity-50 mt-4 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{t('saveNotificationPrefs')}</span>
          </button>
        </div>
      </div>
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
              {user.cancerJourney === 'PREVENTION' && t('modes.preventionTitle', 'Cancer Prevention')}
              {user.cancerJourney === 'TREATMENT' && t('modes.treatmentTitle', 'Cancer Treatment')}
              {user.cancerJourney === 'SECONDARY_PREVENTION' && t('modes.secondaryPreventionTitle', 'Secondary Prevention')}
              {user.cancerJourney === 'AGEING' && t('modes.ageingTitle', 'Ageing & Longevity')}
              {user.cancerJourney === 'PCOD' && t('modes.pcodTitle', 'PCOD / PCOS Care')}
              {user.cancerJourney === 'DIABETES' && t('modes.diabetesTitle', 'Diabetes & Glucose')}
              {user.cancerJourney === 'HYPERTENSION' && t('modes.hypertensionTitle', 'Hypertension (HTN)')}
              {user.cancerJourney === 'PARKINSON' && t('modes.parkinsonTitle', "Parkinson's Care")}
              {user.cancerJourney === 'CARDIAC' && t('modes.cardiacTitle', 'Cardiac Health')}
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
                  {t('profile.liveCgmTracking', 'Live CGM Tracking')}
                </h4>
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{t('profile.cgmSubtext', 'Abbott Libre & Sugarfit Direct API')}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 text-[9px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs">
              {t('common.comingSoon', 'Coming Soon')}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 relative z-10">
            {t('profile.cgmComingSoonDesc', 'Direct live continuous sensor syncing will be launching soon. In the meantime, you can seamlessly upload your CGM reports (CSV/PDF) to track glucose curves and meal spikes!')}
          </p>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{t('profile.useManualReport', 'Use Manual Report Upload')}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('Reports');
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
            >
              {t('profile.uploadCsvPdf', 'Upload CSV/PDF')}
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
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">{t('profile.pendingReview', 'Pending Review')}</h4>
            <p className="text-[10px] text-amber-700 dark:text-amber-400/80 font-semibold mt-0.5 leading-relaxed">
              {t('profile.pendingReview')}
            </p>
          </div>
        </motion.div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm animate-in fade-in duration-200">
          {t('profile.savedSuccessfully')}
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
          <h4 className="text-[10px] font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-0.5">{t('profile.calorieRecommendation', 'My Calorie Recommendation')}</h4>
          <span className="text-base font-bold text-slate-800 dark:text-slate-100 block">
            {t('profile.kcalPerDay', { count: user?.dailyCalorieTarget || 2000 }, `${user?.dailyCalorieTarget || 2000} kcal / day`)}
          </span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 leading-relaxed">
            {t('profile.calorieRecommendationHint', 'Mifflin-St Jeor target calculated from your height, weight, and activity.')}{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/15883556/" target="_blank" rel="noreferrer" className="text-primary dark:text-primary-light hover:underline" onClick={(e) => e.stopPropagation()}>{t('profile.source', '[Source]')}</a>
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
          className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="h-4 w-4 text-primary dark:text-primary-light" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('profile.educationCenter', 'Educational Guides & Videos')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>

        {branding.enableSubscriptions !== false && !isIOSAppStoreBlocked && (
          <button
            onClick={() => setSubView('subscription')}
            className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-4 w-4 text-primary dark:text-primary-light" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('profile.subscriptionBilling', 'My Subscription & Billing')}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
        )}

        {/* Dedicated Notification Preferences Sub-view Menu Item */}
        <button
          type="button"
          onClick={() => setSubView('notifications')}
          className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all text-left cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Bell className="h-4 w-4 text-primary dark:text-primary-light" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('profile.notificationPreferences', 'Notification & Delivery Preferences')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>
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
            <span>{t('profile.profileConfig', 'Profile Configuration')}</span>
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.fullName', 'Full Name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.emailAddress', 'Email Address')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.mobileNumber', 'Mobile Number')}</label>
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
              <span>{t('profile.cancerJourney', 'Cancer Care Journey')}</span>
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
              <option value="PREVENTION">{t('modes.preventionTitle', 'Cancer Prevention')}</option>
              <option value="TREATMENT">{t('modes.treatmentTitle', 'Cancer Treatment')}</option>
              <option value="SECONDARY_PREVENTION">{t('modes.secondaryPreventionTitle', 'Secondary Prevention')}</option>
              <option value="AGEING">{t('modes.ageingTitle', 'Ageing & Longevity')}</option>
              <option value="PCOD">{t('modes.pcodTitle', 'PCOD / PCOS Care')}</option>
              <option value="DIABETES">{t('modes.diabetesTitle', 'Diabetes & Glucose')}</option>
              <option value="HYPERTENSION">{t('modes.hypertensionTitle', 'Hypertension (HTN)')}</option>
              <option value="PARKINSON">{t('modes.parkinsonTitle', "Parkinson's Care")}</option>
              <option value="CARDIAC">{t('modes.cardiacTitle', 'Cardiac Health')}</option>
            </select>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
              <span className={disclaimerAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                {disclaimerAccepted ? `✓ ${t('profile.disclaimerAccepted', 'Disclaimer Accepted')}` : `✗ ${t('profile.disclaimerNotAccepted', 'Disclaimer Declined / Not Accepted')}`}
              </span>
              <button
                type="button"
                onClick={() => setShowDisclaimer(true)}
                className="text-primary dark:text-primary-light hover:underline cursor-pointer"
              >
                {t('profile.readDisclaimer', 'Read Disclaimer')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.gender', 'Gender')}</label>
              <select
                value={gender}
                onChange={(e: any) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-705 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
              >
                <option value="Male">{t('profile.male', 'Male')}</option>
                <option value="Female">{t('profile.female', 'Female')}</option>
                <option value="Other">{t('profile.other', 'Other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.age', 'Age')}</label>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.height', 'Height (cm)')}</label>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.weight', 'Weight (kg)')}</label>
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.activityLevel', 'Activity Level')}</label>
            <select
              value={activityLevel}
              onChange={(e: any) => setActivityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
            >
              <option value="Sedentary">{t('profile.sedentary', 'Sedentary (no exercise)')}</option>
              <option value="Lightly active">{t('profile.lightlyActive', 'Lightly active (1-2 days/wk)')}</option>
              <option value="Moderately active">{t('profile.moderatelyActive', 'Moderately active (3-5 days/wk)')}</option>
              <option value="Very active">{t('profile.veryActive', 'Very active (6-7 days/wk)')}</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Calculator className="h-3.5 w-3.5 text-primary dark:text-primary-light" />
              <span>{t('profile.spikeThreshold', 'Spike Threshold (mg/dL)')}</span>
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
              {t('profile.spikeThresholdHint', 'Values above this peak will mark meals as Moderate or Avoid. Default is 90 mg/dL.')}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.currencyPreference', 'Currency Preference')}</label>
            <select
              value={currency}
              onChange={(e: any) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 cursor-pointer transition-all"
            >
              <option value="INR">{t('currencyInr')}</option>
              <option value="USD">{t('currencyUsd')}</option>
            </select>
          </div>

          {cancerJourney === 'PREVENTION' && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Globe className="h-4 w-4 text-primary dark:text-primary-light" />
                <span>{t('profile.shippingAddress', 'Default Shipping Address')}</span>
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.streetAddress', 'Street Address')}</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder={t('profile.streetAddressPlaceholder', 'e.g. Apartment, Suite, Road number')}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.city', 'City')}</label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder={t('profile.cityPlaceholder', 'e.g. Bangalore')}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.state', 'State')}</label>
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder={t('profile.statePlaceholder', 'e.g. Karnataka')}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.postalCode', 'Postal Code (PIN/ZIP)')}</label>
                <input
                  type="text"
                  value={addressPinCode}
                  onChange={(e) => setAddressPinCode(e.target.value)}
                  placeholder={t('profile.postalCodePlaceholder', 'e.g. 560001')}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all"
                />
              </div>
            </div>
          )}

          {/* App Language Section */}
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Globe className="h-4 w-4 text-primary dark:text-primary-light" />
              <span>{t('profile.appLanguage')}</span>
            </h4>
            <LanguageSelector variant="cards" />
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              {isDark ? <Moon className="h-4 w-4 text-primary dark:text-primary-light" /> : <Sun className="h-4 w-4 text-primary dark:text-primary-light" />}
              <span>{t('profile.appAppearance')}</span>
            </h4>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!isDark ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {t('profile.light')}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${isDark ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}
              >
                {t('profile.dark')}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/95 dark:bg-primary-dark text-white font-bold py-3 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{t('common.update')}</span>
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
          <span>{t('profile.legalAgreements', 'Legal & Agreement')}</span>
        </h4>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('Terms of Service')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all border border-slate-200/60 dark:border-slate-700/60 text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>{t('profile.masterDisclaimer', 'Master Disclaimer, Privacy Notice & Terms of Use')}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
          {user?.termsAccepted && (
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1 flex items-center space-x-1">
              <span>✓ {t('profile.termsAcceptedOn', { date: user.termsAcceptedAt ? new Date(user.termsAcceptedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'File' })} (v{user.acceptedTermsVersion || '1.0'})</span>
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
        className="w-full border border-rose-250 dark:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-4 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        <span>{t('auth.signOut')}</span>
      </motion.button>

      {/* Delete Account button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        onClick={() => setShowDeleteModal(true)}
        className="w-full text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 font-bold py-3 px-4 rounded-3xl flex items-center justify-center space-x-2 transition-all mb-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
      >
        <span>{t('profile.requestAccountDeletion', 'Request Account Deletion')}</span>
      </motion.button>

      {/* Trademark & Copyright Footer */}
      <div className="text-center py-3 mb-6 text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5">
        <p className="font-bold flex items-center justify-center gap-0.5">
          <span>{branding.appName || 'Mito Reboot'}</span>
          <span className="text-[8.5px] font-black text-blue-600 dark:text-blue-400 -translate-y-0.5 select-none">™</span>
          <span className="mx-1">•</span>
          <span>v5.4.0</span>
        </p>
        <p className="text-[9px] text-slate-400/80">
          © {new Date().getFullYear()} MitoReboot Private Limited. All rights reserved.
        </p>
      </div>

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
              <span>{t('profile.readDisclaimer', 'Medical Disclaimer')}</span>
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
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t('common.cancel', 'Decline')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 dark:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-soft cursor-pointer"
              >
                {t('common.confirm', 'I Understand & Accept')}
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
              <span>{t('profile.deleteAccountConfirmTitle', 'Delete Account')}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
              {t('profile.deleteAccountConfirmDesc', 'Are you sure you want to permanently delete your account? All your food logs, CGM reports, subscriptions, and health analysis data will be permanently erased. This action cannot be undone.')}
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft disabled:opacity-50 cursor-pointer"
              >
                {isDeletingAccount ? t('profile.deleting', 'Deleting...') : t('auth.deleteAccount', 'Delete Account')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
