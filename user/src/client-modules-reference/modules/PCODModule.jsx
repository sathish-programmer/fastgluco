import React, { useState, useMemo } from "react";
import { Card, SectionTitle, YesNoToggle, TalkToDoctorCard } from "../shared/ui";
import StressTracker from "../shared/StressTracker";

/**
 * PCOD module.
 * Integration note: swap `useState` for the app's localStorage-keyed
 * pattern (key by date) so height/weight, period dates and daily habit
 * answers persist and feed trend views, the same way other modules do.
 */
export default function PCODModule() {
  const [height, setHeight] = useState(""); // cm
  const [weight, setWeight] = useState(""); // kg
  const [exercised, setExercised] = useState(null);
  const [ateJunk, setAteJunk] = useState(null);
  const [slept8, setSlept8] = useState(null);
  const [stress, setStress] = useState(5);
  const [hirsutism, setHirsutism] = useState(null);
  const [periodDates, setPeriodDates] = useState([]); // ISO date strings, sorted ascending
  const [newPeriodDate, setNewPeriodDate] = useState("");

  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return null;
    return w / (h * h);
  }, [height, weight]);

  const bmiCategory = (b) => {
    if (b == null) return { label: "—", color: "#94a3b8" };
    if (b < 18.5) return { label: "Underweight", color: "#FAC775" };
    if (b < 25) return { label: "Healthy range", color: "#5DCAA5" };
    if (b < 30) return { label: "Overweight", color: "#FAC775" };
    return { label: "Obese range", color: "#F09595" };
  };
  const bmiCat = bmiCategory(bmi);

  // Additive daily score: exercise/sleep help (+1), junk hurts (-1),
  // stress <=5 counts as a good day (+1), >5 as a hard day (-1).
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

  const cycleStats = useMemo(() => {
    if (periodDates.length < 2) return { avgLength: null, nextPredicted: null };
    const dates = periodDates.map((d) => new Date(d)).sort((a, b) => a - b);
    const gaps = [];
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
    setPeriodDates((prev) => [...new Set([...prev, newPeriodDate])].sort());
    setNewPeriodDate("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-teal-300">PCOD</h1>
        <p className="text-sm text-slate-400 mt-1">Daily habits, cycle tracking and symptom check-ins.</p>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Today's score</p>
          <p className="text-2xl font-semibold" style={{ color: dailyScore >= 0 ? "#5DCAA5" : "#F09595" }}>
            {dailyScore > 0 ? `+${dailyScore}` : dailyScore}
          </p>
        </div>
        <p className="text-right text-xs text-slate-500">Exercise, junk food, sleep and stress today</p>
      </Card>

      <Card>
        <SectionTitle>Height, weight & BMI</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-slate-500">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              placeholder="e.g. 162"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              placeholder="e.g. 68"
            />
          </div>
        </div>
        {bmi && (
          <p className="text-sm text-slate-300">
            BMI: <span className="font-medium" style={{ color: bmiCat.color }}>{bmi.toFixed(1)} · {bmiCat.label}</span>
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Daily habits</SectionTitle>
        <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
        <YesNoToggle label="Ate junk food today?" value={ateJunk} onChange={setAteJunk} goodAnswer={false} />
        <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
        <div className="pt-1">
          <StressTracker value={stress} onChange={setStress} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Period tracker</SectionTitle>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={newPeriodDate}
            onChange={(e) => setNewPeriodDate(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
          />
          <button
            onClick={logPeriod}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-teal-900/60 border border-teal-500 text-teal-200"
          >
            Log period start
          </button>
        </div>
        {periodDates.length > 0 && (
          <p className="text-xs text-slate-500 mb-1">
            Logged: {periodDates.slice(-5).map((d) => new Date(d).toLocaleDateString()).join(", ")}
          </p>
        )}
        {cycleStats.avgLength && (
          <p className="text-sm text-slate-300">
            Average cycle length: <span className="text-teal-300 font-medium">{Math.round(cycleStats.avgLength)} days</span>
            {" · "}
            Next expected: <span className="text-teal-300 font-medium">{cycleStats.nextPredicted.toLocaleDateString()}</span>
          </p>
        )}
        {periodDates.length < 2 && (
          <p className="text-xs text-slate-600">Log at least two cycles to see average length and prediction.</p>
        )}
      </Card>

      <Card>
        <SectionTitle>Symptom check-in</SectionTitle>
        <YesNoToggle
          label="Noticing excess facial/body hair growth (hirsutism)?"
          sublabel="A common PCOD symptom worth flagging to your gynaecologist"
          value={hirsutism}
          onChange={setHirsutism}
          goodAnswer={false}
        />
      </Card>

      <TalkToDoctorCard
        specialty="gynaecologist"
        note="Irregular cycles, hirsutism, or a rising BMI trend are worth discussing at your next visit — this app is for daily tracking, not diagnosis."
      />
    </div>
  );
}
