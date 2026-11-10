import React, { useState } from 'react';
import { Activity, Flame, ShieldCheck, Sparkles } from 'lucide-react';

export const InteractiveCGMSimulator: React.FC = () => {
  const [mealType, setMealType] = useState<'spike' | 'balanced'>('balanced');

  const spikeCurve = [
    { time: '0m', val: 95 },
    { time: '15m', val: 120 },
    { time: '30m', val: 155 },
    { time: '45m', val: 182 },
    { time: '60m', val: 168 },
    { time: '75m', val: 135 },
    { time: '90m', val: 105 },
    { time: '120m', val: 78 } // Reactive hypoglycemia crash
  ];

  const balancedCurve = [
    { time: '0m', val: 95 },
    { time: '15m', val: 104 },
    { time: '30m', val: 116 },
    { time: '45m', val: 122 },
    { time: '60m', val: 118 },
    { time: '75m', val: 110 },
    { time: '90m', val: 102 },
    { time: '120m', val: 96 }
  ];

  const activeData = mealType === 'spike' ? spikeCurve : balancedCurve;
  const currentReading = mealType === 'spike' ? 182 : 122;

  // Generate SVG path points
  const points = activeData.map((d, i) => {
    const x = (i / (activeData.length - 1)) * 420 + 40;
    // val range: 60 to 200 -> Y range: 170 to 30
    const y = 190 - ((d.val - 60) / (200 - 60)) * 150;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `40,190 ${points} 460,190`;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Interactive Health Lab
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            See Your Cellular Response in Real-Time
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-lg">
            Toggle meals to preview how continuous glucose spikes trigger cellular inflammation vs how balanced fiber & walks protect mitochondrial ATP.
          </p>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMealType('balanced')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mealType === 'balanced'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🥗 Mito Balanced Meal
          </button>
          <button
            type="button"
            onClick={() => setMealType('spike')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mealType === 'spike'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🍚 High-GI Refined Meal
          </button>
        </div>
      </div>

      {/* Graph and Biological Impact Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-center">
        {/* SVG Chart */}
        <div className="lg:col-span-7 bg-slate-50/80 rounded-2xl p-4 sm:p-6 border border-slate-200/60 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${mealType === 'balanced' ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping`} />
              <span className="text-xs font-bold text-slate-700">Abbott FreeStyle Libre Simulation</span>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${mealType === 'balanced' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {currentReading} <span className="text-xs font-semibold text-slate-500">mg/dL</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-500">
                {mealType === 'balanced' ? 'Peak: In Optimal Zone' : 'Peak: Severe Spike Alert'}
              </span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 500 210" className="w-full h-44 drop-shadow-sm">
              {/* Background safe zone (70-140 mg/dL) */}
              <rect x="40" y="70" width="420" height="75" fill="#10B981" fillOpacity="0.08" rx="6" />
              <text x="45" y="85" fill="#059669" fontSize="9" fontWeight="bold">Optimal Metabolic Range (70 - 140 mg/dL)</text>

              {/* Threshold line 140 */}
              <line x1="40" y1="70" x2="460" y2="70" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

              {/* Area fill */}
              <polygon
                points={areaPoints}
                fill={mealType === 'balanced' ? 'url(#balancedGrad)' : 'url(#spikeGrad)'}
                className="transition-all duration-700"
              />

              {/* Curve Line */}
              <polyline
                fill="none"
                stroke={mealType === 'balanced' ? '#10B981' : '#E11D48'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="transition-all duration-700"
              />

              {/* Peak indicator dot */}
              <circle
                cx={mealType === 'balanced' ? "220" : "220"}
                cy={mealType === 'balanced' ? "123" : "59"}
                r="6"
                fill={mealType === 'balanced' ? '#10B981' : '#E11D48'}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="transition-all duration-700"
              />

              <defs>
                <linearGradient id="balancedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="spikeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E11D48" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#E11D48" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-600 px-6 pt-1">
            <span>0m (Pre-meal)</span>
            <span>30m</span>
            <span>45m Peak</span>
            <span>90m</span>
            <span>120m</span>
          </div>
        </div>

        {/* Biological Scorecard */}
        <div className="lg:col-span-5 space-y-3">
          <div className={`p-4 rounded-2xl border transition-all ${
            mealType === 'balanced'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {mealType === 'balanced' ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Flame className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="text-xs font-black uppercase tracking-wider">
                {mealType === 'balanced' ? 'Cellular Repair Mode Active' : 'Cellular Stress & Glycation Spike'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              {mealType === 'balanced'
                ? 'Fiber sequencing and post-meal vagal activity blunted the glucose wave. Mitochondria operate efficiently with minimal oxidative byproduct formation.'
                : 'Rapid spike over 140 mg/dL triggers excess insulin, arterial endothelial irritation, and mitochondrial ROS stress, leading to a late energy crash.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="block text-[10px] text-slate-600 font-bold uppercase">Spike Severity</span>
              <span className={`text-sm font-black ${mealType === 'balanced' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {mealType === 'balanced' ? '+27 mg/dL (Mild)' : '+87 mg/dL (High)'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="block text-[10px] text-slate-600 font-bold uppercase">Time In Target</span>
              <span className={`text-sm font-black ${mealType === 'balanced' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {mealType === 'balanced' ? '98%' : '62%'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://apps.apple.com/in/app/mito-reboot/id6783705985"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-all text-center"
            >
              <Activity className="h-3.5 w-3.5" />
              Connect Your CGM Sensor in Mito Reboot
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
