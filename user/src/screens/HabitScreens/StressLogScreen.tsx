import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface StressLogScreenProps {
  onBack: () => void;
}

const faces = [
  { id: 'calm', label: 'Calm', emoji: '😁' },
  { id: 'steady', label: 'Steady', emoji: '🙂' },
  { id: 'tense', label: 'Tense', emoji: '😐' },
  { id: 'stressed', label: 'Stressed', emoji: '☹️' },
  { id: 'maxed', label: 'Maxed', emoji: '😫' },
];

export const StressLogScreen: React.FC<StressLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

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
      setSelectedFace(null);
    } catch (err) {
      console.error('Failed to log stress', err);
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Stress</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">How heavy is today?</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5">Chronic stress wears cells down.</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tap how today feels. A run of hard days is your cue to lean on support — we'll flag it.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Today's Load</span>
        
        <div className="flex justify-between items-center mb-8">
          {faces.map((f) => (
            <button 
              key={f.id}
              onClick={() => setSelectedFace(f.id)}
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
          className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-sm ${selectedFace ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
        >
          {loading ? 'Saving...' : 'Log today'}
        </button>
      </div>

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
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
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
    </div>
  );
};
