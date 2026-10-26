import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flame, ShoppingBag, Trash2 } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface GastritisLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (recommendationId: string) => void;
  onNavigateToShop?: (query: string) => void;
  initialFilter?: '7' | '30' | '365';
}

export const GastritisLogScreen: React.FC<GastritisLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop, initialFilter }) => {
  const { user, token, apiUrl } = useAuth();
  const { t, language } = useLanguage();
  const LOCALE_MAP: Record<string, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    hi: 'hi-IN'
  };
  const activeLocale = LOCALE_MAP[language] || 'en-US';

  const [gastritis, setGastritis] = useState<boolean | null>(null);
  const [showHpyPopup, setShowHpyPopup] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id) loadHistory(Number(historyFilter));
  }, [user, historyFilter]);

  const loadHistory = async (days: number = Number(historyFilter)) => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Gastritis', days);
      setHistory(logs || []);
      if (logs && logs.length > 0) {
        const todayStr = new Date().toDateString();
        const todayLog = logs.find(l => new Date(l.timestamp || (l as any).createdAt).toDateString() === todayStr);
        if (todayLog?.value?.gastritis !== undefined) {
          setGastritis(todayLog.value.gastritis);
        }
      }
    } catch (err) {
      console.error('Failed to load gastritis history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete gastritis log', err);
    }
  };

  const handleSelectGastritis = async (val: boolean) => {
    setGastritis(val);
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Gastritis', { gastritis: val });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log gastritis log', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
            {t('gastritis.damageBreadcrumb', 'Damage · Gastritis')}
          </span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">
            {t('gastritis.gutHealthTracker', 'Gut Health Tracker')}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" /> {t('gastritis.trackAcidity', 'Track Acidity')}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('gastritis.trackAcidityDesc', 'Frequent gastritis or acidity can be a sign of underlying issues like H. Pylori, which increases the risk of stomach ulcers and cancer.')}
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">
          {t('gastritis.assessment', 'Assessment')}
        </span>
        
        <p className="font-semibold text-slate-800 text-sm mb-4">
          {t('gastritis.doYouFeelAcidityOften', 'Do you feel gastritis or acidity often?')}
        </p>
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => handleSelectGastritis(true)}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${gastritis === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
          >
            {t('common.yes', 'Yes')}
          </button>
          <button 
            onClick={() => handleSelectGastritis(false)}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${gastritis === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
          >
            {t('common.no', 'No')}
          </button>
        </div>

        {gastritis === true && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 mb-4">
              <p className="text-orange-800 text-sm font-semibold">{t('gastritis.frequentRequiresEvaluation', 'Frequent gastritis requires evaluation.')}</p>
              <p className="text-orange-700/80 text-xs mt-1">{t('gastritis.chooseOption', 'Please choose one of the following recommended options:')}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 hover:border-primary/50 transition-colors shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{t('gastritis.option1HpyTest', 'Option 1: H. Pylori Test')}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {t('gastritis.option1Desc', 'Take an H. Pylori blood test at home. After the test results arrive, consult a gastric specialist.')}
              </p>
              <button onClick={() => {
                setShowHpyPopup(true);
              }} className="inline-flex items-center justify-center w-full gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                <ShoppingBag className="h-4 w-4" /> {t('gastritis.buyHpyTest', 'Buy H. Pylori Test')}
              </button>
            </div>

            <ConsultationBanner
              sourceModule="Gastritis"
              reason="Gastric Specialist Consultation"
              triggerCondition="Has frequent gastritis"
              riskLevel="Medium"
              recommendedSpecialty="Gastroenterologist"
              title={t('directConsultation')}
              description={t('gastritis.consultDesc', 'Directly consult a gastric specialist for advice and diagnosis.')}
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          </div>
        )}

        {gastritis === false && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in duration-300">
            <p className="text-emerald-700 text-sm font-bold mb-1">{t('gastritis.thatsGreat', "That's great!")}</p>
            <p className="text-emerald-600/90 text-xs font-medium">{t('gastritis.thatsGreatDesc', 'Maintain a healthy diet to keep your gut happy and inflammation low.')}</p>
          </div>
        )}
      </div>

      {/* Gastritis History Section */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
            {historyFilter === '365'
              ? t('gastritis.recentHistory365', 'Gut Health History (1 Year)')
              : historyFilter === '30'
              ? t('gastritis.recentHistory30', 'Gut Health History (30 Days)')
              : t('gastritis.recentHistory', 'Gut Health History (7 Days)')}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setHistoryFilter('7')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '7'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
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
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
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
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              1Y
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400">{t('common.loading', 'Loading history...')}</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t('gastritis.noHistoryYet', 'No gut health logs yet. Complete the check above!')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => {
              const hasGas = h.value?.gastritis === true;
              return (
                <div key={h.id || (h as any)._id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${hasGas ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {hasGas ? '🔥' : '🌿'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">
                        {hasGas ? t('gastritis.frequentAcidity', 'Frequent Gastritis / Acidity') : t('gastritis.noAcidity', 'No Gastritis')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(h.timestamp || (h as any).createdAt).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(h.timestamp || (h as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasGas ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        Risk -1
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Safe 0
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(h.id || (h as any)._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* H. PYLORI TESTING & CONSULTATION POPUP */}
      {showHpyPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200 text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center mb-2">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('gastritis.advisoryTitle', 'Testing & Consultation Advisory')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('gastritis.advisoryDesc', 'After complete testing, you must BOOK CONSULTATION if you have any results (like a positive test or persistent symptoms). We want to help guide you and inform you of the next steps.')}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => {
                  setShowHpyPopup(false);
                  if (onNavigateToShop) onNavigateToShop('H. Pylori');
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {t('gastritis.proceedToBuyTest', 'Proceed to Buy Test')}
              </button>
              {onBookAppointment && (
                <button 
                  onClick={() => {
                    setShowHpyPopup(false);
                    onBookAppointment('pending_H. Pylori Test Follow-up');
                  }}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-primary rounded-xl text-xs font-bold transition-all border border-indigo-100"
                >
                  {t('gastritis.bookConsultationFirst', 'Book Consultation First')}
                </button>
              )}
              <button 
                onClick={() => setShowHpyPopup(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};;
