import React, { useState, useEffect } from 'react';
import { ArrowLeft, BrainCircuit, MessageSquare, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Wind } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { DeStressAIChatModal } from '../../components/DeStressAIChatModal';

interface StressLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToIntimacy?: () => void;
  onNavigateToBreath?: () => void;
}

const faces = [
  { id: 'calm', label: 'Calm', emoji: '😁', baseScore: 0 },
  { id: 'steady', label: 'Steady', emoji: '🙂', baseScore: 1 },
  { id: 'tense', label: 'Tense', emoji: '😐', baseScore: 2 },
  { id: 'stressed', label: 'Overwhelmed', emoji: '☹️', baseScore: 3 },
  { id: 'maxed', label: 'High Stress', emoji: '😫', baseScore: 4 },
];

const STRESS_SUB_OPTIONS = [
  { id: 'work_life', label: 'Work-life balance & burnout' },
  { id: 'relationship', label: 'Relationship issues' },
  { id: 'loss', label: 'Loss of dear ones' },
  { id: 'mood_swings', label: 'Premenstrual or hormonal mood swings' },
  { id: 'sexual_health', label: 'Sexual health' },
  { id: 'others', label: 'Financial or other concerns' }
];

export const StressLogScreen: React.FC<StressLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToIntimacy, onNavigateToBreath }) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  const { user, token, apiUrl } = useAuth();
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Breath Count (Respiratory Inhalations / Min)
  // Clinical rule: <= 12 is calm/optimal, > 12 indicates stress / need to calm down
  const [breathRate, setBreathRate] = useState<number>(12);

  // Clinical Stress Screening Questions (scored 0-2 each)
  const [qNervous, setQNervous] = useState<number>(0);
  const [qTension, setQTension] = useState<number>(0);
  const [qOverwhelmed, setQOverwhelmed] = useState<number>(0);

  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);
  
  // AI Modal is CLOSED by default so user can complete manual scoring first
  const [showDeStressModal, setShowDeStressModal] = useState<boolean>(false);
  const [initialCategory, setInitialCategory] = useState('general');

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const rawLogs = await HabitsService.getRecentHabits(apiUrl, token, 'Stress', 7);
      
      const uniqueMap = new Map<string, HabitLog>();
      rawLogs.forEach(log => {
        const dateKey = new Date(log.timestamp).toDateString();
        if (!uniqueMap.has(dateKey)) {
          uniqueMap.set(dateKey, log);
        }
      });

      const deduplicated = Array.from(uniqueMap.values());
      setHistory(deduplicated);

      const todayStr = new Date().toDateString();
      const todayLog = deduplicated.find(l => new Date(l.timestamp).toDateString() === todayStr);
      if (todayLog && todayLog.value) {
        if (todayLog.value.faceId) setSelectedFace(todayLog.value.faceId);
        
        const sub = todayLog.value.subOption || todayLog.value.label || '';
        if (sub.includes('work') || sub.includes('Work-Life')) setSelectedSubOption('work_life');
        else if (sub.includes('relation') || sub.includes('Relationship')) setSelectedSubOption('relationship');
        else if (sub.includes('loss') || sub.includes('Loss')) setSelectedSubOption('loss');
        else if (sub.includes('hormon') || sub.includes('Premenstru')) setSelectedSubOption('mood_swings');
        else if (sub.includes('sexual') || sub.includes('Sexual')) setSelectedSubOption('sexual_health');
        else if (sub.includes('other') || sub.includes('Other')) setSelectedSubOption('others');

        if (typeof todayLog.value.breathCount === 'number') {
          setBreathRate(todayLog.value.breathCount);
        }

        if (todayLog.value.questions) {
          if (typeof todayLog.value.questions.qNervous === 'number') setQNervous(todayLog.value.questions.qNervous);
          if (typeof todayLog.value.questions.qTension === 'number') setQTension(todayLog.value.questions.qTension);
          if (typeof todayLog.value.questions.qOverwhelmed === 'number') setQOverwhelmed(todayLog.value.questions.qOverwhelmed);
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Compute total manual stress score (0-10 scale)
  const faceBase = faces.find(f => f.id === selectedFace)?.baseScore ?? 0;
  const questionsTotal = qNervous + qTension + qOverwhelmed; // 0 to 6
  // Scaled composite score out of 10
  const computedStressScore = Math.min(10, faceBase * 1.5 + questionsTotal);
  
  const getStressTier = (score: number) => {
    if (score <= 3) return { label: t('stress.low', 'Low / Manageable Stress'), color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' };
    if (score <= 6) return { label: t('stress.moderate', 'Moderate Stress Load'), color: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' };
    return { label: t('stress.high', 'High Stress / Overwhelmed'), color: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' };
  };

  const stressTier = getStressTier(computedStressScore);

  const handleLog = async () => {
    if (!selectedFace || !user?.id) return;
    setLoading(true);
    try {
      const faceData = faces.find(f => f.id === selectedFace);
      await HabitsService.logHabit(apiUrl, token, 'Stress', { 
        faceId: selectedFace, 
        label: faceData?.label, 
        emoji: faceData?.emoji,
        stressScore: computedStressScore,
        breathCount: breathRate,
        subOption: selectedSubOption ? (STRESS_SUB_OPTIONS.find(o => o.id === selectedSubOption)?.label || selectedSubOption) : null,
        questions: { qNervous, qTension, qOverwhelmed }
      });
      showToast(t('stress.loggedSuccess', "Today's stress assessment saved!"), 'success');
      await loadHistory();
    } catch (err) {
      console.error('Failed to log stress', err);
      showToast(t('common.errorOccurred', 'Failed to save stress log. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const sadDaysCount = history.filter(h => h.value.faceId === 'tense' || h.value.faceId === 'stressed' || h.value.faceId === 'maxed').length;

  return (
    <div 
      className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('habits.stress', 'Damage · Stress')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">{t('habits.areYouStressed', 'Stress & Mood Assessment')}</h2>
        </div>
      </div>

      {/* Mia Mental Health AI Expert Hero Banner (Optional Trigger) */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-5 mb-6 shadow-xs border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800">
              <Sparkles className="h-3 w-3 text-indigo-600" /> {t('mia.mentalHealthAiExpert', 'Mental Health AI Expert')}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{t('mia.stressHeading', 'Stress Management & Mood Log')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {t('mia.greetingStressDesc', 'Score your stress manually below. If you want interactive conversational therapy, sleep assessments, or guided breathing, Mia is available 24/7.')}
          </p>
        </div>
        <button
          onClick={() => {
            setInitialCategory('general');
            setShowDeStressModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <MessageSquare className="h-4 w-4" /> {t('mia.chatWithMia', 'Chat with Mia')}
        </button>
      </div>

      {/* Clinical Context Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-amber-500" /> {t('habits.stressImpact', 'Chronic high stress elevates cortisol and blood sugar.')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('stress.stressSubtext', 'Tracking daily stress helps identify triggers and restores hormonal balance. Complete your manual score below.')}
        </p>
      </div>

      {/* Step 1: Mood Face Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4">
          {t('stress.step1Title', "Step 1 · Today's Mood & Emotional Load")}
        </span>
        
        <div className="flex justify-between items-center mb-6">
          {faces.map((f) => (
            <button 
              key={f.id}
              onClick={() => {
                setSelectedFace(f.id);
              }}
              className="flex flex-col items-center gap-2 transition-all p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className={`text-3xl transition-transform ${selectedFace === f.id ? 'scale-125 grayscale-0 opacity-100 drop-shadow-md' : 'grayscale opacity-50 hover:opacity-80'}`}>
                {f.emoji}
              </div>
              <span className={`text-[10px] ${selectedFace === f.id ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                {t(`stress.${f.id}`, f.label)}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center py-2 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('stress.tapAFace', 'Selected mood today:')}</p>
          <h3 className="text-xl font-sans text-amber-600 dark:text-amber-400 font-extrabold">
            {selectedFace ? t(`stress.${selectedFace}`, faces.find(f => f.id === selectedFace)?.label || '') : t('stress.tapPrompt', 'Tap an emotion above')}
          </h3>
        </div>
      </div>

      {/* Step 2 · Count Your Breath (Respiratory Rate & Stress Regulation) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🫁</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {t('stress.countYourBreath', 'Count Your Breath (Inhalations / Min)')}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('stress.countYourBreathSub', 'Rest quietly for 30s and count your inhalations over 1 minute. Number of inhalations: if more than 12, you need to calm down and do a breathing exercise.')}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-2xl border text-center shrink-0 ${
            breathRate > 12 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' 
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}>
            <span className="text-xl font-black block leading-none">{breathRate}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5">
              {breathRate > 12 ? t('stress.elevated', 'Elevated') : t('stress.calmState', 'Calm')}
            </span>
          </div>
        </div>

        {/* Interactive Stepper & Presets */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBreathRate(prev => Math.max(4, prev - 1))}
              className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-base flex items-center justify-center cursor-pointer shadow-2xs"
            >
              -
            </button>
            <div className="text-center px-2 min-w-[70px]">
              <span className="text-lg font-black text-slate-900 dark:text-white">{breathRate}</span>
              <span className="text-[9.5px] text-slate-400 block font-semibold leading-tight">{t('stress.inhalationsPerMin', 'inhalations / min')}</span>
            </div>
            <button
              type="button"
              onClick={() => setBreathRate(prev => Math.min(35, prev + 1))}
              className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-base flex items-center justify-center cursor-pointer shadow-2xs"
            >
              +
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
            {[
              { val: 8, label: '8-10 (Calm)' },
              { val: 12, label: '11-12 (Optimal)' },
              { val: 15, label: '13-16 (Stress)' },
              { val: 18, label: '>16 (High)' }
            ].map(p => (
              <button
                key={p.val}
                type="button"
                onClick={() => setBreathRate(p.val)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  breathRate === p.val
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Dynamic Feedback Alert */}
        {breathRate > 12 ? (
          <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-snug">
                  {t('stress.breathHighAlertTitle', 'Breath rate is > 12 inhalations/min')}
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed font-medium">
                  {t('stress.breathHighAlertDesc', 'Your sympathetic nervous system is elevated. You need to calm down — do a calming breathing exercise to lower cortisol.')}
                </p>
              </div>
            </div>
            {onNavigateToBreath && (
              <button
                type="button"
                onClick={onNavigateToBreath}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3.5 py-2 rounded-xl shrink-0 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Wind className="h-3.5 w-3.5" />
                <span>{t('stress.doBreathingExercise', 'Do Breathing Exercise')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 leading-snug">
              {t('stress.breathCalmDesc', 'Your inhalation rate is ≤ 12/min. Your body is in a calm, restorative parasympathetic state.')}
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Clinical Screening Questions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-6 space-y-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('stress.step2Title', 'Step 3 · Manual Stress Check Questions')}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('stress.step2Subtitle', 'Rate each indicator to calculate your clinical stress score:')}
          </p>
        </div>

        {/* Question 1: Nervous / Racing Thoughts */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            1. {t('stress.q1', 'Feeling nervous, anxious, or unable to stop worrying?')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { score: 0, label: t('stress.notAtAll', 'Not at all') },
              { score: 1, label: t('stress.sometimes', 'Several days') },
              { score: 2, label: t('stress.often', 'Nearly every day') },
            ].map((opt) => (
              <button
                key={opt.score}
                type="button"
                onClick={() => setQNervous(opt.score)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  qNervous === opt.score
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Physical Tension / Headaches */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            2. {t('stress.q2', 'Trouble relaxing, physical muscle tension, or headaches?')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { score: 0, label: t('stress.none', 'None') },
              { score: 1, label: t('stress.mild', 'Mild / Moderate') },
              { score: 2, label: t('stress.severe', 'Severe / Frequent') },
            ].map((opt) => (
              <button
                key={opt.score}
                type="button"
                onClick={() => setQTension(opt.score)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  qTension === opt.score
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 3: Overwhelmed by Responsibilities */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            3. {t('stress.q3', 'Feeling overwhelmed by personal, work, or care responsibilities?')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { score: 0, label: t('stress.manageable', 'Manageable') },
              { score: 1, label: t('stress.strained', 'Often strained') },
              { score: 2, label: t('stress.overwhelming', 'Overwhelming') },
            ].map((opt) => (
              <button
                key={opt.score}
                type="button"
                onClick={() => setQOverwhelmed(opt.score)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  qOverwhelmed === opt.score
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Score Meter */}
        <div className={`p-4 rounded-2xl border ${stressTier.bg} flex items-center justify-between gap-4 mt-4`}>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
              {t('stress.calculatedScore', 'Calculated Stress Index')}
            </span>
            <div className="text-base font-black flex items-center gap-2">
              {computedStressScore <= 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              {stressTier.label}
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{Math.round(computedStressScore)}</span>
            <span className="text-xs font-bold opacity-75"> / 10</span>
          </div>
        </div>
      </div>

      {/* Clinical Insight: Vitamin & Thyroid Deficiencies in Chronic Stress */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-800/40 rounded-3xl p-5 mb-8 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xl shrink-0 border border-amber-200 dark:border-amber-700/50">
            💡
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
              {t('stress.medicalInsightTag', 'Medical & Biochemical Insight')}
            </span>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
              {t('stress.vitaminDeficiencyMain', 'Repeated anxiety and stress can also be a vitamin deficiency issue. Check your Vitamin D, B12, and thyroid levels.')}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              {t('stress.vitaminDeficiencySub', 'Subclinical thyroid imbalances and low levels of Vitamin D3 or B12 directly affect brain neurotransmitters, often manifesting as persistent worry, brain fog, fatigue, and low resilience to stress.')}
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Contributing Factors (Optional) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎯</span>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{t('stress.whatIsContributing', 'What is contributing to your stress?')}</h4>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{t('stress.selectFactor', 'Select a primary factor (optional)')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {STRESS_SUB_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setSelectedSubOption(opt.id === selectedSubOption ? null : opt.id);
                if (opt.id === 'sexual_health' && onNavigateToIntimacy) {
                  onNavigateToIntimacy();
                }
              }}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${selectedSubOption === opt.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {t(`stress.sub.${opt.id}`, opt.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Submission Button */}
      <div className="mb-8">
        <button 
          onClick={handleLog}
          disabled={!selectedFace || loading}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            selectedFace 
              ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/20' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          {loading ? t('common.saving', 'Saving...') : `${t('stress.logToday', "Log Today's Stress")} (Score: ${Math.round(computedStressScore)}/10)`}
        </button>
      </div>

      {/* High Stress Specialist Consultation Recommendation */}
      {(sadDaysCount >= 3 || computedStressScore >= 7) && (
        <div className="mb-8">
          <ConsultationBanner
            sourceModule="Stress"
            reason="Stress Consultation"
            triggerCondition="Logged high stress"
            riskLevel="High"
            recommendedSpecialty="Psychologist/Counselor"
            title={t('stressManagementSupport', 'Stress Management Support')}
            description="You've logged high stress levels recently. Consider talking to a certified mental health professional to help manage it effectively."
            colorTheme="amber"
            onBookAppointment={onBookAppointment!}
          />
        </div>
      )}

      {/* Past 7 Days History */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">{t('common.last7Days', 'Last 7 Days History')}</span>
        
        <div className="flex flex-col gap-2">
          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400">{t('common.noDaysLogged', 'No stress entries logged in the last 7 days')}</p>
            </div>
          ) : (
            history.map((h) => {
              const emojiMap: Record<string, string> = { calm: '😁', steady: '🙂', tense: '😐', stressed: '☹️', maxed: '😫' };
              const displayEmoji = h.value?.emoji || (h.value?.faceId ? emojiMap[h.value.faceId] : '😐');
              const rawLabel = h.value?.label || h.value?.option || (h.value?.faceId ? h.value.faceId.charAt(0).toUpperCase() + h.value.faceId.slice(1) : 'Stress Logged');
              const scoreVal = typeof h.value?.stressScore === 'number' ? h.value.stressScore : null;
              const breathVal = typeof h.value?.breathCount === 'number' ? h.value.breathCount : null;
              const isAi = h.value?.source === 'ai_mia';

              return (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{displayEmoji}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{rawLabel}</span>
                      {scoreVal !== null && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {Math.round(scoreVal)}/10
                        </span>
                      )}
                      {isAi && (
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60 uppercase">
                          Mia AI
                        </span>
                      )}
                    </div>
                    {h.value?.subOption && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {h.value.subOption}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                      {new Date(h.timestamp).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Breath Count Column */}
                  {breathVal !== null ? (
                    <div className="shrink-0">
                      <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl border inline-flex items-center gap-1.5 ${
                        breathVal > 12
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span>🫁</span>
                        <span>{breathVal} {t('stress.inhalationsShort', 'inhalations/m')}</span>
                        <span className="opacity-80">· {breathVal > 12 ? t('stress.needCalmShort', 'Calm down') : t('stress.calmState', 'Calm')}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mia Mental Health AI Chat Modal (Only opens when user explicitly clicks) */}
      <DeStressAIChatModal
        isOpen={showDeStressModal}
        onClose={() => setShowDeStressModal(false)}
        initialCategory={initialCategory}
        onBookAppointment={onBookAppointment}
      />
    </div>
  );
};
