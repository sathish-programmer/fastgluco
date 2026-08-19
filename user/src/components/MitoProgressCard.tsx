import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

interface MitoProgressCardProps {
  activeMode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  habits: any[];
  hasCGMData?: boolean;
  upcomingAppt?: any;
  onTakeImprovementAction?: (actionKey: string) => void;
}

export const MitoProgressCard: React.FC<MitoProgressCardProps> = ({
  activeMode,
  habits,
  hasCGMData,
  upcomingAppt,
  onTakeImprovementAction
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Dynamic Calculation strictly based on available user modules
  const computeProgress = () => {
    const loggedTypes = new Set(habits.map(h => h.type || h.habitType));

    const metrics: { name: string; score: number; max: number; tip: string; actionKey: string }[] = [];

    // 1. Environment metric (Available to everyone)
    const envLogged = loggedTypes.has('Environmental') || loggedTypes.has('environmental_exposures');
    metrics.push({
      name: 'Environment Audit',
      score: envLogged ? 100 : 30,
      max: 100,
      tip: envLogged ? 'Environment risk audit completed' : 'Complete environment exposure assessment (+70%)',
      actionKey: 'environmental_exposures'
    });

    // 2. Daily Habits & Fasting (Available to everyone)
    const habitCount = loggedTypes.size;
    const habitScore = Math.min(100, habitCount * 20 + 20);
    metrics.push({
      name: 'Wellness Habits',
      score: habitScore,
      max: 100,
      tip: habitScore === 100 ? 'Active daily tracking' : 'Log daily habits like sleep, stillness, or fasting',
      actionKey: 'fasting'
    });

    // 3. Genetics or Antioxidants (Available to everyone)
    const genLogged = loggedTypes.has('Genetic') || loggedTypes.has('genetics') || loggedTypes.has('Antioxidants') || loggedTypes.has('antioxidants');
    metrics.push({
      name: 'Genetics & Cellular',
      score: genLogged ? 100 : 40,
      max: 100,
      tip: genLogged ? 'Genetics or antioxidant profile updated' : 'Complete genetics or antioxidant log (+60%)',
      actionKey: 'genetics'
    });

    // 4. Mode-specific dynamic metric
    if (activeMode === 'TREATMENT') {
      if (hasCGMData) {
        metrics.push({
          name: 'CGM Metabolic Data',
          score: 100,
          max: 100,
          tip: 'Continuous glucose monitoring active',
          actionKey: 'Reports'
        });
      } else {
        // If CGM data is missing, we don't penalize harshly; we offer it as an enhancement
        const symptomLogged = loggedTypes.has('Stress') || loggedTypes.has('stress') || loggedTypes.has('Joy') || loggedTypes.has('joy');
        metrics.push({
          name: 'Symptom & Treatment Support',
          score: symptomLogged ? 100 : 50,
          max: 100,
          tip: symptomLogged ? 'Symptom log recorded' : 'Log daily treatment symptoms (+50%)',
          actionKey: 'stress'
        });
      }
    } else if (activeMode === 'SECONDARY_PREVENTION') {
      const recoveryLogged = loggedTypes.has('CancerScreening') || loggedTypes.has('cancer_screening') || loggedTypes.has('Antioxidants') || loggedTypes.has('antioxidants');
      metrics.push({
        name: 'Recovery & Recurrence Check',
        score: recoveryLogged ? 100 : 50,
        max: 100,
        tip: recoveryLogged ? 'Surveillance check logged' : 'Complete cancer screening & recovery log (+50%)',
        actionKey: 'cancer_screening'
      });
    }

    // 5. Doctor / Consultation metric (if appointment exists)
    if (upcomingAppt) {
      metrics.push({
        name: 'Doctor Consultations',
        score: 100,
        max: 100,
        tip: 'Upcoming appointment confirmed',
        actionKey: 'Book Appointment'
      });
    }

    // Average only over available metrics
    const totalScore = Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length);

    return { totalScore, metrics };
  };

  const { totalScore, metrics } = computeProgress();

  return (
    <>
      <div className="w-full my-4 rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4 min-w-0">
          {/* Progress Circular Gauge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary transition-all duration-700 ease-out stroke-current"
                strokeWidth="3.5"
                strokeDasharray={`${totalScore}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-sm font-black text-slate-900 dark:text-slate-100">
              {totalScore}%
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Mito Progress
              </h4>
              <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                Wellness Indicator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug mt-0.5 truncate">
              Based on your active habit & assessment logs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBreakdown(true)}
          className="shrink-0 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1"
        >
          <span>Breakdown</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      {/* Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Mito Progress Breakdown
                </h3>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Engagement & Wellness Indicator (Non-medical)
                </span>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {metrics.map((m, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {m.name}
                    </span>
                    <span className="text-xs font-black text-primary">
                      {m.score}%
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                    {m.tip}
                  </p>
                  {m.score < 100 && onTakeImprovementAction && (
                    <button
                      onClick={() => {
                        setShowBreakdown(false);
                        onTakeImprovementAction(m.actionKey);
                      }}
                      className="mt-2 text-[10px] font-bold text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>Improve Score</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] text-amber-700 dark:text-amber-300 font-medium">
              <span className="font-bold">Note: </span>
              This score measures habit consistency and application engagement. It is not a medical diagnosis or health risk assessment.
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
