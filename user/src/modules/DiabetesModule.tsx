import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Sparkles, AlertTriangle, Check, Calendar, Plus } from 'lucide-react';
import { Card, SectionTitle, YesNoToggle, ModeTabs, StressTracker, TalkToDoctorCard } from './shared/ConditionUI';

const YEARLY_CHECKS_TEMPLATE = [
  { key: 'peripheral', label: 'Peripheral Neuropathy & Foot (Podiatry) Check' },
  { key: 'retinopathy', label: 'Retinopathy Screening (Dilated Eye Exam)' },
  { key: 'nephropathy', label: 'Nephropathy Screening (Kidney / Urine Microalbumin)' }
];

function daysSince(dateStr: string) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export const DiabetesModule: React.FC = () => {
  const [mode, setMode] = useState<string>('Prevention');

  // Prevention State
  const [exercised, setExercised] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_diab_exercised');
    return v === null ? null : v === 'true';
  });
  const [tookAlcohol, setTookAlcohol] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_diab_alcohol');
    return v === null ? null : v === 'true';
  });
  const [ateJunk, setAteJunk] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_diab_junk');
    return v === null ? null : v === 'true';
  });
  const [slept8, setSlept8] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_diab_slept8');
    return v === null ? null : v === 'true';
  });
  const [stress, setStress] = useState<number>(() => Number(localStorage.getItem('mito_diab_stress')) || 5);
  const [lastFbsPpbs, setLastFbsPpbs] = useState<string>(() => localStorage.getItem('mito_diab_last_fbs') || '');

  // Treatment State
  const [hba1cLog, setHba1cLog] = useState<{ date: string; value: number }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_diab_hba1c') || '[]');
    } catch {
      return [];
    }
  });
  const [newHba1cDate, setNewHba1cDate] = useState<string>('');
  const [newHba1cValue, setNewHba1cValue] = useState<string>('');
  const [yearlyChecks, setYearlyChecks] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_diab_yearly_checks') || '{}');
    } catch {
      return {};
    }
  });
  const [ateHighCarb, setAteHighCarb] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_diab_highcarb');
    return v === null ? null : v === 'true';
  });

  // Persist State
  useEffect(() => { if (exercised !== null) localStorage.setItem('mito_diab_exercised', String(exercised)); }, [exercised]);
  useEffect(() => { if (tookAlcohol !== null) localStorage.setItem('mito_diab_alcohol', String(tookAlcohol)); }, [tookAlcohol]);
  useEffect(() => { if (ateJunk !== null) localStorage.setItem('mito_diab_junk', String(ateJunk)); }, [ateJunk]);
  useEffect(() => { if (slept8 !== null) localStorage.setItem('mito_diab_slept8', String(slept8)); }, [slept8]);
  useEffect(() => { localStorage.setItem('mito_diab_stress', String(stress)); }, [stress]);
  useEffect(() => { localStorage.setItem('mito_diab_last_fbs', lastFbsPpbs); }, [lastFbsPpbs]);
  useEffect(() => { localStorage.setItem('mito_diab_hba1c', JSON.stringify(hba1cLog)); }, [hba1cLog]);
  useEffect(() => { localStorage.setItem('mito_diab_yearly_checks', JSON.stringify(yearlyChecks)); }, [yearlyChecks]);
  useEffect(() => { if (ateHighCarb !== null) localStorage.setItem('mito_diab_highcarb', String(ateHighCarb)); }, [ateHighCarb]);

  const preventionScore = useMemo(() => {
    let s = 0;
    if (exercised === true) s += 1;
    if (exercised === false) s -= 1;
    if (tookAlcohol === true) s -= 1;
    if (tookAlcohol === false) s += 1;
    if (ateJunk === true) s -= 1;
    if (ateJunk === false) s += 1;
    if (slept8 === true) s += 1;
    if (slept8 === false) s -= 1;
    s += stress <= 5 ? 1 : -1;
    return s;
  }, [exercised, tookAlcohol, ateJunk, slept8, stress]);

  const fbsDays = daysSince(lastFbsPpbs);
  const fbsDue = fbsDays == null ? null : fbsDays > 365;

  const addHba1c = () => {
    if (!newHba1cDate || !newHba1cValue) return;
    const num = parseFloat(newHba1cValue);
    if (isNaN(num)) return;
    setHba1cLog(prev =>
      [...prev, { date: newHba1cDate, value: num }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );
    setNewHba1cDate('');
    setNewHba1cValue('');
  };

  const chartData = hba1cLog.map(e => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    HbA1c: e.value
  }));

  return (
    <div className="space-y-5">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="text-xs font-black uppercase tracking-widest text-emerald-100">Glycemic & Insulin Control</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Diabetes Management Protocol</h1>
        <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed max-w-xl">
          Preventive insulin sensitivity habits and clinical HbA1c / screening monitoring.
        </p>
      </div>

      <ModeTabs modes={['Prevention', 'Treatment']} active={mode} onChange={setMode} />

      {mode === 'Prevention' && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Today's Prevention Score</p>
              <p className="text-2xl font-black" style={{ color: preventionScore >= 0 ? '#10B981' : '#EF4444' }}>
                {preventionScore > 0 ? `+${preventionScore}` : preventionScore}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 text-right">
              Exercise, low junk, 8h sleep & calm stress
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Activity}>Daily Glycemic Defense Habits</SectionTitle>
            <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label="Had alcohol today?" value={tookAlcohol} onChange={setTookAlcohol} goodAnswer={false} />
            <YesNoToggle label="Ate junk / sugary foods today?" value={ateJunk} onChange={setAteJunk} goodAnswer={false} />
            <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Calendar}>Yearly Preventive Screening</SectionTitle>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Last Fasting (FBS) / Postprandial (PPBS) Check Date:
            </label>
            <input
              type="date"
              value={lastFbsPpbs}
              onChange={(e) => setLastFbsPpbs(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            {fbsDue !== null && (
              <div className={`mt-2.5 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                fbsDue
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
              }`}>
                {fbsDue ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
                <span>{fbsDue ? 'Overdue for screening — it has been more than 12 months.' : 'Up to date with annual screening.'}</span>
              </div>
            )}
          </Card>
        </>
      )}

      {mode === 'Treatment' && (
        <>
          <Card>
            <SectionTitle icon={Activity}>Quarterly HbA1c Log (Every 3 Months)</SectionTitle>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={newHba1cDate}
                onChange={(e) => setNewHba1cDate(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 6.5%"
                value={newHba1cValue}
                onChange={(e) => setNewHba1cValue(e.target.value)}
                className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={addHba1c}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="HbA1c" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                Add HbA1c test readings to view your longitudinal glycemic trends.
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Calendar}>Annual Organ Protection Checks</SectionTitle>
            <div className="space-y-3">
              {YEARLY_CHECKS_TEMPLATE.map(c => {
                const dateVal = yearlyChecks[c.key] || '';
                const d = daysSince(dateVal);
                const isOverdue = d !== null && d > 365;
                return (
                  <div key={c.key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">{c.label}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => setYearlyChecks(prev => ({ ...prev, [c.key]: e.target.value }))}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      {dateVal && (
                        <span className={`text-[10.5px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
                          isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {isOverdue ? 'Overdue' : 'OK'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Activity}>Daily Dietary Glycemic Check-in</SectionTitle>
            <YesNoToggle label="Ate high-carb / refined sugar foods today?" value={ateHighCarb} onChange={setAteHighCarb} goodAnswer={false} />
          </Card>

          <TalkToDoctorCard
            specialty="Diabetologist / Endocrinologist"
            note="Maintain regular checks for retinopathy, nephropathy, and neuropathy. Pair your diet with low-GI foods and portion control."
          />
        </>
      )}
    </div>
  );
};
