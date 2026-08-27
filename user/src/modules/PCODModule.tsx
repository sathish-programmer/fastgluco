import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Calendar, Activity, Scale, AlertCircle, Plus } from 'lucide-react';
import { Card, SectionTitle, YesNoToggle, TalkToDoctorCard, StressTracker } from './shared/ConditionUI';

export const PCODModule: React.FC = () => {
  const [height, setHeight] = useState<string>(() => localStorage.getItem('mito_pcod_height') || '');
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('mito_pcod_weight') || '');
  const [exercised, setExercised] = useState<boolean | null>(() => {
    const val = localStorage.getItem('mito_pcod_exercised');
    return val === null ? null : val === 'true';
  });
  const [ateJunk, setAteJunk] = useState<boolean | null>(() => {
    const val = localStorage.getItem('mito_pcod_junk');
    return val === null ? null : val === 'true';
  });
  const [slept8, setSlept8] = useState<boolean | null>(() => {
    const val = localStorage.getItem('mito_pcod_slept8');
    return val === null ? null : val === 'true';
  });
  const [stress, setStress] = useState<number>(() => Number(localStorage.getItem('mito_pcod_stress')) || 5);
  const [hirsutism, setHirsutism] = useState<boolean | null>(() => {
    const val = localStorage.getItem('mito_pcod_hirsutism');
    return val === null ? null : val === 'true';
  });
  const [periodDates, setPeriodDates] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_pcod_periods') || '[]');
    } catch {
      return [];
    }
  });
  const [newPeriodDate, setNewPeriodDate] = useState<string>('');

  // Persist state
  useEffect(() => { localStorage.setItem('mito_pcod_height', height); }, [height]);
  useEffect(() => { localStorage.setItem('mito_pcod_weight', weight); }, [weight]);
  useEffect(() => { if (exercised !== null) localStorage.setItem('mito_pcod_exercised', String(exercised)); }, [exercised]);
  useEffect(() => { if (ateJunk !== null) localStorage.setItem('mito_pcod_junk', String(ateJunk)); }, [ateJunk]);
  useEffect(() => { if (slept8 !== null) localStorage.setItem('mito_pcod_slept8', String(slept8)); }, [slept8]);
  useEffect(() => { localStorage.setItem('mito_pcod_stress', String(stress)); }, [stress]);
  useEffect(() => { if (hirsutism !== null) localStorage.setItem('mito_pcod_hirsutism', String(hirsutism)); }, [hirsutism]);
  useEffect(() => { localStorage.setItem('mito_pcod_periods', JSON.stringify(periodDates)); }, [periodDates]);

  // BMI Calculation
  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return w / (h * h);
  }, [height, weight]);

  const bmiCategory = (b: number | null) => {
    if (b == null) return { label: 'Enter details', color: '#94A3B8', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (b < 18.5) return { label: 'Underweight', color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' };
    if (b < 25) return { label: 'Optimal BMI', color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' };
    if (b < 30) return { label: 'Overweight', color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' };
    return { label: 'Obese range', color: '#EF4444', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' };
  };
  const bmiCat = bmiCategory(bmi);

  // Daily Score
  const dailyScore = useMemo(() => {
    let s = 0;
    if (exercised === true) s += 1;
    if (exercised === false) s -= 1;
    if (ateJunk === true) s -= 1;
    if (ateJunk === false) s += 1;
    if (slept8 === true) s += 1;
    if (slept8 === false) s -= 1;
    s += stress <= 5 ? 1 : -1;
    return s;
  }, [exercised, ateJunk, slept8, stress]);

  // Period Cycle Stats
  const cycleStats = useMemo(() => {
    if (periodDates.length < 2) return { avgLength: null, nextPredicted: null };
    const dates = periodDates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const recent = gaps.slice(-6);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const last = dates[dates.length - 1];
    const next = new Date(last);
    next.setDate(next.getDate() + Math.round(avg));
    return { avgLength: avg, nextPredicted: next };
  }, [periodDates]);

  const logPeriod = () => {
    if (!newPeriodDate) return;
    setPeriodDates(prev => [...new Set([...prev, newPeriodDate])].sort());
    setNewPeriodDate('');
  };

  const removePeriodDate = (dStr: string) => {
    setPeriodDates(prev => prev.filter(d => d !== dStr));
  };

  return (
    <div className="space-y-5">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-pink-200" />
          <span className="text-xs font-black uppercase tracking-widest text-pink-100">Hormonal & Cycle Defense</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">PCOD / PCOS Care Protocol</h1>
        <p className="text-xs text-pink-100/90 mt-1 leading-relaxed max-w-xl">
          Daily habit tracking, menstrual cycle predictor, and symptom check-ins.
        </p>

        {/* Daily Score Indicator */}
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs font-bold text-pink-100">Today's Hormonal Balance Score:</span>
          <span className="text-lg font-black bg-white/20 px-3.5 py-1 rounded-xl backdrop-blur-md">
            {dailyScore > 0 ? `+${dailyScore}` : dailyScore}
          </span>
        </div>
      </div>

      {/* Height, Weight & BMI */}
      <Card>
        <SectionTitle icon={Scale}>Height, Weight & Metabolic BMI</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
              placeholder="e.g. 162"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
              placeholder="e.g. 68"
            />
          </div>
        </div>
        {bmi !== null && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Calculated BMI:</span>
            <span className={`text-xs font-black px-3 py-1 rounded-xl ${bmiCat.bg}`}>
              {bmi.toFixed(1)} · {bmiCat.label}
            </span>
          </div>
        )}
      </Card>

      {/* Daily Habits */}
      <Card>
        <SectionTitle icon={Activity}>Daily Hormonal Balance Habits</SectionTitle>
        <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
        <YesNoToggle label="Ate junk / ultra-processed food today?" value={ateJunk} onChange={setAteJunk} goodAnswer={false} />
        <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
        <div className="pt-2">
          <StressTracker value={stress} onChange={setStress} />
        </div>
      </Card>

      {/* Menstrual Period Tracker & Cycle Predictor */}
      <Card>
        <SectionTitle icon={Calendar}>Menstrual Cycle Tracker & Predictor</SectionTitle>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={newPeriodDate}
            onChange={(e) => setNewPeriodDate(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
          />
          <button
            type="button"
            onClick={logPeriod}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" /> Log Period Start
          </button>
        </div>

        {/* Logged Period History List */}
        {periodDates.length > 0 ? (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                Period History ({periodDates.length} Logged)
              </span>
              {periodDates.length > 3 && (
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                  Showing all recorded cycles
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {periodDates
                .slice()
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((dStr, idx, arr) => {
                  const currentDate = new Date(dStr);
                  const prevDateStr = arr[idx + 1];
                  const cycleDays = prevDateStr
                    ? Math.round((currentDate.getTime() - new Date(prevDateStr).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={dStr}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 flex items-center justify-center shrink-0 font-black text-[10px]">
                          {currentDate.getDate()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {cycleDays !== null ? (
                            <p className="text-[10px] text-slate-400">
                              Cycle duration: <span className="font-bold text-pink-600 dark:text-pink-400">{cycleDays} days</span>
                              {cycleDays >= 21 && cycleDays <= 35 ? (
                                <span className="ml-1 text-emerald-600 font-semibold">(Regular)</span>
                              ) : (
                                <span className="ml-1 text-amber-600 font-semibold">(Varied)</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Initial recorded baseline</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePeriodDate(dStr)}
                        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 text-sm font-bold transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mb-3">
            No period start dates logged yet. Select a date above to begin your cycle history.
          </p>
        )}

        {cycleStats.avgLength ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200/80 dark:border-pink-900/40 text-xs font-bold text-pink-950 dark:text-pink-200">
            Average Cycle Length: <span className="font-black text-pink-600 dark:text-pink-400">{Math.round(cycleStats.avgLength)} days</span>
            <span className="mx-2">•</span>
            Next Expected Period: <span className="font-black text-purple-600 dark:text-purple-400">{cycleStats.nextPredicted?.toLocaleDateString()}</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            Log at least 2 period dates to calculate average cycle length and predict your next period.
          </p>
        )}
      </Card>

      {/* Symptom Check-in */}
      <Card>
        <SectionTitle icon={AlertCircle}>Symptom Check-in</SectionTitle>
        <YesNoToggle
          label="Noticing excess facial / body hair growth (hirsutism)?"
          sublabel="A common androgen marker in PCOD to monitor with your physician"
          value={hirsutism}
          onChange={setHirsutism}
          goodAnswer={false}
        />
      </Card>

      {/* Doctor Advice Card */}
      <TalkToDoctorCard
        specialty="Gynaecologist / Endocrinologist"
        note="Irregular cycles, hirsutism, or a rising BMI trend are critical markers to review at your next clinical consultation."
      />
    </div>
  );
};
