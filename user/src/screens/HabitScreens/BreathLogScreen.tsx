import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Wind, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Trash2, 
  Sparkles, 
  HeartPulse, 
  Brain, 
  ShieldCheck, 
  Activity, 
  Zap 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { scheduleHabitReminder, BREATHWORK_NOTIFICATION_ID, playNotificationChime } from '../../utils/notificationScheduler';

interface BreathLogScreenProps {
  onBack: () => void;
}

type TechniqueId = 'box' | 'relax478' | 'coherent' | 'energizing';

interface Technique {
  id: TechniqueId;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  phases: { name: string; duration: number; instruction: string }[];
  benefit: string;
  recommendedMinutes: number;
}

export const BreathLogScreen: React.FC<BreathLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const TECHNIQUES: Technique[] = [
    {
      id: 'box',
      name: t('breath.techniques.box.name', 'Box Breathing'),
      tagline: t('breath.techniques.box.tagline', '4-4-4-4 Navy SEAL Focus'),
      badge: t('breath.techniques.box.badge', 'Cellular Calm'),
      description: t('breath.techniques.box.description', 'Equal duration for inhale, hold, exhale, hold. Balances autonomic nervous system and clears mental brain fog.'),
      phases: [
        { name: t('breath.phaseNameInhale', 'Inhale'), duration: 4, instruction: t('breath.techniques.box.phaseInhale', 'Breathe in slowly through your nose into the abdomen') },
        { name: t('breath.phaseNameHold', 'Hold'), duration: 4, instruction: t('breath.techniques.box.phaseHold', 'Hold gently with lungs comfortably full') },
        { name: t('breath.phaseNameExhale', 'Exhale'), duration: 4, instruction: t('breath.techniques.box.phaseExhale', 'Smoothly release breath through nose or mouth') },
        { name: t('breath.phaseNameHold', 'Hold'), duration: 4, instruction: t('breath.techniques.box.phaseHoldEmpty', 'Rest quietly before the next breath') }
      ],
      benefit: t('breath.techniques.box.benefit', 'Lowers acute sympathetic surge & cortisol spike within 3 minutes.'),
      recommendedMinutes: 5
    },
    {
      id: 'relax478',
      name: t('breath.techniques.relax478.name', '4-7-8 Relaxing Breath'),
      tagline: t('breath.techniques.relax478.tagline', 'Dr. Weil Parasympathetic Brake'),
      badge: t('breath.techniques.relax478.badge', 'Deep Rest'),
      description: t('breath.techniques.relax478.description', 'Extended hold and slow exhalation triggers strong vagal nerve stimulation and slows rapid pulse.'),
      phases: [
        { name: t('breath.phaseNameInhale', 'Inhale'), duration: 4, instruction: t('breath.techniques.relax478.phaseInhale', 'Inhale quietly through nose') },
        { name: t('breath.phaseNameHold', 'Hold'), duration: 7, instruction: t('breath.techniques.relax478.phaseHold', 'Retain oxygen gently without straining') },
        { name: t('breath.phaseNameExhale', 'Exhale'), duration: 8, instruction: t('breath.techniques.relax478.phaseExhale', 'Exhale completely with a gentle whoosh sound') }
      ],
      benefit: t('breath.techniques.relax478.benefit', 'Boosts melatonin readiness, lowers blood pressure, ideal for sleep & evening wind-down.'),
      recommendedMinutes: 4
    },
    {
      id: 'coherent',
      name: t('breath.techniques.coherent.name', 'Coherent Resonant (5.5s)'),
      tagline: t('breath.techniques.coherent.tagline', 'Optimal HRV & Vascular Tone'),
      badge: t('breath.techniques.coherent.badge', 'Heart Coherence'),
      description: t('breath.techniques.coherent.description', 'Breathe at roughly 5.5 to 6 breaths per minute to align heart rate variability (HRV) with respiratory rhythm.'),
      phases: [
        { name: t('breath.phaseNameInhale', 'Inhale'), duration: 5.5, instruction: t('breath.techniques.coherent.phaseInhale', 'Smooth continuous diaphragmatic inhale') },
        { name: t('breath.phaseNameExhale', 'Exhale'), duration: 5.5, instruction: t('breath.techniques.coherent.phaseExhale', 'Smooth effortless release without pauses') }
      ],
      benefit: t('breath.techniques.coherent.benefit', 'Maximizes nitric oxide absorption & cellular perfusion.'),
      recommendedMinutes: 10
    },
    {
      id: 'energizing',
      name: t('breath.techniques.energizing.name', 'Diaphragmatic Belly Reset'),
      tagline: t('breath.techniques.energizing.tagline', 'Deep Lymphatic & Lung Oxygenation'),
      badge: t('breath.techniques.energizing.badge', 'Vitality'),
      description: t('breath.techniques.energizing.description', 'Deep abdominal expansion that massages internal organs and engages lower lung lobes where capillary density is highest.'),
      phases: [
        { name: t('breath.phaseNameInhale', 'Deep Inhale'), duration: 4, instruction: t('breath.techniques.energizing.phaseInhale', 'Expand belly first, then ribcage, then upper chest') },
        { name: t('breath.phaseNamePause', 'Pause'), duration: 2, instruction: t('breath.techniques.energizing.phasePause', 'Brief mindful pause') },
        { name: t('breath.phaseNameExhale', 'Full Exhale'), duration: 6, instruction: t('breath.techniques.energizing.phaseExhale', 'Draw navel gently back toward the spine') }
      ],
      benefit: t('breath.techniques.energizing.benefit', 'Expels stagnant air in lung bases and improves mitochondrial respiration.'),
      recommendedMinutes: 5
    }
  ];

  const [selectedTech, setSelectedTech] = useState<TechniqueId>('box');
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const [totalSecondsTrained, setTotalSecondsTrained] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [logging, setLogging] = useState(false);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [savingReminder, setSavingReminder] = useState(false);

  const currentTechnique = TECHNIQUES.find(t => t.id === selectedTech) || TECHNIQUES[0];
  const activePhase = currentTechnique.phases[phaseIndex] || currentTechnique.phases[0];

  // Ref to handle timer interval
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  // Reset pacer when technique changes
  useEffect(() => {
    setIsActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(currentTechnique.phases[0].duration);
    setCompletedCycles(0);
    setTotalSecondsTrained(0);
  }, [selectedTech]);

  // Pacer timer engine
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalStepMs = 100; // high precision tick
    let currentPhaseIdx = phaseIndex;
    let currentRemaining = phaseSecondsLeft > 0 ? phaseSecondsLeft : currentTechnique.phases[0].duration;

    timerRef.current = setInterval(() => {
      currentRemaining = Math.max(0, currentRemaining - 0.1);
      setTotalSecondsTrained(prev => prev + 0.1);

      if (currentRemaining <= 0.05) {
        // Next phase
        const nextPhaseIdx = (currentPhaseIdx + 1) % currentTechnique.phases.length;
        if (nextPhaseIdx === 0) {
          setCompletedCycles(c => c + 1);
        }
        currentPhaseIdx = nextPhaseIdx;
        currentRemaining = currentTechnique.phases[nextPhaseIdx].duration;
        setPhaseIndex(nextPhaseIdx);
      }

      setPhaseSecondsLeft(Math.round(currentRemaining * 10) / 10);
    }, intervalStepMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phaseIndex, selectedTech]);

  const toggleTrainer = () => {
    if (!isActive && phaseSecondsLeft <= 0) {
      setPhaseIndex(0);
      setPhaseSecondsLeft(currentTechnique.phases[0].duration);
    }
    setIsActive(!isActive);
  };

  const resetTrainer = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(currentTechnique.phases[0].duration);
    setCompletedCycles(0);
    setTotalSecondsTrained(0);
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Breath', 7);
      setHistory(logs);
    } catch (err) {
      console.error('Failed to load breath history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogBreath = async (minutesToLog: number) => {
    if (!user?.id) return;
    setLogging(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Breath', {
        minutes: minutesToLog,
        technique: currentTechnique.name,
        techniqueId: currentTechnique.id,
        isCompleted: true,
        done: true,
        cycles: completedCycles > 0 ? completedCycles : Math.round(minutesToLog * 60 / currentTechnique.phases.reduce((acc, p) => acc + p.duration, 0))
      });
      playNotificationChime();
      showToast(`${t('common.logged', 'Logged')} ${minutesToLog} ${t('common.minutes', 'Minutes')} ${currentTechnique.name}! ${t('breath.repairForceBreadcrumb', 'Repair Force · Cellular Breath')}`, 'success');
      await loadHistory();
    } catch (err) {
      console.error('Failed to log breathwork', err);
      showToast('Could not save breathwork log. Please try again.', 'error');
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      showToast('Deleted habit log', 'info');
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete log', err);
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderTime) return;
    setSavingReminder(true);
    try {
      await scheduleHabitReminder(
        BREATHWORK_NOTIFICATION_ID,
        'Power of Breath Reminder 🫁',
        'Take 5 mindful minutes for box breathing to oxygenate your cells and lower stress hormones.',
        reminderTime
      );
      playNotificationChime();
      showToast(`${t('breath.notificationTitle', 'Daily Breathwork Notification')}: ${reminderTime}`, 'success');
    } catch (err) {
      console.error('Failed to schedule reminder', err);
      showToast('Failed to schedule reminder.', 'error');
    } finally {
      setSavingReminder(false);
    }
  };

  // Compute visual circle scale
  const isHolding = activePhase.name.toLowerCase().includes('hold') || activePhase.name.toLowerCase().includes('pause');
  const isInhaling = activePhase.name.toLowerCase().includes('inhale');
  const isExhaling = activePhase.name.toLowerCase().includes('exhale');

  let orbScale = 1;
  if (isActive) {
    const fraction = (activePhase.duration - phaseSecondsLeft) / activePhase.duration;
    if (isInhaling) {
      orbScale = 1 + fraction * 0.45; // 1.0 -> 1.45
    } else if (isExhaling) {
      orbScale = 1.45 - fraction * 0.45; // 1.45 -> 1.0
    } else if (isHolding) {
      orbScale = phaseIndex === 1 ? 1.45 : 1.0;
    }
  }

  return (
    <div 
      className="pb-28 pt-4 px-4 max-w-4xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
    >
      {/* Internal Subpage Header */}
      <div className="flex items-center gap-3.5 mb-5 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 tracking-[0.2em] uppercase">
              {t('breath.repairForceBreadcrumb', 'Repair Force · Cellular Breath')}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40">
              <Wind className="w-2.5 h-2.5 mr-1" /> {t('breath.activeRepair', 'Active Repair')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
            {t('breath.powerOfBreath', 'Power of Breath')}
          </h1>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 mb-5 shadow-lg shadow-cyan-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold tracking-wide text-cyan-50 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              {t('breath.mitochondrialAtpBadge', 'Mitochondrial ATP & Vagal Tone')}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-1 text-white">
              {t('breath.heroTitle', 'Breathe intentionally to reset cellular stress')}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-50/90 leading-relaxed font-normal">
              {t('breath.heroDesc', 'Slow nasal breathing releases sinus nitric oxide, dilates micro-vessels, and activates the parasympathetic brake to halt cellular oxidation.')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 shrink-0 text-center">
            <div className="px-1.5 py-1">
              <p className="text-[9px] uppercase tracking-wider text-cyan-100 font-bold">{t('breath.sinusNo', 'Sinus NO')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">+15x</p>
              <p className="text-[8px] text-cyan-200">{t('breath.viaNasal', 'via Nasal')}</p>
            </div>
            <div className="px-1.5 py-1 border-x border-white/15">
              <p className="text-[9px] uppercase tracking-wider text-cyan-100 font-bold">{t('breath.hrv', 'HRV')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">+42%</p>
              <p className="text-[8px] text-cyan-200">{t('breath.coherence', 'Coherence')}</p>
            </div>
            <div className="px-1.5 py-1">
              <p className="text-[9px] uppercase tracking-wider text-cyan-100 font-bold">{t('breath.cortisol', 'Cortisol')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">-35%</p>
              <p className="text-[8px] text-cyan-200">{t('breath.fiveMinSession', '5 min session')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technique Selector Pills */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('breath.chooseExercise', 'Choose Breathing Exercise')}
          </span>
          <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
            {TECHNIQUES.length} {t('breath.protocolsAvailable', 'Protocols Available')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TECHNIQUES.map((tech) => {
            const isSelected = selectedTech === tech.id;
            return (
              <button
                key={tech.id}
                onClick={() => setSelectedTech(tech.id)}
                className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500 text-cyan-950 dark:text-cyan-100 shadow-sm ring-1 ring-cyan-500/50' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {tech.badge}
                    </span>
                    <Wind className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-1">
                    {tech.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {tech.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Breath Trainer Studio */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 sm:p-6 mb-5 transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Visual Breathing Orb */}
          <div className="flex flex-col items-center justify-center w-full md:w-1/2 py-4">
            <div className="relative flex items-center justify-center w-56 h-56">
              {/* Outer pulsing wave rings */}
              <div 
                className={`absolute inset-0 rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-xl transition-all duration-700 ${
                  isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-40'
                }`} 
              />
              
              {/* Animated Pacer Orb */}
              <div 
                className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white/60 dark:border-slate-800/80 transition-transform duration-300 ease-out text-center relative overflow-hidden"
                style={{
                  transform: `scale(${orbScale})`,
                  background: isInhaling 
                    ? 'radial-gradient(circle, #06b6d4 0%, #0891b2 70%, #0e7490 100%)' 
                    : isHolding 
                      ? 'radial-gradient(circle, #10b981 0%, #059669 70%, #047857 100%)' 
                      : 'radial-gradient(circle, #3b82f6 0%, #2563eb 70%, #1d4ed8 100%)',
                  boxShadow: isActive ? '0 0 40px rgba(6, 182, 212, 0.45)' : '0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                <div className="relative z-10 text-white px-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-100 opacity-90 block">
                    {isActive ? activePhase.name : t('breath.ready', 'Ready')}
                  </span>
                  <span className="text-3xl font-mono font-extrabold tracking-tight">
                    {isActive ? `${Math.ceil(phaseSecondsLeft)}s` : `${currentTechnique.phases[0].duration}s`}
                  </span>
                  <span className="text-[9px] text-white/80 font-medium block mt-0.5">
                    {isActive ? `${t('breath.cycleNum', 'Cycle #')}${completedCycles + 1}` : currentTechnique.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Instruction Pill */}
            <div className="mt-4 text-center min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/50 max-w-sm w-full">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isActive ? activePhase.instruction : currentTechnique.description}
              </p>
            </div>

            {/* Trainer Controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={toggleTrainer}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4" /> {t('breath.pauseSession', 'Pause Session')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> {t('breath.startPractice', 'Start Practice')}
                  </>
                )}
              </button>

              <button
                onClick={resetTrainer}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title={t('resetSession')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Technique Details & Sequence Breakdown */}
          <div className="w-full md:w-1/2 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800/80 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  {t('breath.cadenceBreakdown', 'Cadence Breakdown')}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {currentTechnique.phases.reduce((acc, p) => acc + p.duration, 0)}{t('breath.sPerCycle', 's per cycle')}
                </span>
              </div>

              {/* Phase Step List */}
              <div className="space-y-2 mb-4">
                {currentTechnique.phases.map((p, idx) => {
                  const isCurrent = isActive && phaseIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-100 font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold leading-tight">{p.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{p.instruction}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-extrabold shrink-0 ml-2">
                        {p.duration}s
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Science Note Callout */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3 text-emerald-900 dark:text-emerald-200 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t('breath.physioBenefit', 'Physiological Benefit:')}
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                  {currentTechnique.benefit}
                </p>
              </div>
            </div>

            {/* Quick Session Counter */}
            {totalSecondsTrained > 2 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{t('breath.practicedJustNow', 'Practiced just now:')} <strong className="text-slate-800 dark:text-slate-200">{Math.round(totalSecondsTrained)}s</strong></span>
                <span>{t('breath.completedCycles', 'Completed:')} <strong className="text-slate-800 dark:text-slate-200">{completedCycles} {t('breath.cycles', 'cycles')}</strong></span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Quick Logging Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-5 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {t('breath.dailyHabitLogger', 'Daily Habit Logger')}
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('breath.logTodaysSession', "Log Today's Breathwork Session")}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/30">
            {t('breath.plusRepairScore', '+1 Repair Score')}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          {t('breath.recordDesc', 'Record your daily practice to strengthen your Cellular Repair Defence and keep your streak active.')}
        </p>

        {/* Quick Log Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[3, 5, 10, 15].map((mins) => (
            <button
              key={mins}
              onClick={() => handleLogBreath(mins)}
              disabled={logging}
              className="py-3 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{mins} {t('common.minutes', 'Minutes')}</span>
              <span className="text-[9px] font-normal text-slate-400">{mins === 5 ? t('breath.standard', 'Standard') : mins === 10 ? t('breath.optimal', 'Optimal') : mins > 10 ? t('breath.deep', 'Deep') : t('breath.quick', 'Quick')}</span>
            </button>
          ))}
        </div>

        {/* Custom Input Logger */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{t('breath.customDuration', 'Custom Duration:')}</span>
            <input
              type="number"
              min={1}
              max={120}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-100"
            />
            <span className="text-xs text-slate-500 font-medium">{t('breath.mins', 'mins')}</span>
          </div>

          <button
            onClick={() => handleLogBreath(customMinutes)}
            disabled={logging}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {logging ? t('common.saving') : t('breath.saveLog', 'Save Log')}
          </button>
        </div>
      </div>

      {/* Science & Health Tips: High Value Clean Cards */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {t('breath.scienceNotesTitle', 'Health & Cellular Science Notes')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: Nitric Oxide */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                  {t('breath.card1Title', 'Nasal Breathing & Nitric Oxide (NO)')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('breath.card1Desc', 'Your paranasal sinuses continuously produce nitric oxide gas. Breathing strictly in and out through the nose carries NO into the lower lungs, expanding alveolar capillaries and increasing arterial oxygen saturation by up to 10–18%.')}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Vagus Nerve & Heart Rate Variability */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                  {t('breath.card2Title', 'Vagus Nerve Anti-Inflammatory Reflex')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('breath.card2Desc', 'When exhalations are slower than inhalations (as in 4-7-8 and Box breathing), the vagal nerve releases acetylcholine on the sinoatrial node, calming heart rate and downregulating inflammatory cytokines (TNF-α and IL-6).')}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: The Bohr Effect & CO2 Tolerance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                  {t('breath.card3Title', 'The Bohr Effect & Cellular Oxygen Delivery')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('breath.card3Desc', 'Over-breathing or shallow mouth breathing expels too much CO₂, preventing hemoglobin from unbinding and releasing oxygen into your vital organs and brain. Gentle, slow breathing optimizes tissue oxygen delivery.')}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Daily Tactical Protocols */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                  {t('breath.card4Title', 'Daily Rhythm Protocols')}
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-1">
                  <li>• {t('morningHRVBreathing')}</li>
                  <li>• {t('preMealBoxBreathing')}</li>
                  <li>• {t('bedtimeSleepBreathing')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Scheduler */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 sm:p-5 mb-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {t('breath.notificationTitle', 'Daily Breathwork Notification')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('breath.notificationDesc', 'Get a timely chime to pause and practice for 5 minutes.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button 
              onClick={handleSaveReminder}
              disabled={savingReminder}
              className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {savingReminder ? t('common.saving') : t('breath.setReminder', 'Set Reminder')}
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day History Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t('breath.recentSessions', 'Recent Breath Sessions')}</span>
          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">{t('breath.last7Days', 'Last 7 Days')}</span>
        </div>

        {loadingHistory ? (
          <div className="py-6 text-center text-xs text-slate-400">{t('common.loading')}</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            {t('breath.noSessionsDesc', 'No breath sessions logged in the last 7 days. Start your first session above!')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              });
              const mins = (item.value as any)?.minutes || (item.value as any)?.duration || 5;
              const tech = (item.value as any)?.technique || 'Breath Practice';

              const logId = item.id || (item as any)._id || `${item.timestamp}-${mins}`;

              return (
                <div key={logId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                      <Wind className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">{tech}</span>
                      <span className="text-[10px] text-slate-400">{dateStr} · {mins} {t('common.minutes', 'minutes')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                      {t('common.logged', 'Logged')}
                    </span>
                    <button 
                      onClick={() => handleDelete(logId)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                      title={t('deleteLog')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
export default BreathLogScreen;
