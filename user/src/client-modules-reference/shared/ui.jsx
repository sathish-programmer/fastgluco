import React from "react";

/** Colour scale used everywhere a 0-100% score is shown. */
export function pctColor(pct) {
  if (pct >= 70) return "#5DCAA5";
  if (pct >= 40) return "#FAC775";
  return "#F09595";
}

/** Colour scale for a raw 1-10 severity value where 10 = worst. */
export function severityColor(v) {
  if (v <= 3) return "#5DCAA5";
  if (v <= 6) return "#FAC775";
  return "#F09595";
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, color = "#5DCAA5" }) {
  return (
    <h2 className="text-base font-medium mb-2" style={{ color }}>
      {children}
    </h2>
  );
}

/** Yes/No toggle. `good` marks which answer counts as the positive habit,
 * purely for colour — the caller still receives raw true/false. */
export function YesNoToggle({ label, value, onChange, goodAnswer = true, sublabel }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div>
        <p className="text-sm text-slate-200">{label}</p>
        {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
            value === true
              ? goodAnswer === true
                ? "bg-teal-900/60 border-teal-500 text-teal-200"
                : "bg-red-900/40 border-red-500 text-red-200"
              : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
            value === false
              ? goodAnswer === false
                ? "bg-teal-900/60 border-teal-500 text-teal-200"
                : "bg-red-900/40 border-red-500 text-red-200"
              : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function ScoreBadge({ pct }) {
  return (
    <span className="text-sm font-medium" style={{ color: pctColor(pct) }}>
      {Math.round(pct)}%
    </span>
  );
}

export function ModeTabs({ modes, active, onChange }) {
  return (
    <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0,1fr))` }}>
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
            active === m
              ? "bg-teal-900/60 border-teal-500 text-teal-200"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export function Slider1to10({ label, value, onChange, worstLabel = "Worst", bestLabel = "Minimal" }) {
  const v = value ?? 1;
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-200">{label}</span>
        <span className="font-medium" style={{ color: severityColor(v) }}>
          {v}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-500"
      />
      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
        <span>1 · {bestLabel}</span>
        <span>10 · {worstLabel}</span>
      </div>
    </div>
  );
}

export function TalkToDoctorCard({ specialty, note }) {
  return (
    <Card className="border-teal-900/60 bg-teal-950/20">
      <p className="text-sm text-teal-200 font-medium mb-1">Talk to your {specialty}</p>
      <p className="text-xs text-slate-400">{note}</p>
      <p className="text-[11px] text-slate-600 mt-2">
        This tracker supports your care, it doesn't replace it — please consult your {specialty} if symptoms persist or worsen.
      </p>
    </Card>
  );
}
