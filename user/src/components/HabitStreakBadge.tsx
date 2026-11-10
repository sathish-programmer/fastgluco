import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Sparkles, CheckCircle2, ChevronRight, X, Trophy, Shield } from 'lucide-react';
import { triggerHaptic } from '../utils/hapticHelper';

interface HabitStreakBadgeProps {
  habits: any[];
}

export const HabitStreakBadge: React.FC<HabitStreakBadgeProps> = ({ habits }) => {
  const [showModal, setShowModal] = useState(false);

  // Collect unique logged dates (YYYY-MM-DD)
  const loggedDates = useMemo(() => {
    const dates = new Set<string>();
    if (habits && habits.length > 0) {
      habits.forEach(h => {
        const ts = h.timestamp || h.createdAt;
        if (ts) {
          const d = new Date(ts).toISOString().split('T')[0];
          dates.add(d);
        }
      });
    }
    return dates;
  }, [habits]);

  // Calculate consecutive streak
  const streak = useMemo(() => {
    if (loggedDates.size === 0) return 0;

    const now = new Date();
    let currentStreak = 0;

    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate = new Date(now);
    if (!loggedDates.has(todayStr)) {
      if (loggedDates.has(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        return 0;
      }
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (loggedDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  }, [loggedDates]);

  // Calculate current week days (Mon -> Sun)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);

    const days = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fullDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === currentDayOfWeek;
      const isPast = i < currentDayOfWeek;
      const isLogged = loggedDates.has(dateStr);

      days.push({
        key: dateStr,
        label: dayLabels[i],
        fullLabel: fullDayLabels[i],
        dayNum: d.getDate(),
        isToday,
        isPast,
        isLogged
      });
    }

    return days;
  }, [loggedDates]);

  const isTodayLogged = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return loggedDates.has(todayStr);
  }, [loggedDates]);

  const handleOpenModal = () => {
    triggerHaptic('light');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Next milestone calculation
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak + 10;
  const daysToNext = nextMilestone - streak;

  return (
    <>
      {/* Modern High-End Streak Pill */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/40 transition-all cursor-pointer active:scale-95 text-left"
        title="View consistency streak details"
      >
        {/* Glowing Fiery Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          {streak > 0 && (
            <div className="absolute inset-0 bg-orange-500/25 rounded-xl blur-xs group-hover:scale-110 transition-transform" />
          )}
          <div
            className={`relative w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              streak > 0
                ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white shadow-xs shadow-orange-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            {streak > 0 ? (
              <Flame className="w-4 h-4 text-white fill-white" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Counter & 7-Day Mini Dots */}
        <div className="flex flex-col min-w-0 pr-0.5">
          <div className="flex items-center gap-1 leading-none">
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              {streak}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {streak === 1 ? 'Day' : 'Days'}
            </span>
            {isTodayLogged && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 ml-0.5 shrink-0" title="Logged today" />
            )}
          </div>

          {/* 7-Day Micro Strip */}
          <div className="flex items-center gap-1 mt-1">
            {weekDays.map(day => (
              <span
                key={day.key}
                className={`w-1 h-1 rounded-full transition-all ${
                  day.isLogged
                    ? 'bg-orange-500 scale-125'
                    : day.isToday
                      ? 'bg-orange-400/50 ring-1 ring-orange-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
      </button>

      {/* Portalled Detailed Streak Bottom Sheet / Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={handleCloseModal}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Content Card */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[85vh] p-6 animate-in slide-in-from-bottom duration-300">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Big Flame */}
            <div className="text-center pt-2 pb-4">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 bg-orange-500/30 rounded-3xl blur-md scale-110" />
                <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
                  <Flame className="w-9 h-9 text-white fill-white" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {streak} Day {streak === 1 ? 'Streak' : 'Consistency Streak'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {isTodayLogged
                  ? "Outstanding! You've logged your habits today. Cellular repair defenses are fully active."
                  : "Keep your flame alive! Complete your daily habit check-in before midnight."}
              </p>
            </div>

            {/* Current Week Day Cards */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  This Week
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {weekDays.filter(d => d.isLogged).length} / 7 Days Active
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map(day => (
                  <div
                    key={day.key}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                      day.isLogged
                        ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white shadow-xs shadow-orange-500/20'
                        : day.isToday
                          ? 'bg-white dark:bg-slate-800 border-2 border-orange-500 text-slate-900 dark:text-white ring-2 ring-orange-500/20'
                          : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase opacity-75">{day.label}</span>
                    <span className="text-xs font-black mt-0.5">{day.dayNum}</span>
                    <div className="mt-1">
                      {day.isLogged ? (
                        <CheckCircle2 className="w-3 h-3 text-white fill-white/20" />
                      ) : day.isToday ? (
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping block" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 block" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone Roadmap */}
            <div className="space-y-2 mb-5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
                Cellular Milestones
              </span>

              <div className="p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                    <span>Next Milestone: {nextMilestone} Days</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold">{daysToNext} days to go</span>
                  </div>
                  <div className="w-full h-1.5 bg-orange-200 dark:bg-orange-950/60 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, (streak / nextMilestone) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Science note */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Consistent fasting, movement & stillness stimulate mitochondrial autophagy and DNA repair enzymes.
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
            >
              Continue Habit Log
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
