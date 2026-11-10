import React from 'react';
import { Timer, Activity, Star, Stethoscope } from 'lucide-react';

export const SocialProofStats: React.FC = () => {
  const stats = [
    {
      value: '120,000+',
      label: 'Fasting Hours Tracked',
      subtext: 'Autophagy & cellular repair',
      icon: <Timer className="h-5 w-5 text-blue-600" />,
      accent: 'border-blue-100 bg-blue-50/40'
    },
    {
      value: '98.4%',
      label: 'Average Time-in-Range',
      subtext: 'Optimal 70-140 mg/dL target',
      icon: <Activity className="h-5 w-5 text-teal-600" />,
      accent: 'border-teal-100 bg-teal-50/40'
    },
    {
      value: '4.8 ★',
      label: 'App Store Rating',
      subtext: 'Rated by patient community',
      icon: <Star className="h-5 w-5 text-amber-500 fill-amber-400" />,
      accent: 'border-amber-100 bg-amber-50/40'
    },
    {
      value: '100%',
      label: 'Verified Oncologists',
      subtext: 'Radiation & lifestyle doctors',
      icon: <Stethoscope className="h-5 w-5 text-emerald-600" />,
      accent: 'border-emerald-100 bg-emerald-50/40'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 -mt-4 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-3xl border bg-white shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs">
                {stat.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Verified
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                {stat.label}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {stat.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

