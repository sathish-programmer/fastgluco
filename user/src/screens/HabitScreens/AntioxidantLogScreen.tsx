import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Info, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface AntioxidantLogScreenProps {
  onBack: () => void;
  onViewShop?: () => void;
  onNavigateToDiagnostics?: () => void;
}

const ANTIOXIDANT_FOODS = [
  { antioxidant: 'Vitamin C', source: 'Orange', serving: '1 medium' },
  { antioxidant: 'Vitamin C', source: 'Guava', serving: '1 medium' },
  { antioxidant: 'Vitamin C', source: 'Kiwi', serving: '2 fruits' },
  { antioxidant: 'Vitamin C', source: 'Amla (Indian gooseberry)', serving: '1–2 fruits' },
  { antioxidant: 'Vitamin C', source: 'Bell pepper', serving: '½ cup' },
  { antioxidant: 'Vitamin E', source: 'Almonds', serving: '30 g (~23 almonds)' },
  { antioxidant: 'Vitamin E', source: 'Sunflower seeds', serving: '30 g' },
  { antioxidant: 'Vitamin E', source: 'Avocado', serving: '½ fruit' },
  { antioxidant: 'Beta-carotene', source: 'Carrot', serving: '1 medium' },
  { antioxidant: 'Beta-carotene', source: 'Sweet potato', serving: '1 medium' },
  { antioxidant: 'Beta-carotene', source: 'Pumpkin', serving: '1 cup cooked' },
  { antioxidant: 'Beta-carotene', source: 'Spinach', serving: '1 cup cooked' },
  { antioxidant: 'Lycopene', source: 'Tomato', serving: '2 medium' },
  { antioxidant: 'Lycopene', source: 'Watermelon', serving: '2 cups' },
  { antioxidant: 'Lutein & Zeaxanthin', source: 'Kale', serving: '1 cup cooked' },
  { antioxidant: 'Lutein & Zeaxanthin', source: 'Spinach', serving: '1 cup cooked' },
  { antioxidant: 'Anthocyanins', source: 'Blueberries', serving: '1 cup' },
  { antioxidant: 'Anthocyanins', source: 'Blackberries', serving: '1 cup' },
  { antioxidant: 'Anthocyanins', source: 'Jamun', serving: '1 cup' },
  { antioxidant: 'Polyphenols', source: 'Green tea', serving: '2 cups' },
  { antioxidant: 'Polyphenols', source: 'Black tea', serving: '2 cups' },
  { antioxidant: 'Polyphenols', source: 'Cocoa (≥70%)', serving: '20–30 g' },
  { antioxidant: 'Polyphenols', source: 'Coffee', serving: '1–2 cups' },
  { antioxidant: 'Curcumin', source: 'Turmeric', serving: '½–1 tsp/day (with black pepper)' },
  { antioxidant: 'Resveratrol', source: 'Red grapes', serving: '1 cup' },
  { antioxidant: 'Quercetin', source: 'Onion', serving: '½ onion' },
  { antioxidant: 'Quercetin', source: 'Apple', serving: '1 medium' },
  { antioxidant: 'Sulforaphane', source: 'Broccoli sprouts', serving: '½ cup' },
  { antioxidant: 'Sulforaphane', source: 'Broccoli', serving: '1 cup' },
  { antioxidant: 'Organosulfur', source: 'Garlic', serving: '1–2 cloves' },
  { antioxidant: 'Organosulfur', source: 'Onion', serving: '½ onion' },
  { antioxidant: 'Selenium', source: 'Brazil nuts', serving: '1–2 nuts (avoid excess)' },
  { antioxidant: 'Omega-3 (anti-inflammatory)', source: 'Flaxseed', serving: '1 tablespoon' },
  { antioxidant: 'Omega-3', source: 'Chia seeds', serving: '1 tablespoon' },
  { antioxidant: 'Omega-3', source: 'Walnuts', serving: '30 g' },
];

// Group by antioxidant for nicer display
const grouped = ANTIOXIDANT_FOODS.reduce<Record<string, { source: string; serving: string }[]>>((acc, row) => {
  if (!acc[row.antioxidant]) acc[row.antioxidant] = [];
  acc[row.antioxidant].push({ source: row.source, serving: row.serving });
  return acc;
}, {});

const antioxidantColors: Record<string, string> = {
  'Vitamin C': 'bg-orange-50 text-orange-700 border-orange-100',
  'Vitamin E': 'bg-amber-50 text-amber-700 border-amber-100',
  'Beta-carotene': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Lycopene': 'bg-red-50 text-red-700 border-red-100',
  'Lutein & Zeaxanthin': 'bg-lime-50 text-lime-700 border-lime-100',
  'Anthocyanins': 'bg-purple-50 text-purple-700 border-purple-100',
  'Polyphenols': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Curcumin': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Resveratrol': 'bg-rose-50 text-rose-700 border-rose-100',
  'Quercetin': 'bg-green-50 text-green-700 border-green-100',
  'Sulforaphane': 'bg-teal-50 text-teal-700 border-teal-100',
  'Organosulfur': 'bg-slate-50 text-slate-700 border-slate-200',
  'Selenium': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Omega-3 (anti-inflammatory)': 'bg-sky-50 text-sky-700 border-sky-100',
  'Omega-3': 'bg-sky-50 text-sky-700 border-sky-100',
};

export const AntioxidantLogScreen: React.FC<AntioxidantLogScreenProps> = ({ onBack, onViewShop, onNavigateToDiagnostics }) => {
  const { user, token, apiUrl } = useAuth();
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFoodTable, setShowFoodTable] = useState(false);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Antioxidants', 7);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  };

  const handleLog = async () => {
    if (!user?.id || answer === null) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Antioxidants', { consumed: answer === 'yes' });
      setAnswer(null);
      await loadHistory();
    } catch (err) {
      console.error('Failed to log antioxidants', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Repair · Antioxidants</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">Daily Antioxidant Log</h2>
        </div>
      </div>

      {/* Context Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🫐</span>
          <div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-1">Why antioxidants matter</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Antioxidants neutralise free radicals that damage DNA and accelerate ageing. Daily intake through food or supplements helps your cells repair and defend against chronic disease.
            </p>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl p-5 mb-6">

        {/* Question with underlined antioxidant-rich food + info icon */}
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed mb-5">
          Do you consume{' '}
          <button
            onClick={() => setShowFoodTable(v => !v)}
            className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 underline underline-offset-2 decoration-dashed font-bold hover:text-emerald-700 transition-colors"
          >
            antioxidant-rich foods
            <Info className="h-3.5 w-3.5 ml-0.5 text-emerald-500" />
          </button>
          {' '}or take antioxidant supplements{' '}
          {onViewShop ? (
            <button
              onClick={onViewShop}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-all"
            >
              [TABLETS]
            </button>
          ) : (
            <span className="text-slate-400 font-medium">[TABLETS]</span>
          )}
          {' '}to support your body's repair mechanisms{' '}
          <span className="font-bold text-slate-800 dark:text-slate-50">EVERYDAY?</span>
        </p>

        {/* Collapsible Food Table */}
        {showFoodTable && (
          <div className="mb-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
            {/* Table Header */}
            <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🌿</span>
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">Antioxidant Food Sources</span>
              </div>
              <button
                onClick={() => setShowFoodTable(false)}
                className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 border-b border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Antioxidant</span>
              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Food Source</span>
              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-right">One Serving</span>
            </div>

            {/* Grouped Rows */}
            <div className="max-h-72 overflow-y-auto bg-white dark:bg-slate-900">
              {Object.entries(grouped).map(([antioxidant, items]) => (
                items.map((item, idx) => (
                  <div
                    key={`${antioxidant}-${idx}`}
                    className="grid grid-cols-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {idx === 0 ? (
                      <span className={`inline-flex items-center self-start mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border w-fit ${antioxidantColors[antioxidant] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {antioxidant}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 self-center">{item.source}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 text-right self-center">{item.serving}</span>
                  </div>
                ))
              ))}
            </div>
          </div>
        )}

        {/* Show table toggle if hidden */}
        {!showFoodTable && (
          <button
            onClick={() => setShowFoodTable(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-4 hover:text-emerald-700 transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            View antioxidant-rich food sources
          </button>
        )}

        {/* Yes / No Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAnswer('yes')}
            className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
              answer === 'yes'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-[1.02]'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            <Check className="h-4 w-4" />
            Yes, I did
          </button>
          <button
            onClick={() => setAnswer('no')}
            className={`py-4 rounded-2xl font-bold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
              answer === 'no'
                ? 'bg-rose-500 border-rose-500 text-white shadow-md scale-[1.02]'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 hover:text-rose-500'
            }`}
          >
            <X className="h-4 w-4" />
            Not today
          </button>
        </div>

        {/* Log Button */}
        {answer !== null && (
          <button
            onClick={handleLog}
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm text-white transition-all shadow-sm disabled:opacity-50 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {loading ? 'Saving…' : `Save — ${answer === 'yes' ? '✅ Consumed today' : '❌ Skipped today'}`}
          </button>
        )}
      </div>

      {/* 7-Day History */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block mb-3">7-Day Trend</span>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400">No days logged yet. Start your streak today!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => {
              const consumed = h.value?.consumed === true;
              return (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg ${consumed ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40'}`}>
                      {consumed ? '🫐' : '⭕'}
                    </div>
                    <div>
                      <span className={`text-sm font-bold ${consumed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {consumed ? 'Consumed antioxidants' : 'Not consumed'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {new Date(h.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {consumed
                      ? <Check className="h-4 w-4 text-emerald-500" />
                      : <X className="h-4 w-4 text-rose-400" />
                    }
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
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
      {/* Check Vitamin Levels (Lab Testing) */}
      {onNavigateToDiagnostics && (
        <div className="mt-6">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block mb-3">Want to check your actual levels?</span>
          <button
            onClick={onNavigateToDiagnostics}
            className="w-full relative overflow-hidden rounded-3xl p-5 flex items-center justify-between gap-4 text-left shadow-md bg-white border border-slate-200"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0 border border-indigo-100">
                🧪
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">Check Vitamin Levels</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Book a lab test with our partner diagnostics vendors</p>
              </div>
            </div>
            <div className="relative z-10 h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-indigo-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}
      {/* Shop for Supplements */}
      {onViewShop && (
        <div className="mt-6">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block mb-3">Can't get enough from food?</span>
          <button
            onClick={onViewShop}
            className="w-full relative overflow-hidden rounded-3xl p-5 flex items-center justify-between gap-4 text-left shadow-md"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)' }}
          >
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute bottom-0 right-20 h-12 w-12 rounded-full bg-white/10" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 border border-white/20">
                💊
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">Shop Antioxidant Supplements</p>
                <p className="text-xs text-emerald-100 mt-0.5">Vitamin C, E, Curcumin, Omega-3 & more</p>
              </div>
            </div>
            <div className="relative z-10 h-9 w-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
