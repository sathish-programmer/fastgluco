import React, { useState, useEffect } from 'react';
import { ArrowLeft, Dna, Sparkles } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { useAuth } from '../../context/AuthContext';
import { HabitsService } from '../../services/habitsService';
import { GeneticRiskAIChatModal } from '../../components/GeneticRiskAIChatModal';
 
interface GeneticLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToShop?: (query: string) => void;
}
 
export const GeneticLogScreen: React.FC<GeneticLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop }) => {
  const { user, token, apiUrl } = useAuth();
  const [geneticLink, setGeneticLink] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  // Auto-opens Gene AI modal when visiting the Genetic Risk page
  const [showGeneAIModal, setShowGeneAIModal] = useState(true);

  useEffect(() => {
    if (user?.id) loadGeneticHistory();
  }, [user]);

  const loadGeneticHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Genetic', 7);
      if (logs && logs.length > 0) {
        const latest = logs[0];
        if (latest.value && typeof latest.value.geneticLink === 'boolean') {
          setGeneticLink(latest.value.geneticLink);
        }
      }
    } catch (e) {}
  };

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
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
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

      {/* Gene Oncogenetics AI Advisor Hero Banner */}
      <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-5 mb-6 shadow-xs border border-purple-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-purple-200/60 dark:border-purple-800">
              <Sparkles className="h-3 w-3 text-purple-600" /> Oncogenetics AI
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">NCCN v2.2025 & ASCO 2024 Guidelines</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">Roughly 10% of cancers have a genetic risk.</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Chat with **Gene**, our Germline Risk Advisor AI, to evaluate your personal & family cancer history and see if multi-gene testing is recommended.
          </p>
        </div>

        <button
          onClick={() => setShowGeneAIModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <Dna className="h-4 w-4" /> Chat with Genetic Risk AI
        </button>
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

      {/* Genetic Risk Advisor AI Modal */}
      <GeneticRiskAIChatModal
        isOpen={showGeneAIModal}
        onClose={() => setShowGeneAIModal(false)}
        onBookAppointment={onBookAppointment}
        onNavigateToShop={onNavigateToShop}
      />
    </div>
  );
};
