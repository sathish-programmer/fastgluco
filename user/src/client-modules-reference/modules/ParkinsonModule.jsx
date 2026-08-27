import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, SectionTitle, Slider1to10, YesNoToggle } from "../shared/ui";

const TIME_SLOTS = ["9:00 AM", "2:00 PM", "6:00 PM", "10:00 PM"];
const SYMPTOMS = [
  { key: "tremor", label: "Tremor" },
  { key: "rigidity", label: "Rigidity" },
  { key: "bradykinesia", label: "Bradykinesia (slowness)" },
];

const DOPAMINE_BOOSTERS = [
  "Hugged someone",
  "Gave or received loving words",
  "Sunlight exposure",
  "Listened to favourite music",
  "Physical touch / massage",
];

export default function ParkinsonModule() {
  // symptomScores[timeSlot][symptomKey] = 1-10
  const [symptomScores, setSymptomScores] = useState({});
  const setScore = (slot, key, value) => {
    setSymptomScores((prev) => ({ ...prev, [slot]: { ...prev[slot], [key]: value } }));
  };

  const [drugLog, setDrugLog] = useState([]); // {id, name, dose, time}
  const [drugName, setDrugName] = useState("");
  const [drugDose, setDrugDose] = useState("");
  const [drugTime, setDrugTime] = useState("");

  const addDrug = () => {
    if (!drugName || !drugTime) return;
    setDrugLog((prev) =>
      [...prev, { id: Date.now(), name: drugName, dose: drugDose, time: drugTime }].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    );
    setDrugName("");
    setDrugDose("");
    setDrugTime("");
  };

  // Mood booster
  const [slept8, setSlept8] = useState(null);
  const [lovedActivity, setLovedActivity] = useState(null);
  const [lovedActivityNote, setLovedActivityNote] = useState("");
  const [darkChocolate, setDarkChocolate] = useState(null);
  const [boosters, setBoosters] = useState({});

  const toggleBooster = (b) => setBoosters((prev) => ({ ...prev, [b]: !prev[b] }));
  const boosterCount =
    Object.values(boosters).filter(Boolean).length +
    (slept8 ? 1 : 0) +
    (lovedActivity ? 1 : 0) +
    (darkChocolate ? 1 : 0);

  const chartData = TIME_SLOTS.map((slot) => ({
    time: slot,
    Tremor: symptomScores[slot]?.tremor ?? null,
    Rigidity: symptomScores[slot]?.rigidity ?? null,
    Bradykinesia: symptomScores[slot]?.bradykinesia ?? null,
  }));
  const hasAnyScore = Object.keys(symptomScores).length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-teal-300">Parkinson's — Treatment</h1>
        <p className="text-sm text-slate-400 mt-1">Symptom check-ins across the day, medication log, and mood support.</p>
      </div>

      <Card>
        <SectionTitle>Symptom severity by time of day</SectionTitle>
        <p className="text-xs text-slate-500 mb-3">Rate each symptom 1 (minimal) to 10 (worst) at each check-in.</p>
        <div className="space-y-4">
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm text-teal-300 font-medium mb-1">{slot}</p>
              {SYMPTOMS.map((s) => (
                <Slider1to10
                  key={s.key}
                  label={s.label}
                  value={symptomScores[slot]?.[s.key]}
                  onChange={(v) => setScore(slot, s.key, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {hasAnyScore && (
        <Card>
          <SectionTitle>Today's pattern</SectionTitle>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[1, 10]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Tremor" stroke="#F09595" strokeWidth={2} connectNulls dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Rigidity" stroke="#FAC775" strokeWidth={2} connectNulls dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Bradykinesia" stroke="#AFA9EC" strokeWidth={2} connectNulls dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Medication tracker</SectionTitle>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            placeholder="Drug name"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            className="col-span-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
          />
          <input
            type="text"
            placeholder="Dose (e.g. 100mg)"
            value={drugDose}
            onChange={(e) => setDrugDose(e.target.value)}
            className="col-span-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
          />
          <input
            type="time"
            value={drugTime}
            onChange={(e) => setDrugTime(e.target.value)}
            className="col-span-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
          />
        </div>
        <button
          onClick={addDrug}
          className="w-full px-3 py-1.5 rounded-md text-sm font-medium bg-teal-900/60 border border-teal-500 text-teal-200 mb-3"
        >
          Log dose
        </button>
        {drugLog.length > 0 ? (
          <ul className="space-y-1">
            {drugLog.map((d) => (
              <li key={d.id} className="text-sm text-slate-300 flex justify-between border-b border-slate-800 pb-1">
                <span>{d.name}{d.dose ? ` · ${d.dose}` : ""}</span>
                <span className="text-slate-500">{d.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-600">No doses logged yet today.</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Mood & dopamine boosters</SectionTitle>
          <span className="text-sm font-medium text-teal-300">{boosterCount} today</span>
        </div>
        <YesNoToggle label="Slept 8 hours?" value={slept8} onChange={setSlept8} goodAnswer={true} />
        <YesNoToggle
          label="Did something you love today?"
          sublabel="singing, painting, drawing, or similar"
          value={lovedActivity}
          onChange={setLovedActivity}
          goodAnswer={true}
        />
        {lovedActivity === true && (
          <input
            type="text"
            placeholder="What did you do?"
            value={lovedActivityNote}
            onChange={(e) => setLovedActivityNote(e.target.value)}
            className="w-full mb-2 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100"
          />
        )}
        <YesNoToggle label="Ate dark chocolate today?" value={darkChocolate} onChange={setDarkChocolate} goodAnswer={true} />
        <p className="text-xs text-slate-500 mt-3 mb-1">Other dopamine boosters today</p>
        <div className="flex flex-wrap gap-2">
          {DOPAMINE_BOOSTERS.map((b) => (
            <button
              key={b}
              onClick={() => toggleBooster(b)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                boosters[b]
                  ? "bg-teal-900/60 border-teal-500 text-teal-200"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
