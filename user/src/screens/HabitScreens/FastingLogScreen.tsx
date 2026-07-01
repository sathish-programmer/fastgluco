import React, { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Droplet, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface FastingLogScreenProps {
  onBack: () => void;
}

export const FastingLogScreen: React.FC<FastingLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [started, setStarted] = useState('2026-07-01T20:20');
  const [ended, setEnded] = useState('2026-07-01T20:20');
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
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Fasting', 7);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };
  const handleLog = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Fasting', { started, ended });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log fasting', err);
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Repair · Fasting</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Give cells a break</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-4">
        <h3 className="font-bold text-slate-800 mb-1.5">Time-restricted eating.</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Window 9 AM–7 PM · aim for a 14–16 h fast · lower glucose gives repair pathways room to work.
        </p>
      </div>

      <div className="bg-white border border-emerald-100 shadow-[0_8px_30px_rgba(16,185,129,0.04)] rounded-2xl p-6 mb-4 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
        <div className="text-5xl font-mono font-black text-emerald-500 tracking-widest mb-2 drop-shadow-sm">01:21</div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
          <Moon className="h-4 w-4 text-emerald-400 fill-emerald-100" />
          <span>Fasting — repair pathways are working</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-4">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4">Log a completed fast</span>
        
        <div className="flex flex-col gap-4 mb-5">
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Started</label>
            <input 
              type="datetime-local" 
              value={started}
              onChange={(e) => setStarted(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Ended</label>
            <input 
              type="datetime-local" 
              value={ended}
              onChange={(e) => setEnded(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log fast'}
        </button>
      </div>

      <button className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-95 mb-6 hover:shadow-md hover:border-slate-300">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
          <Droplet className="h-5 w-5 text-sky-500 fill-sky-200" />
        </div>
        <div className="flex-1">
          <h4 className="text-slate-800 font-sans font-bold text-base leading-tight inline mr-1">Glucose & Food</h4>
          <span className="text-[10px] text-slate-500 leading-snug">
            Upload your CGM report. See which foods keep you above 90 — and block the repair window.
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </button>

      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Recent Fasts</span>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No fasts logged yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" /> Fast Completed
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
