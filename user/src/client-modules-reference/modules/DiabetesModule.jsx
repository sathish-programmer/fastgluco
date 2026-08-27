import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, SectionTitle, YesNoToggle, ModeTabs } from "../shared/ui";
import StressTracker from "../shared/StressTracker";

const YEARLY_CHECKS_TEMPLATE = [
  { key: "peripheral", label: "Peripheral neuropathy & foot (podiatry) check" },
  { key: "retinopathy", label: "Retinopathy screening (eyes)" },
  { key: "nephropathy", label: "Nephropathy screening (kidney)" },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function DiabetesModule() {
  const [mode, setMode] = useState("Prevention");

  // Prevention state
  const [exercised, setExercised] = useState(null);
  const [tookAlcohol, setTookAlcohol] = useState(null);
  const [ateJunk, setAteJunk] = useState(null);
  const [slept8, setSlept8] = useState(null);
  const [stress, setStress] = useState(5);
  const [lastFbsPpbs, setLastFbsPpbs] = useState("");

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

  const fbsDue = useMemo(() => {
    const d = daysSince(lastFbsPpbs);
    return d == null ? null : d > 365;
  }, [lastFbsPpbs]);

  // Treatment state
  const [hba1cLog, setHba1cLog] = useState([]); // {date, value}
  const [newHba1cDate, setNewHba1cDate] = useState("");
  const [newHba1cValue, setNewHba1cValue] = useState("");
  const [yearlyChecks, setYearlyChecks] = useState({}); // key -> date string
  const [ateHighCarb, setAteHighCarb] = useState(null);

  const addHba1c = () => {
    if (!newHba1cDate || !newHba1cValue) return;
    setHba1cLog((prev) =>
      [...prev, { date: newHba1cDate, value: parseFloat(newHba1cValue) }].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )
    );
    setNewHba1cDate("");
    setNewHba1cValue("");
  };

  const chartData = hba1cLog.map((e) => ({
    date: new Date(e.date).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    HbA1c: e.value,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-teal-300">Diabetes</h1>
        <p className="text-sm text-slate-400 mt-1">Prevention habits, or treatment monitoring if already diagnosed.</p>
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
            <SectionTitle>Daily habits</SectionTitle>
            <YesNoToggle label="Exercised 20 minutes today?" value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label="Had alcohol today?" value={tookAlcohol} onChange={setTookAlcohol} goodAnswer={false} />
            <YesNoToggle label="Ate junk food today?" value={ateJunk} onChange={setAteJunk} goodAnswer={false} />
            <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-1">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Yearly screening</SectionTitle>
            <label className="text-xs text-slate-500">Last FBS / PPBS check date</label>
            <input
              type="date"
              value={lastFbsPpbs}
              onChange={(e) => setLastFbsPpbs(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
            />
            {fbsDue !== null && (
              <p className={`text-xs mt-2 ${fbsDue ? "text-red-300" : "text-teal-300"}`}>
                {fbsDue ? "Overdue — it's been more than a year." : "Up to date."}
              </p>
            )}
          </Card>
        </>
      )}

      {mode === "Treatment" && (
        <>
          <Card>
            <SectionTitle>HbA1c (every 3 months)</SectionTitle>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={newHba1cDate}
                onChange={(e) => setNewHba1cDate(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 6.8"
                value={newHba1cValue}
                onChange={(e) => setNewHba1cValue(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <button
                onClick={addHba1c}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-teal-900/60 border border-teal-500 text-teal-200"
              >
                Add
              </button>
            </div>
            {chartData.length > 0 ? (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                    <Line type="monotone" dataKey="HbA1c" stroke="#5DCAA5" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-600">Add readings to see the trend line.</p>
            )}
          </Card>

          <Card>
            <SectionTitle>Yearly checks</SectionTitle>
            {YEARLY_CHECKS_TEMPLATE.map((c) => {
              const d = yearlyChecks[c.key];
              const due = daysSince(d) == null ? null : daysSince(d) > 365;
              return (
                <div key={c.key} className="py-1.5">
                  <p className="text-sm text-slate-200 mb-1">{c.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={d || ""}
                      onChange={(e) => setYearlyChecks((prev) => ({ ...prev, [c.key]: e.target.value }))}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
                    />
                    {due !== null && (
                      <span className={`text-xs ${due ? "text-red-300" : "text-teal-300"}`}>
                        {due ? "Overdue" : "OK"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionTitle>Diabetic diet check-in</SectionTitle>
            <YesNoToggle label="Ate high-carb foods today?" value={ateHighCarb} onChange={setAteHighCarb} goodAnswer={false} />
          </Card>

          <Card className="border-teal-900/60 bg-teal-950/20">
            <p className="text-sm text-teal-200 font-medium mb-1">Diabetic-friendly food support</p>
            <p className="text-xs text-slate-400">
              Low-GI staples, sugar-free snacks and portion-controlled diabetic meal kits — link this section to your
              product catalogue so it recommends actual SKUs instead of categories.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
