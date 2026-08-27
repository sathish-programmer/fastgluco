import React from "react";
import { severityColor } from "./ui";

/**
 * Stress tracker — same 1-10 self-rated scale used in the core Mito Reboot
 * stress module. Drop this into any condition module so stress is logged
 * the same way everywhere.
 *
 * Integration note: in the main app, back `value`/`onChange` with the same
 * localStorage-keyed state your existing stress tracker uses (keyed by
 * date) so this reads from — and writes to — the same history/trend data.
 */
export default function StressTracker({ value, onChange }) {
  const v = value ?? 5;
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-200">Stress level today</span>
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
        <span>1 · Calm</span>
        <span>10 · Highly stressed</span>
      </div>
    </div>
  );
}
