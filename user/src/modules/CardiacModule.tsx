import React, { useState, useMemo, useEffect } from 'react';
import { Heart, Scale, Sparkles } from 'lucide-react';
import { Card, SectionTitle, YesNoToggle, ModeTabs, StressTracker, TalkToDoctorCard } from './shared/ConditionUI';

export const CardiacModule: React.FC = () => {
  const [mode, setMode] = useState<string>('Prevention');

  // Prevention State
  const [height, setHeight] = useState<string>(() => localStorage.getItem('mito_cardiac_height') || '');
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('mito_cardiac_weight') || '');
  const [exercised, setExercised] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_exercised');
    return v === null ? null : v === 'true';
  });
  const [lowSalt, setLowSalt] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_lowsalt');
    return v === null ? null : v === 'true';
  });
  const [lowSugarJunk, setLowSugarJunk] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_lowjunk');
    return v === null ? null : v === 'true';
  });
  const [alcohol, setAlcohol] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_alcohol');
    return v === null ? null : v === 'true';
  });
  const [slept8, setSlept8] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_slept8');
    return v === null ? null : v === 'true';
  });
  const [stress, setStress] = useState<number>(() => Number(localStorage.getItem('mito_cardiac_stress')) || 5);

  // Treatment State
  const [nonStrenuous, setNonStrenuous] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_nonstrenuous');
    return v === null ? null : v === 'true';
  });
  const [meditated, setMeditated] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_meditated');
    return v === null ? null : v === 'true';
  });
  const [lowSaltTx, setLowSaltTx] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_lowsalt_tx');
    return v === null ? null : v === 'true';
  });
  const [lowFatTx, setLowFatTx] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_lowfat_tx');
    return v === null ? null : v === 'true';
  });
  const [slept8Tx, setSlept8Tx] = useState<boolean | null>(() => {
    const v = localStorage.getItem('mito_cardiac_slept8_tx');
    return v === null ? null : v === 'true';
  });
  const [stressTx, setStressTx] = useState<number>(() => Number(localStorage.getItem('mito_cardiac_stress_tx')) || 5);

  // Persist State
  useEffect(() => { localStorage.setItem('mito_cardiac_height', height); }, [height]);
  useEffect(() => { localStorage.setItem('mito_cardiac_weight', weight); }, [weight]);
  useEffect(() => { if (exercised !== null) localStorage.setItem('mito_cardiac_exercised', String(exercised)); }, [exercised]);
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
          <span className="text-xs font-black uppercase tracking-widest text-rose-100">Cardiovascular Protection</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Cardiac Health Protocol</h1>
        <p className="text-xs text-rose-100/90 mt-1 leading-relaxed max-w-xl">
          Arterial defense, weight management, and post-cardiac event gentle recovery lifestyle.
        </p>
      </div>

      <ModeTabs modes={['Prevention', 'Treatment']} active={mode} onChange={setMode} />

      {mode === 'Prevention' && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Today's Cardiac Prevention Score</p>
              <p className="text-2xl font-black" style={{ color: preventionScore >= 0 ? '#10B981' : '#EF4444' }}>
                {preventionScore > 0 ? `+${preventionScore}` : preventionScore}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 text-right">
              Cardio, low-salt/sugar, zero alcohol & sleep
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Scale}>Weight & Cardiovascular BMI</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="e.g. 172"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="e.g. 74"
                />
              </div>
            </div>
            {bmi !== null && (
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
                Cardiovascular BMI: <span className="font-black text-rose-600 dark:text-rose-400">{bmi.toFixed(1)}</span>
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Heart}>Daily Habits (Cardiac Defense)</SectionTitle>
            <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label="Ate low-salt foods today?" value={lowSalt} onChange={setLowSalt} goodAnswer={true} />
            <YesNoToggle label="Ate low-sugar / low-junk food today?" value={lowSugarJunk} onChange={setLowSugarJunk} goodAnswer={true} />
            <YesNoToggle label="Had alcohol today?" value={alcohol} onChange={setAlcohol} goodAnswer={false} />
            <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
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
              <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Today's Treatment Protocol Score</p>
              <p className="text-2xl font-black" style={{ color: treatmentScore >= 0 ? '#10B981' : '#EF4444' }}>
                {treatmentScore > 0 ? `+${treatmentScore}` : treatmentScore}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 text-right">
              Non-strenuous movement, meditation & low-fat diet
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Heart}>Gentle Daily Cardiac Recovery Protocol</SectionTitle>
            <YesNoToggle
              label="Non-strenuous exercise 20 minutes?"
              sublabel="Light walking, gentle yoga, or cardiac rehab movement"
              value={nonStrenuous}
              onChange={setNonStrenuous}
              goodAnswer={true}
            />
            <YesNoToggle label="Meditated today?" value={meditated} onChange={setMeditated} goodAnswer={true} />
            <YesNoToggle label="Ate low-salt food today?" value={lowSaltTx} onChange={setLowSaltTx} goodAnswer={true} />
            <YesNoToggle label="Ate low-fat / whole food today?" value={lowFatTx} onChange={setLowFatTx} goodAnswer={true} />
            <YesNoToggle label="Slept 8 hours?" value={slept8Tx} onChange={setSlept8Tx} goodAnswer={true} />
            <div className="pt-2">
              <StressTracker value={stressTx} onChange={setStressTx} />
            </div>
          </Card>

          <TalkToDoctorCard
            specialty="Cardiologist"
            note="Consult your cardiologist before progressing exercise intensity, especially post-angioplasty, bypass, or cardiac events."
          />
        </>
      )}
    </div>
  );
};
