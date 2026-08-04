import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, ShieldAlert, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface EnvironmentalExposuresLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
}

export const EnvironmentalExposuresLogScreen: React.FC<EnvironmentalExposuresLogScreenProps> = ({ onBack, onBookAppointment }) => {
  const { user, token, apiUrl } = useAuth();
  
  // Sub-screens: 'hub' | 'air' | 'water' | 'pesticides' | 'microplastics'
  const [currentView, setCurrentView] = useState<'hub' | 'air' | 'water' | 'pesticides' | 'microplastics'>('hub');
  
  // Answers state
  const [airQ1, setAirQ1] = useState<boolean | null>(null);
  const [airQ2, setAirQ2] = useState<boolean | null>(null);
  const [waterQ1, setWaterQ1] = useState<boolean | null>(null); // true = Yes, false = No/Not sure
  const [pesticidesQ1, setPesticidesQ1] = useState<boolean | null>(null); // true = Yes, false = No
  const [microplasticsQ1, setMicroplasticsQ1] = useState<boolean | null>(null); // true = Yes, false = No

  const [showWaterInfo, setShowWaterInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore from localStorage or load latest habit log
  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Environmental', 7);
      
      // Prefill with today's/latest answers if available
      if (logs.length > 0) {
        const latest = logs[0].value;
        if (latest.answers) {
          setAirQ1(latest.answers.airQ1);
          setAirQ2(latest.answers.airQ2);
          setWaterQ1(latest.answers.waterQ1);
          setPesticidesQ1(latest.answers.pesticidesQ1);
          setMicroplasticsQ1(latest.answers.microplasticsQ1);
        }
      }
    } catch (err) {
      console.error(err);
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

  // Calculate live overall score
  const airScore = getAirScore();
  const waterScore = getWaterScore();
  const pesticidesScore = getPesticidesScore();
  const microplasticsScore = getMicroplasticsScore();

  const hasAnyAnswer = airQ1 !== null || airQ2 !== null || waterQ1 !== null || pesticidesQ1 !== null || microplasticsQ1 !== null;

  const getOverallScore = () => {
    let score = 0;
    // Air contribution: if -2 combined, overall gets -1, else if -1, overall gets -0.5 (or we sum them up capped at -4)
    if (airScore !== null) score += Math.max(-1, airScore); // cap air contribution to max -1
    if (waterScore !== null) score += waterScore;
    if (pesticidesScore !== null) score += pesticidesScore;
    if (microplasticsScore !== null) score += microplasticsScore;
    return score;
  };

  const overallScore = getOverallScore();

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
          microplasticsQ1
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
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={currentView === 'hub' ? onBack : () => setCurrentView('hub')}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Environmental Exposures</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">
            {currentView === 'hub' && 'Environmental Exposures'}
            {currentView === 'air' && 'Air Pollution'}
            {currentView === 'water' && 'Water Carcinogens'}
            {currentView === 'pesticides' && 'Pesticide Exposure'}
            {currentView === 'microplastics' && 'Microplastics Exposure'}
          </h2>
        </div>
      </div>

      {/* VIEW 1: HUB SCREEN */}
      {currentView === 'hub' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Live Score Ring Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
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
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                      <Award className="h-4 w-4 shrink-0" />
                      Excellent! You have very low exposure risks today. Keep following these best practices.
                    </div>
                  )}
                  {overallScore < 0 && overallScore >= -2 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      Moderate risk flagged. Take simple steps like carbon-filtering water and avoiding peak outdoor hours.
                    </div>
                  )}
                  {overallScore <= -3 && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-xl font-bold">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        High environmental risk. We suggest scheduling a preventative oncology checkup.
                      </div>
                      {onBookAppointment && (
                        <button 
                          onClick={() => onBookAppointment('Preventive Oncologist Consultation')}
                          className="mt-2.5 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase py-2 px-3 rounded-lg shadow-sm transition-all"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Air Pollution */}
            <button 
              onClick={() => setCurrentView('air')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left flex justify-between items-center hover:border-indigo-200 dark:hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">01 · Outdoor Air & Fumes</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">Air Pollution</span>
              </div>
              {getStatusBadge(airScore, airQ1 !== null && airQ2 !== null)}
            </button>

            {/* Water Pollution */}
            <button 
              onClick={() => setCurrentView('water')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left flex justify-between items-center hover:border-indigo-200 dark:hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">02 · Water Contaminants</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">Water Pollution</span>
              </div>
              {getStatusBadge(waterScore, waterQ1 !== null)}
            </button>

            {/* Pesticides */}
            <button 
              onClick={() => setCurrentView('pesticides')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left flex justify-between items-center hover:border-indigo-200 dark:hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">03 · Produce & Farming</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">Pesticides Exposure</span>
              </div>
              {getStatusBadge(pesticidesScore, pesticidesQ1 !== null)}
            </button>

            {/* Microplastics */}
            <button 
              onClick={() => setCurrentView('microplastics')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left flex justify-between items-center hover:border-indigo-200 dark:hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">04 · Plastic Containers</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">Microplastics Exposure</span>
              </div>
              {getStatusBadge(microplasticsScore, microplasticsQ1 !== null)}
            </button>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={handleSaveLogs}
              disabled={loading || !hasAnyAnswer}
              className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-sm ${hasAnyAnswer ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50'}`}
            >
              {loading ? 'Saving...' : 'Save Exposure Log'}
            </button>
            {!hasAnyAnswer && (
              <p className="text-[10px] text-center text-slate-450 mt-2 font-bold uppercase tracking-wider">Please answer at least one category to save.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AIR POLLUTION */}
      {currentView === 'air' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm animate-in slide-in-from-right duration-250">
          <div className="space-y-4">
            {/* Q1 */}
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
              <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3">
                Does your work or daily routine require you to stay outdoors for more than 2 hours on days with poor air quality (AQI &gt; 150)?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setAirQ1(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${airQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Yes (-1)
                </button>
                <button 
                  onClick={() => setAirQ1(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${airQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  No (0)
                </button>
              </div>
            </div>

            {/* Q2 (unlocked after Q1 answered) */}
            {airQ1 !== null ? (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 2</p>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-3">
                  Does your work involve exposure to asbestos, silica, or industrial fumes?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setAirQ2(true)}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${airQ2 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    Yes (-1)
                  </button>
                  <button 
                    onClick={() => setAirQ2(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${airQ2 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                  >
                    No (0)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-400 italic">
                Answer Question 1 to unlock the next question.
              </div>
            )}
          </div>

          {/* Referral banner if score is -2 */}
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

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={airQ1 === null || airQ2 === null}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all text-white ${airQ1 !== null && airQ2 !== null ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-200 cursor-not-allowed opacity-60'}`}
          >
            Done with Air Category
          </button>
        </div>
      )}

      {/* VIEW 3: WATER POLLUTION */}
      {currentView === 'water' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm animate-in slide-in-from-right duration-250">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
              Do you know that your regular drinking water is free of carcinogenic contaminants (e.g., heavy metals, pesticides, PFAS)?
            </p>
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => setWaterQ1(true)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${waterQ1 === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes, it is free (0)
              </button>
              <button 
                onClick={() => setWaterQ1(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${waterQ1 === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No / Not sure (-1)
              </button>
            </div>

            {/* Info Symbol & Table Toggle */}
            <button 
              onClick={() => setShowWaterInfo(v => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors mt-2"
            >
              <Info className="h-4 w-4 text-indigo-500" />
              What filters remove water carcinogens?
            </button>

            {showWaterInfo && (
              <div className="mt-4 border border-indigo-100 dark:border-slate-850 rounded-2xl overflow-hidden animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-2 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-2 border-b border-indigo-100 dark:border-slate-850 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
                  <span>Contaminant</span>
                  <span>Effective Treatment</span>
                </div>
                <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Heavy metals (lead, arsenic, mercury, cadmium)</span>
                    <span className="text-slate-500">Reverse osmosis (RO); certified activated carbon filters for lead</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Pesticides</span>
                    <span className="text-slate-500">Activated carbon; RO</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">PFAS ("forever chemicals")</span>
                    <span className="text-slate-500">Reverse osmosis; activated carbon (certified for PFAS)</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Microplastics</span>
                    <span className="text-slate-500">Reverse osmosis; ultrafiltration; nanofiltration</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Nitrates</span>
                    <span className="text-slate-500">Reverse osmosis; ion exchange</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Bacteria/viruses</span>
                    <span className="text-slate-500">UV, RO, ultrafiltration (depends on organism)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test link if risk flagged */}
          {waterQ1 === false && (
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-rose-700 dark:text-rose-450 leading-relaxed font-semibold">
                Water quality is crucial for chemical prevention. Consider testing your regular home drinking water.
              </p>
              <a 
                href="https://www.1mg.com/labs/test/water-testing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-rose-650 hover:underline font-bold"
              >
                🔗 Click here to order a 1mg Water Quality Test Kit
              </a>
            </div>
          )}

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={waterQ1 === null}
            className={`w-full py-3.5 rounded-xl font-bold text-xs text-white ${waterQ1 !== null ? 'bg-indigo-600' : 'bg-slate-200 opacity-60 cursor-not-allowed'}`}
          >
            Done with Water Category
          </button>
        </div>
      )}

      {/* VIEW 4: PESTICIDES */}
      {currentView === 'pesticides' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm animate-in slide-in-from-right duration-250">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
              Do you regularly consume conventionally grown produce without taking steps to reduce pesticide residues (e.g., washing thoroughly or choosing lower-residue options when possible)?
            </p>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setPesticidesQ1(true)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${pesticidesQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes, I consume without steps (-1)
              </button>
              <button 
                onClick={() => setPesticidesQ1(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${pesticidesQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No, I wash or choose organic (0)
              </button>
            </div>

            {/* Dirty Dozen Washing Tips Card */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                🥬 Dirty Dozen & Residue Washing Tips
              </h4>
              <ul className="text-[11px] text-amber-700 dark:text-amber-450 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
                <li>Soak produce in a baking soda solution (1 tsp baking soda to 2 cups water) for 12-15 minutes to clear surface residues.</li>
                <li>Peel skins of apples, peaches, or cucumbers to completely remove surface residues.</li>
                <li>Prioritize buying organic versions for the "Dirty Dozen" (strawberries, spinach, kale, nectarines, apples, grapes).</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={pesticidesQ1 === null}
            className={`w-full py-3.5 rounded-xl font-bold text-xs text-white ${pesticidesQ1 !== null ? 'bg-indigo-600' : 'bg-slate-200 opacity-60 cursor-not-allowed'}`}
          >
            Done with Pesticides Category
          </button>
        </div>
      )}

      {/* VIEW 5: MICROPLASTICS */}
      {currentView === 'microplastics' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm animate-in slide-in-from-right duration-250">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Question 1</p>
            <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-4">
              Do you regularly drink from plastic water bottles or consume food stored, served, or heated in plastic containers (especially non-food-grade plastics)?
            </p>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setMicroplasticsQ1(true)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${microplasticsQ1 === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Yes, regularly (-1)
              </button>
              <button 
                onClick={() => setMicroplasticsQ1(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${microplasticsQ1 === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                No, I avoid plastic containers (0)
              </button>
            </div>

            {/* Plastic Swap Guide Card */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                🥛 Safe Container Plastic Swaps
              </h4>
              <div className="grid grid-cols-2 text-[10px] text-emerald-700 dark:text-emerald-450 gap-2 font-semibold">
                <div className="bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-xl border border-emerald-100/50">
                  <span className="block font-black text-rose-600 uppercase tracking-widest text-[9px] mb-1">Avoid ❌</span>
                  Disposable PET water bottles, heating plastic in microwaves, plastic tea bags.
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-xl border border-emerald-100/50">
                  <span className="block font-black text-emerald-600 uppercase tracking-widest text-[9px] mb-1">Choose ✅</span>
                  Borosilicate glass bottles, food-grade stainless steel containers, ceramic dinnerware.
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('hub')}
            disabled={microplasticsQ1 === null}
            className={`w-full py-3.5 rounded-xl font-bold text-xs text-white ${microplasticsQ1 !== null ? 'bg-indigo-600' : 'bg-slate-200 opacity-60'}`}
          >
            Done with Microplastics Category
          </button>
        </div>
      )}

    </div>
  );
};
