import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Minus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface JoyLogScreenProps {
  onBack: () => void;
}

export const JoyLogScreen: React.FC<JoyLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [joy, setJoy] = useState('');
  const [didDoJoy, setDidDoJoy] = useState<boolean | null>(null);
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
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Joy', 7);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  };

  const handleLog = async (done: boolean) => {
    setDidDoJoy(done);
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Joy', { joyActivity: joy, done });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log joy', err);
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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Repair · Joy</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Do what you love</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5">Joy is biochemistry.</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Thirty minutes of something you love shifts you into the calm, repair-friendly state.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Your joy this week</span>
        
        <input 
          type="text" 
          placeholder="Painting, gardening, music, cooking..."
          value={joy}
          onChange={(e) => setJoy(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-4">Did you give it 30 minutes today?</span>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleLog(true)}
            disabled={loading || !joy}
            className={`py-3.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${didDoJoy === true ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'}`}
          >
            Yes!
          </button>
          <button 
            onClick={() => handleLog(false)}
            disabled={loading || !joy}
            className={`py-3.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${didDoJoy === false ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
          >
            Not today
          </button>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Recent</span>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No days logged yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {h.value.done ? '🎉' : '😔'} {h.value.done ? 'My joy' : 'Missed'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {h.value.done ? (
                  <Check className="h-4 w-4 text-indigo-500" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-300" />
                )}
                <button onClick={() => handleDelete(h.id)} className="ml-3 p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
