import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bot, Cigarette, Flame, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface SmokingLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onOpenAiCheckin?: () => void;
}

export const SmokingLogScreen: React.FC<SmokingLogScreenProps> = ({ onBack, onBookAppointment, onOpenAiCheckin }) => {
  const { user, token, apiUrl } = useAuth();
  const [count, setCount] = useState<number>(0); // Cigarettes / Bidis
  const [chewingCount, setChewingCount] = useState<number>(0); // Chewing tobacco / Gutkha / Khaini
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Smoking', 14);
      const sorted = logs.reverse(); // for chart
      setHistory(sorted);

      // Populate today's current counts if already logged
      const todayStr = new Date().toDateString();
      const todayLog = logs.find(h => new Date(h.timestamp || (h as any).createdAt).toDateString() === todayStr);
      if (todayLog?.value) {
        const val = todayLog.value;
        if (val.cigarettesCount !== undefined) {
          setCount(val.cigarettesCount);
        } else if (typeof val.count === 'number' && val.chewingCount === undefined) {
          setCount(val.count);
        }
        if (val.chewingCount !== undefined) {
          setChewingCount(val.chewingCount);
        }
      }
    } catch (err) {
      console.error('Failed to load smoking history', err);
    }
  };

  const handleLog = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const totalTobacco = count + chewingCount;
      await HabitsService.logHabit(apiUrl, token, 'Smoking', {
        count: totalTobacco,
        cigarettesCount: count,
        chewingCount: chewingCount,
        totalExposure: totalTobacco,
        option: totalTobacco === 0 
          ? 'No (Clean Day)' 
          : `Smoked: ${count} sticks, Chewed: ${chewingCount} pouches`
      });
      await loadHistory();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to log smoking / chewing tobacco', err);
    } finally {
      setLoading(false);
    }
  };

  const get14DayChartData = () => {
    const daysMap: { [dateStr: string]: { total: number; sticks: number; chewing: number } } = {};
    const now = new Date();
    
    history.forEach(h => {
      const dStr = new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const val = h.value || {};
      const sticks = val.cigarettesCount ?? (val.chewingCount === undefined ? (val.count ?? 0) : 0);
      const chewing = val.chewingCount ?? 0;
      const total = val.count ?? (sticks + chewing);
      daysMap[dStr] = { total, sticks, chewing };
    });

    const result = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const data = daysMap[label] || { total: 0, sticks: 0, chewing: 0 };
      result.push({
        date: label,
        total: data.total,
        sticks: data.sticks,
        chewing: data.chewing
      });
    }
    return result;
  };

  const chartData = get14DayChartData();
  const totalExposure14Days = history.reduce((sum, h) => sum + (h.value?.count ?? ((h.value?.cigarettesCount ?? 0) + (h.value?.chewingCount ?? 0))), 0);
  const avgExposurePerDay = history.length > 0 ? (totalExposure14Days / history.length).toFixed(1) : '0';
  const tobaccoFreeDays = history.filter(h => {
    const total = h.value?.count ?? ((h.value?.cigarettesCount ?? 0) + (h.value?.chewingCount ?? 0));
    return total === 0;
  }).length;

  const totalToday = count + chewingCount;

  return (
    <div 
      className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Tobacco Exposure</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">Smoking & Chewing Tobacco</h2>
        </div>
      </div>

      {/* AI Assistant Quick Banner */}
      {onOpenAiCheckin && (
        <div className="mb-5 p-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
              <Bot className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black">Want to log all habits 10x faster?</p>
              <p className="text-[10px] text-blue-100 font-medium">Log habits & upload reports in 60s via AI voice</p>
            </div>
          </div>
          <button
            onClick={onOpenAiCheckin}
            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-[11px] rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Try AI →
          </button>
        </div>
      )}

      {/* Clinical Advisory Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Combustible & Smokeless Tobacco Risks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Both smoking (cigarettes, bidis) and chewing tobacco (gutkha, khaini, paan masala with zarda) release potent carcinogenic nitrosamines (NNK, NNN), accelerating cellular DNA mutations and driving oral & respiratory malignancies.
            </p>
          </div>
        </div>
      </div>

      {/* Main Logging Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-8 space-y-6">
        
        {/* Section 1: Cigarettes & Bidis Smoked */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cigarette className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">1. Cigarettes / Bidis Smoked</span>
            </div>
            <div className="flex items-baseline gap-1 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-900/40">
              <span className="text-xl font-sans font-bold text-rose-500">{count}</span>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">sticks</span>
            </div>
          </div>

          <div className="relative py-1">
            <input 
              type="range" 
              min="0" 
              max="40" 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 outline-none shadow-inner"
              style={{
                background: `linear-gradient(to right, #F43F5E 0%, #F43F5E ${(count / 40) * 100}%, #F1F5F9 ${(count / 40) * 100}%, #F1F5F9 100%)`
              }}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            {[0, 1, 3, 5, 10, 20].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setCount(val)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${count === val ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
              >
                {val === 0 ? '0 (Clean)' : val}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Section 2: Tobacco Chewed (Gutkha / Khaini / Paan) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">2. Tobacco Chewed (Gutkha / Khaini / Paan)</span>
            </div>
            <div className="flex items-baseline gap-1 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-900/40">
              <span className="text-xl font-sans font-bold text-amber-600 dark:text-amber-400">{chewingCount}</span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">pouches</span>
            </div>
          </div>

          <div className="relative py-1">
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={chewingCount} 
              onChange={(e) => setChewingCount(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 outline-none shadow-inner"
              style={{
                background: `linear-gradient(to right, #D97706 0%, #D97706 ${(chewingCount / 20) * 100}%, #F1F5F9 ${(chewingCount / 20) * 100}%, #F1F5F9 100%)`
              }}
            />
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            {[0, 1, 2, 4, 8, 12].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setChewingCount(val)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${chewingCount === val ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
              >
                {val === 0 ? '0 (Clean)' : val}
              </button>
            ))}
          </div>
        </div>

        {/* Combined Daily Status */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${totalToday === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'}`}>
          <div className="flex items-center gap-2.5">
            {totalToday === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold">
                {totalToday === 0 ? 'Smoke & Tobacco-Free Clean Day' : `Total Tobacco Exposures: ${totalToday}`}
              </p>
              <p className="text-[10px] opacity-80">
                {totalToday === 0 ? 'Score: 0 (No damage added)' : 'Score: -1 (Damage flag added)'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${totalToday === 0 ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200' : 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'}`}>
            {totalToday === 0 ? '0 pts' : '-1 pt'}
          </span>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Saving...' : saveSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Logged Successfully!
            </>
          ) : 'Log Tobacco Habits Today'}
        </button>
      </div>

      {/* 14-Day Trend Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            14-Day Tapering Trend
          </span>
          {tobaccoFreeDays > 0 && (
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
              {tobaccoFreeDays} Tobacco-Free Days
            </span>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Logged</span>
            <span className="text-lg font-black text-rose-500 mt-0.5 block">{totalExposure14Days} <span className="text-xs font-semibold text-slate-400">total</span></span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Daily Avg</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5 block">{avgExposurePerDay} <span className="text-xs font-semibold text-slate-400">/day</span></span>
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
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800 font-sans space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{data.date}</p>
                          <p className="font-black text-rose-400">{data.total} Total Exposures</p>
                          <div className="text-[10px] text-slate-300 flex gap-2">
                            <span>Smoked: {data.sticks} sticks</span>
                            <span>•</span>
                            <span>Chewed: {data.chewing} pouches</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
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

      {history.some(h => (h.value?.count > 0 || (h.value?.cigarettesCount ?? 0) > 0 || (h.value?.chewingCount ?? 0) > 0)) && (
        <ConsultationBanner
          sourceModule="Smoking"
          reason="Smoking & Tobacco Cessation Consultation"
          triggerCondition="Logged active tobacco consumption (smoking / chewing)"
          riskLevel="High"
          recommendedSpecialty="Preventive Oncologist / De-addiction Specialist"
          title="Tobacco Cessation Support"
          description="Tobacco in any form (smoking or chewing) significantly accelerates cellular oncogenesis. We offer specialized clinical support and tapering protocols to help you quit."
          colorTheme="rose"
          onBookAppointment={onBookAppointment!}
        />
      )}
    </div>
  );
};

