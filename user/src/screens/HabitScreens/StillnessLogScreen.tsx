import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Check, Minus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface StillnessLogScreenProps {
  onBack: () => void;
}

export const StillnessLogScreen: React.FC<StillnessLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const { showToast } = useToast();
  const [didSit, setDidSit] = useState<boolean | null>(null);
  const [reminderTime, setReminderTime] = useState('06:30');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Stillness', 7);
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

  const handleLog = async (sat: boolean) => {
    setDidSit(sat);
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Stillness', { sat });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log stillness', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Repair · Stillness</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">Ten quiet minutes</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5">Stillness lowers cortisol.</h3>
        <p className="text-xs text-slate-550 dark:text-slate-455 leading-relaxed">
          Stillness lowers cortisol, supporting immunity and longevity. Aim for at least 10 minutes.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-4">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4">Did you meditate / sit for 10 min minimum today?</span>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleLog(true)}
            disabled={loading}
            className={`py-3.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${didSit === true ? 'bg-amber-400 text-slate-900' : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-300'}`}
          >
            Yes
          </button>
          <button 
            onClick={() => handleLog(false)}
            disabled={loading}
            className={`py-3.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${didSit === false ? 'bg-slate-250 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
          >
            No
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-105 dark:border-amber-900/35 shadow-sm rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 dark:bg-amber-900/10 rounded-bl-full -z-10"></div>
        <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-1 flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
          A quiet window helps
        </h4>
        <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed font-medium">
          Even ten minutes counts. Set a daily time?
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4">Daily Reminder</span>
        
        <div className="relative mb-4">
          <input 
            type="time" 
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-950/30 appearance-none font-bold"
          />
          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        </div>

        <button 
          onClick={() => showToast(`Reminder set for ${reminderTime}`, 'success')}
          className="w-full py-3.5 rounded-xl font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 transition-all shadow-sm"
        >
          Set reminder
        </button>
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Last 7 Days</span>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 dark:text-slate-500">No days logged yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {h.value.sat ? '🧘' : '☁️'} {h.value.sat ? 'Meditated (>=10 min)' : 'No'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {h.value.sat ? (
                  <Check className="h-4 w-4 text-amber-500" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-300" />
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
