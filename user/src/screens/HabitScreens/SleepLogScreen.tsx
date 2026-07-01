import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Minus, Moon, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface SleepLogScreenProps {
  onBack: () => void;
}

export const SleepLogScreen: React.FC<SleepLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [hours, setHours] = useState(7);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Sleep', 7);
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
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Sleep', { hours });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log sleep', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Sleep Debt</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Catch up on rest</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-400" /> Sleep clears the brain.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Deep sleep triggers the glymphatic system to wash away metabolic waste. Aim for 7-9 hours.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Hours slept last night</span>
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setHours(Math.max(0, hours - 0.5))}
            className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-500"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-5xl font-sans font-bold text-indigo-500">{hours}</span>
            <span className="text-sm font-bold text-slate-400 ml-1">hrs</span>
          </div>
          <button 
            onClick={() => setHours(Math.min(24, hours + 0.5))}
            className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-500"
          >
            <span className="text-2xl leading-none font-light">+</span>
          </button>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold transition-all shadow-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
        >
          Log sleep
        </button>
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">7-Day Trend</span>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No days logged yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {h.value.hours >= 7 ? '🌟' : '🥱'} {h.value.hours} hours
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {h.value.hours >= 7 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Minus className="h-4 w-4 text-amber-500" />
                )}
                <button onClick={() => handleDelete(h.id)} className="ml-3 p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
