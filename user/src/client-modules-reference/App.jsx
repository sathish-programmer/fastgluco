import React, { useState } from "react";
import AgeingModule from "./modules/AgeingModule";
import PCODModule from "./modules/PCODModule";
import DiabetesModule from "./modules/DiabetesModule";
import HypertensionModule from "./modules/HypertensionModule";
import CardiacModule from "./modules/CardiacModule";
import ParkinsonModule from "./modules/ParkinsonModule";

const MODULES = [
  { key: "ageing", label: "Ageing", component: AgeingModule },
  { key: "pcod", label: "PCOD", component: PCODModule },
  { key: "diabetes", label: "Diabetes", component: DiabetesModule },
  { key: "hypertension", label: "Hypertension", component: HypertensionModule },
  { key: "cardiac", label: "Cardiac", component: CardiacModule },
  { key: "parkinson", label: "Parkinson's", component: ParkinsonModule },
];

export default function App() {
  const [active, setActive] = useState("ageing");
  const ActiveComponent = MODULES.find((m) => m.key === active).component;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {MODULES.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors ${
                active === m.key
                  ? "bg-teal-900/60 border-teal-500 text-teal-200"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <ActiveComponent />
      </main>
    </div>
  );
}
