import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Utensils, 
  Salad, 
  Drumstick, 
  Wheat, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Trash2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface DietLogScreenProps {
  onBack: () => void;
  onNavigateToFoodLog?: () => void;
  initialFilter?: '7' | '30' | '365';
}

export const DietLogScreen: React.FC<DietLogScreenProps> = ({ 
  onBack, 
  onNavigateToFoodLog,
  initialFilter
}) => {
  const { user, token, apiUrl } = useAuth();
  const { t, language } = useLanguage();

  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  const [ateBalancedDiet, setAteBalancedDiet] = useState<boolean | null>(null);
  const [ateJunkFood, setAteJunkFood] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Calculate live net score
  const balancedScore = ateBalancedDiet === true ? 1 : 0;
  const junkScore = ateJunkFood === true ? -1 : 0;
  const netScore = balancedScore + junkScore;

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id && token) {
      loadHistory(Number(historyFilter));
    }
  }, [user?.id, token, historyFilter]);

  const loadHistory = async (days: number = Number(historyFilter)) => {
    if (!user?.id || !token) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Diet', days);
      setHistory(logs);

      // Pre-populate if already logged today
      const todayStr = new Date().toDateString();
      const todayLog = logs.find(h => new Date(h.timestamp || (h as any).createdAt).toDateString() === todayStr);
      if (todayLog && typeof todayLog.value === 'object') {
        if (todayLog.value.balancedDiet !== undefined) setAteBalancedDiet(todayLog.value.balancedDiet);
        if (todayLog.value.junkFood !== undefined) setAteJunkFood(todayLog.value.junkFood);
        if (todayLog.value.notes) setNotes(todayLog.value.notes);
      }
    } catch (err) {
      console.error('Failed to load diet habit history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !token) return;
    if (ateBalancedDiet === null && ateJunkFood === null) {
      alert(t('diet.pleaseSelect', 'Please answer at least one question to log your diet check-in.'));
      return;
    }

    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Diet', {
        balancedDiet: ateBalancedDiet === true,
        junkFood: ateJunkFood === true,
        score: netScore,
        netScore: netScore,
        balancedScore,
        junkScore,
        notes: notes.trim()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadHistory();
    } catch (err) {
      console.error('Failed to log diet habit:', err);
      alert(t('diet.saveFailed', 'Could not save diet log. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete', 'Are you sure you want to delete this log?'))) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete diet log:', err);
    }
  };

  return (
    <div 
      className="pb-28 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      {/* Internal Navigation Header */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.2em] uppercase flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            {t('habits.defenceDiet', 'Build Defence · Cellular Nutrition')}
          </span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">
            {t('habits.dietTracker', 'Balanced Diet & Nutrition')}
          </h2>
        </div>
      </div>

      {/* Visual Healthy Plate Showcase */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl p-3.5 sm:p-5 mb-5 overflow-hidden">
        <div className="flex items-start sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                {t('diet.plateProtocol', 'Healthy Eating Plate Protocol')}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                {t('diet.cancerPreventionRule', 'Foundational Prevention Standard')}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
            50 · 25 · 25 Rule
          </span>
        </div>

        {/* Plate Image Illustration */}
        <div className="relative my-3 flex justify-center">
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs w-full max-w-sm flex items-center justify-center bg-white dark:bg-slate-900">
            <img 
              src="/assets/balanced-diet-plate.jpg" 
              alt="Balanced Diet Plate: 50% Vegetables, 25% Protein, 25% Carbs"
              className="w-full h-auto max-h-72 object-contain rounded-2xl transition-transform duration-300"
              onError={(e) => {
                // Graceful fallback if image path isn't loaded
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Nutritional Breakdown Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
              <Salad className="h-3.5 w-3.5" />
              <span>50% Vegetables & Greens</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Broccoli, carrots, tomatoes, leafy greens, onions. Packed with polyphenols & protective fiber.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs mb-1">
              <Drumstick className="h-3.5 w-3.5" />
              <span>25% Clean Protein</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Fish, eggs, lentils, tofu, almonds, clean dairy. Sourcing <strong>0.8 to 1 gm per kg</strong> body weight.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold text-xs mb-1">
              <Wheat className="h-3.5 w-3.5" />
              <span>25% Complex Carbs</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Sweet potato, brown rice, whole oats, seeds. Clean sustained fuel without rapid glucose spikes.
            </p>
          </div>
        </div>

        {/* Clinical Definition Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
              {t('diet.whatIsBalanced', 'What defines a Balanced Diet?')}
            </h4>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
              &ldquo;A balanced diet is an eating pattern that provides all essential nutrients by typically sourcing <strong>45% to 65%</strong> of daily calories from carbohydrates, <strong>10% to 35%</strong> from proteins <em>(0.8 to 1 gm per kg)</em>, and <strong>20% to 35%</strong> from healthy fats.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Two-Question Check-in Questionnaire */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
            {t('diet.dailyCheckin', "Today's Diet Assessment")}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date().toLocaleDateString(activeLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Question 1: Balanced Diet */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                1
              </span>
              {t('diet.qBalanced', 'Did you eat a balanced diet today?')}
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              Score +1
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 pl-7">
            {t('diet.qBalancedDesc', 'Did your meals follow the healthy plate guideline with ~50% vegetables, 0.8–1g/kg protein, and healthy complex carbs?')}
          </p>

          <div className="grid grid-cols-2 gap-3 pl-7">
            <button
              type="button"
              onClick={() => setAteBalancedDiet(true)}
              className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border ${
                ateBalancedDiet === true
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <Check className={`h-4 w-4 ${ateBalancedDiet === true ? 'text-white' : 'text-emerald-500'}`} />
              <span>{t('common.yes', 'Yes')} (+1)</span>
            </button>

            <button
              type="button"
              onClick={() => setAteBalancedDiet(false)}
              className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border ${
                ateBalancedDiet === false
                  ? 'bg-slate-700 text-white border-slate-800 dark:bg-slate-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{t('common.no', 'No')} (0)</span>
            </button>
          </div>
        </div>

        {/* Question 2: Junk Food */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-black">
                2
              </span>
              {t('diet.qJunk', 'Did you eat junk food today?')}
            </h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
              Score -1
            </span>
          </div>
          <div className="mb-3.5 ml-7 p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              <strong className="font-bold text-amber-950 dark:text-amber-100">{t('diet.junkFoodInfoTitle', 'Important Definition:')}</strong>{' '}
              {t('diet.qJunkDesc', 'Junk food is not just pizza and burger, but also ultra-processed foods with long shelf lives, packaged snacks, instant noodles, chemical preservatives, refined sugars, deep-fried foods, and sugary sodas.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pl-7">
            <button
              type="button"
              onClick={() => setAteJunkFood(true)}
              className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border ${
                ateJunkFood === true
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-300'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${ateJunkFood === true ? 'text-white' : 'text-rose-500'}`} />
              <span>{t('common.yes', 'Yes')} (-1)</span>
            </button>

            <button
              type="button"
              onClick={() => setAteJunkFood(false)}
              className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border ${
                ateJunkFood === false
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <Check className={`h-4 w-4 ${ateJunkFood === false ? 'text-white' : 'text-emerald-500'}`} />
              <span>{t('diet.cleanNoJunk', 'No (Clean 0)')}</span>
            </button>
          </div>
        </div>

        {/* Optional Notes */}
        <div className="mb-5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
            {t('common.optionalNotes', 'Optional meal notes (what you ate today)')}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('diet.notesPlaceholder', 'e.g. Steamed veggies, grilled fish, brown rice...')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950/30"
          />
        </div>

        {/* Live Net Score Display */}
        {(ateBalancedDiet !== null || ateJunkFood !== null) && (
          <div className={`p-4 rounded-2xl mb-5 border transition-all ${
            netScore > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
              : netScore < 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
                : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-75 block">
                  {t('diet.netScoreEffect', 'Net Tug-of-War Score Impact')}
                </span>
                <p className="text-xs font-bold mt-0.5">
                  {netScore > 0
                    ? t('diet.scorePositive', 'Cellular Repair Force boosted! (+1 Point)')
                    : netScore < 0
                      ? t('diet.scoreNegative', 'Cellular Stress / Damage penalty applied (-1 Point)')
                      : t('diet.scoreNeutral', 'Neutral Score (0 points applied to Cellular Balance)')}
                </p>
              </div>
              <div className={`text-2xl font-mono font-black px-3.5 py-1.5 rounded-xl border ${
                netScore > 0
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : netScore < 0
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-400/50'
              }`}>
                {netScore > 0 ? `+${netScore}` : netScore}
              </div>
            </div>
          </div>
        )}

        {/* Save CTA */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || (ateBalancedDiet === null && ateJunkFood === null)}
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : saveSuccess ? (
            <>
              <Check className="h-5 w-5" />
              <span>{t('common.savedSuccessfully', 'Logged to Cellular Dashboard!')}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>{t('diet.saveDietScore', "Save Today's Diet Score")}</span>
            </>
          )}
        </button>
      </div>

      {/* Bridge to Cancer Treatment Food Log (Carb / Fat / Protein Calculator) */}
      {onNavigateToFoodLog && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-3xl p-5 mb-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                {t('diet.needExactMacros', 'Want exact Carb, Fat & Protein calculation?')}
              </span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                {t('diet.fullFoodModule', 'Open Detailed Food & Nutrition Log')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('diet.fullFoodDesc', 'Feed what you ate item by item or snap a meal picture to calculate exact grams of carbohydrates, healthy fats, fiber, and protein.')}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToFoodLog}
              className="mt-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>{t('diet.openFoodLog', 'Open Log')}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 7-Day History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
            {historyFilter === '365'
              ? t('diet.recentDietHistory365', 'Past 1 Year Diet Check-ins')
              : historyFilter === '30'
              ? t('diet.recentDietHistory30', 'Past 30 Days Diet Check-ins')
              : t('diet.recentDietHistory', 'Past 7 Days Diet Check-ins')}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setHistoryFilter('7')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '7'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('30')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '30'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              30D
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('365')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '365'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              1Y
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs text-slate-400">{t('common.loading', 'Loading history...')}</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t('diet.noHistoryYet', 'No diet check-ins logged yet. Complete today\'s assessment above!')}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {history.map((h) => {
              const val = h.value || {};
              const isBalanced = val.balancedDiet === true;
              const isJunk = val.junkFood === true;
              const score = val.netScore !== undefined ? val.netScore : (val.score || 0);

              return (
                <div 
                  key={h.id || (h as any)._id} 
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      score > 0 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : score < 0 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {score > 0 ? `+${score}` : score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {new Date(h.timestamp || (h as any).createdAt).toLocaleDateString(activeLocale, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(h.timestamp || (h as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isBalanced && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Balanced
                          </span>
                        )}
                        {isJunk && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Junk Food
                          </span>
                        )}
                        {!isBalanced && !isJunk && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Neutral
                          </span>
                        )}
                      </div>
                      {val.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                          &ldquo;{val.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(h.id || (h as any)._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
