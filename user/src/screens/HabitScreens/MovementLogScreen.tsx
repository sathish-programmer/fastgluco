import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Minus, User, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface MovementLogScreenProps {
  onBack: () => void;
}

export const MovementLogScreen: React.FC<MovementLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [minutes, setMinutes] = useState(30);
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
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Movement', 7);
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
      await HabitsService.logHabit(apiUrl, token, 'Movement', { minutes });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log movement', err);
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Repair · Movement</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Keep it moving</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <User className="h-4 w-4 text-amber-500" /> Movement signals life.
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Muscle contractions release myokines, which reduce systemic inflammation and support metabolic health.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Minutes active today</span>
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setMinutes(Math.max(0, minutes - 5))}
            className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-500"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-5xl font-sans font-bold text-amber-500">{minutes}</span>
            <span className="text-sm font-bold text-slate-400 ml-1">min</span>
          </div>
          <button 
            onClick={() => setMinutes(Math.min(300, minutes + 5))}
            className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-500"
          >
            <span className="text-2xl leading-none font-light">+</span>
          </button>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold transition-all shadow-sm bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
        >
          Log movement
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
                    {h.value.minutes >= 30 ? '🏃‍♂️' : '🚶‍♂️'} {h.value.minutes} minutes
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {h.value.minutes >= 30 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Check className="h-4 w-4 text-slate-300" />
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
