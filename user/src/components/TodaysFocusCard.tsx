import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Wind, 
  FileText, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  Heart,
  Dna
} from 'lucide-react';

export interface FocusAction {
  id: string;
  title: string;
  reason: string;
  category: string;
  icon: React.ReactNode;
  gradient: string;
  badgeBg: string;
  actionKey: string; // Navigates to habit screen or tab
}

interface TodaysFocusCardProps {
  activeMode: 'PREVENTION' | 'TREATMENT' | 'SECONDARY_PREVENTION';
  habits: any[];
  hasCGMData?: boolean;
  upcomingAppt?: any;
  onTakeAction: (actionKey: string) => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  activeMode,
  habits,
  hasCGMData,
  upcomingAppt,
  onTakeAction
}) => {
  // Logic to determine the ONE best unfulfilled priority action dynamically
  const determineBestAction = (): FocusAction | null => {
    const loggedKeysEver = new Set(habits.map(h => (h.type || h.habitType)));
    const todayStr = new Date().toDateString();
    const loggedToday = new Set(
      habits.filter(h => new Date(h.timestamp).toDateString() === todayStr).map(h => (h.type || h.habitType))
    );

    // 1. Upcoming Appointment Priority across all modes
    if (upcomingAppt) {
      return {
        id: 'upcoming_appointment',
        title: `Upcoming Consultation with ${upcomingAppt.doctorName || 'Doctor'}`,
        reason: `Scheduled for ${new Date(`${upcomingAppt.date}T${upcomingAppt.time}`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        category: 'Appointment',
        icon: <Calendar className="h-6 w-6 text-cyan-500" />,
        gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
        badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        actionKey: 'Book Appointment'
      };
    }

    // 2. Mode Specific Unfulfilled Priorities
    if (activeMode === 'TREATMENT') {
      if (!hasCGMData && !loggedKeysEver.has('cgm') && !loggedKeysEver.has('CGM')) {
        return {
          id: 'cgm_upload',
          title: 'Review or Upload Your CGM Glucose Export',
          reason: 'Digitizing continuous glucose measurements helps track metabolic spikes during active treatment.',
          category: 'Metabolic Support',
          icon: <FileText className="h-6 w-6 text-indigo-500" />,
          gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent',
          badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          actionKey: 'Reports'
        };
      }
      if (!loggedToday.has('Stress') && !loggedToday.has('stress')) {
        return {
          id: 'caregiver_stress',
          title: 'Log Today’s Symptom & Caregiver Stress Assessment',
          reason: 'Monitoring emotional strain and physical recovery provides holistic treatment clarity.',
          category: 'Treatment Support',
          icon: <Heart className="h-6 w-6 text-rose-500" />,
          gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          actionKey: 'stress'
        };
      }
      if (!loggedToday.has('Fasting') && !loggedToday.has('fasting')) {
        return {
          id: 'treatment_fasting',
          title: 'Log Today’s Intermittent Fasting Window',
          reason: 'Aligning therapeutic fasting windows supports mitochondrial resilience during treatment.',
          category: 'Metabolic Health',
          icon: <Activity className="h-6 w-6 text-amber-500" />,
          gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          actionKey: 'fasting'
        };
      }
    }

    if (activeMode === 'SECONDARY_PREVENTION') {
      if (!loggedKeysEver.has('Environmental') && !loggedKeysEver.has('environmental_exposures')) {
        return {
          id: 'secondary_env',
          title: 'Complete Environmental Recurrence Risk Audit',
          reason: 'Identifying air toxins, particulate exposure, and household chemical risks aids long-term recovery.',
          category: 'Long-term Recovery',
          icon: <Wind className="h-6 w-6 text-sky-500" />,
          gradient: 'from-sky-500/10 via-teal-500/5 to-transparent',
          badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          actionKey: 'environmental_exposures'
        };
      }
      if (!loggedToday.has('Antioxidants') && !loggedToday.has('antioxidants')) {
        return {
          id: 'secondary_antioxidant',
          title: 'Check Bioactive Antioxidant Protective Intake',
          reason: 'Consuming phytochemicals and polyphenols reduces cellular oxidative stress during recovery.',
          category: 'Cellular Health',
          icon: <ShieldCheck className="h-6 w-6 text-rose-500" />,
          gradient: 'from-rose-500/10 via-amber-500/5 to-transparent',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          actionKey: 'antioxidants'
        };
      }
    }

    // 3. Unlogged Daily Priorities for All Users
    if (!loggedKeysEver.has('Environmental') && !loggedKeysEver.has('environmental_exposures')) {
      return {
        id: 'prev_env',
        title: 'Complete Your Environmental Exposure Assessment',
        reason: 'Air toxins, water contaminants, and plastic exposure account for significant preventable health risks.',
        category: 'Primary Prevention',
        icon: <Wind className="h-6 w-6 text-emerald-500" />,
        gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        actionKey: 'environmental_exposures'
      };
    }

    if (!loggedToday.has('Fasting') && !loggedToday.has('fasting')) {
      return {
        id: 'prev_fasting',
        title: 'Log Today’s Fasting Window',
        reason: 'Circadian metabolic fasting promotes cellular autophagy and mitochondrial renewal.',
        category: 'Circadian Health',
        icon: <Activity className="h-6 w-6 text-amber-500" />,
        gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        actionKey: 'fasting'
      };
    }

    if (!loggedToday.has('Sleep') && !loggedToday.has('sleep')) {
      return {
        id: 'prev_sleep',
        title: 'Log Today’s Sleep Quality & Duration',
        reason: 'Consistent rest prevents sleep debt accumulation and supports systemic repair.',
        category: 'Rest & Recovery',
        icon: <Activity className="h-6 w-6 text-indigo-500" />,
        gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
        badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        actionKey: 'Sleep'
      };
    }

    if (!loggedToday.has('Stress') && !loggedToday.has('stress')) {
      return {
        id: 'prev_stress',
        title: 'Log Today’s Stress Level',
        reason: 'Managing acute stress prevents cortisol elevation and cellular inflammatory load.',
        category: 'Mental Balance',
        icon: <Heart className="h-6 w-6 text-rose-500" />,
        gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
        badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        actionKey: 'Stress'
      };
    }

    if (!loggedToday.has('Movement') && !loggedToday.has('movement')) {
      return {
        id: 'prev_movement',
        title: 'Log Today’s Exercise & Movement',
        reason: 'Physical activity enhances insulin sensitivity and cardiovascular resilience.',
        category: 'Physical Activity',
        icon: <Activity className="h-6 w-6 text-emerald-500" />,
        gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        actionKey: 'Movement'
      };
    }

    if (!loggedKeysEver.has('Genetic') && !loggedKeysEver.has('genetics')) {
      return {
        id: 'prev_genetics',
        title: 'Log Family Health & Genetic Tendencies',
        reason: 'Understanding hereditary history enables early targeted lifestyle intervention.',
        category: 'Genetics',
        icon: <Dna className="h-6 w-6 text-violet-500" />,
        gradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
        badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        actionKey: 'genetics'
      };
    }

    // Hide card completely when all key daily priorities have been logged today!
    return null;
  };

  const action = determineBestAction();

  if (!action) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-3xl p-5 bg-gradient-to-r ${action.gradient} bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden my-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-2xl text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Today’s Focus
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${action.badgeBg}`}>
          {action.category}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs shrink-0 mt-0.5">
          {action.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {action.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Why recommended: </span>
            {action.reason}
          </p>

          <button
            onClick={() => onTakeAction(action.actionKey)}
            className="mt-4 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center space-x-2 transform active:scale-[0.98]"
          >
            <span>Take Action</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
