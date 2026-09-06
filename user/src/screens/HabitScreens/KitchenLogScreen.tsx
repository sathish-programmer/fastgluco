import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Award, ShoppingBag, Utensils } from 'lucide-react';
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
  const hasLoadedRef = React.useRef(false);

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
      if (logs.length > 0) {
        const latest = logs[0].value;
        if (latest && latest.answers) {
          setKitchenQ1(latest.answers.kitchenQ1 ?? null);
          setKitchenQ2(latest.answers.kitchenQ2 ?? null);
          setKitchenQ3(latest.answers.kitchenQ3 ?? null);
        }
      } else {
        // Fallback check Environmental logs
        const envLogs = await HabitsService.getRecentHabits(apiUrl, token, 'Environmental', 7);
        if (envLogs.length > 0) {
          const latestEnv = envLogs[0].value;
          if (latestEnv && latestEnv.answers) {
            setKitchenQ1(latestEnv.answers.kitchenQ1 ?? null);
            setKitchenQ2(latestEnv.answers.kitchenQ2 ?? null);
            setKitchenQ3(latestEnv.answers.kitchenQ3 ?? null);
          }
        }
      }
    } catch (err) {
      console.error(err);
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

  // Auto-save when answers change
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
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
      className="pb-28 pt-4 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header px-1">
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

      <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Microplastics & Utensils Audit</span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">Kitchen Safety Questions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identify plastic water cans, cookware Teflon exposure, and plastic commodity storage.</p>
        </div>

        {/* Status Score Banner */}
        {hasAnyAnswer && (
          <div>
            {kitchenScore === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                <Award className="h-5 w-5 shrink-0 text-emerald-500" />
                <span>Excellent! Your drinking water storage, cookware utensils, and commodity containers are safe and plastic-free.</span>
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
                onClick={() => setKitchenQ1(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ1 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => setKitchenQ1(false)}
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
              2. Are utensils like <strong>Tava and pan made of natural substances</strong> like iron, brass, or aluminum (avoiding synthetic Teflon non-stick coatings)?
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setKitchenQ2(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ2 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => setKitchenQ2(false)}
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
                onClick={() => setKitchenQ3(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border cursor-pointer ${kitchenQ3 === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes (Safe 0)
              </button>
              <button 
                type="button"
                onClick={() => setKitchenQ3(false)}
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
            <li><strong>Cast Iron & Brass Tava</strong>: Natural iron cookware infuses dietary bioavailable iron while preventing toxic PFOA/PTFE Teflon breakdown fumes.</li>
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
