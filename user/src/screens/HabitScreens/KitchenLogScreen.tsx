import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldAlert, Award, ShoppingBag, Utensils, RotateCcw, Calendar, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService } from '../../services/habitsService';

interface KitchenLogScreenProps {
  onBack: () => void;
  onNavigateToShop?: (query: string) => void;
  initialFilter?: '7' | '30' | '365';
}

export const KitchenLogScreen: React.FC<KitchenLogScreenProps> = ({ onBack, onNavigateToShop, initialFilter }) => {
  const { user, token, apiUrl } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  // 5 Audit Questions
  const [kitchenQ1, setKitchenQ1] = useState<boolean | null>(null); // Non-stick with scratches/PTFE (true = Yes Risk -1, false = No Safe 0)
  const [kitchenQ2, setKitchenQ2] = useState<boolean | null>(null); // Store/microwave hot food in plastic (true = Yes Risk -1, false = No Safe 0)
  const [kitchenQ3, setKitchenQ3] = useState<boolean | null>(null); // Plastic cutting boards or synthetic utensils (true = Yes Risk -1, false = No Safe 0)
  const [kitchenQ4, setKitchenQ4] = useState<boolean | null>(null); // High-temp cooked meat / deeply browned/fried (true = Yes Risk -1, false = No Safe 0)
  const [kitchenQ5, setKitchenQ5] = useState<boolean | null>(null); // Smoked or salted fish (high nitrosamines) (true = Yes Risk -1, false = No Safe 0)

  const [loading, setLoading] = useState(false);
  const [todayLogId, setTodayLogId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const isLoadedRef = useRef(false);
  const isUserInteractingRef = useRef(false);

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id && token) {
      loadHistory();
      const days = historyFilter === '30' ? 30 : historyFilter === '365' ? 365 : 7;
      fetchHistoryList(days);
    }
  }, [user?.id, token, historyFilter]);

  const fetchHistoryList = async (days: number = historyFilter === '30' ? 30 : historyFilter === '365' ? 365 : 7) => {
    if (!user?.id || !token) return;
    setLoadingHistory(true);
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Kitchen', days);
      const sorted = (logs || []).sort((a: any, b: any) => 
        new Date(b.timestamp || (b as any).createdAt).getTime() - new Date(a.timestamp || (a as any).createdAt).getTime()
      );
      setHistoryLogs(sorted);
    } catch (err) {
      console.error('Error fetching kitchen history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFilterChange = (filter: '7' | '30' | '365') => {
    setHistoryFilter(filter);
    fetchHistoryList(filter === '30' ? 30 : filter === '365' ? 365 : 7);
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Kitchen', 7);
      const todayStr = new Date().toDateString();

      // Daily Reset: strictly only prefill if logged TODAY!
      const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);

      if (todayLog && todayLog.value && (todayLog.value.answers || todayLog.value)) {
        const answers = todayLog.value.answers || todayLog.value;
        setTodayLogId(todayLog.id || (todayLog as any)._id || null);
        setKitchenQ1(answers.kitchenQ1 ?? null);
        setKitchenQ2(answers.kitchenQ2 ?? null);
        setKitchenQ3(answers.kitchenQ3 ?? null);
        setKitchenQ4(answers.kitchenQ4 ?? null);
        setKitchenQ5(answers.kitchenQ5 ?? null);
      } else {
        // Fresh daily state for new day
        setTodayLogId(null);
        setKitchenQ1(null);
        setKitchenQ2(null);
        setKitchenQ3(null);
        setKitchenQ4(null);
        setKitchenQ5(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isLoadedRef.current = true;
    }
  };

  const calculateScore = () => {
    if (kitchenQ1 === null && kitchenQ2 === null && kitchenQ3 === null && kitchenQ4 === null && kitchenQ5 === null) return null;
    let score = 0;
    if (kitchenQ1 === true) score -= 1;
    if (kitchenQ2 === true) score -= 1;
    if (kitchenQ3 === true) score -= 1;
    if (kitchenQ4 === true) score -= 1;
    if (kitchenQ5 === true) score -= 1;
    return score;
  };

  const kitchenScore = calculateScore();
  const hasAnyAnswer = kitchenQ1 !== null || kitchenQ2 !== null || kitchenQ3 !== null || kitchenQ4 !== null || kitchenQ5 !== null;

  // Auto-save ONLY when user actively changes answers (never during initial data load)
  useEffect(() => {
    if (!isLoadedRef.current || !isUserInteractingRef.current) {
      return;
    }
    if (hasAnyAnswer && user?.id && token) {
      HabitsService.logHabit(apiUrl, token, 'Kitchen', {
        score: kitchenScore,
        answers: {
          kitchenQ1,
          kitchenQ2,
          kitchenQ3,
          kitchenQ4,
          kitchenQ5
        }
      })
        .then(() => fetchHistoryList(Number(historyFilter)))
        .catch(err => console.error('Kitchen habit auto-save error', err));
    }
  }, [kitchenQ1, kitchenQ2, kitchenQ3, kitchenQ4, kitchenQ5, kitchenScore, hasAnyAnswer, apiUrl, token, user?.id]);

  const handleAnswerQ1 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ1(val);
  };

  const handleAnswerQ2 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ2(val);
  };

  const handleAnswerQ3 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ3(val);
  };

  const handleAnswerQ4 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ4(val);
  };

  const handleAnswerQ5 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ5(val);
  };

  const handleResetLog = async () => {
    isUserInteractingRef.current = false;
    setKitchenQ1(null);
    setKitchenQ2(null);
    setKitchenQ3(null);
    setKitchenQ4(null);
    setKitchenQ5(null);
    setLoading(true);
    try {
      if (todayLogId && token) {
        await HabitsService.deleteHabit(apiUrl, token, todayLogId);
        setTodayLogId(null);
      }
      // Also ensure any other kitchen log logged today is cleared
      if (token) {
        const logs = await HabitsService.getRecentHabits(apiUrl, token, 'all', 2);
        const todayStr = new Date().toDateString();
        const todayKitchenLogs = logs.filter(l => 
          (l.type?.toUpperCase().includes('KITCHEN')) &&
          new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr
        );
        for (const log of todayKitchenLogs) {
          const id = log.id || (log as any)._id;
          if (id) {
            await HabitsService.deleteHabit(apiUrl, token, id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to reset kitchen habit', err);
    } finally {
      setLoading(false);
      fetchHistoryList(Number(historyFilter));
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      showToast(t('habits.habitDeleted', 'Log deleted'), 'info');
      await fetchHistoryList(Number(historyFilter));
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete kitchen log', err);
      showToast(t('habits.habitDeleteFailed', 'Failed to delete log'), 'error');
    }
  };

  const handleSaveLogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Kitchen', {
        score: kitchenScore,
        answers: {
          kitchenQ1,
          kitchenQ2,
          kitchenQ3,
          kitchenQ4,
          kitchenQ5
        }
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 mb-6 sub-page-internal-header px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-1">
              <Utensils className="h-3 w-3 text-amber-500" /> {t('kitchen.damageKitchenAudit', 'Damage · Kitchen Audit')}
            </span>
            <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">
              {t('kitchen.checkYourKitchen', 'Check Your Kitchen')}
            </h2>
          </div>
        </div>

        {/* Daily Status & Reset Button */}
        <div className="flex items-center gap-2">
          {(todayLogId || hasAnyAnswer) && (
            <button
              type="button"
              onClick={handleResetLog}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={t('resetAnswersToday')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t('kitchen.resetToday', 'Reset Today')}</span>
            </button>
          )}
          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border ${todayLogId || hasAnyAnswer ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'}`}>
            {todayLogId || hasAnyAnswer ? t('environmental.loggedToday', 'Logged (Today)') : t('environmental.dailyCheckin', 'Daily Check-in')}
          </span>
        </div>
      </div>

      <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('environmental.microplasticsExposure', 'Microplastics & Utensils Audit')}</span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{t('kitchen.kitchenSafetyQuestions', 'Kitchen Safety Questions')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('kitchen.kitchenSafetyDesc', 'Identify plastic water cans, synthetic non-stick cookware exposure, and plastic commodity storage.')}</p>
        </div>

        {/* Status Score Banner */}
        {hasAnyAnswer && (
          <div>
            {kitchenScore === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                <Award className="h-5 w-5 shrink-0 text-emerald-500" />
                <span>{t('kitchenSafePlasticFree', 'Safe! Your kitchen is low in plastic exposure.')}</span>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
                <span>
                  <strong>{t('kitchen.riskFlagged', 'Risk Flagged')} ({kitchenScore}):</strong> {t('kitchen.riskDescription', 'Using scratched non-stick cookware, microwaving hot food in plastic, or using synthetic utensils releases microplastics and toxic chemicals.')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Question 1 */}
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t('kitchen.question1', 'Question 1')}</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              1. {t('kitchen.q1Text', 'Do you use non-stick cookware with scratches or PTFE coatings?')}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ1(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ1 === true ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.yesRiskMinus1', 'Yes (Risk -1)')}
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ1(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.noSafeZero', 'No (Safe 0)')}
              </button>
            </div>
          </div>

          {/* Question 2 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t('kitchen.question2', 'Question 2')}</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              2. {t('kitchen.q2Text', 'Do you store or microwave hot food in plastic containers?')}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ2(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ2 === true ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.yesRiskMinus1', 'Yes (Risk -1)')}
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ2(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ2 === false ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.noSafeZero', 'No (Safe 0)')}
              </button>
            </div>
          </div>

          {/* Question 3 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t('kitchen.question3', 'Question 3')}</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              3. {t('kitchen.q3Text', 'Do you use plastic cutting boards or synthetic cooking utensils?')}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ3(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ3 === true ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.yesRiskMinus1', 'Yes (Risk -1)')}
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ3(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ3 === false ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.noSafeZero', 'No (Safe 0)')}
              </button>
            </div>
          </div>

          {/* Question 4 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t('kitchen.question4', 'Question 4')}</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              4. {t('kitchen.q4Text', 'Did you eat high temperature cooked meat (pan frying or grilling) or heavily browned foods like darkly toasted bread, deep brown/black deeply fried vegetables or chips?')}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ4(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ4 === true ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.yesRiskMinus1', 'Yes (Risk -1)')}
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ4(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ4 === false ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.noSafeZero', 'No (Safe 0)')}
              </button>
            </div>
          </div>

          {/* Question 5 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t('kitchen.question5', 'Question 5')}</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              5. {t('kitchen.q5Text', 'Did you cook or consume smoked or salted fish (high nitrosamines)?')}
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ5(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ5 === true ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.yesRiskMinus1', 'Yes (Risk -1)')}
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ5(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ5 === false ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                {t('common.noSafeZero', 'No (Safe 0)')}
              </button>
            </div>
          </div>
        </div>

        {/* Natural Kitchen Guidelines Card */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            {t('kitchen.naturalGuidelines', '🍳 Natural Kitchen & Utensil Guidelines')}
          </h4>
          <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-2 list-disc pl-4 font-semibold leading-relaxed">
            <li><strong>{t('castIronBrassTava')}</strong>: {t('castIronDesc')}</li>
            <li><strong>{t('nonPlasticWaterStorage')}</strong>: {t('nonPlasticWaterDesc')}</li>
            <li><strong>{t('glassStainlessJars')}</strong>: {t('glassStainlessDesc')}</li>
          </ul>
        </div>

        {hasAnyAnswer && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 space-y-2.5 animate-in fade-in duration-200">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
              {t('kitchen.lookingForPlasticFree', 'Looking for plastic-free stainless steel or glass kitchen storage containers?')}
            </p>
            <button 
              type="button"
              onClick={() => onNavigateToShop?.('Safe kitchen')}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-bold text-left cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
              <span>{t('orderPlasticFreeKitchen')}</span>
            </button>
          </div>
        )}

        <button 
          type="button"
          onClick={handleSaveLogs}
          disabled={loading || !hasAnyAnswer}
          className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${hasAnyAnswer ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm active:scale-98' : 'bg-slate-200 dark:bg-slate-800 opacity-60 cursor-not-allowed'}`}
        >
          {loading ? t('common.saving') : t('kitchen.saveKitchenLog', 'Save Kitchen Audit Log')}
        </button>
      </div>

      {/* Past History with 7D / 30D Filter */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {historyFilter === '365' ? t('common.last1Year', '1-Year Kitchen History') : historyFilter === '30' ? t('common.last30Days', 'Last 30 Days History') : t('common.last7Days', 'Last 7 Days History')}
          </span>

          {/* 7D / 30D / 1Y Filter Pill Toggle */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleFilterChange('7')}
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
              onClick={() => handleFilterChange('30')}
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
              onClick={() => handleFilterChange('365')}
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

        <div className="space-y-2">
          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">{t('common.loading', 'Loading history...')}</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {historyFilter === '7'
                  ? t('kitchen.noEntries7d', 'No kitchen audit entries logged in the last 7 days')
                  : t('kitchen.noEntries30d', 'No kitchen audit entries logged in the last 30 days')}
              </p>
            </div>
          ) : (
            historyLogs.map((h: any) => {
              const val = h.value;
              const ans = val?.answers || (typeof val === 'object' ? val : {});
              let logScore = typeof val?.score === 'number' ? val.score : null;
              if (logScore === null && (ans.kitchenQ1 !== undefined || ans.kitchenQ2 !== undefined || ans.kitchenQ3 !== undefined || ans.kitchenQ4 !== undefined || ans.kitchenQ5 !== undefined)) {
                let risks = 0;
                if (ans.kitchenQ1 === true) risks -= 1;
                if (ans.kitchenQ2 === true) risks -= 1;
                if (ans.kitchenQ3 === true) risks -= 1;
                if (ans.kitchenQ4 === true) risks -= 1;
                if (ans.kitchenQ5 === true) risks -= 1;
                logScore = risks;
              }
              const isSafe = logScore === 0;
              const isAi = h.source === 'chatbot' || val?.source === 'ai_mia';
              const logDate = new Date(h.timestamp || h.createdAt);

              return (
                <div 
                  key={h.id || h._id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs rounded-2xl p-4 flex flex-col gap-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {logDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isAi && (
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-black px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wider">
                          AI Log
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSafe ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {t('kitchenSafe', 'Safe (0)')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          {t('kitchenRisk', 'Risk Flagged')} ({logScore})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(h.id || h._id)}
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title={t('common.delete', 'Delete log')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary of answers */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between sm:justify-start gap-1 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Non-stick:</span>
                      <span className={`font-bold ${ans.kitchenQ1 === true ? 'text-rose-600 dark:text-rose-400' : ans.kitchenQ1 === false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {ans.kitchenQ1 === true ? 'Risk (-1)' : ans.kitchenQ1 === false ? 'Safe (0)' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-1 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Plastics:</span>
                      <span className={`font-bold ${ans.kitchenQ2 === true ? 'text-rose-600 dark:text-rose-400' : ans.kitchenQ2 === false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {ans.kitchenQ2 === true ? 'Risk (-1)' : ans.kitchenQ2 === false ? 'Safe (0)' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-1 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Utensils:</span>
                      <span className={`font-bold ${ans.kitchenQ3 === true ? 'text-rose-600 dark:text-rose-400' : ans.kitchenQ3 === false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {ans.kitchenQ3 === true ? 'Risk (-1)' : ans.kitchenQ3 === false ? 'Safe (0)' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-1 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">High-Temp:</span>
                      <span className={`font-bold ${ans.kitchenQ4 === true ? 'text-rose-600 dark:text-rose-400' : ans.kitchenQ4 === false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {ans.kitchenQ4 === true ? 'Risk (-1)' : ans.kitchenQ4 === false ? 'Safe (0)' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-1 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Smoked:</span>
                      <span className={`font-bold ${ans.kitchenQ5 === true ? 'text-rose-600 dark:text-rose-400' : ans.kitchenQ5 === false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {ans.kitchenQ5 === true ? 'Risk (-1)' : ans.kitchenQ5 === false ? 'Safe (0)' : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
