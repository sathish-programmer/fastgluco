import React from 'react';
import { Activity, ShieldCheck, HeartPulse, Sparkles, CheckCircle2, TrendingDown } from 'lucide-react';

interface HeroAppShowcaseProps {
  appName?: string;
}

export const HeroAppShowcase: React.FC<HeroAppShowcaseProps> = ({ appName = 'Mito Reboot' }) => {
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      {/* Background ambient glow behind device */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-teal-500/20 rounded-[50px] blur-2xl opacity-75 pointer-events-none" />

      {/* Floating Glass Pill: CGM Spike Protection */}
      <div className="absolute -top-4 -left-4 sm:-left-8 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-float">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0">
          <TrendingDown className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Postprandial CGM</div>
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
            <span>98 mg/dL</span>
            <span className="text-[10px] font-extrabold text-emerald-600">• Spike Protected</span>
          </div>
        </div>
      </div>

      {/* Floating Glass Pill: Medical Specialist */}
      <div className="absolute -bottom-5 -right-2 sm:-right-6 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-float-delayed">
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Oncology MD Review</div>
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
            <span>Dr. Krithikaa Sekar</span>
            <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded font-bold">Verified</span>
          </div>
        </div>
      </div>

      {/* Modern Device Frame */}
      <div className="relative bg-slate-950 p-3 sm:p-3.5 rounded-[48px] shadow-2xl border-[5px] border-slate-800/90 overflow-hidden">
        {/* Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-30 pointer-events-none">
          <div className="bg-slate-950 w-28 h-5 rounded-b-2xl flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-900"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/70"></div>
          </div>
        </div>

        {/* Screen Content Body */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-[38px] p-5 pt-8 text-white relative min-h-[460px] flex flex-col justify-between border border-slate-800/60 overflow-hidden">
          {/* Top Status */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-xs">
                M
              </div>
              <div>
                <div className="text-xs font-black tracking-tight text-white leading-none">
                  {appName || 'Mito_Reboot'}
                  <span className="text-[8px] text-blue-400 ml-0.5">PRO</span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">Cellular Engine Active</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live CGM
            </span>
          </div>

          {/* Center Card: Cellular Health Tug-of-War Score */}
          <div className="my-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Cellular Balance State
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">+4 Net</span>
                  <span className="text-[11px] font-bold text-slate-300">Autophagy Dominance</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Force Ratio Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-extrabold">
                <span className="text-rose-400">Stress: 2</span>
                <span className="text-emerald-400">Repair: 6</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="w-[25%] bg-rose-500" />
                <div className="w-[75%] bg-gradient-to-r from-emerald-500 to-teal-400" />
              </div>
            </div>

            {/* Mini SVG CGM Glycemic Line */}
            <div className="pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  Continuous Glucose (Last 6 Hours)
                </span>
                <span className="text-emerald-400 font-extrabold">In Target 98%</span>
              </div>
              <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id="heroCgmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,28 Q 30,22 60,25 T 120,15 T 160,22 T 200,18"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 0,28 Q 30,22 60,25 T 120,15 T 160,22 T 200,18 L 200,40 L 0,40 Z"
                  fill="url(#heroCgmGrad)"
                />
                <circle cx="200" cy="18" r="3" fill="#10b981" className="animate-ping" />
                <circle cx="200" cy="18" r="3" fill="#ffffff" />
              </svg>
            </div>
          </div>

          {/* Protocols List in-app */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block px-1">
              Active Cellular Protocols
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 truncate">16h Circadian Fast</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 truncate">4-4-4-4 Breathwork</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 truncate">Clean Cookware 304</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-bold text-slate-200 truncate">Lab Bloodwork OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

