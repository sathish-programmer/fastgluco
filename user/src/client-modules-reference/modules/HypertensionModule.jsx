import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, SectionTitle, YesNoToggle, ModeTabs } from "../shared/ui";
import StressTracker from "../shared/StressTracker";

export default function HypertensionModule() {
  const [mode, setMode] = useState("Prevention");

  // Prevention
  const [exercised, setExercised] = useState(null);
  const [meditated, setMeditated] = useState(null);
  const [lowSalt, setLowSalt] = useState(null);
  const [slept8, setSlept8] = useState(null);
  const [stress, setStress] = useState(5);

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

  // Treatment
  const [bpLog, setBpLog] = useState([]); // {date, amSys, amDia, pmSys, pmDia}
  const [entryDate, setEntryDate] = useState("");
  const [amSys, setAmSys] = useState("");
  const [amDia, setAmDia] = useState("");
  const [pmSys, setPmSys] = useState("");
  const [pmDia, setPmDia] = useState("");
  const [highSaltToday, setHighSaltToday] = useState(null);
  const [exercisedTx, setExercisedTx] = useState(null);
  const [meditatedTx, setMeditatedTx] = useState(null);
  const [lovedActivity, setLovedActivity] = useState(null);
  const [slept8Tx, setSlept8Tx] = useState(null);
  const [stressTx, setStressTx] = useState(5);

  const addBpEntry = () => {
    if (!entryDate) return;
    setBpLog((prev) =>
      [
        ...prev,
        {
          date: entryDate,
          amSys: amSys ? Number(amSys) : null,
          amDia: amDia ? Number(amDia) : null,
          pmSys: pmSys ? Number(pmSys) : null,
          pmDia: pmDia ? Number(pmDia) : null,
        },
      ].sort((a, b) => new Date(a.date) - new Date(b.date))
    );
    setEntryDate("");
    setAmSys("");
    setAmDia("");
    setPmSys("");
    setPmDia("");
  };

  const chartData = bpLog.map((e) => ({
    date: new Date(e.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    "AM Systolic": e.amSys,
    "AM Diastolic": e.amDia,
    "PM Systolic": e.pmSys,
    "PM Diastolic": e.pmDia,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-teal-300">Hypertension</h1>
        <p className="text-sm text-slate-400 mt-1">Prevention habits, or daily BP monitoring if already diagnosed.</p>
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
            <YesNoToggle label="Exercised today?" value={exercised} onChange={setExercised} goodAnswer={true} />
            <YesNoToggle label="Meditated today?" value={meditated} onChange={setMeditated} goodAnswer={true} />
            <YesNoToggle label="Ate low-salt food today?" value={lowSalt} onChange={setLowSalt} goodAnswer={true} />
            <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
            <div className="pt-1">
              <StressTracker value={stress} onChange={setStress} />
            </div>
          </Card>
        </>
      )}

      {mode === "Treatment" && (
        <>
          <Card>
            <SectionTitle>Blood pressure — morning & evening</SectionTitle>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="col-span-2 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                type="number"
                placeholder="AM Systolic"
                value={amSys}
                onChange={(e) => setAmSys(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                type="number"
                placeholder="AM Diastolic"
                value={amDia}
                onChange={(e) => setAmDia(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                type="number"
                placeholder="PM Systolic"
                value={pmSys}
                onChange={(e) => setPmSys(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                type="number"
                placeholder="PM Diastolic"
                value={pmDia}
                onChange={(e) => setPmDia(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
              />
            </div>
            <button
              onClick={addBpEntry}
              className="w-full px-3 py-1.5 rounded-md text-sm font-medium bg-teal-900/60 border border-teal-500 text-teal-200 mb-3"
            >
              Log reading
            </button>
            {chartData.length > 0 ? (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="AM Systolic" stroke="#F09595" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="AM Diastolic" stroke="#FAC775" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="PM Systolic" stroke="#AFA9EC" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="PM Diastolic" stroke="#5DCAA5" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-600">Log a reading to see the trend.</p>
            )}
          </Card>

          <Card>
            <SectionTitle>Daily check-in</SectionTitle>
            <YesNoToggle label="High-salt food today?" value={highSaltToday} onChange={setHighSaltToday} goodAnswer={false} />
            <YesNoToggle label="Exercised 20 minutes?" value={exercisedTx} onChange={setExercisedTx} goodAnswer={true} />
            <YesNoToggle label="Meditated 10 minutes?" value={meditatedTx} onChange={setMeditatedTx} goodAnswer={true} />
            <YesNoToggle
              label="Did something you loved for 10 minutes?"
              sublabel="painting, dancing, singing, or similar"
              value={lovedActivity}
              onChange={setLovedActivity}
              goodAnswer={true}
            />
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
