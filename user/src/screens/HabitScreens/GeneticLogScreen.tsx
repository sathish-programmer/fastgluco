import React, { useState } from 'react';
import { ArrowLeft, Dna } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';
 
interface GeneticLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToShop?: (query: string) => void;
}
 
export const GeneticLogScreen: React.FC<GeneticLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop }) => {
  const { user, token, apiUrl } = useAuth();
  const [geneticLink, setGeneticLink] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectGenetic = async (val: boolean) => {
    setGeneticLink(val);
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Genetic', { geneticLink: val });
    } catch (err) {
      console.error('Failed to log genetic family history log', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Genetics</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">Genetic Link</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-2"><Dna className="h-4 w-4 text-purple-500" /> Family History</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
          Understanding your genetic background can help identify predispositions to certain conditions and allow for early preventative screening.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">🔍 Check Genetic Tendency</h3>
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
            Order a clinical-grade blood test to screen for hereditary gene mutations and disease susceptibilities.
          </p>
        </div>
        <button 
          onClick={() => onNavigateToShop?.('Genetic')}
          className="bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap text-center cursor-pointer"
        >
          Blood Test
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Self Assessment</span>
        
        <div className="mb-8">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4 leading-relaxed">
            Do you have anybody in your family with cancer, or a self-diagnosis of cancer?
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleSelectGenetic(true)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${geneticLink === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50`}
            >
              Yes
            </button>
            <button 
              onClick={() => handleSelectGenetic(false)}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${geneticLink === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50`}
            >
              No
            </button>
          </div>

          {geneticLink === true && (
            <ConsultationBanner
              sourceModule="Genetic Risk"
              reason="Genetic Counselor Consultation"
              triggerCondition="Family history of cancer"
              riskLevel="High"
              recommendedSpecialty="Genetic Counselor"
              title="Recommendation"
              description="Based on your history, we recommend consulting a genetic counselor to assess potential risks."
              colorTheme="purple"
              onBookAppointment={onBookAppointment!}
            />
          )}

          {geneticLink === false && (
            <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in duration-300">
              <p className="text-emerald-700 text-sm font-bold mb-1">Thank you for sharing.</p>
              <p className="text-emerald-600/90 text-xs font-medium">Regular general checkups are still recommended for overall health.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
