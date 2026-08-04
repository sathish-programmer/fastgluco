import React, { useState, useEffect } from 'react';
import { ArrowLeft, BrainCircuit, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface StressLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToIntimacy?: () => void;
}

const faces = [
  { id: 'calm', label: 'Calm', emoji: '😁' },
  { id: 'steady', label: 'Steady', emoji: '🙂' },
  { id: 'tense', label: 'Tense', emoji: '😐' },
  { id: 'stressed', label: 'Stressed', emoji: '☹️' },
  { id: 'maxed', label: 'Maxed', emoji: '😫' },
];

const STRESS_SUB_OPTIONS = [
  { id: 'work_life', label: 'Work-life balance' },
  { id: 'relationship', label: 'Relationship issue' },
  { id: 'loss', label: 'Loss of dear ones' },
  { id: 'mood_swings', label: 'Premenstrual or perimenopausal mood swings' },
  { id: 'sexual_health', label: 'Sexual health' },
  { id: 'others', label: 'Others' }
];

export const StressLogScreen: React.FC<StressLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToIntimacy }) => {
  const { user, token, apiUrl } = useAuth();
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Stressed sub-options state
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Stress', 7);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLog = async () => {
    if (!selectedFace || !user?.id) return;
    setLoading(true);
    try {
      const faceData = faces.find(f => f.id === selectedFace);
      await HabitsService.logHabit(apiUrl, token, 'Stress', { faceId: selectedFace, label: faceData?.label, emoji: faceData?.emoji });
      await loadHistory();
      // Keep selectedFace set to show sub-options if they just logged a sad/stressed face
    } catch (err) {
      console.error('Failed to log stress', err);
    } finally {
      setLoading(false);
    }
  };

  // Count sad/stressed days in the last 7 days
  const sadDaysCount = history.filter(h => h.value.faceId === 'tense' || h.value.faceId === 'stressed' || h.value.faceId === 'maxed').length;
  
  // Show contributing factors options if they have >= 3 sad days in history, OR if they selected a tense/stressed face today
  const showSubOptions = sadDaysCount >= 3 || (selectedFace === 'tense' || selectedFace === 'stressed' || selectedFace === 'maxed');

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Stress</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">How heavy is today?</h2>
        </div>
      </div>

      {/* Intro Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-amber-500" /> Chronic stress wears cells down.
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Tap how today feels. A run of hard days is your cue to lean on support — we'll flag it.
        </p>
      </div>

      {/* Face Selector Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Today's Load</span>
        
        <div className="flex justify-between items-center mb-8">
          {faces.map((f) => (
            <button 
              key={f.id}
              onClick={() => {
                setSelectedFace(f.id);
                setSelectedSubOption(null);
              }}
              className="flex flex-col items-center gap-2 transition-all"
            >
              <div className={`text-3xl transition-transform ${selectedFace === f.id ? 'scale-125 grayscale-0 opacity-100 drop-shadow-sm' : 'grayscale opacity-50'}`}>
                {f.emoji}
              </div>
              <span className={`text-[10px] ${selectedFace === f.id ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                {f.label}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-sans text-amber-500 font-bold">
            {selectedFace ? faces.find(f => f.id === selectedFace)?.label : 'Tap a face'}
          </h3>
        </div>

        <button 
          onClick={handleLog}
          disabled={!selectedFace || loading}
          className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-sm ${selectedFace ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'}`}
        >
          {loading ? 'Saving...' : 'Log today'}
        </button>
      </div>

      {/* Sub-options for contributing factors */}
      {showSubOptions && (
        <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-3xl p-5 mb-8 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">What is contributing to your stress?</h4>
              <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mt-0.5">Select a factor to receive specialized guidance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {STRESS_SUB_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedSubOption(opt.id);
                  if (opt.id === 'sexual_health' && onNavigateToIntimacy) {
                    onNavigateToIntimacy();
                  }
                }}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${selectedSubOption === opt.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Connect to mental health specialist banner */}
          {selectedSubOption && selectedSubOption !== 'sexual_health' && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 mt-5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <HeartHandshake className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-indigo-850 dark:text-indigo-350">We're here to help</h5>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed mt-1">
                    Managing mental loads is vital for physical wellness. We recommend scheduling a talk with a qualified therapist or counselor.
                  </p>
                </div>
              </div>
              {onBookAppointment && (
                <button
                  onClick={() => onBookAppointment(`Stress Management: ${STRESS_SUB_OPTIONS.find(o => o.id === selectedSubOption)?.label}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase py-3 px-3 rounded-xl shadow-sm transition-all"
                >
                  Connect to Mental Health Specialist
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Last 7 Days</span>
        
        <div className="flex flex-col gap-2">
          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No days logged yet</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-750 flex items-center gap-2">
                    {h.value.emoji} {h.value.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {sadDaysCount >= 3 && (
        <div className="mt-6">
          <ConsultationBanner
            sourceModule="Stress"
            reason="Stress Consultation"
            triggerCondition="Logged high stress"
            riskLevel="High"
            recommendedSpecialty="Psychologist/Counselor"
            title="Stress Management Support"
            description="You've logged high stress levels recently. Consider talking to a professional to help manage it effectively."
            colorTheme="amber"
            onBookAppointment={onBookAppointment!}
          />
        </div>
      )}
    </div>
  );
};
