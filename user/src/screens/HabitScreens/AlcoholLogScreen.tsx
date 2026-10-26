import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Minus, Wine, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface AlcoholLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  initialFilter?: '7' | '30' | '365';
}

export const AlcoholLogScreen: React.FC<AlcoholLogScreenProps> = ({ onBack, onBookAppointment, initialFilter = '7' }) => {
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

  const [drinks, setDrinks] = useState<number>(0);
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (user?.id) loadHistory(Number(historyFilter));
  }, [user, historyFilter]);

  const loadHistory = async (days = Number(historyFilter)) => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Alcohol', days);
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

  const handleLog = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Alcohol', { drinks });
      await loadHistory();
    } catch (err) {
      console.error('Failed to log alcohol', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('habits.alcoholHeader', 'Damage · Alcohol')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">{t('habits.trackAndTaper', 'Track and taper')}</h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-2">
          <Wine className="h-4 w-4 text-rose-500" /> {t('habits.ethanolDisrupts', 'Ethanol disrupts repair.')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('habits.ethanolDesc', 'Alcohol is metabolized into acetaldehyde, a known carcinogen that damages DNA and prevents cells from repairing themselves.')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">{t('habits.drinksToday', 'Drinks today')}</span>
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setDrinks(Math.max(0, drinks - 1))}
            className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <span className="text-5xl font-sans font-bold text-rose-500">{drinks}</span>
            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-widest">{t('habits.drinks', 'Drinks')}</span>
          </div>
          <button 
            onClick={() => setDrinks(drinks + 1)}
            className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
          >
            <span className="text-2xl leading-none font-light">+</span>
          </button>
        </div>

        <button 
          onClick={handleLog}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold transition-all shadow-sm bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 cursor-pointer"
        >
          {loading ? t('habits.saving', 'Saving...') : t('habits.logAlcohol', 'Log drinks')}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {historyFilter === '365' ? t('habits.oneYearTrend', '1-Year Trend') : historyFilter === '30' ? t('habits.thirtyDayTrend', '30-Day Trend') : t('habits.sevenDayTrend', '7-Day Trend')}
          </span>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setHistoryFilter('7')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                historyFilter === '7'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setHistoryFilter('30')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                historyFilter === '30'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setHistoryFilter('365')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                historyFilter === '365'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              1Y
            </button>
          </div>
        </div>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('habits.noDaysLogged', 'No days logged yet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id || (h as any)._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {h.value.drinks === 0 ? '🎉' : '🍷'} {h.value.drinks === 0 ? t('habits.zeroDrinksClean', '0 drinks (Clean day)') : t('habits.drinksCount', { count: h.value.drinks }, `${h.value.drinks} drinks`)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(h.timestamp).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric' })} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {h.value.drinks === 0 ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-rose-500" />
                  )}
                  <button onClick={() => handleDelete(h.id || (h as any)._id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.some(h => h.value.drinks > 0) && (
        <ConsultationBanner
          sourceModule="Alcohol"
          reason="Alcohol De-addiction Consultation"
          triggerCondition="Logged > 0 drinks"
          riskLevel="High"
          recommendedSpecialty="Hepatologist/De-addiction Specialist"
          title={t('habits.alcoholConsultTitle', 'De-addiction Support')}
          description={t('habits.alcoholConsultDesc', 'Regular alcohol consumption affects cellular repair and liver health. We provide confidential support to help you reduce intake.')}
          colorTheme="rose"
          onBookAppointment={onBookAppointment!}
        />
      )}
    </div>
  );
};
