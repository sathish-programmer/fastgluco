import React, { useState, useEffect } from 'react';
import { ArrowLeft, Dna, Sparkles, AlertTriangle, ShieldAlert, ShieldCheck, ArrowRight, Trash2 } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { GeneticRiskAIChatModal } from '../../components/GeneticRiskAIChatModal';

interface GeneticLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  onNavigateToShop?: (query: string) => void;
  initialFilter?: '7' | '30' | '365';
}

const CANCER_TYPES_LIST = [
  { id: 'breast', label: 'Breast Cancer', icon: '🎗️', points: 1 },
  { id: 'ovarian', label: 'Ovarian Cancer (High-Risk Flag)', icon: '🧬', points: 2 },
  { id: 'colon', label: 'Colorectal / Colon Cancer', icon: '🩸', points: 1 },
  { id: 'pancreatic', label: 'Pancreatic Cancer', icon: '🔬', points: 2 },
  { id: 'prostate', label: 'Prostate Cancer', icon: '🩺', points: 1 },
  { id: 'other', label: 'Other Cancers', icon: '⚕️', points: 1 },
];

export const GeneticLogScreen: React.FC<GeneticLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop, initialFilter }) => {
  const { user, token, apiUrl } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  // Manual Questionnaire States
  const [historyType, setHistoryType] = useState<'none' | 'second_degree' | 'first_degree' | 'personal' | 'both'>('none');
  const [selectedCancers, setSelectedCancers] = useState<string[]>([]);
  const [earlyOnset, setEarlyOnset] = useState<'no' | 'yes' | 'unsure'>('no');
  const [multipleOrRare, setMultipleOrRare] = useState<'no' | 'yes'>('no');
  const [knownMutation, setKnownMutation] = useState<'no' | 'yes' | 'not_tested'>('no');

  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  // Gia AI Modal is CLOSED by default so user can complete manual scoring first
  const [showGeneAIModal, setShowGeneAIModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id) loadGeneticHistory(Number(historyFilter));
  }, [user, historyFilter]);

  const loadGeneticHistory = async (days: number = Number(historyFilter)) => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Genetic', days);
      setHistory(logs || []);
      if (logs && logs.length > 0) {
        const latest = logs[0];
        if (latest.value) {
          if (latest.value.historyType) setHistoryType(latest.value.historyType);
          if (Array.isArray(latest.value.selectedCancers)) setSelectedCancers(latest.value.selectedCancers);
          if (latest.value.earlyOnset) setEarlyOnset(latest.value.earlyOnset);
          if (latest.value.multipleOrRare) setMultipleOrRare(latest.value.multipleOrRare);
          if (latest.value.knownMutation) setKnownMutation(latest.value.knownMutation);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      showToast(t('habits.habitDeleted', 'Log deleted'), 'info');
      await loadGeneticHistory();
    } catch (err) {
      console.error('Failed to delete genetic log', err);
      showToast(t('habits.habitDeleteFailed', 'Failed to delete log'), 'error');
    }
  };

  // Toggle cancer type selection
  const toggleCancerType = (id: string) => {
    setSelectedCancers(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Calculate Manual Genetic Risk Score (NCCN & ASCO Red Flag Index)
  const computeGeneticRiskScore = () => {
    let score = 0;

    // Q1: History degree
    if (historyType === 'second_degree') score += 1;
    else if (historyType === 'first_degree') score += 2;
    else if (historyType === 'personal') score += 3;
    else if (historyType === 'both') score += 4;

    // Q2: Specific cancer types
    selectedCancers.forEach(cId => {
      const found = CANCER_TYPES_LIST.find(c => c.id === cId);
      if (found) score += found.points;
    });

    // Q3: Early onset before age 50
    if (earlyOnset === 'yes') score += 2;

    // Q4: Multiple primaries or rare tumors
    if (multipleOrRare === 'yes') score += 2;

    // Q5: Known mutation in family
    if (knownMutation === 'yes') score += 3;

    return score;
  };

  const riskScore = computeGeneticRiskScore();

  // Determine Stratification Tier
  const getRiskTier = (score: number) => {
    if (knownMutation === 'yes' || (earlyOnset === 'yes' && selectedCancers.some(c => c === 'breast' || c === 'ovarian' || c === 'pancreatic')) || score >= 4) {
      return {
        level: 'high',
        label: t('genetic.elevatedRisk', 'Elevated / Hereditary Red Flag'),
        description: t('genetic.elevatedRiskDesc', 'Meets NCCN & ASCO clinical red flags for hereditary cancer. Certified genetic counseling and germline multi-gene panel testing are strongly advised.'),
        color: 'rose',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
      };
    }
    if (score >= 2 || historyType === 'second_degree' || historyType === 'first_degree') {
      return {
        level: 'moderate',
        label: t('genetic.moderateRisk', 'Moderate Familial Risk'),
        description: t('genetic.moderateRiskDesc', 'Some familial cancer history noted. Enhanced lifestyle prevention and earlier baseline cancer screenings are recommended.'),
        color: 'amber',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
      };
    }
    return {
      level: 'low',
      label: t('genetic.lowRisk', 'Low / Standard Population Risk'),
      description: t('genetic.lowRiskDesc', 'No major hereditary cancer indicators detected. Maintain routine healthy habits and age-appropriate general screenings.'),
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
    };
  };

  const riskTier = getRiskTier(riskScore);
  const isHighRisk = riskTier.level === 'high';

  const handleSaveAssessment = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const hasElevatedRisk = riskTier.level !== 'low';
      await HabitsService.logHabit(apiUrl, token, 'Genetic', {
        geneticLink: hasElevatedRisk,
        riskScore,
        riskLevel: riskTier.level,
        historyType,
        selectedCancers,
        earlyOnset,
        multipleOrRare,
        knownMutation,
        summary: riskTier.label
      });
      showToast(t('genetic.savedSuccess', 'Genetic risk assessment saved successfully!'), 'success');
      await loadGeneticHistory();
    } catch (err) {
      console.error('Failed to log genetic assessment', err);
      showToast(t('common.errorOccurred', 'Failed to save genetic assessment. Please try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('genetic.damageBreadcrumb', 'Damage · Genetics')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">{t('genetic.geneticLink', 'Genetic Risk Assessment')}</h2>
        </div>
      </div>

      {/* Gia Genetic AI Counselor Hero Banner (Optional Trigger) */}
      <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl p-5 mb-6 shadow-xs border border-purple-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-purple-200/60 dark:border-purple-800">
              <Sparkles className="h-3 w-3 text-purple-600" /> {t('gia.badge', 'GENETIC AI COUNSELOR')}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t('gia.guidelines', 'NCCN v2.2025 & ASCO 2024 Guidelines')}</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{t('genetic.tenPercentRisk', 'Roughly 10% of cancers have a genetic risk.')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {t('genetic.manualFirstPrompt', 'Complete your manual risk scoring questionnaire below. If you want interactive pedigree counseling or gene guidelines, Gia is available anytime.')}
          </p>
        </div>

        <button
          onClick={() => setShowGeneAIModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <Dna className="h-4 w-4" /> {t('genetic.chatWithGia', 'Chat with Gia')}
        </button>
      </div>

      {/* Manual Scoring Section */}
      <div className="space-y-6">
        {/* Question 1: Personal or Family Cancer Diagnosis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('genetic.q1Title', 'Question 1 · Personal or Family History')}
          </span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">
            {t('genetic.q1Prompt', 'Has anyone in your biological family (or yourself) had a cancer diagnosis?')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: t('genetic.none', 'No cancer history in family or self'), points: '0 pts' },
              { id: 'second_degree', label: t('genetic.secondDegree', '2nd-degree relative (Grandparent, Aunt, Uncle)'), points: '+1 pt' },
              { id: 'first_degree', label: t('genetic.firstDegree', '1st-degree relative (Parent, Sibling, Child)'), points: '+2 pts' },
              { id: 'personal', label: t('genetic.personal', 'Personal cancer diagnosis'), points: '+3 pts' },
              { id: 'both', label: t('genetic.both', 'Both personal & family cancer history'), points: '+4 pts' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setHistoryType(opt.id as any)}
                className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  historyType === opt.id
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200 shadow-xs ring-1 ring-purple-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] font-black opacity-60 ml-2 shrink-0">{opt.points}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Cancer Types in Family */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('genetic.q2Title', 'Question 2 · Specific Cancer Types')}
          </span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
            {t('genetic.q2Prompt', 'Which primary cancers have occurred in your biological family?')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('genetic.selectAllPrompt', 'Select all that apply in your pedigree:')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CANCER_TYPES_LIST.map((c) => {
              const selected = selectedCancers.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCancerType(c.id)}
                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    selected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200 shadow-xs ring-1 ring-purple-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selected ? 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    +{c.points} pt
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 3: Early Onset (Diagnosed before age 50) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('genetic.q3Title', 'Question 3 · Early Onset Age')}
          </span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
            {t('genetic.q3Prompt', 'Was any relative diagnosed with cancer at or before age 50?')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('genetic.q3Desc', 'Diagnosis before age 50 is an NCCN key red flag for hereditary syndromic cancers (e.g. early BRCA or Lynch).')}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'no', label: t('common.no', 'No'), points: '0 pts' },
              { id: 'yes', label: t('common.yes', 'Yes (<=50 yrs)'), points: '+2 pts' },
              { id: 'unsure', label: t('genetic.unsure', 'Unsure / Unknown'), points: '0 pts' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEarlyOnset(opt.id as any)}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  earlyOnset === opt.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] font-black opacity-80 mt-0.5">{opt.points}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Question 4: Multiple Primaries or Rare Tumors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('genetic.q4Title', 'Question 4 · Rare Tumors or Bilateral Cancers')}
          </span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
            {t('genetic.q4Prompt', 'Are there rare cancers (e.g., male breast cancer, bilateral tumors, or multiple primaries)?')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('genetic.q4Desc', 'Male breast cancer, synchronous tumors, or rare sarcoma clusters strongly indicate germline mutations.')}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'no', label: t('common.no', 'No'), points: '0 pts' },
              { id: 'yes', label: t('common.yes', 'Yes'), points: '+2 pts' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMultipleOrRare(opt.id as any)}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  multipleOrRare === opt.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] font-black opacity-80 mt-0.5">{opt.points}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Question 5: Known Mutation in Family */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1">
            {t('genetic.q5Title', 'Question 5 · Prior Genetic Panel Testing')}
          </span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
            {t('genetic.q5Prompt', 'Has anyone in your biological family tested positive for a hereditary gene mutation?')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('genetic.q5Desc', 'Such as pathogenic variants in BRCA1, BRCA2, MLH1, MSH2, PALB2, TP53, or APC.')}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'no', label: t('common.no', 'No Known Mutation'), points: '0 pts' },
              { id: 'yes', label: t('common.yes', 'Yes (Positive Variant)'), points: '+3 pts' },
              { id: 'not_tested', label: t('genetic.neverTested', 'Never Tested'), points: '0 pts' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKnownMutation(opt.id as any)}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  knownMutation === opt.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] font-black opacity-80 mt-0.5">{opt.points}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculated Genetic Risk Stratification Box */}
        <div className={`rounded-3xl p-5 border ${riskTier.bg} shadow-sm space-y-3`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              {isHighRisk ? (
                <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : riskTier.level === 'moderate' ? (
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  {t('genetic.stratificationTitle', 'Manual Genetic Risk Stratification')}
                </span>
                <h4 className="text-base font-black leading-tight">
                  {riskTier.label}
                </h4>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 text-right">
              <span className="text-xs font-bold opacity-75">Risk Score: </span>
              <span className="text-sm font-black">{riskScore} pts</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed opacity-90 font-medium">
            {riskTier.description}
          </p>
        </div>

        {/* Action Button: Save Assessment */}
        <button
          onClick={handleSaveAssessment}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <ShieldCheck className="h-5 w-5" />
          {loading ? t('common.saving', 'Saving...') : t('genetic.saveAssessment', 'Save & Log Genetic Assessment')}
        </button>

        {/* High-Risk Clinical Recommendation Banner */}
        {isHighRisk && onBookAppointment && (
          <ConsultationBanner
            sourceModule="Genetic Risk"
            reason="Genetic Counselor Consultation"
            triggerCondition="Family history of cancer"
            riskLevel="High"
            recommendedSpecialty="Genetic Counselor"
            title={t('recommendationTitle', 'Specialist Consultation Recommended')}
            description={t('genetic.consultRecommendDesc', 'Based on your manual scoring, we strongly recommend consulting a certified genetic counselor for clinical-grade germline multi-gene panel ordering.')}
            colorTheme="purple"
            onBookAppointment={onBookAppointment}
          />
        )}

        {/* Optional Diagnostics / Blood Test Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              🔍 {t('genetic.checkGeneticTendency', 'Order Hereditary Cancer Panel')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('genetic.checkGeneticDesc', 'Order a diagnostic multi-gene panel to screen for hereditary gene mutations (BRCA1/2, Lynch MMR, PALB2, TP53).')}
            </p>
          </div>
          <button 
            onClick={() => onNavigateToShop?.('Genetic')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap text-center cursor-pointer flex items-center gap-1.5"
          >
            <span>{t('genetic.bloodTest', 'View Lab Panels')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Past Genetic Assessment History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
              {historyFilter === '365'
                ? t('genetic.assessmentHistory365', 'Assessment History (1 Year)')
                : historyFilter === '30'
                ? t('genetic.assessmentHistory30', 'Assessment History (30 Days)')
                : t('genetic.assessmentHistory', 'Assessment History (7 Days)')}
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setHistoryFilter('7')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  historyFilter === '7'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('30')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  historyFilter === '30'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('365')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  historyFilter === '365'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                1Y
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {loadingHistory ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-400">{t('genetic.noHistoryYet', 'No genetic assessments logged yet. Complete the questions above to save your score.')}</p>
              </div>
            ) : (
              history.map((h) => {
                const isElevated = h.value?.geneticLink === true || h.value?.riskLevel === 'high';
                return (
                  <div key={h.id || (h as any)._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-xl p-3.5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <Dna className={`h-4 w-4 ${isElevated ? 'text-rose-500' : 'text-emerald-500'}`} />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {h.value?.summary || (isElevated ? 'Elevated Genetic Risk' : 'Standard Population Risk')}
                        </span>
                        {typeof h.value?.riskScore === 'number' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {h.value.riskScore} pts
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                        {new Date(h.timestamp || (h as any).createdAt).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(h.timestamp || (h as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(h.id || (h as any)._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Genetic Risk Advisor AI Modal (Gia) - Only opened on explicit button click */}
      <GeneticRiskAIChatModal
        isOpen={showGeneAIModal}
        onClose={() => setShowGeneAIModal(false)}
        onBookAppointment={onBookAppointment}
        onNavigateToShop={onNavigateToShop}
      />
    </div>
  );
};
