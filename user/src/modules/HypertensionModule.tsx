import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Heart, Activity, Sparkles, Plus, History, ChevronRight, X } from 'lucide-react';
import { Card, SectionTitle, YesNoToggle, ModeTabs, StressTracker, TalkToDoctorCard, ConditionSaveButton, ConditionHistoryModal } from './shared/ConditionUI';
import { triggerHealthInsightNotification } from '../utils/notificationScheduler';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { HabitsService, type HabitLog } from '../services/habitsService';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

export const HypertensionModule: React.FC = () => {
  const { t, language } = useLanguage();
  const activeLocale = LOCALE_MAP[language] || 'en-US';
  const { apiUrl, token, user } = useAuth();
  const [mode, setMode] = useState<string>(() => localStorage.getItem('mito_htn_mode') || 'Prevention');
  const [showBpHistoryModal, setShowBpHistoryModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HabitLog[]>([]);

  // Prevention State (Scoped to current day)
  const [exercised, setExercised] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_exercised');
    return v === null ? null : v === 'true';
  });
  const [meditated, setMeditated] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_meditated');
    return v === null ? null : v === 'true';
  });
  const [lowSalt, setLowSalt] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_lowsalt');
    return v === null ? null : v === 'true';
  });
  const [slept8, setSlept8] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_slept8');
    return v === null ? null : v === 'true';
  });
  const [stress, setStress] = useState<number>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return 5;
    return Number(localStorage.getItem('mito_htn_stress')) || 5;
  });

  // Treatment State
  const [bpLog, setBpLog] = useState<{ date: string; amSys?: number; amDia?: number; pmSys?: number; pmDia?: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_htn_bplog') || '[]');
    } catch {
      return [];
    }
  });
  const [entryDate, setEntryDate] = useState<string>('');
  const [amSys, setAmSys] = useState<string>('');
  const [amDia, setAmDia] = useState<string>('');
  const [pmSys, setPmSys] = useState<string>('');
  const [pmDia, setPmDia] = useState<string>('');
  const [highSaltToday, setHighSaltToday] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_highsalt_tx');
    return v === null ? null : v === 'true';
  });
  const [exercisedTx, setExercisedTx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_exercised_tx');
    return v === null ? null : v === 'true';
  });
  const [meditatedTx, setMeditatedTx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_meditated_tx');
    return v === null ? null : v === 'true';
  });
  const [lovedActivity, setLovedActivity] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_loved');
    return v === null ? null : v === 'true';
  });
  const [slept8Tx, setSlept8Tx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_htn_slept8_tx');
    return v === null ? null : v === 'true';
  });
  const [stressTx, setStressTx] = useState<number>(() => {
    if (localStorage.getItem('mito_htn_date') !== new Date().toDateString()) return 5;
    return Number(localStorage.getItem('mito_htn_stress_tx')) || 5;
  });

  // Check if today has already been logged
  const isLoggedToday = useMemo(() => {
    const today = new Date().toDateString();
    return historyLogs.some(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === today);
  }, [historyLogs]);

  const hasAnsweredDaily = exercised !== null || meditated !== null || lowSalt !== null || slept8 !== null;

  // Load from cloud on mount
  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'hypertension', 365);
      setHistoryLogs(logs || []);
      if (logs && logs.length > 0) {
        // 1. Long-term clinical history (preserve bpLog)
        for (const log of logs) {
          const val = log.value;
          if (val) {
            if (val.mode && !localStorage.getItem('mito_htn_mode')) setMode(val.mode);
            if (val.bpLog && Array.isArray(val.bpLog)) {
              setBpLog(prev => {
                const map = new Map<string, any>();
                val.bpLog.forEach((item: any) => map.set(item.date, item));
                prev.forEach(item => map.set(item.date, item));
                return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              });
            }
            break;
          }
        }

        // 2. Daily habits ONLY from today's log
        const currentToday = new Date().toDateString();
        const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === currentToday);
        if (todayLog?.value) {
          const val = todayLog.value;
          if (val.mode && !localStorage.getItem('mito_htn_mode')) setMode(val.mode);
          if (val.exercised !== undefined) setExercised(val.exercised);
          if (val.meditated !== undefined) setMeditated(val.meditated);
          if (val.lowSalt !== undefined) setLowSalt(val.lowSalt);
          if (val.slept8 !== undefined) setSlept8(val.slept8);
          if (val.stress !== undefined) setStress(Number(val.stress));
          if (val.highSaltToday !== undefined) setHighSaltToday(val.highSaltToday);
          if (val.exercisedTx !== undefined) setExercisedTx(val.exercisedTx);
          if (val.meditatedTx !== undefined) setMeditatedTx(val.meditatedTx);
          if (val.lovedActivity !== undefined) setLovedActivity(val.lovedActivity);
          if (val.slept8Tx !== undefined) setSlept8Tx(val.slept8Tx);
          if (val.stressTx !== undefined) setStressTx(Number(val.stressTx));
          setLastSaved(new Date(todayLog.timestamp || (todayLog as any).createdAt));
        } else if (localStorage.getItem('mito_htn_date') !== currentToday) {
          // Fresh day: reset daily answers so past days' records don't bleed into today
          setExercised(null);
          setMeditated(null);
          setLowSalt(null);
          setSlept8(null);
          setStress(5);
          setHighSaltToday(null);
          setExercisedTx(null);
          setMeditatedTx(null);
          setLovedActivity(null);
          setSlept8Tx(null);
          setStressTx(5);
        }
      }
    } catch (e) {
      console.error('Failed to load hypertension history from cloud', e);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    if (user?.id && token) {
      loadHistory();
    }
  }, [user?.id, token, loadHistory]);

  const handleSave = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      const payload = {
        mode,
        exercised,
        meditated,
        lowSalt,
        slept8,
        stress,
        bpLog,
        highSaltToday,
        exercisedTx,
        meditatedTx,
        lovedActivity,
        slept8Tx,
        stressTx,
        preventionScore
      };
      await HabitsService.logHabit(apiUrl, token, 'hypertension', payload);
      setLastSaved(new Date());
      await loadHistory();
    } catch (err) {
      console.error('Failed to save hypertension log', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHistoryLog = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete hypertension habit log', err);
    }
  };

  // Persist State
  useEffect(() => { localStorage.setItem('mito_htn_mode', mode); }, [mode]);
  useEffect(() => {
    const today = new Date().toDateString();
    if (exercised !== null || meditated !== null || lowSalt !== null || slept8 !== null || highSaltToday !== null || exercisedTx !== null || meditatedTx !== null || lovedActivity !== null || slept8Tx !== null) {
      localStorage.setItem('mito_htn_date', today);
    }
    if (exercised !== null) localStorage.setItem('mito_htn_exercised', String(exercised));
  }, [exercised, meditated, lowSalt, slept8, highSaltToday, exercisedTx, meditatedTx, lovedActivity, slept8Tx]);
  useEffect(() => { if (meditated !== null) localStorage.setItem('mito_htn_meditated', String(meditated)); }, [meditated]);
  useEffect(() => { if (lowSalt !== null) localStorage.setItem('mito_htn_lowsalt', String(lowSalt)); }, [lowSalt]);
  useEffect(() => { if (slept8 !== null) localStorage.setItem('mito_htn_slept8', String(slept8)); }, [slept8]);
  useEffect(() => { localStorage.setItem('mito_htn_stress', String(stress)); }, [stress]);
  useEffect(() => { localStorage.setItem('mito_htn_bplog', JSON.stringify(bpLog)); }, [bpLog]);
  useEffect(() => { if (highSaltToday !== null) localStorage.setItem('mito_htn_highsalt_tx', String(highSaltToday)); }, [highSaltToday]);
  useEffect(() => { if (exercisedTx !== null) localStorage.setItem('mito_htn_exercised_tx', String(exercisedTx)); }, [exercisedTx]);
  useEffect(() => { if (meditatedTx !== null) localStorage.setItem('mito_htn_meditated_tx', String(meditatedTx)); }, [meditatedTx]);
  useEffect(() => { if (lovedActivity !== null) localStorage.setItem('mito_htn_loved', String(lovedActivity)); }, [lovedActivity]);
  useEffect(() => { if (slept8Tx !== null) localStorage.setItem('mito_htn_slept8_tx', String(slept8Tx)); }, [slept8Tx]);
  useEffect(() => { localStorage.setItem('mito_htn_stress_tx', String(stressTx)); }, [stressTx]);

  const preventionScore = useMemo(() => {
    let s = 0;
    if (exercised === true) s += 1;
    if (exercised === false) s -= 1;
    if (meditated === true) s += 1;
    if (meditated === false) s -= 1;
    if (lowSalt === true) s += 1;
    if (lowSalt === false) s -= 1;
    if (slept8 === true) s += 1;
    if (slept8 === false) s -= 1;
    s += stress <= 5 ? 1 : -1;
    return s;
  }, [exercised, meditated, lowSalt, slept8, stress]);

  const addBpEntry = () => {
    if (!entryDate) return;
    const numAmSys = amSys ? Number(amSys) : undefined;
    const numAmDia = amDia ? Number(amDia) : undefined;
    const numPmSys = pmSys ? Number(pmSys) : undefined;
    const numPmDia = pmDia ? Number(pmDia) : undefined;

    setBpLog(prev =>
      [
        ...prev.filter(e => e.date !== entryDate),
        {
          date: entryDate,
          amSys: numAmSys,
          amDia: numAmDia,
          pmSys: numPmSys,
          pmDia: numPmDia
        }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );

    // Trigger proactive actionable alert if BP is elevated (>130 / >85)
    const maxSys = Math.max(numAmSys || 0, numPmSys || 0);
    const maxDia = Math.max(numAmDia || 0, numPmDia || 0);
    if (maxSys >= 130 || maxDia >= 85) {
      triggerHealthInsightNotification({
        category: 'HYPERTENSION_HIGH',
        metricValue: maxSys || 135,
        secondaryValue: maxDia || 88
      });
    }

    setEntryDate('');
    setAmSys('');
    setAmDia('');
    setPmSys('');
    setPmDia('');
  };

  const removeBpEntry = (dateStr: string) => {
    setBpLog(prev => prev.filter(e => e.date !== dateStr));
  };

  const bpStats = useMemo(() => {
    const amEntries = bpLog.filter(e => e.amSys && e.amDia);
    const pmEntries = bpLog.filter(e => e.pmSys && e.pmDia);
    const avgAmSys = amEntries.length ? Math.round(amEntries.reduce((s, e) => s + (e.amSys || 0), 0) / amEntries.length) : null;
    const avgAmDia = amEntries.length ? Math.round(amEntries.reduce((s, e) => s + (e.amDia || 0), 0) / amEntries.length) : null;
    const avgPmSys = pmEntries.length ? Math.round(pmEntries.reduce((s, e) => s + (e.pmSys || 0), 0) / pmEntries.length) : null;
    const avgPmDia = pmEntries.length ? Math.round(pmEntries.reduce((s, e) => s + (e.pmDia || 0), 0) / pmEntries.length) : null;
    return { avgAmSys, avgAmDia, avgPmSys, avgPmDia };
  }, [bpLog]);

  const chartData = bpLog.map(e => ({
    date: new Date(e.date).toLocaleDateString(activeLocale, { day: 'numeric', month: 'short' }),
    'AM Systolic': e.amSys,
    'AM Diastolic': e.amDia,
    'PM Systolic': e.pmSys,
    'PM Diastolic': e.pmDia
  }));

  return (
    <div className="space-y-5">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-200" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-100">{t('protocols.hypertensionProtocol')}</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">{t('protocols.hypertensionProtocol')}</h1>
        <p className="text-xs text-rose-100/90 mt-1 leading-relaxed max-w-xl">
          {t('protocols.hypertensionSubtitle')}
        </p>
      </div>

      <ModeTabs modes={['Prevention', 'Treatment']} active={mode} onChange={setMode} />

      <ConditionSaveButton
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        saveButtonText={t('protocols.saveHypertensionEntry', "Save Today's Entry")}
        onViewHistory={() => setShowHistoryModal(true)}
        historyCount={historyLogs.length}
        isLoggedToday={isLoggedToday}
      />

      {mode === 'Prevention' && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">{t('protocols.dailyHypertensionScore')}</p>
                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                  isLoggedToday 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                    : hasAnsweredDaily 
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {isLoggedToday ? t('common.loggedTodayBadge', 'Logged Today') : hasAnsweredDaily ? t('common.previewUnsaved', 'Preview (Unsaved)') : t('common.notLoggedToday', 'Not Logged Today')}
                </span>
              </div>
              <p className="text-2xl font-black" style={{ color: !hasAnsweredDaily && !isLoggedToday ? '#94A3B8' : preventionScore >= 0 ? '#10B981' : '#EF4444' }}>
                {!hasAnsweredDaily && !isLoggedToday ? '--' : (preventionScore > 0 ? `+${preventionScore}` : preventionScore)}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 text-right max-w-[160px]">
              {isLoggedToday 
                ? t('protocols.hypertensionSummary') 
                : hasAnsweredDaily 
                  ? t('protocols.saveToRecordScore', 'Save below to record this score for today')
                  : t('protocols.answerHabitsHint', 'Log your habits below to track your score')}
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Heart}>{t('protocols.dailyLifestyleVitals')}</SectionTitle>
            <YesNoToggle label={t('protocols.exercised20Min')} value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label={t('protocols.meditatedToday')} value={meditated} onChange={setMeditated} goodAnswer={true} />
            <YesNoToggle label={t('protocols.ateLowSalt')} value={lowSalt} onChange={setLowSalt} goodAnswer={true} />
            <YesNoToggle label={t('protocols.slept8Hours')} value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>
        </>
      )}

      {mode === 'Treatment' && (
        <>
          <Card>
            <SectionTitle icon={Activity}>{t('protocols.bpMorningEvening')}</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                placeholder={t('bp.amSysPlaceholder', 'AM Systolic (e.g. 120)')}
                value={amSys}
                onChange={(e) => setAmSys(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                placeholder={t('bp.amDiaPlaceholder', 'AM Diastolic (e.g. 80)')}
                value={amDia}
                onChange={(e) => setAmDia(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                placeholder={t('bp.pmSysPlaceholder', 'PM Systolic (e.g. 125)')}
                value={pmSys}
                onChange={(e) => setPmSys(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="number"
                placeholder={t('bp.pmDiaPlaceholder', 'PM Diastolic (e.g. 82)')}
                value={pmDia}
                onChange={(e) => setPmDia(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="button"
              onClick={addBpEntry}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mb-3"
            >
              <Plus className="h-4 w-4" /> {t('protocols.logBpReading')}
            </button>

            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="AM Systolic" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="AM Diastolic" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="PM Systolic" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="PM Diastolic" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                {t('protocols.bpEmpty')}
              </p>
            )}

            {/* Compact History Trigger Bar */}
            {bpLog.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBpHistoryModal(true)}
                className="w-full mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center justify-between gap-2 group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('protocols.bpHistory', { count: bpLog.length })}
                    </p>
                    <p className="text-[10.5px] text-slate-400 truncate">
                      {bpStats.avgAmSys ? `${t('protocols.avgMorningAm')}: ${bpStats.avgAmSys}/${bpStats.avgAmDia} mmHg` : t('protocols.viewRecordedReadings', 'View recorded readings')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  {t('protocols.viewAllLogs', 'View All Logs')} <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            )}
          </Card>

          {/* Full BP History & Analytics Modal */}
          {showBpHistoryModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{t('protocols.bpMorningEvening')}</h3>
                      <p className="text-[10.5px] text-slate-400">{t('protocols.amPmLongitudinalLogs', 'AM & PM longitudinal pressure logs')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBpHistoryModal(false)}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Pressure Summary */}
                {bpLog.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 my-3.5">
                    <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-rose-500 block">{t('protocols.avgMorningAm')}</span>
                      <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                        {bpStats.avgAmSys ? `${bpStats.avgAmSys}/${bpStats.avgAmDia} mmHg` : '--'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-indigo-500 block">{t('protocols.avgEveningPm')}</span>
                      <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                        {bpStats.avgPmSys ? `${bpStats.avgPmSys}/${bpStats.avgPmDia} mmHg` : '--'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Scrollable Timeline List */}
                <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
                  {bpLog
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((log) => {
                      const logDate = new Date(log.date);
                      return (
                        <div
                          key={log.date}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                              <span className="text-[9px] font-semibold leading-none uppercase">{logDate.toLocaleString(activeLocale, { month: 'short' })}</span>
                              <span className="text-xs font-black leading-none mt-0.5">{logDate.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                {logDate.toLocaleDateString(activeLocale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {log.amSys ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                                    AM: {log.amSys}/{log.amDia} mmHg
                                  </span>
                                ) : null}
                                {log.pmSys ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                                    PM: {log.pmSys}/{log.pmDia} mmHg
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBpEntry(log.date)}
                            className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 flex items-center justify-center text-xs font-bold transition-all cursor-pointer shrink-0"
                            title={t('common.delete')}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowBpHistoryModal(false)}
                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    {t('protocols.closeHistory')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <Card>
            <SectionTitle icon={Heart}>{t('protocols.treatmentDailyHabits')}</SectionTitle>
            <YesNoToggle label={t('protocols.highSaltToday')} value={highSaltToday} onChange={setHighSaltToday} goodAnswer={false} />
            <YesNoToggle label={t('protocols.exercised20Min')} value={exercisedTx} onChange={setExercisedTx} goodAnswer={true} />
            <YesNoToggle label={t('protocols.meditatedToday')} value={meditatedTx} onChange={setMeditatedTx} goodAnswer={true} />
            <YesNoToggle
              label={t('protocols.lovedActivity')}
              sublabel={t('protocols.lovedActivitySub')}
              value={lovedActivity}
              onChange={setLovedActivity}
              goodAnswer={true}
            />
            <YesNoToggle label={t('protocols.slept8Hours')} value={slept8Tx} onChange={setSlept8Tx} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stressTx} onChange={setStressTx} />
            </div>
          </Card>

          <TalkToDoctorCard
            specialty={t('protocols.cardiologist')}
            note={t('protocols.bpDoctorNote')}
          />
        </>
      )}

      {/* Global Hypertension History Modal */}
      <ConditionHistoryModal
        title={t('protocols.hypertensionHistoryTitle', 'Hypertension & Blood Pressure History')}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        logs={historyLogs}
        onDelete={handleDeleteHistoryLog}
        activeLocale={activeLocale}
        renderLogDetails={(val) => {
          if (!val) return null;
          return (
            <div className="space-y-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  Mode: {val.mode || 'Prevention'}
                </span>
                {val.preventionScore !== undefined && (
                  <span className="font-black px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                    Score: {val.preventionScore > 0 ? `+${val.preventionScore}` : val.preventionScore}
                  </span>
                )}
                {val.stress !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                    Stress: {val.stress}/10
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-[10.5px] pt-1">
                {val.exercised !== undefined && (
                  <span>Exercise: <b>{val.exercised ? 'Yes' : 'No'}</b></span>
                )}
                {val.meditated !== undefined && (
                  <span>Meditated: <b>{val.meditated ? 'Yes' : 'No'}</b></span>
                )}
                {val.lowSalt !== undefined && (
                  <span>Low Salt: <b>{val.lowSalt ? 'Yes' : 'No'}</b></span>
                )}
                {val.slept8 !== undefined && (
                  <span>8h Sleep: <b>{val.slept8 ? 'Yes' : 'No'}</b></span>
                )}
                {val.highSaltToday !== undefined && (
                  <span>High Salt Today: <b>{val.highSaltToday ? 'Yes' : 'No'}</b></span>
                )}
                {val.lovedActivity !== undefined && (
                  <span>Loved Activity: <b>{val.lovedActivity ? 'Yes' : 'No'}</b></span>
                )}
              </div>
              {Array.isArray(val.bpLog) && val.bpLog.length > 0 && (
                <div className="pt-1.5 text-[10.5px] text-rose-600 dark:text-rose-400 font-bold border-t border-slate-100 dark:border-slate-800">
                  BP Records: {val.bpLog.map((b: any) => `${b.date} (AM: ${b.amSys || '-'}/${b.amDia || '-'}, PM: ${b.pmSys || '-'}/${b.pmDia || '-'})`).join('; ')}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};
