import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  CreditCard,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisProps {
  onNavigateToTab?: (tab: string) => void;
  features?: any;
}

import { Capacitor } from '@capacitor/core';

export const Analysis: React.FC<AnalysisProps> = ({ onNavigateToTab }) => {
  const { token, apiUrl, branding } = useAuth();
  const isIOSAppStoreBlocked = Capacitor.getPlatform() === 'ios' && !branding.enableIOSExternalPayments;

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
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAnalysisData();
  }, [token, range, customFrom, customTo]);

  const fetchAnalysisData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let queryParam = `range=${range}`;
      if (range === 'custom' && customFrom && customTo) {
        queryParam = `startDate=${customFrom}&endDate=${customTo}`;
      }
      // 1. Fetch Food Spike Correlations
      const spikeRes = await fetch(`${apiUrl}/glucose/analysis?${queryParam}`, {
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
      const topRes = await fetch(`${apiUrl}/glucose/top-foods?${queryParam}`, {
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
      <div className="pb-24 pt-12 px-6 max-w-5xl mx-auto bg-white dark:bg-slate-950 min-h-[80vh] flex flex-col items-center justify-center text-center transition-colors duration-300">
        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-primary-light rounded-full flex items-center justify-center mb-4 shadow-soft">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{isIOSAppStoreBlocked ? 'Feature Unavailable' : 'Advanced Analytics Locked'}</h3>
        <p className="text-xs text-slate-500 font-semibold max-w-xs mt-2 mb-6">
          {isIOSAppStoreBlocked 
            ? 'This feature is currently unavailable on iOS.'
            : 'Advanced glucose trends, food spikes analysis, and classification are available on our premium plans.'}
        </p>
        {!isIOSAppStoreBlocked && (
          <button
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('Subscription');
              }
            }}
            className="bg-primary hover:bg-primary-dark text-white font-extrabold px-6 py-3 rounded-2xl shadow-soft transition-all"
          >
            View Subscription Plans
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-slate-50/70 dark:bg-slate-950/70 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">AI Food Analysis</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
          Machine learning correlation between your meals and glucose spikes.
        </p>
      </motion.div>

      {showUpgradePrompt ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-soft rounded-3xl p-8 text-center"
        >
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Premium Feature</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            AI Food Analysis requires a premium subscription. Upgrade to see which exact foods are spiking your glucose.
          </p>
          {!isIOSAppStoreBlocked && (
            <button
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('Subscription');
                }
              }}
              className="bg-gradient-to-r from-primary to-indigo-600 dark:from-indigo-600 dark:to-primary-dark text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:shadow transition-all"
            >
              View Subscription Plans
            </button>
          )}
        </motion.div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">
          Analyzing meal metrics...
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            {/* Modern Filter Tabs */}
            <div className="flex bg-slate-200/60 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-1.5 mb-4 backdrop-blur-md shadow-inner">
              {[
                { id: 'day', label: 'Today' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: '30 Days' },
                { id: 'custom', label: 'Custom' }
              ].map(({ id, label }) => {
                const isActive = range === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setRange(id);
                      if (id !== 'custom') {
                        setCustomFrom('');
                        setCustomTo('');
                      }
                    }}
                    className={`flex-1 py-2 text-xs font-black tracking-wide rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-md shadow-blue-500/10 dark:shadow-blue-900/40 scale-[1.02]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Custom date range picker with modern sleek card */}
            {range === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold shrink-0">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Date Range:</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase mr-2">From</span>
                    <input
                      type="date"
                      value={customFrom}
                      max={customTo || getTodayStr()}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer w-full"
                    />
                  </div>
                  <span className="text-slate-400 font-bold dark:text-slate-600">-</span>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase mr-2">To</span>
                    <input
                      type="date"
                      value={customTo}
                      min={customFrom}
                      max={getTodayStr()}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Smile className="h-4 w-4 shrink-0" />
                  <span>Top Safe Foods (Peak ≤ {topFoods.safeThreshold ?? 90} mg/dL)</span>
                </h4>
                {topFoods.safe.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered as safe yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.safe.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Top Moderate Foods ({(topFoods.safeThreshold ?? 90) + 1} - {topFoods.moderateThreshold ?? 110} mg/dL)</span>
                </h4>
                {topFoods.moderate.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered as moderate yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.moderate.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Avoid Foods */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4">
                <h4 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Frown className="h-4 w-4 shrink-0" />
                  <span>Top Avoid Foods (Peak &gt; {topFoods.moderateThreshold ?? 110} mg/dL)</span>
                </h4>
                {topFoods.avoid.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-5">No foods registered to avoid yet.</p>
                ) : (
                  <div className="space-y-2.5 pl-5">
                    {topFoods.avoid.slice(0, 5).map((food, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{food.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {food.count} logs • {food.avgPeak} mg/dL peak
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Section 2: Meal-Spike Correlation Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Meal Spike Analyzer</h3>

            <div className="space-y-4">
              {spikeLogs.length === 0 ? (
                <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-semibold text-slate-400 shadow-[0_12px_24px_rgba(0,0,0,0.02)]">
                  No meal analysis available. Upload a report and log food to view spikes.
                </div>
              ) : (
                spikeLogs.map((log) => {
                  const analysis = log.glucoseAnalysis;
                  return (
                    <motion.div
                      key={log._id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{log.name}</h4>
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
                      <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100/70 dark:border-slate-700/70 rounded-2xl text-center mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Before Meal</span>
                          <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{analysis.beforeGlucose} <span className="text-[8px] text-slate-400">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Post Peak</span>
                          <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{analysis.peakGlucose} <span className="text-[8px] text-slate-400">mg/dL</span></span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Difference</span>
                          <span className={`text-sm font-extrabold ${analysis.difference < 0 ? 'text-emerald-600 dark:text-emerald-400' : analysis.difference > 20 ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {analysis.difference > 0 ? '+' : ''}{analysis.difference} <span className="text-[8px] text-slate-400">mg/dL</span>
                          </span>
                        </div>
                      </div>

                      {/* User Feedback Panel */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Was this spike accurate?</span>

                        {log.feedback ? (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                            <span>User response:</span>
                            <span className="font-bold text-primary dark:text-primary-light">{log.feedback.isAccurate ? '👍 Yes' : '👎 No'}</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleFeedback(log._id, true)}
                              disabled={submittingFeedbackId === log._id}
                              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-650 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all shadow-sm"
                            >
                              <ThumbsUp className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              <span>Yes</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(log._id, false)}
                              disabled={submittingFeedbackId === log._id}
                              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-655 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all shadow-sm"
                            >
                              <ThumbsDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                              <span>No</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
