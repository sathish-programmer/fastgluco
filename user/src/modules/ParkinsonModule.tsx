import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Activity, Plus, Pill, Sparkles, Heart, History, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { Card, SectionTitle, Slider1to10, YesNoToggle, TalkToDoctorCard } from './shared/ConditionUI';

const TIME_SLOTS = ['9:00 AM', '2:00 PM', '6:00 PM', '10:00 PM'];
const SYMPTOMS = [
  { key: 'tremor', label: 'Tremor Severity' },
  { key: 'rigidity', label: 'Muscle Rigidity / Stiffness' },
  { key: 'bradykinesia', label: 'Bradykinesia (Slowness of Movement)' }
];

const DOPAMINE_BOOSTERS = [
  'Hugged a loved one',
  'Received / gave kind words',
  'Morning sunlight exposure',
  'Listened to favourite music',
  'Gentle massage / stretch',
  'Laughed / watched comedy'
];

export const ParkinsonModule: React.FC = () => {
  const [showMedModal, setShowMedModal] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [symptomScores, setSymptomScores] = useState<Record<string, Record<string, number>>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_pd_symptom_scores') || '{}');
    } catch {
      return {};
    }
  });

  const [drugLog, setDrugLog] = useState<{ id: number; name: string; dose: string; time: string; taken?: boolean }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_pd_drug_log') || '[]');
    } catch {
      return [];
    }
  });

  const [drugName, setDrugName] = useState<string>('');
  const [drugDose, setDrugDose] = useState<string>('');
  const [drugTime, setDrugTime] = useState<string>('');

  const [slept8, setSlept8] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_pd_slept8');
    return v === null ? null : v === 'true';
  });
  const [lovedActivity, setLovedActivity] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_pd_loved');
    return v === null ? null : v === 'true';
  });
  const [lovedActivityNote, setLovedActivityNote] = useState<string>(() => localStorage.getItem('mito_pd_loved_note') || '');
  const [darkChocolate, setDarkChocolate] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_pd_choc');
    return v === null ? null : v === 'true';
  });
  const [boosters, setBoosters] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_pd_boosters') || '{}');
    } catch {
      return {};
    }
  });

  // Persist State
  useEffect(() => { localStorage.setItem('mito_pd_symptom_scores', JSON.stringify(symptomScores)); }, [symptomScores]);
  useEffect(() => { localStorage.setItem('mito_pd_drug_log', JSON.stringify(drugLog)); }, [drugLog]);
  useEffect(() => { if (slept8 !== null) localStorage.setItem('mito_pd_slept8', String(slept8)); }, [slept8]);
  useEffect(() => { if (lovedActivity !== null) localStorage.setItem('mito_pd_loved', String(lovedActivity)); }, [lovedActivity]);
  useEffect(() => { localStorage.setItem('mito_pd_loved_note', lovedActivityNote); }, [lovedActivityNote]);
  useEffect(() => { if (darkChocolate !== null) localStorage.setItem('mito_pd_choc', String(darkChocolate)); }, [darkChocolate]);
  useEffect(() => { localStorage.setItem('mito_pd_boosters', JSON.stringify(boosters)); }, [boosters]);

  const showFeedback = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const setScore = (slot: string, key: string, value: number) => {
    setSymptomScores(prev => {
      const next = {
        ...prev,
        [slot]: {
          ...(prev[slot] || { tremor: 1, rigidity: 1, bradykinesia: 1 }),
          [key]: value
        }
      };
      return next;
    });
  };

  const addDrug = () => {
    const trimmedName = drugName.trim();
    if (!trimmedName) {
      showFeedback('Please enter medication name');
      return;
    }

    const now = new Date();
    const fallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const finalTime = drugTime || fallbackTime;

    const newEntry = {
      id: Date.now(),
      name: trimmedName,
      dose: drugDose.trim() || 'Standard Dose',
      time: finalTime,
      taken: true
    };

    setDrugLog(prev => [...prev, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
    setDrugName('');
    setDrugDose('');
    setDrugTime('');
    showFeedback(`Logged ${trimmedName} at ${finalTime}`);
  };

  const toggleDrugTaken = (id: number) => {
    setDrugLog(prev => prev.map(d => d.id === id ? { ...d, taken: !d.taken } : d));
  };

  const removeDrug = (id: number) => {
    setDrugLog(prev => prev.filter(d => d.id !== id));
    showFeedback('Medication dose removed');
  };

  const toggleBooster = (b: string) => {
    setBoosters(prev => {
      const next = { ...prev, [b]: !prev[b] };
      return next;
    });
  };

  const activeBoosterList = useMemo(() => {
    const list: string[] = [];
    DOPAMINE_BOOSTERS.forEach(b => {
      if (boosters[b]) list.push(b);
    });
    if (slept8 === true) list.push('8 Hours Restful Sleep');
    if (lovedActivity === true) list.push(lovedActivityNote ? `Activity: ${lovedActivityNote}` : 'Loved Activity');
    if (darkChocolate === true) list.push('Dark Chocolate (>70%)');
    return list;
  }, [boosters, slept8, lovedActivity, lovedActivityNote, darkChocolate]);

  const boosterCount = activeBoosterList.length;

  const chartData = TIME_SLOTS.map(slot => ({
    time: slot,
    Tremor: symptomScores[slot]?.tremor ?? null,
    Rigidity: symptomScores[slot]?.rigidity ?? null,
    Bradykinesia: symptomScores[slot]?.bradykinesia ?? null
  }));

  const hasAnyScore = Object.values(symptomScores).some(slot =>
    slot && Object.values(slot).some(v => typeof v === 'number')
  );

  return (
    <div className="space-y-5 relative">
      {/* Toast Confirmation */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-2xl shadow-xl border border-slate-700/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-5 w-5 text-amber-200" />
          <span className="text-xs font-black uppercase tracking-widest text-violet-100">Neuroprotective Care</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Parkinson's Disease Management</h1>
        <p className="text-xs text-violet-100/90 mt-1 leading-relaxed max-w-xl">
          Track motor symptom patterns throughout the day, log medication timings, and boost dopamine habits.
        </p>

        {/* Live Dopamine Counter & Progress */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-violet-100">Dopamine & Mood Boosters Today:</span>
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md">
              {boosterCount} / 9 Active
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.round((boosterCount / 9) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Symptom Severity by Time of Day */}
      <Card>
        <SectionTitle icon={Brain}>Motor Symptom Severity by Time of Day</SectionTitle>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
          Rate each symptom from 1 (minimal) to 10 (worst) at each scheduled daily checkpoint.
        </p>
        <div className="space-y-4">
          {TIME_SLOTS.map(slot => {
            const slotScores = symptomScores[slot] || {};
            const vals = [slotScores.tremor, slotScores.rigidity, slotScores.bradykinesia].filter((v): v is number => typeof v === 'number');
            const avgSlotScore = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;

            return (
              <div key={slot} className="border-t border-slate-100 dark:border-slate-800 pt-3.5 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-violet-600 dark:text-violet-400">{slot}</span>
                  {avgSlotScore && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-900/40">
                      Avg Severity: {avgSlotScore} / 10
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {SYMPTOMS.map(s => (
                    <Slider1to10
                      key={s.key}
                      label={s.label}
                      value={symptomScores[slot]?.[s.key]}
                      onChange={(v) => setScore(slot, s.key, v)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Today's Motor Fluctuation Pattern */}
      {hasAnyScore && (
        <Card>
          <SectionTitle icon={Activity}>Today's Motor Fluctuation Curve</SectionTitle>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[1, 10]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Tremor" stroke="#EF4444" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} />
                <Line type="monotone" dataKey="Rigidity" stroke="#F59E0B" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} />
                <Line type="monotone" dataKey="Bradykinesia" stroke="#8B5CF6" strokeWidth={2.5} connectNulls dot={{ r: 3.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Medication Tracker */}
      <Card>
        <SectionTitle icon={Pill}>Medication Schedule Log</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <input
            type="text"
            placeholder="Drug name (e.g. Levodopa)"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="text"
            placeholder="Dose (e.g. 100mg)"
            value={drugDose}
            onChange={(e) => setDrugDose(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="time"
            value={drugTime}
            onChange={(e) => setDrugTime(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
        <button
          type="button"
          onClick={addDrug}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mb-3"
        >
          <Plus className="h-4 w-4" /> Log Dose Timing
        </button>

        {drugLog.length > 0 ? (
          <div className="space-y-2">
            {drugLog.map(d => (
              <div
                key={d.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleDrugTaken(d.id)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      d.taken !== false
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                    title="Toggle taken status"
                  >
                    {d.taken !== false && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0">
                    <p className={`font-bold text-xs truncate ${d.taken !== false ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 line-through'}`}>
                      {d.name}
                    </p>
                    <p className="text-[10.5px] text-slate-400">
                      {d.dose}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-violet-600 dark:text-violet-400 font-black text-xs px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-200/50 dark:border-violet-900/40">
                    {d.time}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDrug(d.id)}
                    className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1 text-xs font-bold transition-colors cursor-pointer"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* View Full History Button */}
            <button
              type="button"
              onClick={() => setShowMedModal(true)}
              className="w-full mt-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-violet-500" />
                Medication Schedule ({drugLog.length} Recorded)
              </span>
              <span className="text-violet-600 dark:text-violet-400 flex items-center gap-0.5 text-[11px]">
                Manage <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No medication doses logged today. Enter your dose details above to track schedule adherence.</p>
        )}
      </Card>

      {/* Medication History Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex items-center justify-center">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Medication Schedule</h3>
                  <p className="text-[10.5px] text-slate-400">Daily dose timings & adherence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMedModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
              {drugLog.map(d => (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleDrugTaken(d.id)}
                      className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        d.taken !== false
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {d.taken !== false && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`font-extrabold text-xs truncate ${d.taken !== false ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 line-through'}`}>
                        {d.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {d.dose} · Scheduled for <strong className="text-violet-600 dark:text-violet-400">{d.time}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDrug(d.id)}
                    className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 flex items-center justify-center text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Delete log"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => setShowMedModal(false)}
                className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood & Dopamine Boosters */}
      <Card>
        <SectionTitle icon={Heart}>Mood & Dopamine Support</SectionTitle>
        <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
        <YesNoToggle
          label="Did something you love today?"
          sublabel="Singing, drawing, gardening, or hobbies"
          value={lovedActivity}
          onChange={setLovedActivity}
          goodAnswer={true}
        />
        {lovedActivity === true && (
          <input
            type="text"
            placeholder="What activity did you enjoy?"
            value={lovedActivityNote}
            onChange={(e) => setLovedActivityNote(e.target.value)}
            className="w-full mt-2 mb-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        )}
        <YesNoToggle label="Ate dark chocolate (>70% cacao) today?" value={darkChocolate} onChange={setDarkChocolate} goodAnswer={true} />

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            Select Dopamine Boosters Experienced Today:
          </span>
          <div className="flex flex-wrap gap-2">
            {DOPAMINE_BOOSTERS.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => toggleBooster(b)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  boosters[b]
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <TalkToDoctorCard
        specialty="Neurologist / Movement Disorder Specialist"
        note="Bring your daily symptom severity curve and dose log to your clinical visit to optimize on/off motor fluctuations."
      />
    </div>
  );
};
