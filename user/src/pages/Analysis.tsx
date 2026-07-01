import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface AnalysisProps {
  onNavigateToTab?: (tab: string) => void;
  features?: any;
}

export const Analysis: React.FC<AnalysisProps> = ({ onNavigateToTab }) => {
  const { token, apiUrl } = useAuth();

  const [spikeLogs, setSpikeLogs] = useState<any[]>([]);
  const [topFoods, setTopFoods] = useState<{
    safe: any[];
    moderate: any[];
    avoid: any[];
    safeThreshold?: number;
    moderateThreshold?: number;
  }>({ safe: [], moderate: [], avoid: [] });
  const [loading, setLoading] = useState(true);
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const [range, setRange] = useState<string>('day');

  useEffect(() => {
    fetchAnalysisData();
  }, [token, range]);

  const fetchAnalysisData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Food Spike Correlations
      const spikeRes = await fetch(`${apiUrl}/glucose/analysis?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (spikeRes.status === 402 || spikeRes.status === 403) {
        setShowUpgradePrompt(true);
        setLoading(false);
        return;
      }
      if (spikeRes.ok) {
        const data = await spikeRes.json();
        setSpikeLogs(data);
      }

      // 2. Fetch Top Foods Aggregates
      const topRes = await fetch(`${apiUrl}/glucose/top-foods?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (topRes.status === 402 || topRes.status === 403) {
        setShowUpgradePrompt(true);
        setLoading(false);
        return;
      }
      if (topRes.ok) {
        const data = await topRes.json();
        setTopFoods(data);
        setShowUpgradePrompt(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (logId: string, isAccurate: boolean) => {
    if (!token) return;
    setSubmittingFeedbackId(logId);
    try {
      const response = await fetch(`${apiUrl}/food-logs/${logId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAccurate })
      });

      if (response.ok) {
        // Refresh local items
        fetchAnalysisData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedbackId(null);
    }
  };

  if (showUpgradePrompt) {
    return (
      <div className="pb-24 pt-12 px-6 max-w-5xl mx-auto bg-white min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4 shadow-soft">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Advanced Analytics Locked</h3>
        <p className="text-xs text-slate-500 font-semibold max-w-xs mt-2 mb-6">
          Advanced glucose trends, food spikes analysis, and classification are available on our premium plans.
        </p>
        <button
          onClick={() => {
            if (onNavigateToTab) {
              onNavigateToTab('Profile');
            }
          }}
          className="bg-primary hover:bg-primary-dark text-white font-extrabold px-6 py-3 rounded-2xl shadow-soft transition-all"
        >
          View Subscription Plans
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-slate-50/70 min-h-screen font-sans antialiased text-slate-800">
      {/* Title and Timeframe Selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Glucose & Food Analysis</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Review glycemic impacts and build your safe food profiles
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-slate-200/60 rounded-2xl px-3 py-1.5 self-start sm:self-auto shrink-0 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Timeframe:</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none border-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="day">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">
          Analyzing meal metrics...
        </div>
      ) : (
        <div className="space-y-6">

          {/* Section 1: Food GI aggregates lists */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">My Food Profiles</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Safe Foods */}
              <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Smile className="h-4 w-4 shrink-0" />
                  <span>Top Safe Foods (Peak ≤ {topFoods.safeThreshold ?? 90} mg/dL)</span>
                </h4>
                {topFoods.safe.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered as safe yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.safe.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Moderate Foods */}
              <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Top Moderate Foods ({(topFoods.safeThreshold ?? 90) + 1} - {topFoods.moderateThreshold ?? 110} mg/dL)</span>
                </h4>
                {topFoods.moderate.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered as moderate yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.moderate.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Avoid Foods */}
              <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Frown className="h-4 w-4 shrink-0" />
                  <span>Top Avoid Foods (Peak &gt; {topFoods.moderateThreshold ?? 110} mg/dL)</span>
                </h4>
                {topFoods.avoid.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered to avoid yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.avoid.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Meal-Spike Correlation Table */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Meal Spike Analyzer</h3>

            <div className="space-y-4">
              {spikeLogs.length === 0 ? (
                <div className="text-center p-8 bg-white border border-slate-100 rounded-3xl text-sm font-semibold text-slate-400 shadow-[0_12px_24px_rgba(0,0,0,0.02)]">
                  No meal analysis available. Upload a report and log food to view spikes.
                </div>
              ) : (
                spikeLogs.map((log) => {
                  const analysis = log.glucoseAnalysis;
                  return (
                    <div
                      key={log._id}
                      className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{log.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(log.loggedAt).toLocaleDateString([], { dateStyle: 'medium' })} • {log.mealType}
                          </span>
                        </div>
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                          analysis.status === 'Safe' ? 'bg-emerald-50 text-success border-emerald-100/70' :
                          analysis.status === 'Moderate' ? 'bg-amber-50 text-warning border-amber-100/70' :
                          'bg-rose-50 text-danger border-rose-100/70'
                        }`}>
                          {analysis.status}
                        </span>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-50 border border-slate-100/70 rounded-2xl text-center mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Before Meal</span>
                          <span className="text-sm font-extrabold text-slate-700">{analysis.beforeGlucose} <span className="text-[8px] text-slate-400">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Post Peak</span>
                          <span className="text-sm font-extrabold text-slate-700">{analysis.peakGlucose} <span className="text-[8px] text-slate-400">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Difference</span>
                          <span className={`text-sm font-extrabold ${analysis.difference < 0 ? 'text-emerald-600' : analysis.difference > 20 ? 'text-red-500' : 'text-slate-700'}`}>
                            {analysis.difference > 0 ? '+' : ''}{analysis.difference} <span className="text-[8px] text-slate-400">mg/dL</span>
                          </span>
                        </div>
                      </div>

                      {/* User Feedback Panel */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Was this spike accurate?</span>

                        {log.feedback ? (
                          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                            <span>User response:</span>
                            <span className="font-bold text-primary">{log.feedback.isAccurate ? '👍 Yes' : '👎 No'}</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleFeedback(log._id, true)}
                              disabled={submittingFeedbackId === log._id}
                              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-650 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all shadow-sm"
                            >
                              <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                              <span>Yes</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(log._id, false)}
                              disabled={submittingFeedbackId === log._id}
                              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/60 text-slate-655 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all shadow-sm"
                            >
                              <ThumbsDown className="h-3.5 w-3.5 text-slate-400" />
                              <span>No</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
