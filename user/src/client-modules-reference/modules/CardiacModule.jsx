import React, { useState, useMemo } from "react";
import { Card, SectionTitle, YesNoToggle, ModeTabs } from "../shared/ui";
import StressTracker from "../shared/StressTracker";

export default function CardiacModule() {
  const [mode, setMode] = useState("Prevention");

  // Prevention — draws on hypertension + diabetes + weight-management habits
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [exercised, setExercised] = useState(null);
  const [lowSalt, setLowSalt] = useState(null);
  const [lowSugarJunk, setLowSugarJunk] = useState(null);
  const [alcohol, setAlcohol] = useState(null);
  const [slept8, setSlept8] = useState(null);
  const [stress, setStress] = useState(5);

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return null;
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

  // Treatment — gentler, post-event / diagnosed protocol
  const [nonStrenuous, setNonStrenuous] = useState(null);
  const [meditated, setMeditated] = useState(null);
  const [lowSaltTx, setLowSaltTx] = useState(null);
  const [lowFatTx, setLowFatTx] = useState(null);
  const [slept8Tx, setSlept8Tx] = useState(null);
  const [stressTx, setStressTx] = useState(5);

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-teal-300">Cardiovascular</h1>
        <p className="text-sm text-slate-400 mt-1">
          Prevention combines hypertension, diabetes and weight-management habits. Treatment is a gentler protocol.
        </p>
      </div>

      <ModeTabs modes={["Prevention", "Treatment"]} active={mode} onChange={setMode} />

      {mode === "Prevention" && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Today's prevention score</p>
              <p className="text-2xl font-semibold" style={{ color: preventionScore >= 0 ? "#5DCAA5" : "#F09595" }}>
                {preventionScore > 0 ? `+${preventionScore}` : preventionScore}
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle>Weight</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
                />
              </div>
            </div>
            {bmi && <p className="text-sm text-slate-300 mt-2">BMI: <span className="text-teal-300 font-medium">{bmi.toFixed(1)}</span></p>}
          </Card>

          <Card>
            <SectionTitle>Daily habits (hypertension + diabetes overlap)</SectionTitle>
            <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label="Ate low-salt food today?" value={lowSalt} onChange={setLowSalt} goodAnswer={true} />
            <YesNoToggle label="Ate low-sugar / low-junk food today?" value={lowSugarJunk} onChange={setLowSugarJunk} goodAnswer={true} />
            <YesNoToggle label="Had alcohol today?" value={alcohol} onChange={setAlcohol} goodAnswer={false} />
            <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-1">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>
        </>
      )}

      {mode === "Treatment" && (
        <>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Today's protocol score</p>
              <p className="text-2xl font-semibold" style={{ color: treatmentScore >= 0 ? "#5DCAA5" : "#F09595" }}>
                {treatmentScore > 0 ? `+${treatmentScore}` : treatmentScore}
              </p>
            </div>
          </Card>
          <Card>
            <SectionTitle>Daily protocol</SectionTitle>
            <YesNoToggle
              label="Non-strenuous exercise 20 minutes?"
              sublabel="yoga or similar low-intensity movement"
              value={nonStrenuous}
              onChange={setNonStrenuous}
              goodAnswer={true}
            />
            <YesNoToggle label="Meditated today?" value={meditated} onChange={setMeditated} goodAnswer={true} />
            <YesNoToggle label="Ate low-salt food today?" value={lowSaltTx} onChange={setLowSaltTx} goodAnswer={true} />
            <YesNoToggle label="Ate low-fat food today?" value={lowFatTx} onChange={setLowFatTx} goodAnswer={true} />
            <YesNoToggle label="Slept 8 hours?" value={slept8Tx} onChange={setSlept8Tx} goodAnswer={true} />
            <div className="pt-1">
              <StressTracker value={stressTx} onChange={setStressTx} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
