import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface SmokingLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
}

export const SmokingLogScreen: React.FC<SmokingLogScreenProps> = ({ onBack, onBookAppointment }) => {
  const { user, token, apiUrl } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Smoking', 14);
      setHistory(logs.reverse()); // for chart
    } catch (err) {
      console.error(err);
    } finally {
      // Done fetching
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

  const get14DayChartData = () => {
    const daysMap: { [dateStr: string]: number } = {};
    const now = new Date();
    
    history.forEach(h => {
      const dStr = new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysMap[dStr] = h.value?.count ?? 0;
    });

    const result = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const countVal = daysMap[label] !== undefined ? daysMap[label] : 0;
      result.push({
        date: label,
        count: countVal
      });
    }
    return result;
  };

  const chartData = get14DayChartData();
  const totalSticks14Days = history.reduce((sum, h) => sum + (h.value?.count || 0), 0);
  const avgSticksPerDay = history.length > 0 ? (totalSticks14Days / history.length).toFixed(1) : '0';
  const smokeFreeDays = history.filter(h => h.value?.count === 0).length;

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100">
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Smoking</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">Count, then taper</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">Every cigarette adds carcinogens.</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Log daily. The goal isn't perfection — it's a falling line over two weeks.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Cigarettes today</span>
          <div className="flex items-baseline gap-1 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-900/40">
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
            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 outline-none shadow-inner"
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

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            14-Day Tapering Trend
          </span>
          {smokeFreeDays > 0 && (
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              🎉 {smokeFreeDays} Smoke-Free Days
            </span>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Logged</span>
            <span className="text-lg font-black text-rose-500 mt-0.5 block">{totalSticks14Days} <span className="text-xs font-semibold text-slate-400">sticks</span></span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Daily Avg</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5 block">{avgSticksPerDay} <span className="text-xs font-semibold text-slate-400">/day</span></span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Days Tracked</span>
            <span className="text-lg font-black text-emerald-500 mt-0.5 block">{history.length} <span className="text-xs font-semibold text-slate-400">/14</span></span>
          </div>
        </div>

        {/* Modern Trend Chart Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft rounded-3xl p-5">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="smokeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={15}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800 font-sans">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{data.date}</p>
                          <p className="font-black text-rose-400">{data.count} Sticks</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#F43F5E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#smokeGradient)"
                  dot={{ r: 4, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {history.some(h => h.value.count > 0) && (
        <ConsultationBanner
          sourceModule="Smoking"
          reason="Smoking Cessation Consultation"
          triggerCondition="Logged > 0 cigarettes"
          riskLevel="High"
          recommendedSpecialty="Pulmonologist/De-addiction Specialist"
          title="Cessation Support"
          description="Smoking significantly accelerates cellular aging. We offer specialized support to help you quit."
          colorTheme="rose"
          onBookAppointment={onBookAppointment!}
        />
      )}
    </div>
  );
};
