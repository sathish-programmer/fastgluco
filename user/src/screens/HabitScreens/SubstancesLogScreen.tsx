import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';

interface SubstancesLogScreenProps {
  onBack: () => void;
}

export const SubstancesLogScreen: React.FC<SubstancesLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const handleLog = async (used: boolean) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Substances', { used });
      onBack();
    } catch (err) {
      console.error('Failed to log substances', err);
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
          disabled={loading}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Substances</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">No judgment here</h2>
        </div>
      </div>

      <div className="bg-white border border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.04)] rounded-2xl p-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10"></div>
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></span>
          Private & confidential
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed relative z-10">
          This helps us point you to the right support. Nothing leaves your device without your consent.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6 text-center">
          Used any recreational or non-prescribed substances recently?
        </span>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleLog(true)}
            disabled={loading}
            className="py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition-all disabled:opacity-50"
          >
            Yes
          </button>
          <button 
            onClick={() => handleLog(false)}
            disabled={loading}
            className="py-3.5 rounded-xl font-bold text-slate-800 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};
