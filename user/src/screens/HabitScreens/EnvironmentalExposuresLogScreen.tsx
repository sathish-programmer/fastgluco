import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Info, ShieldAlert, Award, ShoppingBag, ExternalLink, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { LiveAQIWidget } from '../../components/LiveAQIWidget';

interface EnvironmentalExposuresLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToShop?: (query: string) => void;
}

export const EnvironmentalExposuresLogScreen: React.FC<EnvironmentalExposuresLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop }) => {
  const { user, token, apiUrl } = useAuth();
  
  // Sub-screens: 'hub' | 'air' | 'water' | 'pesticides' | 'microplastics' | 'kitchen'
  const [currentView, setCurrentView] = useState<'hub' | 'air' | 'water' | 'pesticides' | 'microplastics' | 'kitchen'>('hub');
  
  // Answers state
  const [airQ1, setAirQ1] = useState<boolean | null>(null);
  const [airQ2, setAirQ2] = useState<boolean | null>(null);
  const [waterQ1, setWaterQ1] = useState<boolean | null>(null); // true = Yes, false = No/Not sure
  const [pesticidesQ1, setPesticidesQ1] = useState<boolean | null>(null); // true = Yes, false = No
  const [microplasticsQ1, setMicroplasticsQ1] = useState<boolean | null>(null); // true = Yes, false = No

  // Kitchen audit answers state
  const [kitchenQ1, setKitchenQ1] = useState<boolean | null>(null); // Drinking water NOT stored in plastic can (true = Yes, false = No)
  const [kitchenQ2, setKitchenQ2] = useState<boolean | null>(null); // Utensils (Tava, pan) made of natural substances like iron, brass, aluminum (true = Yes, false = No)
  const [kitchenQ3, setKitchenQ3] = useState<boolean | null>(null); // Commodities stored preferably in non-plastic containers (true = Yes, false = No)

  const [showWaterInfo, setShowWaterInfo] = useState(true);
  const [showAirModal, setShowAirModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayLogId, setTodayLogId] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const isLoadedRef = useRef(false);
  const isUserInteractingRef = useRef(false);

  // Restore from localStorage or load latest habit log once
  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    if (airQ1 !== null && airQ2 !== null && currentView === 'air') {
      setShowAirModal(true);
    }
  }, [airQ1, airQ2, currentView]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Environmental', 7);
      const todayStr = new Date().toDateString();
      // Daily Reset: strictly only prefill if logged TODAY!
      const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);
      
      if (todayLog && todayLog.value && todayLog.value.answers) {
        setTodayLogId(todayLog.id || (todayLog as any)._id || null);
        const ans = todayLog.value.answers;
        setAirQ1(ans.airQ1 ?? null);
        setAirQ2(ans.airQ2 ?? null);
        setWaterQ1(ans.waterQ1 ?? null);
        setPesticidesQ1(ans.pesticidesQ1 ?? null);
        setMicroplasticsQ1(ans.microplasticsQ1 ?? null);
        setKitchenQ1(ans.kitchenQ1 ?? null);
        setKitchenQ2(ans.kitchenQ2 ?? null);
        setKitchenQ3(ans.kitchenQ3 ?? null);
      } else {
        // Daily reset: Nothing logged today yet!
        setTodayLogId(null);
        setAirQ1(null);
        setAirQ2(null);
        setWaterQ1(null);
        setPesticidesQ1(null);
        setMicroplasticsQ1(null);
        setKitchenQ1(null);
        setKitchenQ2(null);
        setKitchenQ3(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isLoadedRef.current = true;
    }
  };

  // Scores calculation
  const getAirScore = () => {
    if (airQ1 === null && airQ2 === null) return null;
    let score = 0;
    if (airQ1 === true) score -= 1;
    if (airQ2 === true) score -= 1;
    return score;
  };

  const getWaterScore = () => {
    if (waterQ1 === null) return null;
    return waterQ1 === true ? 0 : -1; // Yes = 0, No/Not sure = -1
  };

  const getPesticidesScore = () => {
    if (pesticidesQ1 === null) return null;
    return pesticidesQ1 === true ? -1 : 0; // Yes = -1, No = 0
  };

  const getMicroplasticsScore = () => {
    if (microplasticsQ1 === null) return null;
    return microplasticsQ1 === true ? -1 : 0; // Yes = -1, No = 0
  };

  const getKitchenScore = () => {
    if (kitchenQ1 === null && kitchenQ2 === null && kitchenQ3 === null) return null;
    let score = 0;
    if (kitchenQ1 === false) score -= 1;
    if (kitchenQ2 === false) score -= 1;
    if (kitchenQ3 === false) score -= 1;
    return score;
  };

  // Calculate live overall score
  const airScore = getAirScore();
  const waterScore = getWaterScore();
  const pesticidesScore = getPesticidesScore();
  const microplasticsScore = getMicroplasticsScore();
  const kitchenScore = getKitchenScore();

  const hasAnyAnswer = airQ1 !== null || airQ2 !== null || waterQ1 !== null || pesticidesQ1 !== null || microplasticsQ1 !== null || kitchenQ1 !== null || kitchenQ2 !== null || kitchenQ3 !== null;

  const getOverallScore = () => {
    let score = 0;
    if (airScore !== null) score += Math.max(-1, airScore);
    if (waterScore !== null) score += waterScore;
    if (pesticidesScore !== null) score += pesticidesScore;
    if (microplasticsScore !== null) score += microplasticsScore;
    if (kitchenScore !== null) score += Math.max(-1, kitchenScore);
    return Math.max(-4, score);
  };

  const overallScore = getOverallScore();

  // Auto-save to DB whenever answers change intentionally by user
  useEffect(() => {
    if (!isLoadedRef.current || !isUserInteractingRef.current) {
      return;
    }
    if (hasAnyAnswer && user?.id && token) {
      HabitsService.logHabit(apiUrl, token, 'Environmental', {
        score: overallScore,
        answers: {
          airQ1,
          airQ2,
          waterQ1,
          pesticidesQ1,
          microplasticsQ1,
          kitchenQ1,
          kitchenQ2,
          kitchenQ3
        }
      }).catch(err => console.error('Environmental habit auto-save error', err));
    }
  }, [airQ1, airQ2, waterQ1, pesticidesQ1, microplasticsQ1, kitchenQ1, kitchenQ2, kitchenQ3, overallScore, hasAnyAnswer, apiUrl, token, user?.id]);

  const handleResetLog = async () => {
    isUserInteractingRef.current = false;
    setAirQ1(null);
    setAirQ2(null);
    setWaterQ1(null);
    setPesticidesQ1(null);
    setMicroplasticsQ1(null);
    setKitchenQ1(null);
    setKitchenQ2(null);
    setKitchenQ3(null);
    if (todayLogId && token) {
      setLoading(true);
      try {
        await HabitsService.deleteHabit(apiUrl, token, todayLogId);
        setTodayLogId(null);
      } catch (err) {
        console.error('Failed to reset environmental habit', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAnswerAirQ1 = (val: boolean) => { isUserInteractingRef.current = true; setAirQ1(val); };
  const handleAnswerAirQ2 = (val: boolean) => { isUserInteractingRef.current = true; setAirQ2(val); };
  const handleAnswerWaterQ1 = (val: boolean) => { isUserInteractingRef.current = true; setWaterQ1(val); };
  const handleAnswerPesticidesQ1 = (val: boolean) => { isUserInteractingRef.current = true; setPesticidesQ1(val); };
  const handleAnswerMicroplasticsQ1 = (val: boolean) => { isUserInteractingRef.current = true; setMicroplasticsQ1(val); };
  const handleAnswerKitchenQ1 = (val: boolean) => { isUserInteractingRef.current = true; setKitchenQ1(val); };
  const handleAnswerKitchenQ2 = (val: boolean) => { isUserInteractingRef.current = true; setKitchenQ2(val); };
  const handleAnswerKitchenQ3 = (val: boolean) => { isUserInteractingRef.current = true; setKitchenQ3(val); };

  const handleSaveLogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Environmental', {
        score: overallScore,
        answers: {
          airQ1,
          airQ2,
          waterQ1,
          pesticidesQ1,
          microplasticsQ1,
          kitchenQ1,
          kitchenQ2,
          kitchenQ3
        }
      });
      onBack(); // Go back to dashboard immediately to trigger re-fetch of logs
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Category status badge helpers
  const getStatusBadge = (score: number | null, countFilled: boolean) => {
    if (!countFilled) return <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-full">Not Logged</span>;
    if (score === 0) return <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Safe</span>;
    return <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">Risk ({score})</span>;
  };

  return (
    <div 
      className="pb-28 pt-4 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 mb-8 sub-page-internal-header px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={currentView === 'hub' ? onBack : () => setCurrentView('hub')}
            className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Environment</span>
            <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">
              {currentView === 'hub' && 'Environment'}
              {currentView === 'air' && 'Air Pollution'}
              {currentView === 'water' && 'Water Carcinogens'}
              {currentView === 'pesticides' && 'Pesticide Exposure'}
              {currentView === 'microplastics' && 'Microplastics Exposure'}
            </h2>
          </div>
        </div>

        {/* Daily Status & Reset Button */}
        <div className="flex items-center gap-2">
          {hasAnyAnswer && (
            <button
              type="button"
              onClick={handleResetLog}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Reset answers for today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset Today</span>
            </button>
          )}
          <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border ${todayLogId || hasAnyAnswer ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'}`}>
            {todayLogId || hasAnyAnswer ? 'Logged (Today)' : 'Daily Check-in'}
          </span>
        </div>
      </div>

      {/* VIEW 1: HUB SCREEN */}
      {currentView === 'hub' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Live Score Ring Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="#f1f5f9" className="dark:stroke-slate-800" fill="transparent" />
                <circle 
                  cx="56" cy="56" r="48" strokeWidth="8" 
                  stroke={overallScore === 0 ? '#10b981' : overallScore >= -2 ? '#f59e0b' : '#f43f5e'} 
                  fill="transparent" 
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * (4 + (overallScore || 0))) / 4}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{overallScore}</span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm">Environmental Exposure Score</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your score ranges from <strong className="text-emerald-500">0 (Safe)</strong> to <strong className="text-rose-500">-4 (High Exposure)</strong>. Minimize daily environmental carcinogen exposure to reduce systemic DNA damage.
              </p>
              {hasAnyAnswer && (
                <div className="pt-2">
                  {overallScore === 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                      <Award className="h-4 w-4 shrink-0" />
                      Excellent! You have very low exposure risks today. Keep following these best practices.
                    </div>
                  )}
                  {overallScore < 0 && overallScore >= -2 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs p-4 rounded-2xl font-bold flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      Moderate risk flagged. Take simple steps like carbon-filtering water and avoiding peak outdoor hours.
                    </div>
                  )}
                  {overallScore <= -3 && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs p-4 rounded-2xl font-bold">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        High environmental risk. We suggest scheduling a preventative oncology checkup.
                      </div>
                      {onBookAppointment && (
                        <button 
                          onClick={() => onBookAppointment('Preventive Oncologist Consultation')}
                          className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase py-2.5 px-4 rounded-xl shadow-sm transition-all"
                        >
                          Book Preventive Oncologist Consultation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hub Option Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Air Pollution */}
            <button 
              onClick={() => setCurrentView('air')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-left flex justify-between items-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  01 · Outdoor Air & Fumes
                  <span className="text-[9px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-extrabold">AQI Tracked</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Air Pollution</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Live AQI widget & smog exposure test</span>
              </div>
              {getStatusBadge(airScore, airQ1 !== null || airQ2 !== null)}
            </button>

            {/* Water Pollution */}
            <button 
              onClick={() => setCurrentView('water')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-left flex justify-between items-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  02 · Water Contaminants
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-extrabold">Carbon + RO</span>
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Water Pollution</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Dual Filtration: Activated Carbon + RO</span>
              </div>
              {getStatusBadge(waterScore, waterQ1 !== null)}
            </button>

            {/* Pesticides */}
            <button 
              onClick={() => setCurrentView('pesticides')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-left flex justify-between items-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">03 · Produce & Farming</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Pesticides Exposure</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Non-organic & produce chemical risks</span>
              </div>
              {getStatusBadge(pesticidesScore, pesticidesQ1 !== null)}
            </button>

            {/* Microplastics */}
            <button 
              onClick={() => setCurrentView('microplastics')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-left flex justify-between items-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm group"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">04 · Plastic Containers</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-base block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Microplastics Exposure</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Heated food containers & bottled water</span>
              </div>
              {getStatusBadge(microplasticsScore, microplasticsQ1 !== null)}
            </button>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button 
              onClick={handleSaveLogs}
              disabled={loading || !hasAnyAnswer}
              className={`w-full py-4 rounded-2xl font-bold text-sm text-white transition-all shadow-sm ${hasAnyAnswer ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50'}`}
            >
              {loading ? 'Saving...' : 'Save Exposure Log'}
            </button>
            {!hasAnyAnswer && (
              <p className="text-[10px] text-center text-slate-450 mt-2.5 font-bold uppercase tracking-wider">Please answer at least one category to save.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AIR POLLUTION */}
      {currentView === 'air' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-250">
          
          {/* Hero Air Quality Tracking System (At the Top) */}
          <LiveAQIWidget onNavigateToShop={onNavigateToShop} />

          {/* Air Pollution Risk Assessment Questionnaire (Below Hero Tracker) */}
          <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Personalized Risk Questionnaire</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">Air Exposure Lifestyle Assessment</h3>
            </div>

            <div className="space-y-5">
              {/* Q1 */}
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
                  Does your work or daily routine require you to stay outdoors for more than 2 hours on days with poor air quality (AQI &gt; 150)?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAnswerAirQ1(true)}
                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${airQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    Yes (-1)
                  </button>
                  <button 
                    onClick={() => handleAnswerAirQ1(false)}
                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${airQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    No (0)
                  </button>
                </div>
              </div>

              {/* Q2 (unlocked after Q1 answered) */}
              {airQ1 !== null ? (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 2</p>
                  <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
                    Does your work involve exposure to asbestos, silica, or industrial fumes?
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAnswerAirQ2(true)}
                      className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${airQ2 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      Yes (-1)
                    </button>
                    <button 
                      onClick={() => handleAnswerAirQ2(false)}
                      className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${airQ2 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      No (0)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-center text-xs text-slate-400 font-bold italic">
                  Answer Question 1 to unlock Question 2...
                </div>
              )}
            </div>

            {/* Referral banner if airScore is -2 */}
            {airScore === -2 && onBookAppointment && (
              <ConsultationBanner
                sourceModule="Environmental"
                reason="Pulmonologist Consultation"
                triggerCondition="Severe air exposure risks"
                riskLevel="High"
                recommendedSpecialty="Pulmonologist"
                title="Pulmonologist Consultation"
                description="Your score flags high particulate & chemical inhalation risks. Consider speaking to a pulmonologist to check lung health."
                colorTheme="rose"
                onBookAppointment={onBookAppointment}
              />
            )}

            {airQ1 !== null && airQ2 !== null && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                <p className="text-xs text-indigo-750 dark:text-indigo-400 font-semibold leading-relaxed">
                  ℹ️ <strong>Recommendation:</strong> Reduce your exposure to air pollution where possible. Use an N95 mask and an air purifier when appropriate.
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={() => onNavigateToShop?.('N95 Mask')}
                    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-800 transition-all text-center group w-full"
                  >
                    <ShoppingBag className="h-5 w-5 text-indigo-500 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Order N95 Masks</span>
                    <span className="text-[9px] text-slate-400 mt-1 inline-flex items-center gap-0.5">Shop now <ExternalLink className="h-2 w-2" /></span>
                  </button>
                  <button 
                    onClick={() => onNavigateToShop?.('Air Purifier')}
                    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-800 transition-all text-center group w-full"
                  >
                    <ShoppingBag className="h-5 w-5 text-indigo-500 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Order Air Purifier</span>
                    <span className="text-[9px] text-slate-400 mt-1 inline-flex items-center gap-0.5">Shop now <ExternalLink className="h-2 w-2" /></span>
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => setCurrentView('hub')}
              disabled={airQ1 === null || airQ2 === null}
              className={`w-full py-4 rounded-2xl font-bold text-xs transition-all text-white ${airQ1 !== null && airQ2 !== null ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm' : 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed opacity-60'}`}
            >
              Done with Air Exposure Category
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: WATER POLLUTION */}
      {currentView === 'water' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm animate-in slide-in-from-right duration-250">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
              <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
                Do you know that your regular drinking water is free of carcinogenic contaminants (e.g., heavy metals, pesticides, PFAS)?
              </p>
              <div className="flex gap-3 mb-5">
                <button 
                  onClick={() => handleAnswerWaterQ1(true)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${waterQ1 === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Yes, it is free (0)
                </button>
                <button 
                  onClick={() => handleAnswerWaterQ1(false)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${waterQ1 === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  No / Not sure (-1)
                </button>
              </div>
            </div>

            {/* Info Symbol & Table Toggle */}
            <div className="pt-2">
              <button 
                onClick={() => setShowWaterInfo(v => !v)}
                className="inline-flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors py-2 px-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl"
              >
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>What filters remove water carcinogens?</span>
              </button>
            </div>

            {showWaterInfo && (
              <div className="mt-5 mb-8 border border-indigo-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-12 bg-indigo-50/80 dark:bg-indigo-950/50 px-5 py-4 border-b border-indigo-100 dark:border-slate-800 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider gap-2">
                  <span className="col-span-4">Technology</span>
                  <span className="col-span-5">Main Purpose</span>
                  <span className="col-span-3 text-right">MitoReboot</span>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="grid grid-cols-12 px-5 py-4 items-center gap-2">
                    <span className="col-span-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-700 shrink-0" />
                      Activated Carbon
                    </span>
                    <span className="col-span-5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Chlorine, taste/odour, many pesticides & organic chemicals
                    </span>
                    <span className="col-span-3 text-right text-amber-500 text-xs tracking-tighter font-black">
                      ⭐⭐⭐⭐⭐
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-5 py-4 items-center gap-2">
                    <span className="col-span-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                      RO (Reverse Osmosis)
                    </span>
                    <span className="col-span-5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Heavy metals, fluoride, nitrate, TDS, dissolved contaminants
                    </span>
                    <span className="col-span-3 text-right text-amber-500 text-xs tracking-tighter font-black">
                      ⭐⭐⭐⭐⭐
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-5 py-4 items-center gap-2">
                    <span className="col-span-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" />
                      UV Sterilization
                    </span>
                    <span className="col-span-5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Bacteria, viruses & microorganisms
                    </span>
                    <span className="col-span-3 text-right text-amber-500 text-xs tracking-tighter font-black">
                      ⭐⭐⭐⭐
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-5 py-4 items-center gap-2">
                    <span className="col-span-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300 border border-slate-400 shrink-0" />
                      Sediment Filter
                    </span>
                    <span className="col-span-5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Sand, dirt, rust & suspended particles
                    </span>
                    <span className="col-span-3 text-right text-amber-500 text-xs tracking-tighter font-black">
                      ⭐⭐⭐
                    </span>
                  </div>
                  <div className="grid grid-cols-12 px-5 py-4 items-center gap-2">
                    <span className="col-span-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      Post-Carbon
                    </span>
                    <span className="col-span-5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Taste & odour polishing
                    </span>
                    <span className="col-span-3 text-right text-amber-500 text-xs tracking-tighter font-black">
                      ⭐⭐⭐
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test link if risk flagged */}
          {waterQ1 === false && (
            <div className="my-6 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-5 sm:p-6 space-y-3">
              <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-semibold">
                Water quality is crucial for chemical prevention. Unfiltered tap water can contain heavy metals, pesticides, and chlorine byproducts. Consider testing your regular home drinking water.
              </p>
              <a 
                href="https://www.1mg.com/labs/test/water-testing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
              >
                🔗 Click here to order a 1mg Water Quality Test Kit
              </a>
            </div>
          )}

          {/* MitoReboot Recommendation Card */}
          <div className="my-8 bg-gradient-to-br from-indigo-50/90 via-blue-50/80 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">MitoReboot Official Recommendation</p>
                <p className="text-xs text-slate-800 dark:text-slate-100 font-semibold leading-relaxed">
                  Based on current availability, <strong>Dual Filtration systems with RO (Reverse Osmosis) and Activated Carbon</strong> are recommended. Remember <strong>not to store drinking water in plastic containers</strong> to prevent microplastic exposure.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => onNavigateToShop?.('Dual Filtration Activated Carbon RO Water Purifier')}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer active:scale-95"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>Order Dual Filtration Purifier (Activated Carbon + RO)</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80 ml-0.5" />
              </button>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={waterQ1 === null}
            className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${waterQ1 !== null ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 opacity-60 cursor-not-allowed'}`}
          >
            Done with Water Category
          </button>
        </div>
      )}

      {/* VIEW 4: PESTICIDES */}
      {currentView === 'pesticides' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm animate-in slide-in-from-right duration-250">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
              Do you regularly consume conventionally grown produce without taking steps to reduce pesticide residues (e.g., washing thoroughly or choosing lower-residue options when possible)?
            </p>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => handleAnswerPesticidesQ1(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${pesticidesQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes, I consume without steps (-1)
              </button>
              <button 
                onClick={() => handleAnswerPesticidesQ1(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${pesticidesQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No, I wash or choose organic (0)
              </button>
            </div>

            {/* Dirty Dozen Washing Tips Card */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                🥬 Dirty Dozen & Residue Washing Tips
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-450 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
                <li>Soak produce in a baking soda solution (1 tsp baking soda to 2 cups water) for 12-15 minutes to clear surface residues.</li>
                <li>Peel skins of apples, peaches, or cucumbers to completely remove surface residues.</li>
                <li>Prioritize buying organic versions for the "Dirty Dozen" (strawberries, spinach, kale, nectarines, apples, grapes).</li>
              </ul>
            </div>

            {pesticidesQ1 !== null && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 mt-5 space-y-2.5 animate-in fade-in duration-200">
                <p className="text-xs text-emerald-700 dark:text-emerald-450 font-semibold">
                  Choosing organic produce drastically reduces chemical pesticide residue levels in your diet.
                </p>
                <button 
                  onClick={() => onNavigateToShop?.('Organic')}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-650 hover:underline font-bold text-left"
                >
                  🥬 Click here to Order Organic Food
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={pesticidesQ1 === null}
            className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${pesticidesQ1 !== null ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 opacity-60 cursor-not-allowed'}`}
          >
            Done with Pesticides Category
          </button>
        </div>
      )}

      {/* VIEW 5: MICROPLASTICS */}
      {currentView === 'microplastics' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm animate-in slide-in-from-right duration-250">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
              Do you regularly drink from plastic water bottles or consume food stored, served, or heated in plastic containers (especially non-food-grade plastics)?
            </p>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => handleAnswerMicroplasticsQ1(true)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${microplasticsQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes, regularly (-1)
              </button>
              <button 
                onClick={() => handleAnswerMicroplasticsQ1(false)}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${microplasticsQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No, I avoid plastic containers (0)
              </button>
            </div>

            {/* Plastic Swap Guide Card */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                🥛 Safe Container Plastic Swaps
              </h4>
              <div className="grid grid-cols-2 text-xs text-emerald-700 dark:text-emerald-450 gap-3 font-semibold">
                <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-100/50">
                  <span className="block font-black text-rose-600 uppercase tracking-widest text-[9px] mb-1">Avoid ❌</span>
                  Disposable PET water bottles, heating plastic in microwaves, plastic tea bags.
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-100/50">
                  <span className="block font-black text-emerald-600 uppercase tracking-widest text-[9px] mb-1">Choose ✅</span>
                  Borosilicate glass bottles, food-grade stainless steel containers, ceramic dinnerware.
                </div>
              </div>
            </div>

            {microplasticsQ1 !== null && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 mt-5 space-y-2.5 animate-in fade-in duration-200">
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
                  Swap plastic storage for premium borosilicate glass or stainless steel containers.
                </p>
                <button 
                  onClick={() => onNavigateToShop?.('SaferProducts')}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-bold text-left"
                >
                  🥛 Click here to Order Plastic-Free Products
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={microplasticsQ1 === null}
            className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${microplasticsQ1 !== null ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm' : 'bg-slate-200 dark:bg-slate-800 opacity-60'}`}
          >
            Done with Microplastics Category
          </button>
        </div>
      )}

      {/* VIEW 6: CHECK YOUR KITCHEN AUDIT */}
      {currentView === 'kitchen' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm animate-in slide-in-from-right duration-250">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kitchen Microplastics & Utensils Audit</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">Check Your Kitchen</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit water cans, synthetic non-stick cookware exposure, and plastic commodity storage.</p>
          </div>

          <div className="space-y-6">
            {/* Question 1 */}
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
              <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
                Is your drinking water <strong>NOT stored in a plastic can</strong>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAnswerKitchenQ1(true)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ1 === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Yes (Safe - 0)
                </button>
                <button 
                  onClick={() => handleAnswerKitchenQ1(false)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ1 === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  No (Risk -1)
                </button>
              </div>
            </div>

            {/* Question 2 */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 2</p>
              <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
                Are utensils like <strong>Tava and pan made of natural materials</strong> like iron, brass, or clay (avoiding synthetic non-stick coatings)?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAnswerKitchenQ2(true)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ2 === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Yes (Safe - 0)
                </button>
                <button 
                  onClick={() => handleAnswerKitchenQ2(false)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ2 === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  No (Risk -1)
                </button>
              </div>
            </div>

            {/* Question 3 */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 3</p>
              <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3.5">
                Are commodities and ingredients <strong>stored preferably in non-plastic containers</strong> (e.g. glass, stainless steel, ceramic)?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAnswerKitchenQ3(true)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ3 === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Yes (Safe - 0)
                </button>
                <button 
                  onClick={() => handleAnswerKitchenQ3(false)}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs transition-all border ${kitchenQ3 === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  No (Risk -1)
                </button>
              </div>
            </div>
          </div>

          {/* Kitchen Best Practices Card */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              🍳 Natural Kitchen & Utensil Guidelines
            </h4>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-2 list-disc pl-4 font-semibold leading-relaxed">
              <li><strong>Cast Iron & Brass Tava</strong>: Natural iron cookware infuses dietary bioavailable minerals while avoiding synthetic non-stick coating breakdown fumes.</li>
              <li><strong>Non-Plastic Water Storage</strong>: Store drinking water in copper, clay, or food-grade stainless steel pitchers instead of plastic cans.</li>
              <li><strong>Glass & Stainless Jars</strong>: Store dry spices, pulses, and commodities in glass or stainless steel containers to eliminate plasticizer leaching.</li>
            </ul>
          </div>

          {(kitchenQ1 !== null || kitchenQ2 !== null || kitchenQ3 !== null) && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 space-y-2.5 animate-in fade-in duration-200">
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
                Looking for plastic-free stainless steel or glass kitchen storage containers?
              </p>
              <button 
                onClick={() => onNavigateToShop?.('SaferProducts')}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-bold text-left cursor-pointer"
              >
                🥛 Click here to order Plastic-Free Kitchen Products
              </button>
            </div>
          )}

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={kitchenQ1 === null && kitchenQ2 === null && kitchenQ3 === null}
            className={`w-full py-4 rounded-2xl font-bold text-xs text-white transition-all ${kitchenQ1 !== null || kitchenQ2 !== null || kitchenQ3 !== null ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm' : 'bg-slate-200 dark:bg-slate-800 opacity-60'}`}
          >
            Done with Kitchen Category
          </button>
        </div>
      )}

      {showAirModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto text-2xl">
              🌬️
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Air Safety Recommendations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reduce your exposure to air pollution where possible. Use an N95 mask and an air purifier when appropriate.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAirModal(false);
                  onNavigateToShop?.('N95 Mask');
                }}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase shadow-sm transition-all flex flex-col items-center justify-center cursor-pointer"
              >
                <span>N95 Masks 😷</span>
              </button>
              <button
                onClick={() => {
                  setShowAirModal(false);
                  onNavigateToShop?.('Air Purifier');
                }}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase shadow-sm transition-all flex flex-col items-center justify-center cursor-pointer"
              >
                <span>Air Purifier 🌀</span>
              </button>
            </div>
            <button
              onClick={() => setShowAirModal(false)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
