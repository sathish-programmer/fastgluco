import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Heart, Scale, Sparkles } from 'lucide-react';
import { Card, SectionTitle, YesNoToggle, ModeTabs, StressTracker, TalkToDoctorCard, ConditionSaveButton, ConditionHistoryModal } from './shared/ConditionUI';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { HabitsService, type HabitLog } from '../services/habitsService';

export const CardiacModule: React.FC = () => {
  const { t } = useLanguage();
  const { apiUrl, token, user } = useAuth();
  const [mode, setMode] = useState<string>('Prevention');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HabitLog[]>([]);

  // Prevention State
  const [height, setHeight] = useState<string>(() => localStorage.getItem('mito_cardiac_height') || '');
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('mito_cardiac_weight') || '');
  const [exercised, setExercised] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_exercised');
    return v === null ? null : v === 'true';
  });
  const [lowSalt, setLowSalt] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_lowsalt');
    return v === null ? null : v === 'true';
  });
  const [lowSugarJunk, setLowSugarJunk] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_lowjunk');
    return v === null ? null : v === 'true';
  });
  const [alcohol, setAlcohol] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_alcohol');
    return v === null ? null : v === 'true';
  });
  const [slept8, setSlept8] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_slept8');
    return v === null ? null : v === 'true';
  });
  const [stress, setStress] = useState<number>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return 5;
    return Number(localStorage.getItem('mito_cardiac_stress')) || 5;
  });

  // Treatment State
  const [nonStrenuous, setNonStrenuous] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_nonstrenuous');
    return v === null ? null : v === 'true';
  });
  const [meditated, setMeditated] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_meditated');
    return v === null ? null : v === 'true';
  });
  const [lowSaltTx, setLowSaltTx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_lowsalt_tx');
    return v === null ? null : v === 'true';
  });
  const [lowFatTx, setLowFatTx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_lowfat_tx');
    return v === null ? null : v === 'true';
  });
  const [slept8Tx, setSlept8Tx] = useState<boolean | null>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return null;
    const v = localStorage.getItem('mito_cardiac_slept8_tx');
    return v === null ? null : v === 'true';
  });
  const [stressTx, setStressTx] = useState<number>(() => {
    if (localStorage.getItem('mito_cardiac_date') !== new Date().toDateString()) return 5;
    return Number(localStorage.getItem('mito_cardiac_stress_tx')) || 5;
  });

  // Check if today has already been logged
  const isLoggedToday = useMemo(() => {
    const today = new Date().toDateString();
    return historyLogs.some(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === today);
  }, [historyLogs]);

  const hasAnsweredDaily = exercised !== null || lowSalt !== null || lowSugarJunk !== null || alcohol !== null || slept8 !== null;

  // Load from backend on mount
  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'cardiac', 365);
      setHistoryLogs(logs || []);
      if (logs && logs.length > 0) {
        // 1. Persistent demographic profile (height, weight)
        for (const log of logs) {
          const val = log.value;
          if (val) {
            if (val.mode && !mode) setMode(val.mode);
            if (val.height && !height) setHeight(val.height);
            if (val.weight && !weight) setWeight(val.weight);
            break;
          }
        }

        // 2. Daily habits ONLY from today's log
        const currentToday = new Date().toDateString();
        const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === currentToday);
        if (todayLog?.value) {
          const val = todayLog.value;
          if (val.mode) setMode(val.mode);
          if (val.exercised !== undefined) setExercised(val.exercised);
          if (val.lowSalt !== undefined) setLowSalt(val.lowSalt);
          if (val.lowSugarJunk !== undefined) setLowSugarJunk(val.lowSugarJunk);
          if (val.alcohol !== undefined) setAlcohol(val.alcohol);
          if (val.slept8 !== undefined) setSlept8(val.slept8);
          if (val.stress !== undefined) setStress(Number(val.stress));
          if (val.nonStrenuous !== undefined) setNonStrenuous(val.nonStrenuous);
          if (val.meditated !== undefined) setMeditated(val.meditated);
          if (val.lowSaltTx !== undefined) setLowSaltTx(val.lowSaltTx);
          if (val.lowFatTx !== undefined) setLowFatTx(val.lowFatTx);
          if (val.slept8Tx !== undefined) setSlept8Tx(val.slept8Tx);
          if (val.stressTx !== undefined) setStressTx(Number(val.stressTx));
          setLastSaved(new Date(todayLog.timestamp || (todayLog as any).createdAt));
        } else if (localStorage.getItem('mito_cardiac_date') !== currentToday) {
          // Reset daily answers for fresh day
          setExercised(null);
          setLowSalt(null);
          setLowSugarJunk(null);
          setAlcohol(null);
          setSlept8(null);
          setStress(5);
          setNonStrenuous(null);
          setMeditated(null);
          setLowSaltTx(null);
          setLowFatTx(null);
          setSlept8Tx(null);
          setStressTx(5);
        }
      }
    } catch (e) {
      console.error('Failed to load cardiac history from cloud', e);
    }
  }, [apiUrl, token, mode, height, weight]);

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
        height,
        weight,
        exercised,
        lowSalt,
        lowSugarJunk,
        alcohol,
        slept8,
        stress,
        nonStrenuous,
        meditated,
        lowSaltTx,
        lowFatTx,
        slept8Tx,
        stressTx,
        preventionScore,
        treatmentScore
      };
      await HabitsService.logHabit(apiUrl, token, 'cardiac', payload);
      setLastSaved(new Date());
      await loadHistory();
    } catch (err) {
      console.error('Failed to save cardiac log', err);
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
      console.error('Failed to delete cardiac habit log', err);
    }
  };

  // Persist State
  useEffect(() => { localStorage.setItem('mito_cardiac_height', height); }, [height]);
  useEffect(() => { localStorage.setItem('mito_cardiac_weight', weight); }, [weight]);
  useEffect(() => {
    const today = new Date().toDateString();
    if (exercised !== null || lowSalt !== null || lowSugarJunk !== null || alcohol !== null || slept8 !== null || nonStrenuous !== null || meditated !== null || lowSaltTx !== null || lowFatTx !== null || slept8Tx !== null) {
      localStorage.setItem('mito_cardiac_date', today);
    }
    if (exercised !== null) localStorage.setItem('mito_cardiac_exercised', String(exercised));
  }, [exercised, lowSalt, lowSugarJunk, alcohol, slept8, nonStrenuous, meditated, lowSaltTx, lowFatTx, slept8Tx]);
  useEffect(() => { if (lowSalt !== null) localStorage.setItem('mito_cardiac_lowsalt', String(lowSalt)); }, [lowSalt]);
  useEffect(() => { if (lowSugarJunk !== null) localStorage.setItem('mito_cardiac_lowjunk', String(lowSugarJunk)); }, [lowSugarJunk]);
  useEffect(() => { if (alcohol !== null) localStorage.setItem('mito_cardiac_alcohol', String(alcohol)); }, [alcohol]);
  useEffect(() => { if (slept8 !== null) localStorage.setItem('mito_cardiac_slept8', String(slept8)); }, [slept8]);
  useEffect(() => { localStorage.setItem('mito_cardiac_stress', String(stress)); }, [stress]);
  useEffect(() => { if (nonStrenuous !== null) localStorage.setItem('mito_cardiac_nonstrenuous', String(nonStrenuous)); }, [nonStrenuous]);
  useEffect(() => { if (meditated !== null) localStorage.setItem('mito_cardiac_meditated', String(meditated)); }, [meditated]);
  useEffect(() => { if (lowSaltTx !== null) localStorage.setItem('mito_cardiac_lowsalt_tx', String(lowSaltTx)); }, [lowSaltTx]);
  useEffect(() => { if (lowFatTx !== null) localStorage.setItem('mito_cardiac_lowfat_tx', String(lowFatTx)); }, [lowFatTx]);
  useEffect(() => { if (slept8Tx !== null) localStorage.setItem('mito_cardiac_slept8_tx', String(slept8Tx)); }, [slept8Tx]);
  useEffect(() => { localStorage.setItem('mito_cardiac_stress_tx', String(stressTx)); }, [stressTx]);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return w / (h * h);
  }, [height, weight]);

  const preventionScore = useMemo(() => {
    let s = 0;
    if (exercised === true) s += 1;
    if (exercised === false) s -= 1;
    if (lowSalt === true) s += 1;
    if (lowSalt === false) s -= 1;
    if (lowSugarJunk === true) s += 1;
    if (lowSugarJunk === false) s -= 1;
    if (alcohol === true) s -= 1;
    if (alcohol === false) s += 1;
    if (slept8 === true) s += 1;
    if (slept8 === false) s -= 1;
    s += stress <= 5 ? 1 : -1;
    return s;
  }, [exercised, lowSalt, lowSugarJunk, alcohol, slept8, stress]);

  const treatmentScore = useMemo(() => {
    let s = 0;
    if (nonStrenuous === true) s += 1;
    if (nonStrenuous === false) s -= 1;
    if (meditated === true) s += 1;
    if (meditated === false) s -= 1;
    if (lowSaltTx === true) s += 1;
    if (lowSaltTx === false) s -= 1;
    if (lowFatTx === true) s += 1;
    if (lowFatTx === false) s -= 1;
    if (slept8Tx === true) s += 1;
    if (slept8Tx === false) s -= 1;
    s += stressTx <= 5 ? 1 : -1;
    return s;
  }, [nonStrenuous, meditated, lowSaltTx, lowFatTx, slept8Tx, stressTx]);

  return (
    <div className="space-y-5">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-200" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-100">{t('protocols.cardiovascularProtection')}</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">{t('protocols.cardiacProtocol')}</h1>
        <p className="text-xs text-rose-100/90 mt-1 leading-relaxed max-w-xl">
          {t('protocols.cardiacSubtitle')}
        </p>
      </div>

      <ModeTabs modes={['Prevention', 'Treatment']} active={mode} onChange={setMode} />

      <ConditionSaveButton
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        saveButtonText={t('protocols.saveCardiacEntry', "Save Today's Entry")}
        onViewHistory={() => setShowHistoryModal(true)}
        historyCount={historyLogs.length}
        isLoggedToday={isLoggedToday}
      />

      {mode === 'Prevention' && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">{t('protocols.cardiacPreventionScore')}</p>
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
                ? t('protocols.cardiacSummary') 
                : hasAnsweredDaily 
                  ? t('protocols.saveToRecordScore', 'Save below to record this score for today')
                  : t('protocols.answerHabitsHint', 'Log your habits below to track your score')}
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Scale}>{t('protocols.cardiacBMI')}</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">{t('protocols.heightCm')}</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder={t('protocols.heightPlaceholder', 'e.g. 172')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">{t('protocols.weightKg')}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder={t('protocols.weightPlaceholder', 'e.g. 74')}
                />
              </div>
            </div>
            {bmi !== null && (
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
                {t('protocols.cardiovascularBMI')}: <span className="font-black text-rose-600 dark:text-rose-400">{bmi.toFixed(1)}</span>
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Heart}>{t('protocols.dailyCardiacDefense')}</SectionTitle>
            <YesNoToggle label={t('protocols.exercised20Min')} value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label={t('protocols.ateLowSalt')} value={lowSalt} onChange={setLowSalt} goodAnswer={true} />
            <YesNoToggle label={t('protocols.ateLowSugarJunk')} value={lowSugarJunk} onChange={setLowSugarJunk} goodAnswer={true} />
            <YesNoToggle label={t('protocols.hadAlcohol')} value={alcohol} onChange={setAlcohol} goodAnswer={false} />
            <YesNoToggle label={t('protocols.slept8Hours')} value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>
        </>
      )}

      {mode === 'Treatment' && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">{t('protocols.cardiacTreatmentScore')}</p>
              <p className="text-2xl font-black" style={{ color: treatmentScore >= 0 ? '#10B981' : '#EF4444' }}>
                {treatmentScore > 0 ? `+${treatmentScore}` : treatmentScore}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 text-right">
              {t('protocols.treatmentSummary')}
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Heart}>{t('protocols.gentleCardiacRecovery')}</SectionTitle>
            <YesNoToggle
              label={t('protocols.nonStrenuous20Min')}
              sublabel={t('protocols.nonStrenuousSub')}
              value={nonStrenuous}
              onChange={setNonStrenuous}
              goodAnswer={true}
            />
            <YesNoToggle label={t('protocols.meditatedToday')} value={meditated} onChange={setMeditated} goodAnswer={true} />
            <YesNoToggle label={t('protocols.ateLowSalt')} value={lowSaltTx} onChange={setLowSaltTx} goodAnswer={true} />
            <YesNoToggle label={t('protocols.ateLowFatWhole')} value={lowFatTx} onChange={setLowFatTx} goodAnswer={true} />
            <YesNoToggle label={t('protocols.slept8Hours')} value={slept8Tx} onChange={setSlept8Tx} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stressTx} onChange={setStressTx} />
            </div>
          </Card>

          <TalkToDoctorCard
            specialty={t('protocols.cardiologist')}
            note={t('protocols.cardiologistNote')}
          />
        </>
      )}

      {/* Global Cardiac History Modal */}
      <ConditionHistoryModal
        title={t('protocols.cardiacHistoryTitle', 'Cardiovascular Health Tracking History')}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        logs={historyLogs}
        onDelete={handleDeleteHistoryLog}
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
                    Prevention Score: {val.preventionScore > 0 ? `+${val.preventionScore}` : val.preventionScore}
                  </span>
                )}
                {val.treatmentScore !== undefined && (
                  <span className="font-black px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                    Recovery Score: {val.treatmentScore > 0 ? `+${val.treatmentScore}` : val.treatmentScore}
                  </span>
                )}
                {val.stress !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                    Stress: {val.stress}/10
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-[10.5px] pt-1">
                {val.height && val.weight && (
                  <span>Weight/Height: <b>{val.weight}kg / {val.height}cm</b></span>
                )}
                {val.exercised !== undefined && (
                  <span>Exercise: <b>{val.exercised ? 'Yes' : 'No'}</b></span>
                )}
                {val.lowSalt !== undefined && (
                  <span>Low Salt: <b>{val.lowSalt ? 'Yes' : 'No'}</b></span>
                )}
                {val.lowSugarJunk !== undefined && (
                  <span>Low Sugar/Junk: <b>{val.lowSugarJunk ? 'Yes' : 'No'}</b></span>
                )}
                {val.alcohol !== undefined && (
                  <span>Alcohol: <b>{val.alcohol ? 'Yes' : 'No'}</b></span>
                )}
                {val.slept8 !== undefined && (
                  <span>8h Sleep: <b>{val.slept8 ? 'Yes' : 'No'}</b></span>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};
