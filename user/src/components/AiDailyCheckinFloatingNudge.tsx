import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, CheckCircle2, Mic, Bell, Clock, Check } from 'lucide-react';
import { scheduleDailyCheckinReminder, triggerTestNotification } from '../utils/notificationScheduler';
import { RoboAvatar } from './RoboAvatar';
import { useLanguage } from '../context/LanguageContext';

interface AiDailyCheckinFloatingNudgeProps {
  pendingHabitsCount: number;
  onOpenCheckin: () => void;
  userMode?: string;
}

export const AiDailyCheckinFloatingNudge: React.FC<AiDailyCheckinFloatingNudgeProps> = ({
  pendingHabitsCount,
  onOpenCheckin
}) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showReminderSettings, setShowReminderSettings] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '20:30');
  const [customTimeInput, setCustomTimeInput] = useState<string>(() => localStorage.getItem('mito_checkin_reminder_time') || '20:30');
  const [reminderSaved, setReminderSaved] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleStart = () => {
    setIsVisible(false);
    onOpenCheckin();
  };

  const handleSaveReminder = async (time: string) => {
    setReminderTime(time);
    setCustomTimeInput(time);
    setReminderSaved(true);
    await scheduleDailyCheckinReminder(time);
    setTimeout(() => {
      setReminderSaved(false);
      setShowReminderSettings(false);
    }, 1200);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '8:30 PM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${h12}:${mStr} ${period}`;
  };

  const isAllDone = pendingHabitsCount === 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-20 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[25rem] z-[60] flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="w-full pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200/80 dark:border-slate-800 rounded-3xl p-3.5 shadow-[0_16px_40px_-10px_rgba(37,99,235,0.18)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 relative overflow-hidden"
          >
            {/* Reminder Setting Overlay */}
            {showReminderSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-50/90 dark:bg-slate-800/90 rounded-2xl p-3.5 border border-blue-200 dark:border-blue-900/60"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {t('nudge.dailyCheckinReminderTime', 'Daily Check-in Reminder Time')}
                  </span>
                  <button
                    onClick={() => setShowReminderSettings(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                  {t('nudge.selectQuickTime', 'Select a quick time or pick any custom reminder time:')}
                </p>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {['20:00', '20:30', '21:00', '21:30'].map(tVal => (
                    <button
                      key={tVal}
                      type="button"
                      onClick={() => handleSaveReminder(tVal)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        reminderTime === tVal
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {formatDisplayTime(tVal)}
                    </button>
                  ))}
                </div>

                {/* Custom Time Picker */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">{t('nudge.customTime', 'Custom Time:')}</span>
                  <input
                    type="time"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveReminder(customTimeInput)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-black rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    {t('nudge.setTime', 'Set Time')}
                  </button>
                </div>

                {reminderSaved && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {t('nudge.reminderScheduledFor', 'Reminder scheduled for {{time}}!').replace('{{time}}', formatDisplayTime(reminderTime))}
                  </p>
                )}

                {/* Test Alert Button & Permission Status */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2.5">
                  <span className="text-[9.5px] text-slate-400 font-semibold">
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' ? (
                      <span className="text-rose-500 font-bold">{t('nudge.blockedInBrowser', 'Blocked in browser settings')}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Bell className="h-3 w-3 inline text-indigo-500" /> {t('nudge.activeAlertChannel', 'Active Alert Channel')}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerTestNotification()}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="h-3 w-3" /> {t('nudge.testAlertNow', 'Test Alert Now')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Main Bar */}
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {/* Left Icon + Text */}
              <div
                onClick={handleStart}
                className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 cursor-pointer"
              >
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-2xl ${isAllDone ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/25'} flex items-center justify-center shadow-md shrink-0`}>
                  {isAllDone ? (
                    <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  ) : (
                    <RoboAvatar size={30} isSpeaking={false} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider ${isAllDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'} flex items-center gap-1 leading-none`}>
                      <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current shrink-0" />
                      <span>{isAllDone ? t('nudge.checkinDone', 'Check-in Done') : t('nudge.dailyAiCheckin', 'Daily AI Check-in')}</span>
                    </span>
                    {!isAllDone && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight mt-0.5">
                    {isAllDone
                      ? t('nudge.allHabitsLoggedToday', 'All habits logged today')
                      : t('nudge.habitsRemaining', '{{count}} habits remaining').replace('{{count}}', String(pendingHabitsCount))}
                  </h4>
                </div>
              </div>

              {/* Right Action + Reminder + Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReminderSettings(prev => !prev)}
                  className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
                  title={t('nudge.dailyCheckinReminderTime', 'Daily Check-in Reminder Time')}
                >
                  <Bell className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleStart}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer ${
                    isAllDone
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/25'
                  }`}
                >
                  {!isAllDone && <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />}
                  <span>{isAllDone ? t('nudge.review', 'Review') : t('nudge.checkin', 'Check-in')}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title={t('common.close', 'Close')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

