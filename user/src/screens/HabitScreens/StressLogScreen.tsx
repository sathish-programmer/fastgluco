import React, { useState, useEffect } from 'react';
import { ArrowLeft, BrainCircuit, HeartHandshake, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { DeStressAIChatModal } from '../../components/DeStressAIChatModal';

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

  // De-Stress AI Modal State - Auto-opens when visiting module page
  const [showDeStressModal, setShowDeStressModal] = useState(true);
  const [initialCategory, setInitialCategory] = useState('general');

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const rawLogs = await HabitsService.getRecentHabits(apiUrl, token, 'Stress', 7);
      
      // Deduplicate logs by date (keep latest log per day)
      const uniqueMap = new Map<string, HabitLog>();
      rawLogs.forEach(log => {
        const dateKey = new Date(log.timestamp).toDateString();
        if (!uniqueMap.has(dateKey)) {
          uniqueMap.set(dateKey, log);
        }
      });

      const deduplicated = Array.from(uniqueMap.values());
      setHistory(deduplicated);

      // Auto-highlight face & subOption from today's log (if logged manually or via AI chat)
      const todayStr = new Date().toDateString();
      const todayLog = deduplicated.find(l => new Date(l.timestamp).toDateString() === todayStr);
      if (todayLog && todayLog.value) {
        if (todayLog.value.faceId) setSelectedFace(todayLog.value.faceId);
        
        // Map category/subOption
        const sub = todayLog.value.subOption || todayLog.value.label || '';
        if (sub.includes('work') || sub.includes('Work-Life')) setSelectedSubOption('work_life');
        else if (sub.includes('relation') || sub.includes('Relationship')) setSelectedSubOption('relationship');
        else if (sub.includes('loss') || sub.includes('Loss')) setSelectedSubOption('loss');
        else if (sub.includes('hormon') || sub.includes('Premenstru')) setSelectedSubOption('mood_swings');
        else if (sub.includes('sexual') || sub.includes('Sexual')) setSelectedSubOption('sexual_health');
        else if (sub.includes('other') || sub.includes('Other')) setSelectedSubOption('others');
      }

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
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
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



      {/* Mia AI De-Stress Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-5 mb-6 shadow-xs border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800">
            <Sparkles className="h-3 w-3 text-indigo-600" /> Interactive De-Stress AI
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">Feeling stressed or anxious today?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Chat with **Mia**, your AI wellness companion for instant personalized relaxation techniques and support.
          </p>
        </div>
        <button
          onClick={() => {
            setInitialCategory('general');
            setShowDeStressModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <MessageSquare className="h-4 w-4" /> Chat with Mia AI
        </button>
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
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-4 mt-5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                  🤍
                </div>
                <div>
                  <h5 className="text-xs font-black text-purple-950 dark:text-purple-200">Chat with Mito AI or Consult Specialist</h5>
                  <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed mt-0.5 font-medium">
                    Our AI de-stress companion Mito AI can guide you through tailored relaxation exercises, or you can book a direct session with a counselor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    const catMap: Record<string, string> = {
                      work_life: 'worklife',
                      relationship: 'relationship',
                      loss: 'loss',
                      mood_swings: 'hormonal',
                      sexual_health: 'sexual',
                      others: 'others'
                    };
                    setInitialCategory(catMap[selectedSubOption] || 'general');
                    setShowDeStressModal(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Chat with Mito AI
                </button>

                {onBookAppointment && (
                  <button
                    onClick={() => onBookAppointment(`Stress Management: ${STRESS_SUB_OPTIONS.find(o => o.id === selectedSubOption)?.label}`)}
                    className="w-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 font-black text-xs py-3 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HeartHandshake className="h-4 w-4" /> Book Specialist
                  </button>
                )}
              </div>
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
            history.map((h) => {
              const emojiMap: Record<string, string> = { calm: '😁', steady: '🙂', tense: '😐', stressed: '☹️', maxed: '😫' };
              const displayEmoji = h.value?.emoji || (h.value?.faceId ? emojiMap[h.value.faceId] : '😫');
              const displayLabel = h.value?.label || h.value?.option || (h.value?.faceId ? h.value.faceId.charAt(0).toUpperCase() + h.value.faceId.slice(1) : 'Stress Logged');
              const isAi = h.value?.source === 'ai_mia';

              return (
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{displayEmoji}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{displayLabel}</span>
                      {isAi && (
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60 uppercase">
                          Mia AI
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                      {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
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

      {/* Mito AI De-Stress Chat Modal */}
      <DeStressAIChatModal
        isOpen={showDeStressModal}
        onClose={() => setShowDeStressModal(false)}
        initialCategory={initialCategory}
        onBookAppointment={onBookAppointment}
      />
    </div>
  );
};
