import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Activity, Plus, Pill, Sparkles, Heart } from 'lucide-react';
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
  const [symptomScores, setSymptomScores] = useState<Record<string, Record<string, number>>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mito_pd_symptom_scores') || '{}');
    } catch {
      return {};
    }
  });

  const [drugLog, setDrugLog] = useState<{ id: number; name: string; dose: string; time: string }[]>(() => {
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

  const setScore = (slot: string, key: string, value: number) => {
    setSymptomScores(prev => ({ ...prev, [slot]: { ...prev[slot], [key]: value } }));
  };

  const addDrug = () => {
    if (!drugName || !drugTime) return;
    setDrugLog(prev =>
      [...prev, { id: Date.now(), name: drugName, dose: drugDose, time: drugTime }].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    );
    setDrugName('');
    setDrugDose('');
    setDrugTime('');
  };

  const removeDrug = (id: number) => {
    setDrugLog(prev => prev.filter(d => d.id !== id));
  };

  const toggleBooster = (b: string) => {
    setBoosters(prev => ({ ...prev, [b]: !prev[b] }));
  };

  const boosterCount =
    Object.values(boosters).filter(Boolean).length +
    (slept8 ? 1 : 0) +
    (lovedActivity ? 1 : 0) +
    (darkChocolate ? 1 : 0);

  const chartData = TIME_SLOTS.map(slot => ({
    time: slot,
    Tremor: symptomScores[slot]?.tremor ?? null,
    Rigidity: symptomScores[slot]?.rigidity ?? null,
    Bradykinesia: symptomScores[slot]?.bradykinesia ?? null
  }));
  const hasAnyScore = Object.keys(symptomScores).length > 0;

  return (
    <div className="space-y-5">
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

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs font-bold text-violet-100">Dopamine & Mood Boosters Today:</span>
          <span className="text-lg font-black bg-white/20 px-3.5 py-1 rounded-xl backdrop-blur-md">
            {boosterCount} Boosters
          </span>
        </div>
      </div>

      {/* Symptom Severity by Time of Day */}
      <Card>
        <SectionTitle icon={Brain}>Motor Symptom Severity by Time of Day</SectionTitle>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
          Rate each symptom from 1 (minimal) to 10 (worst) at each scheduled daily checkpoint.
        </p>
        <div className="space-y-4">
          {TIME_SLOTS.map(slot => (
            <div key={slot} className="border-t border-slate-100 dark:border-slate-800 pt-3.5 first:border-t-0 first:pt-0">
              <span className="text-xs font-black text-violet-600 dark:text-violet-400 block mb-2">{slot}</span>
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
          ))}
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
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input
            type="text"
            placeholder="Drug name (e.g. Levodopa)"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            className="col-span-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="text"
            placeholder="Dose (e.g. 100mg)"
            value={drugDose}
            onChange={(e) => setDrugDose(e.target.value)}
            className="col-span-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="time"
            value={drugTime}
            onChange={(e) => setDrugTime(e.target.value)}
            className="col-span-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
        <button
          type="button"
          onClick={addDrug}
          className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mb-3"
        >
          <Plus className="h-4 w-4" /> Log Dose Timing
        </button>

        {drugLog.length > 0 ? (
          <div className="space-y-1.5">
            {drugLog.map(d => (
              <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-slate-900 dark:text-slate-100">{d.name}</span>
                  {d.dose && <span className="text-slate-400 font-medium ml-1.5">({d.dose})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-violet-600 dark:text-violet-400 font-black">{d.time}</span>
                  <button onClick={() => removeDrug(d.id)} className="text-slate-400 hover:text-rose-500 text-xs px-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No medication doses logged today.</p>
        )}
      </Card>

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
