import React from 'react';
import { HeartHandshake, Calendar } from 'lucide-react';

/** Colour scale used everywhere a 0-100% score is shown */
export function pctColor(pct: number): string {
  if (pct >= 70) return '#10B981'; // Emerald
  if (pct >= 40) return '#F59E0B'; // Amber
  return '#EF4444'; // Rose
}

/** Colour scale for a raw 1-10 severity value where 10 = worst */
export function severityColor(v: number): string {
  if (v <= 3) return '#10B981'; // Emerald (Low/Calm)
  if (v <= 6) return '#F59E0B'; // Amber (Moderate)
  return '#EF4444'; // Rose (High/Severe)
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs transition-all ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, color, icon: Icon }: { children: React.ReactNode; color?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200" style={{ color: color || undefined }}>
        {children}
      </h2>
    </div>
  );
}

/** Yes/No toggle with premium pill styling */
export function YesNoToggle({
  label,
  value,
  onChange,
  goodAnswer = true,
  sublabel
}: {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
  goodAnswer?: boolean;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        {sublabel && <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            value === true
              ? goodAnswer === true
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                : 'bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            value === false
              ? goodAnswer === false
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                : 'bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function ScoreBadge({ pct }: { pct: number }) {
  const color = pctColor(pct);
  return (
    <span
      className="text-xs font-black px-2.5 py-1 rounded-full border shadow-xs"
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`
      }}
    >
      {Math.round(pct)}%
    </span>
  );
}

export function ModeTabs({
  modes,
  active,
  onChange
}: {
  modes: string[];
  active: string;
  onChange: (m: string) => void;
}) {
  return (
    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0,1fr))` }}>
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`py-2 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer text-center ${
            active === m
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export function Slider1to10({
  label,
  value,
  onChange,
  worstLabel = 'Severe',
  bestLabel = 'Minimal'
}: {
  label: string;
  value?: number;
  onChange: (val: number) => void;
  worstLabel?: string;
  bestLabel?: string;
}) {
  const v = value ?? 1;
  const col = severityColor(v);
  return (
    <div className="py-2">
      <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
        <span className="text-slate-800 dark:text-slate-200">{label}</span>
        <span className="font-black px-2 py-0.5 rounded-md text-[11px]" style={{ color: col, backgroundColor: `${col}15` }}>
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
        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
        <span>1 · {bestLabel}</span>
        <span>10 · {worstLabel}</span>
      </div>
    </div>
  );
}

export function StressTracker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const v = value ?? 5;
  const col = severityColor(v);
  return (
    <div className="py-2">
      <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
        <span className="text-slate-800 dark:text-slate-200">Stress level today</span>
        <span className="font-black px-2 py-0.5 rounded-md text-[11px]" style={{ color: col, backgroundColor: `${col}15` }}>
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
        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
        <span>1 · Calm / Relaxed</span>
        <span>10 · Overwhelmed</span>
      </div>
    </div>
  );
}

export function TalkToDoctorCard({
  specialty,
  note,
  onBook
}: {
  specialty: string;
  note: string;
  onBook?: () => void;
}) {
  const handleBookClick = () => {
    sessionStorage.setItem('mito_target_specialty', specialty);
    if (onBook) {
      onBook();
    } else {
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Book Appointment' }));
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-3xl p-5 shadow-xs transition-all">
      <div className="flex gap-3.5 items-start">
        <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5">
            <p className="text-xs font-black text-blue-950 dark:text-blue-200">
              Consult Your {specialty}
            </p>
            <button
              type="button"
              onClick={handleBookClick}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {note}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2">
            This tracker supports your daily lifestyle habits and does not replace professional clinical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
