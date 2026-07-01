import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SmokingLogScreenProps {
  onBack: () => void;
}

export const SmokingLogScreen: React.FC<SmokingLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Smoking', 14);
      setHistory(logs.reverse()); // for chart
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
      await HabitsService.logHabit(apiUrl, token, 'Smoking', { count });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log smoking', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = history.map(h => ({
    date: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    count: h.value.count
  }));

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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Smoking</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Count, then taper</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5">Every cigarette adds carcinogens.</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Log daily. The goal isn't perfection — it's a falling line over two weeks.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs text-slate-500 font-bold">Cigarettes today</span>
          <div className="flex items-baseline gap-1 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
            <span className="text-2xl font-sans font-bold text-rose-500">{count}</span>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">sticks</span>
          </div>
        </div>

        {/* Custom Slider */}
        <div className="mb-8 relative py-2">
          <input 
            type="range" 
            min="0" 
            max="40" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500 outline-none shadow-inner"
            style={{
              background: `linear-gradient(to right, #F43F5E 0%, #F43F5E ${(count / 40) * 100}%, #F1F5F9 ${(count / 40) * 100}%, #F1F5F9 100%)`
            }}
          />
          <style>{`
            input[type=range]::-webkit-slider-thumb {
              appearance: none;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: white;
              border: 3px solid #F43F5E;
              box-shadow: 0 2px 6px rgba(244, 63, 94, 0.3);
              cursor: pointer;
            }
          `}</style>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Log today'}
        </button>
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">14-Day Trend</span>
        
        {chartData.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-400">No days logged yet</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
