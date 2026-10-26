import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Check, Minus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
 
interface SubstancesLogScreenProps {
  onBack: () => void;
  initialFilter?: '7' | '30' | '365';
}
 
export const SubstancesLogScreen: React.FC<SubstancesLogScreenProps> = ({ onBack, initialFilter = '7' }) => {
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

  const [loading, setLoading] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState<boolean>(false);
  const [deaddictionNumber, setDeaddictionNumber] = useState<string>('1800-11-0031');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (initialFilter) {
      setHistoryFilter(initialFilter);
    }
  }, [initialFilter]);

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

  useEffect(() => {
    if (user?.id) loadHistory(Number(historyFilter));
  }, [user, historyFilter]);

  const loadHistory = async (days = Number(historyFilter)) => {
    if (!user?.id) return;
    try {
      setLoadingHistory(true);
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Substances', days);
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

  const handleLog = async (used: boolean) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Substances', { used });
      await loadHistory();
      if (used) {
        setShowSupportPopup(true);
      }
    } catch (err) {
      console.error('Failed to log substances', err);
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
          disabled={loading}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('substancesHeader', 'Damage · Substances')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">{t('noJudgmentHere', 'No judgment here')}</h2>
        </div>
      </div>

      <div className="bg-white border border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.04)] rounded-2xl p-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10"></div>
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></span>
          {t('privateConfidential', 'Private & confidential')}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed relative z-10">
          {t('substancesPrivacyDesc', 'This helps us point you to the right support. Nothing leaves your device without your consent.')}
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6 text-center">
          {t('substancesQuestion', 'Used any recreational or non-prescribed substances recently?')}
        </span>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => handleLog(true)}
            disabled={loading}
            className="py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition-all disabled:opacity-50"
          >
            {t('common.yes', 'Yes')}
          </button>
          <button 
            onClick={() => handleLog(false)}
            disabled={loading}
            className="py-3.5 rounded-xl font-bold text-slate-800 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50"
          >
            {t('common.no', 'No')}
          </button>
        </div>

        {/* Deaddiction Support Helpline Card */}
        <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">{t('deaddictionHelpline', 'National Tele-Mental Health & De-addiction Helpline')}</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {t('needHelpSupport', 'Need free, confidential de-addiction support?')}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded-lg">
                📞 {deaddictionNumber}
              </span>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                ({t('callNationalHelpline', 'Toll-Free, 24/7 Helpline')})
              </span>
            </div>
          </div>
          <a
            href={`tel:${deaddictionNumber.replace(/-/g, '')}`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
          >
            {t('common.call', 'Call Now')}
          </a>
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
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
            {history.map((h) => {
              const used = h.value?.used === true;
              return (
                <div key={h.id || (h as any)._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${used ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {used ? '⚠️' : '✅'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">
                        {used ? t('substancesUsed', 'Substance exposure logged') : t('substancesFree', 'Substance free')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(h.timestamp).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric' })} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {used ? <Minus className="h-4 w-4 text-rose-500" /> : <Check className="h-4 w-4 text-emerald-500" />}
                    <button onClick={() => handleDelete(h.id || (h as any)._id)} className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEADDICTION HELPLINE POPUP */}
      {showSupportPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-2">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('deaddictionHelpline', 'Deaddiction Support')}</h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              {t('needHelpSupport', 'If you or a loved one needs guidance or confidential assistance, please reach out to a certified Deaddiction Specialist.')}
            </p>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t('callNationalHelpline', 'National Helpline')}</span>
              <span className="text-sm font-black text-slate-850">{deaddictionNumber}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Toll-Free · 24/7 Helpline</span>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href={`tel:${deaddictionNumber.replace(/-/g, '')}`}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center block"
              >
                📞 {t('common.call', 'Call Helpline Now')}
              </a>
              <button 
                onClick={() => {
                  setShowSupportPopup(false);
                  onBack();
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold transition-all text-center"
              >
                {t('common.close', 'Close & Go Back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
