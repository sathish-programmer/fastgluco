import React, { useState } from 'react';
import { ShieldCheck, HeartPulse, Award } from 'lucide-react';

interface MetricItem {
  id: string;
  name: string;
  unit: string;
  baseline: string;
  current: string;
  change: string;
  status: 'positive' | 'neutral';
  clinicalMeaning: string;
}

export const BiomarkerTransformationShowcase: React.FC = () => {
  const [activeStage, setActiveStage] = useState<'30' | '60' | '90'>('90');

  const metricsByStage: Record<'30' | '60' | '90', MetricItem[]> = {
    '30': [
      {
        id: 'fasting-glucose',
        name: 'Fasting Plasma Glucose',
        unit: 'mg/dL',
        baseline: '168',
        current: '124',
        change: '-26%',
        status: 'positive',
        clinicalMeaning: 'Reduction in early-morning hepatic glucose output through 14-hour circadian fasting'
      },
      {
        id: 'hba1c',
        name: 'Estimated Glycated HbA1c',
        unit: '%',
        baseline: '8.4',
        current: '7.3',
        change: '-1.1%',
        status: 'positive',
        clinicalMeaning: 'Initial normalization of erythrocyte glucose exposure'
      },
      {
        id: 'glucose-variability',
        name: 'CGM Glycemic Variability (SD)',
        unit: 'mg/dL',
        baseline: '42',
        current: '26',
        change: '-38%',
        status: 'positive',
        clinicalMeaning: 'Stabilized postprandial glycemic excursions through sequence meal ordering'
      },
      {
        id: 'cellular-vitality',
        name: 'Cellular Vitality & Deep Sleep',
        unit: 'Score / 100',
        baseline: '38',
        current: '64',
        change: '+68%',
        status: 'positive',
        clinicalMeaning: 'Restored vagal tone and parasympathetic dominance from 4-4-4-4 box breathing'
      }
    ],
    '60': [
      {
        id: 'fasting-glucose',
        name: 'Fasting Plasma Glucose',
        unit: 'mg/dL',
        baseline: '168',
        current: '106',
        change: '-37%',
        status: 'positive',
        clinicalMeaning: 'Significant restoration of peripheral insulin sensitivity'
      },
      {
        id: 'hba1c',
        name: 'Estimated Glycated HbA1c',
        unit: '%',
        baseline: '8.4',
        current: '6.4',
        change: '-2.0%',
        status: 'positive',
        clinicalMeaning: 'Approaching pre-diabetic therapeutic thresholds'
      },
      {
        id: 'glucose-variability',
        name: 'CGM Glycemic Variability (SD)',
        unit: 'mg/dL',
        baseline: '42',
        current: '18',
        change: '-57%',
        status: 'positive',
        clinicalMeaning: 'Dramatic reduction in reactive hypoglycemia and daytime energy dips'
      },
      {
        id: 'cellular-vitality',
        name: 'Cellular Vitality & Deep Sleep',
        unit: 'Score / 100',
        baseline: '38',
        current: '78',
        change: '+105%',
        status: 'positive',
        clinicalMeaning: 'Enhanced mitochondrial biogenesis and daytime cognitive sharpness'
      }
    ],
    '90': [
      {
        id: 'fasting-glucose',
        name: 'Fasting Plasma Glucose',
        unit: 'mg/dL',
        baseline: '168',
        current: '92',
        change: '-45%',
        status: 'positive',
        clinicalMeaning: 'Full clinical normalization within optimal non-diabetic range (70–99 mg/dL)'
      },
      {
        id: 'hba1c',
        name: 'Estimated Glycated HbA1c',
        unit: '%',
        baseline: '8.4',
        current: '5.6',
        change: '-33%',
        status: 'positive',
        clinicalMeaning: 'Complete metabolic remission threshold achieved without pharmaceutical escalation'
      },
      {
        id: 'glucose-variability',
        name: 'CGM Glycemic Variability (SD)',
        unit: 'mg/dL',
        baseline: '42',
        current: '13',
        change: '-69%',
        status: 'positive',
        clinicalMeaning: 'Smooth, resilient curve with minimal vascular endothelial inflammation'
      },
      {
        id: 'cellular-vitality',
        name: 'Cellular Vitality & Deep Sleep',
        unit: 'Score / 100',
        baseline: '38',
        current: '89',
        change: '+134%',
        status: 'positive',
        clinicalMeaning: 'Sustained cellular autophagy and peak mitochondrial ATP generation'
      }
    ]
  };

  const metrics = metricsByStage[activeStage];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Clinical Transformation Outcomes</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Measurable Biomarker Reversal Timeline
          </h3>
          <p className="text-sm text-slate-400 max-w-xl font-medium">
            Real patient averages tracked using continuous glucose monitoring (CGM), precision bloodwork, and circadian lifestyle protocols.
          </p>
        </div>

        {/* Stage Switcher Pills */}
        <div className="inline-flex p-1.5 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/60 self-start md:self-auto">
          {(['30', '60', '90'] as const).map(stage => (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStage(stage)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeStage === stage
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Day {stage} Milestone
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(metric => (
          <div
            key={metric.id}
            className="p-5 rounded-2xl bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-300 truncate">{metric.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {metric.change}
                </span>
              </div>

              {/* Numbers Comparison */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-white tracking-tight">{metric.current}</span>
                <span className="text-xs text-slate-400 font-semibold">{metric.unit}</span>
              </div>

              <div className="text-[11px] text-slate-400 mb-3">
                Baseline Day 1:{' '}
                <span className="line-through text-slate-500">{metric.baseline} {metric.unit}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400/90 font-medium leading-relaxed border-t border-slate-700/50 pt-2.5">
              {metric.clinicalMeaning}
            </p>
          </div>
        ))}
      </div>

      {/* Clinical Notes Footer */}
      <div className="relative z-10 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Verified clinical protocol outcomes based on real longitudinal continuous glucose sensor data.</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400 font-bold shrink-0">
          <Award className="h-4 w-4" />
          <span>91.4% 90-Day Adherence Success</span>
        </div>
      </div>
    </div>
  );
};
