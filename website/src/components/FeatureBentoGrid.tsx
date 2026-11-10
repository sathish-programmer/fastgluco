import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Stethoscope, 
  TestTube, 
  Wind, 
  ShoppingCart, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';

export const FeatureBentoGrid: React.FC<{ appName?: string }> = ({ appName = 'Mito Reboot' }) => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 border border-blue-200/80 shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Clinical Longevity Pillars</span>
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Everything You Need to Restore Biological Balance
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-3">
          {appName} replaces guesswork with real-time continuous biological telemetry, circadian habit tracking, and certified physician consultations.
        </p>
      </div>

      {/* Modern Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Bento 1: Two-Force Cellular Balance (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50/60 rounded-3xl p-7 sm:p-9 border border-blue-100 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-[11px] font-extrabold uppercase tracking-wide">
                Patented Engine
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Two-Force Cellular Balance Algorithm
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-2xl">
              Tracks biological friction (glucose spikes, chronic cortisol, cookware microplastics, late-night snacking) directly against cellular repair forces (autophagy fasting, restorative breathwork, antioxidants). Score above 70 daily to enter active mitochondrial repair mode.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-blue-100/80 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real-Time Daily Tug-of-War Score</span>
            </div>
            <span className="text-blue-600 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Explore Scoring <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Bento 2: Abbott FreeStyle Libre CGM (1 col wide) */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black mb-4 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
              Abbott FreeStyle Libre CGM
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Seamlessly sync Abbott Libre continuous glucose telemetry. Map glycemic triggers, pinpoint insulin peaks, and maintain 90%+ Time In Range (70–140 mg/dL).
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
            <span>TIR (70-140 mg/dL)</span>
            <span className="text-[10px] text-slate-400">PDF & Libre CSV</span>
          </div>
        </div>

        {/* Bento 3: Specialist Video Consultations (1 col wide) */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mb-4 group-hover:scale-105 transition-transform">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
              Specialist Consultations
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Book confidential 1-on-1 HD video appointments with certified Radiation Oncologists, Lifestyle Medicine Physicians, and Metabolic Reversal Doctors.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Certified Oncologists</span>
            <span className="text-[10px] text-slate-400">Integrated Video Call</span>
          </div>
        </div>

        {/* Bento 4: Vagus Nerve Breathwork Studio (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-7 sm:p-9 shadow-card hover:shadow-glow-purple transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black border border-indigo-400/30 group-hover:scale-105 transition-transform">
                <Wind className="h-6 w-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-200 text-[11px] font-extrabold uppercase tracking-wide border border-indigo-700/50">
                Parasympathetic Reset
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
              Vagus Nerve Breathwork Pacer
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium max-w-2xl">
              Scientifically engineered visual, auditory, and tactile pacing for Box Breathing (4-4-4-4), 4-7-8 Deep Sleep, and 5.5s Coherent Resonance. Lowers heart rate variability (HRV) stress markers and reduces post-prandial glycemic surge in 5 minutes.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-indigo-300">
            <span>Audio Guides in 5 Indian Languages</span>
            <span className="text-[10px] text-indigo-400">Zero Gear Required</span>
          </div>
        </div>

        {/* Bento 5: At-Home Diagnostic Lab Tests (1 col wide) */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-4 group-hover:scale-105 transition-transform">
              <TestTube className="h-6 w-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2">
              At-Home Lab Tests
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Doorstep phlebotomy sample collection by NABL-accredited laboratory partners. Track longitudinal trends for HbA1c, hs-CRP, Lipid Profiles, and vitamin biomarkers.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Doorstep Sample Collection</span>
            <span className="text-[10px] text-slate-400">NABL Accredited</span>
          </div>
        </div>

        {/* Bento 6: Clean Living Store in INR (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 rounded-3xl p-7 sm:p-9 border border-amber-200/70 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase tracking-wide">
                Direct in ₹ INR
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Curated Clean Living Store
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-2xl">
              Eliminate toxic everyday disruptors. Order certified cast-iron and pure ceramic cookware (zero Teflon/PFAS carcinogens), authentic Abbott Libre CGM sensors, HEPA air purifiers, and cancer scalp cooling caps with instant checkout.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-800">
            <span>Genuine Health Hardware & Certified Organic Foods</span>
            <span className="text-[10px] text-slate-500">Pan-India Pincode Delivery</span>
          </div>
        </div>

      </div>
    </section>
  );
};
