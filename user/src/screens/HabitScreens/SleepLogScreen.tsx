import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Minus, Moon, Trash2, Sparkles, MessageSquare, Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { DeStressAIChatModal } from '../../components/DeStressAIChatModal';

interface SleepLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (recommendationId: string) => void;
  initialFilter?: '7' | '30' | '365';
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

export const SleepLogScreen: React.FC<SleepLogScreenProps> = ({ onBack, onBookAppointment, initialFilter }) => {
  const { t, language } = useLanguage();
  const { user, token, apiUrl } = useAuth();
  const { showToast } = useToast();
  const [hours, setHours] = useState<number>(7);
  const [quality, setQuality] = useState<string>('good');
  const [difficultyFallingAsleep, setDifficultyFallingAsleep] = useState<boolean | null>(null);
  const [stoppedScreenTime, setStoppedScreenTime] = useState<boolean | null>(null);
  const [snoring, setSnoring] = useState<boolean>(false);
  const [showSleepPopup, setShowSleepPopup] = useState<boolean>(false);
  const [showMiaSleepModal, setShowMiaSleepModal] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  const activeLocale = LOCALE_MAP[language] || 'en-US';

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id && token) loadHistory(Number(historyFilter));
  }, [user?.id, token, historyFilter]);

  const loadHistory = async (days: number = Number(historyFilter)) => {
    if (!user?.id || !token) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Sleep', days);
      setHistory(logs);
      if (logs.length > 0) {
        const todayStr = new Date().toDateString();
        const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);
        if (todayLog?.value) {
          if (typeof todayLog.value.hours === 'number') setHours(todayLog.value.hours);
          if (todayLog.value.quality) setQuality(todayLog.value.quality);
          if (todayLog.value.difficultyFallingAsleep !== undefined) setDifficultyFallingAsleep(todayLog.value.difficultyFallingAsleep);
          if (todayLog.value.stoppedScreenTime !== undefined) setStoppedScreenTime(todayLog.value.stoppedScreenTime);
          if (todayLog.value.snoring !== undefined) setSnoring(todayLog.value.snoring);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      showToast(t('habits.habitDeleted', 'Log deleted'), 'info');
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete habit', err);
      showToast(t('habits.habitDeleteFailed', 'Failed to delete log'), 'error');
    }
  };

  const handleLog = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const isDamaged = quality === 'poor' || hours < 6 || snoring === true || (difficultyFallingAsleep === true && stoppedScreenTime === false);
      const score = isDamaged ? -1 : 0;
      await HabitsService.logHabit(apiUrl, token, 'Sleep', { 
        hours, 
        quality,
        difficultyFallingAsleep,
        stoppedScreenTime,
        snoring,
        score
      });
      showToast(t('habits.sleepLoggedSuccess', 'Sleep logged successfully!'), 'success');
      await loadHistory();
      if (quality === 'poor' || hours < 6 || snoring === true || (difficultyFallingAsleep === true && stoppedScreenTime === false)) {
        setShowSleepPopup(true);
      }
    } catch (err) {
      console.error('Failed to log sleep', err);
      showToast(t('habits.sleepLogFailed', 'Failed to log sleep. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="pb-24 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('habits.sleepDebtSub', 'Damage · Sleep Debt')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">{t('habits.catchUpRest', 'Catch up on rest')}</h2>
        </div>
      </div>

      {/* Mia Sleep AI Assessment Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-5 mb-6 shadow-xs border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-blue-200/60 dark:border-blue-800">
            <Sparkles className="h-3 w-3 text-blue-600" /> {t('mia.sleepAssessment', 'Sleep Health & Mental AI')}
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{t('habits.troubleSleepingTitle', 'Having trouble sleeping or staying asleep?')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {t('habits.troubleSleepingDesc', 'Chat with Mia, your Mental Health & Sleep AI Expert, for root-cause diagnosis and 4 personalized sleep steps.')}
          </p>
        </div>
        <button
          onClick={() => setShowMiaSleepModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <MessageSquare className="h-4 w-4" /> {t('habits.startSleepAssessment', 'Start Sleep Assessment')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-400" /> {t('habits.sleepClearsBrain', 'Sleep clears the brain.')}
        </h3>
        <p className="text-xs text-slate-555 dark:text-slate-450 leading-relaxed">
          {t('habits.sleepClearsBrainDesc', 'Deep sleep triggers the glymphatic system to wash away metabolic waste. Aim for 7-9 hours.')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">{t('habits.hoursSleptLastNight', 'Hours slept last night')}</span>
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setHours(Math.max(0, hours - 0.5))}
            className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-5xl font-sans font-bold text-indigo-500">{hours}</span>
            <span className="text-sm font-bold text-slate-400 ml-1">{t('habits.hrs', 'hrs')}</span>
          </div>
          <button 
            onClick={() => setHours(Math.min(24, hours + 0.5))}
            className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
          >
            <span className="text-2xl leading-none font-light">+</span>
          </button>
        </div>

        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">{t('habits.sleepQuality', 'Sleep Quality')}</span>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { value: 'poor', label: t('habits.poor', 'Poor'), emoji: '🥱' },
            { value: 'fair', label: t('habits.fair', 'Fair'), emoji: '😴' },
            { value: 'good', label: t('habits.good', 'Good'), emoji: '😊' },
            { value: 'excellent', label: t('habits.excellent', 'Excellent'), emoji: '🌟' }
          ].map(q => (
            <button
              key={q.value}
              type="button"
              onClick={() => setQuality(q.value)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all text-center ${
                quality === q.value 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-755 dark:text-indigo-400 font-bold shadow-sm' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-350 dark:hover:border-slate-700 text-slate-650 dark:text-slate-300'
              }`}
            >
              <span className="text-xl mb-1">{q.emoji}</span>
              <span className="text-[10px] font-bold">{q.label}</span>
            </button>
          ))}
        </div>

        {/* Difficulty Falling Asleep Question */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
              {t('habits.difficultyFallingAsleepLabel', 'Sleep Latency')}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {difficultyFallingAsleep === true ? t('common.yes', 'Yes') : difficultyFallingAsleep === false ? t('common.no', 'No') : ''}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
            {t('habits.difficultyFallingAsleepPrompt', 'Is there difficulty in beginning to fall asleep?')}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setDifficultyFallingAsleep(false);
                setStoppedScreenTime(null);
              }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                difficultyFallingAsleep === false
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>✅</span> {t('habits.noEasySleep', 'No · Fall asleep easily')}
            </button>
            <button
              type="button"
              onClick={() => setDifficultyFallingAsleep(true)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                difficultyFallingAsleep === true
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>⏱️</span> {t('habits.yesDifficulty', 'Yes · Takes 30+ mins')}
            </button>
          </div>

          {/* Conditional Screen Time & Doom Scrolling Follow-up */}
          {difficultyFallingAsleep === true && (
            <div className="mt-3 p-3.5 bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-700 dark:text-indigo-300">
                <Smartphone className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {t('habits.screenTimeHeader', 'Screen Time & Doom Scrolling Check')}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-3 leading-relaxed">
                {t('habits.screenTimeQuestion', 'Did you stop doom scrolling and bright screen watching at least 2 hours prior to sleep?')}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setStoppedScreenTime(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    stoppedScreenTime === true
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>🌙</span> {t('habits.yesStoppedScreens', 'Yes · Powered off 2h prior')}
                </button>
                <button
                  type="button"
                  onClick={() => setStoppedScreenTime(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    stoppedScreenTime === false
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>📱</span> {t('habits.noWatchedScreens', 'No · Watched screens in bed')}
                </button>
              </div>

              {/* If YES to stopping screens 2h prior, but still taking 30+ mins: Clinical Latency -> Connect to Expert */}
              {stoppedScreenTime === true && (
                <div className="p-3.5 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                      <span className="font-bold">{t('habits.clinicalLatencyTitle', 'Persistent Sleep Latency Check:')}</span>{' '}
                      {t('habits.clinicalLatencyDesc', 'Taking 30+ minutes to fall asleep despite adhering to a 2-hour pre-bed screen curfew indicates physiological sleep latency. Connecting with a specialist can help evaluate circadian rhythm and sleep architecture.')}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
                    <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold">
                      {t('habits.consultSleepSpecialist', 'Consult a sleep specialist:')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onBookAppointment?.('pending_Sleep Specialist')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🩺</span> {t('habits.connectToExpert', 'Connect to Expert')}
                    </button>
                  </div>
                </div>
              )}

              {/* If NO to stopping screens: Advisory & Habit Change Prompt + Connect to Expert if doesn't improve */}
              {stoppedScreenTime === false && (
                <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                      <span className="font-bold">{t('habits.habitChangeTitle', 'Change Habit Tonight & Revert Tomorrow:')}</span>{' '}
                      {t('habits.habitChangeDesc', 'Blue light and rapid algorithm feeds suppress melatonin by up to 50%. Please power down all bright screens at least 2 hours before bed tonight, try relaxing reading or breathwork, and log your progress tomorrow morning.')}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                      {t('habits.connectIfNoImprove', "Connect to expert if doesn't improve:")}
                    </span>
                    <button
                      type="button"
                      onClick={() => onBookAppointment?.('pending_Sleep Specialist')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🩺</span> {t('habits.connectToExpert', 'Connect to Expert')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Snoring Check Question */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
              {t('habits.snoringLabel', 'Snoring & Airway Check')}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {snoring ? t('common.yes', 'Yes') : t('common.no', 'No')}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
            {t('habits.snoringPrompt', 'Do you snore loudly during sleep, gasp for breath, or wake up unrefreshed?')}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => setSnoring(false)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !snoring
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>😴</span> {t('habits.noSnoring', 'No · Quiet Peaceful Sleep')}
            </button>
            <button
              type="button"
              onClick={() => setSnoring(true)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                snoring
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>💨</span> {t('habits.yesSnoring', 'Yes · Snoring / Airway Gasps')}
            </button>
          </div>
          {snoring && (
            <div className="mt-3 p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-medium">
                  <span className="font-bold">{t('habits.airwayWarningTitle', 'Airway Resistance & Oxygen Alert:')}</span>{' '}
                  {t('habits.snoringWarning', 'Airway resistance, loud snoring, or gasping reduces nighttime blood oxygen saturation and strains cardiovascular recovery.')}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 dark:border-rose-800/40">
                <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold">
                  {t('habits.consultEntSleep', 'Clinical airway evaluation:')}
                </span>
                <button
                  type="button"
                  onClick={() => onBookAppointment?.('pending_Sleep Specialist')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>🩺</span> {t('habits.connectToExpert', 'Connect to Expert')}
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold transition-all shadow-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
        >
          {t('habits.logHabit', { habit: t('habits.sleep', 'Sleep') }, 'Log sleep')}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
            {historyFilter === '365' ? t('habits.oneYearTrend', '1-Year Trend') : historyFilter === '30' ? t('habits.thirtyDayTrend', '30-Day Trend') : t('habits.sevenDayTrend', '7-Day Trend')}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setHistoryFilter('7')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '7'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('30')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '30'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              30D
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('365')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '365'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              1Y
            </button>
          </div>
        </div>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('common.noDaysLogged', 'No days logged yet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id || (h as any)._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {h.value.hours >= 7 && !h.value.snoring ? '🌟' : '🥱'} {h.value.hours ?? 0} {t('habits.hoursWord', 'hours')}
                    {h.value.snoring && (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 px-1.5 py-0.5 rounded-md">
                        💨 {t('habits.snoring', 'Snoring')}
                      </span>
                    )}
                    {h.value.difficultyFallingAsleep && (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 px-1.5 py-0.5 rounded-md">
                        ⏱️ {t('habits.latency', 'Latency')}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp || (h as any).createdAt).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric' })} · {new Date(h.timestamp || (h as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {h.value.quality && ` · ${t('habits.quality', 'Quality')}: ${t('habits.quality_' + h.value.quality, h.value.quality.charAt(0).toUpperCase() + h.value.quality.slice(1))}`}
                    {h.value.stoppedScreenTime === false && ` · ${t('habits.screensUsed', 'Screens used before bed')}`}
                  </span>
                </div>
                {h.value.hours >= 7 && !h.value.snoring && !(h.value.difficultyFallingAsleep && h.value.stoppedScreenTime === false) ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Minus className="h-4 w-4 text-amber-500" />
                )}
                <button onClick={() => handleDelete(h.id || (h as any)._id)} className="ml-3 p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.some(h => h.value.hours <= 5) && (
        <ConsultationBanner
          sourceModule="Sleep"
          reason="Sleep Consultation"
          triggerCondition="Logged <= 5 hours of sleep"
          riskLevel="Medium"
          recommendedSpecialty="Sleep Specialist"
          title={t('sleepQualitySupport', 'Sleep Quality Support')}
          description={t('habits.sleepDeprivationDesc', "You've logged less than 5 hours of sleep recently. Chronic sleep deprivation can accelerate cellular aging. Consider consulting a specialist.")}
          colorTheme="indigo"
          onBookAppointment={onBookAppointment!}
        />
      )}

      {/* SLEEP ADVISORY POPUP */}
      {showSleepPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-3">
                <Moon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t('sleep.sleepAdvisoryAlert', 'Sleep Advisory Alert')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                {t('sleep.advisoryDesc', 'Your sleep quality is poor or duration is less than 6 hours. Please select the option that best describes your situation:')}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => {
                  setShowSleepPopup(false);
                  if (onBookAppointment) onBookAppointment('pending_Mental Health Specialist');
                }}
                className="w-full text-left p-3.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-2xl text-xs transition-all flex flex-col gap-1"
              >
                <span className="font-bold text-rose-800 uppercase tracking-wide text-[9px]">{t('sleep.option1', 'Option 1')}</span>
                <span className="font-bold text-slate-750">{t('sleep.stressedHenceSleepIssue', 'Stressed and hence sleep issue')}</span>
                <span className="text-[10px] text-slate-500 font-semibold">{t('sleep.consultMentalHealth', 'Consult a Mental Health Specialist')}</span>
              </button>

              <button 
                onClick={() => {
                  setShowSleepPopup(false);
                  if (onBookAppointment) onBookAppointment('pending_Sleep Specialist');
                }}
                className="w-full text-left p-3.5 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 rounded-2xl text-xs transition-all flex flex-col gap-1"
              >
                <span className="font-bold text-indigo-850 uppercase tracking-wide text-[9px]">{t('sleep.option2', 'Option 2')}</span>
                <span className="font-bold text-slate-750">{t('sleep.notStressed', 'Not stressed')}</span>
                <span className="text-[10px] text-slate-500 font-semibold">{t('sleep.bookSleepSpecialist', 'Book a Sleep Specialist Consult')}</span>
              </button>

              <button 
                onClick={() => setShowSleepPopup(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all text-center mt-2"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mia Sleep & Mental Health AI Expert Modal */}
      <DeStressAIChatModal
        isOpen={showMiaSleepModal}
        onClose={() => setShowMiaSleepModal(false)}
        initialMode="sleep"
        onBookAppointment={onBookAppointment}
      />
    </div>
  );
};
