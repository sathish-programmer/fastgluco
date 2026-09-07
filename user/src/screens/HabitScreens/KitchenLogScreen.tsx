import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldAlert, Award, ShoppingBag, Utensils, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';

interface KitchenLogScreenProps {
  onBack: () => void;
  onNavigateToShop?: (query: string) => void;
}

export const KitchenLogScreen: React.FC<KitchenLogScreenProps> = ({ onBack, onNavigateToShop }) => {
  const { user, token, apiUrl } = useAuth();
  
  // 3 Audit Questions
  const [kitchenQ1, setKitchenQ1] = useState<boolean | null>(null); // Water NOT stored in plastic can (true = Yes, false = No)
  const [kitchenQ2, setKitchenQ2] = useState<boolean | null>(null); // Utensils (Tava, pan) made of natural substances like iron/brass/aluminum (true = Yes, false = No)
  const [kitchenQ3, setKitchenQ3] = useState<boolean | null>(null); // Commodities stored in non-plastic containers (true = Yes, false = No)

  const [loading, setLoading] = useState(false);
  const [todayLogId, setTodayLogId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isLoadedRef = useRef(false);
  const isUserInteractingRef = useRef(false);

  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Kitchen', 7);
      const todayStr = new Date().toDateString();

      // Daily Reset: strictly only prefill if logged TODAY!
      const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);

      if (todayLog && todayLog.value && (todayLog.value.answers || todayLog.value)) {
        const answers = todayLog.value.answers || todayLog.value;
        setTodayLogId(todayLog.id || (todayLog as any)._id || null);
        setKitchenQ1(answers.kitchenQ1 ?? null);
        setKitchenQ2(answers.kitchenQ2 ?? null);
        setKitchenQ3(answers.kitchenQ3 ?? null);
      } else {
        // Check today's Environmental logs as fallback
        const envLogs = await HabitsService.getRecentHabits(apiUrl, token, 'Environmental', 7);
        const todayEnv = envLogs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);
        if (todayEnv && todayEnv.value && todayEnv.value.answers) {
          setTodayLogId(todayEnv.id || (todayEnv as any)._id || null);
          setKitchenQ1(todayEnv.value.answers.kitchenQ1 ?? null);
          setKitchenQ2(todayEnv.value.answers.kitchenQ2 ?? null);
          setKitchenQ3(todayEnv.value.answers.kitchenQ3 ?? null);
        } else {
          // Fresh daily state for new day
          setTodayLogId(null);
          setKitchenQ1(null);
          setKitchenQ2(null);
          setKitchenQ3(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      isLoadedRef.current = true;
    }
  };

  const calculateScore = () => {
    if (kitchenQ1 === null && kitchenQ2 === null && kitchenQ3 === null) return null;
    let score = 0;
    if (kitchenQ1 === false) score -= 1;
    if (kitchenQ2 === false) score -= 1;
    if (kitchenQ3 === false) score -= 1;
    return score;
  };

  const kitchenScore = calculateScore();
  const hasAnyAnswer = kitchenQ1 !== null || kitchenQ2 !== null || kitchenQ3 !== null;

  // Auto-save ONLY when user actively changes answers (never during initial data load)
  useEffect(() => {
    if (!isLoadedRef.current || !isUserInteractingRef.current) {
      return;
    }
    if (hasAnyAnswer && user?.id && token) {
      HabitsService.logHabit(apiUrl, token, 'Kitchen', {
        score: kitchenScore,
        answers: {
          kitchenQ1,
          kitchenQ2,
          kitchenQ3
        }
      }).catch(err => console.error('Kitchen habit auto-save error', err));
    }
  }, [kitchenQ1, kitchenQ2, kitchenQ3, kitchenScore, hasAnyAnswer, apiUrl, token, user?.id]);

  const handleAnswerQ1 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ1(val);
  };

  const handleAnswerQ2 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ2(val);
  };

  const handleAnswerQ3 = (val: boolean) => {
    isUserInteractingRef.current = true;
    setKitchenQ3(val);
  };

  const handleResetLog = async () => {
    isUserInteractingRef.current = false;
    setKitchenQ1(null);
    setKitchenQ2(null);
    setKitchenQ3(null);
    setLoading(true);
    try {
      if (todayLogId && token) {
        await HabitsService.deleteHabit(apiUrl, token, todayLogId);
        setTodayLogId(null);
      }
      // Also ensure any other kitchen log logged today is cleared
      if (token) {
        const logs = await HabitsService.getRecentHabits(apiUrl, token, 'all', 2);
        const todayStr = new Date().toDateString();
        const todayKitchenLogs = logs.filter(l => 
          (l.type?.toUpperCase().includes('KITCHEN')) &&
          new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr
        );
        for (const log of todayKitchenLogs) {
          const id = log.id || (log as any)._id;
          if (id) {
            await HabitsService.deleteHabit(apiUrl, token, id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to reset kitchen habit', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Kitchen', {
        score: kitchenScore,
        answers: {
          kitchenQ1,
          kitchenQ2,
          kitchenQ3
        }
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 mb-6 sub-page-internal-header px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-1">
              <Utensils className="h-3 w-3 text-amber-500" /> Damage · Kitchen Audit
            </span>
            <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">
              Check Your Kitchen
            </h2>
          </div>
        </div>

        {/* Daily Status & Reset Button */}
        <div className="flex items-center gap-2">
          {(todayLogId || hasAnyAnswer) && (
            <button
              type="button"
              onClick={handleResetLog}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Reset answers for today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset Today</span>
            </button>
          )}
          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border ${todayLogId || hasAnyAnswer ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'}`}>
            {todayLogId || hasAnyAnswer ? 'Logged (Today)' : 'Daily Check-in'}
          </span>
        </div>
      </div>

      <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Microplastics & Utensils Audit</span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">Kitchen Safety Questions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identify plastic water cans, synthetic non-stick cookware exposure, and plastic commodity storage.</p>
        </div>

        {/* Status Score Banner */}
        {hasAnyAnswer && (
          <div>
            {kitchenScore === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                <Award className="h-5 w-5 shrink-0 text-emerald-500" />
                <span>Excellent! Your drinking water storage, natural cookware utensils, and commodity containers are safe and plastic-free.</span>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-500" />
                <span>Kitchen risk flagged ({kitchenScore}). Storing water in plastic cans or heating synthetic non-stick pans releases microplastics and toxic chemical vapors.</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Question 1 */}
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              1. Is your drinking water <strong>NOT stored in a plastic can</strong>?
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ1(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ1 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ1(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ1 === false ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No (Risk -1)
              </button>
            </div>
          </div>

          {/* Question 2 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 2</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              2. Are utensils like <strong>Tava and pan made of natural materials</strong> like iron, brass, or clay (avoiding synthetic non-stick coatings)?
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ2(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ2 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ2(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ2 === false ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No (Risk -1)
              </button>
            </div>
          </div>

          {/* Question 3 */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 3</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
              3. Are commodities and ingredients <strong>stored preferably in non-plastic containers</strong> (e.g. glass, stainless steel, ceramic)?
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAnswerQ3(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ3 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => handleAnswerQ3(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ3 === false ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No (Risk -1)
              </button>
            </div>
          </div>
        </div>

        {/* Natural Kitchen Guidelines Card */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            🍳 Natural Kitchen & Utensil Guidelines
          </h4>
          <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-2 list-disc pl-4 font-semibold leading-relaxed">
            <li><strong>Cast Iron & Brass Tava</strong>: Natural iron cookware infuses dietary bioavailable minerals while avoiding synthetic non-stick coating breakdown fumes.</li>
            <li><strong>Non-Plastic Water Storage</strong>: Store drinking water in copper, clay, or food-grade stainless steel pitchers instead of plastic cans.</li>
            <li><strong>Glass & Stainless Jars</strong>: Store dry spices, pulses, and commodities in glass or stainless steel containers to eliminate plasticizer leaching.</li>
          </ul>
        </div>

        {hasAnyAnswer && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 space-y-2.5 animate-in fade-in duration-200">
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
              Looking for plastic-free stainless steel or glass kitchen storage containers?
            </p>
            <button 
              type="button"
              onClick={() => onNavigateToShop?.('SaferProducts')}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-bold text-left cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
              <span>Click here to order Plastic-Free Kitchen Products</span>
            </button>
          </div>
        )}

        <button 
          type="button"
          onClick={handleSaveLogs}
          disabled={loading || !hasAnyAnswer}
          className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${hasAnyAnswer ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm active:scale-98' : 'bg-slate-200 dark:bg-slate-800 opacity-60 cursor-not-allowed'}`}
        >
          {loading ? 'Saving...' : 'Save Kitchen Audit Log'}
        </button>
      </div>
    </div>
  );
};
