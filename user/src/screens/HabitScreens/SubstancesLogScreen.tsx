import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';
 
interface SubstancesLogScreenProps {
  onBack: () => void;
}
 
export const SubstancesLogScreen: React.FC<SubstancesLogScreenProps> = ({ onBack }) => {
  const { user, token, apiUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState<boolean>(false);
  const [deaddictionNumber, setDeaddictionNumber] = useState<string>('1800-11-0031');

  useEffect(() => {
    const fetchHelpline = async () => {
      try {
        const res = await fetch(`${apiUrl}/patient/deaddiction-number`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.number) setDeaddictionNumber(data.number);
        }
      } catch (err) {
        console.error('Failed to fetch deaddiction helpline number', err);
      }
    };
    if (user?.id) fetchHelpline();
  }, [user, apiUrl, token]);
  const handleLog = async (used: boolean) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Substances', { used });
      if (used) {
        setShowSupportPopup(true);
      } else {
        onBack();
      }
    } catch (err) {
      console.error('Failed to log substances', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
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
        
        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {/* Deaddiction Support Helpline Card */}
        <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">Deaddiction Support Helpline</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              If you or a loved one needs confidential assistance, connect with a certified Deaddiction Specialist.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded-lg">
                📞 {deaddictionNumber}
              </span>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                (Toll-Free, 24/7 Helpline)
              </span>
            </div>
          </div>
          <a
            href={`tel:${deaddictionNumber.replace(/-/g, '')}`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
          >
            Call Now
          </a>
        </div>
      </div>

      {/* DEADDICTION HELPLINE POPUP */}
      {showSupportPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-2">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-base font-bold text-slate-800">Deaddiction Support</h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              If you or a loved one needs guidance or confidential assistance, please reach out to a certified Deaddiction Specialist.
            </p>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">National Helpline</span>
              <span className="text-sm font-black text-slate-850">{deaddictionNumber}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Toll-Free · 24/7 Helpline</span>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href={`tel:${deaddictionNumber.replace(/-/g, '')}`}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center block"
              >
                📞 Call Helpline Now
              </a>
              <button 
                onClick={() => {
                  setShowSupportPopup(false);
                  onBack();
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold transition-all text-center"
              >
                Close & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
