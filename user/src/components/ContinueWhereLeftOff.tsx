import React from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronRight, Wind, FileText, Calendar, Utensils, Heart, ShieldCheck, Dna, Sparkles } from 'lucide-react';

export interface UnfinishedJourney {
  id: string;
  title: string;
  subtitle: string;
  progressText?: string;
  icon: React.ReactNode;
  actionKey: string;
  accentBg: string;
}

interface ContinueWhereLeftOffProps {
  activeMode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  habits: any[];
  upcomingAppt?: any;
  hasCGMData?: boolean;
  onContinue: (actionKey: string) => void;
}

export const ContinueWhereLeftOff: React.FC<ContinueWhereLeftOffProps> = ({
  activeMode,
  habits,
  upcomingAppt,
  hasCGMData,
  onContinue
}) => {
  const journeys: UnfinishedJourney[] = [];
  const todayStr = new Date().toDateString();

  if (activeMode === 'TREATMENT') {
    // 1. Cancer Treatment Journeys ONLY (No prevention-related cards)
    if (upcomingAppt) {
      journeys.push({
        id: 'upcoming_appt',
        title: `Appt with ${upcomingAppt.doctorId?.name || upcomingAppt.doctorName || 'Specialist'}`,
        subtitle: `${upcomingAppt.date} at ${upcomingAppt.time}`,
        progressText: 'Upcoming',
        icon: <Calendar className="h-4 w-4 text-cyan-500" />,
        actionKey: 'Book Appointment',
        accentBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
      });
    }

    if (hasCGMData) {
      journeys.push({
        id: 'cgm_review',
        title: 'CGM Report Insights',
        subtitle: 'View glucose spike analysis',
        progressText: 'Ready',
        icon: <FileText className="h-4 w-4 text-indigo-500" />,
        actionKey: 'Reports',
        accentBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
      });
    }

    const stressToday = habits.some(h => new Date(h.timestamp).toDateString() === todayStr && ((h.type || h.habitType) === 'Stress' || (h.type || h.habitType) === 'stress'));
    if (!stressToday) {
      journeys.push({
        id: 'treatment_symptoms',
        title: 'Treatment Symptoms & Caregiver Stress',
        subtitle: 'Log side-effects & emotional strain',
        progressText: 'Today pending',
        icon: <Heart className="h-4 w-4 text-rose-500" />,
        actionKey: 'stress',
        accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      });
    }

    const mealToday = habits.some(h => new Date(h.timestamp).toDateString() === todayStr && ((h.type || h.habitType) === 'food' || (h.type || h.habitType) === 'Food'));
    if (!mealToday) {
      journeys.push({
        id: 'treatment_food',
        title: 'Log Treatment Nutrition',
        subtitle: 'Track glycemic food response',
        progressText: '0 meals today',
        icon: <Utensils className="h-4 w-4 text-emerald-500" />,
        actionKey: 'Food Log',
        accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      });
    }

    journeys.push({
      id: 'treatment_wigs',
      title: 'Hair Loss Wigs & Head Coverings',
      subtitle: 'Comfortable medical-grade wigs',
      progressText: 'Explore',
      icon: <Sparkles className="h-4 w-4 text-pink-500" />,
      actionKey: 'shop_wigs',
      accentBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
    });
  } else if (activeMode === 'SECONDARY_PREVENTION') {
    // 2. Secondary Prevention / Recovery Journeys
    const screeningLog = habits.find(h => (h.type || h.habitType) === 'CancerScreening' || (h.type || h.habitType) === 'cancer_screening');
    if (!screeningLog) {
      journeys.push({
        id: 'recovery_screening',
        title: 'Surveillance & Recurrence Check',
        subtitle: 'Cancer screening & lab monitoring',
        progressText: 'Pending',
        icon: <ShieldCheck className="h-4 w-4 text-rose-500" />,
        actionKey: 'cancer_screening',
        accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      });
    }

    const envLog = habits.find(h => (h.type || h.habitType) === 'Environmental' || (h.type || h.habitType) === 'environmental_exposures');
    if (!envLog) {
      journeys.push({
        id: 'secondary_env',
        title: 'Recurrence Risk Air/Water Audit',
        subtitle: 'Environmental safety check',
        progressText: 'Not started',
        icon: <Wind className="h-4 w-4 text-emerald-500" />,
        actionKey: 'environmental_exposures',
        accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      });
    }

    if (upcomingAppt) {
      journeys.push({
        id: 'upcoming_appt',
        title: `Follow-up Appt with ${upcomingAppt.doctorId?.name || upcomingAppt.doctorName || 'Specialist'}`,
        subtitle: `${upcomingAppt.date} at ${upcomingAppt.time}`,
        progressText: 'Upcoming',
        icon: <Calendar className="h-4 w-4 text-cyan-500" />,
        actionKey: 'Book Appointment',
        accentBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
      });
    }
  } else {
    // 3. Cancer Prevention Journeys ONLY
    const envLog = habits.find(h => (h.type || h.habitType) === 'Environmental' || (h.type || h.habitType) === 'environmental_exposures');
    if (!envLog) {
      journeys.push({
        id: 'env_audit',
        title: 'Environment Exposure Audit',
        subtitle: 'Air & Water safety check',
        progressText: 'Not started',
        icon: <Wind className="h-4 w-4 text-emerald-500" />,
        actionKey: 'environmental_exposures',
        accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      });
    }

    const genLog = habits.find(h => (h.type || h.habitType) === 'Genetic' || (h.type || h.habitType) === 'genetics');
    if (!genLog) {
      journeys.push({
        id: 'genetics_audit',
        title: 'Genetic Tendency Assessment',
        subtitle: 'Family history & susceptibility',
        progressText: 'Not started',
        icon: <Dna className="h-4 w-4 text-violet-500" />,
        actionKey: 'genetics',
        accentBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
      });
    }

    if (upcomingAppt) {
      journeys.push({
        id: 'upcoming_appt',
        title: `Appt with ${upcomingAppt.doctorId?.name || upcomingAppt.doctorName || 'Doctor'}`,
        subtitle: `${upcomingAppt.date} at ${upcomingAppt.time}`,
        progressText: 'Upcoming',
        icon: <Calendar className="h-4 w-4 text-cyan-500" />,
        actionKey: 'Book Appointment',
        accentBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
      });
    }

    const fastingToday = habits.some(h => new Date(h.timestamp).toDateString() === todayStr && ((h.type || h.habitType) === 'Fasting' || (h.type || h.habitType) === 'fasting'));
    if (!fastingToday) {
      journeys.push({
        id: 'fasting_log',
        title: 'Circadian Metabolic Fasting',
        subtitle: 'Autophagy & cellular alignment',
        progressText: 'Log today',
        icon: <Utensils className="h-4 w-4 text-amber-500" />,
        actionKey: 'fasting',
        accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      });
    }
  }

  if (journeys.length === 0) return null;

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
          <Play className="h-3 w-3 text-primary fill-primary" />
          <span>Continue Where You Left Off</span>
        </h4>
      </div>

      <div className="flex space-x-3 overflow-x-auto pb-1 no-scrollbar">
        {journeys.slice(0, 3).map(j => (
          <motion.button
            key={j.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onContinue(j.actionKey)}
            className="flex-1 min-w-[220px] max-w-[260px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all shrink-0"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${j.accentBg}`}>
                {j.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 block truncate">
                  {j.progressText}
                </span>
                <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate leading-snug">
                  {j.title}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {j.subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
