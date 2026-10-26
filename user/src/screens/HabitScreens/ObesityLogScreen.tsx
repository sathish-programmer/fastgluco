import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Scale, Trash2 } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';
import { HabitsService, type HabitLog } from '../../services/habitsService';

interface ObesityLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
  initialFilter?: '7' | '30' | '365';
}

export const ObesityLogScreen: React.FC<ObesityLogScreenProps> = ({ onBack, onBookAppointment, initialFilter }) => {
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

  const [height, setHeight] = useState<string>(user?.height ? String(user.height) : '');
  const [weight, setWeight] = useState<string>(user?.weight ? String(user.weight) : '');
  const [difficultyLosing, setDifficultyLosing] = useState<boolean | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'7' | '30' | '365'>(initialFilter || '7');
  const [history, setHistory] = useState<HabitLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'Obesity', days);
      setHistory(logs || []);
      if (logs && logs.length > 0) {
        const latest = logs[0];
        if (latest.value) {
          if (latest.value.height && !height) setHeight(String(latest.value.height));
          if (latest.value.weight && !weight) setWeight(String(latest.value.weight));
          if (latest.value.difficultyLosing !== undefined) setDifficultyLosing(latest.value.difficultyLosing);
        }
      }
    } catch (err) {
      console.error('Failed to load obesity history', err);
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
      console.error('Failed to delete obesity log', err);
    }
  };

  const handleSaveObesity = async (diff: boolean | null = difficultyLosing) => {
    if (!user?.id) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const calculatedBmi = (!isNaN(h) && !isNaN(w) && h > 0) ? (w / Math.pow(h / 100, 2)).toFixed(1) : null;
    if (!calculatedBmi) return;

    const bmiNum = parseFloat(calculatedBmi);
    const isRisk = bmiNum >= 25 || diff === true;
    setSaving(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'Obesity', {
        height: h,
        weight: w,
        bmi: calculatedBmi,
        difficultyLosing: diff,
        score: isRisk ? -1 : 0
      });
      await loadHistory();
    } catch (err) {
      console.error('Failed to save obesity habit', err);
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && !isNaN(w) && h > 0) {
      return (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  let bmiCategory = '';
  let catColor = '';
  
  if (bmi) {
    const val = parseFloat(bmi);
    if (val < 18.5) { bmiCategory = t('underweight'); catColor = 'text-sky-500'; }
    else if (val >= 18.5 && val <= 24.9) { bmiCategory = t('optimalBmi'); catColor = 'text-emerald-500'; }
    else if (val >= 25 && val <= 29.9) { bmiCategory = t('overweight'); catColor = 'text-amber-500'; }
    else { bmiCategory = t('obese'); catColor = 'text-rose-500'; }
  }

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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('obesity.damageBreadcrumb', 'Damage · Obesity')}</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">{t('obesity.obesityTracker', 'Obesity Tracker')}</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2"><Scale className="h-4 w-4" /> {t('obesity.knowYourBmi', 'Know your BMI')}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t('obesity.knowYourBmiDesc', 'Body Mass Index helps assess healthy weight range relative to height. Chronic obesity accelerates cellular ageing and raises cancer risk.')}
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">{t('obesity.bmiCalculator', 'BMI Calculator')}</span>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('obesity.heightCm', 'Height (cm)')}</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 165"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('obesity.weightKg', 'Weight (kg)')}</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
            />
          </div>
        </div>

        {bmi && (
          <div className="bg-slate-50 rounded-2xl p-5 text-center mb-8 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('obesity.yourBmi', 'Your BMI')}</div>
            <div className="text-4xl font-bold text-slate-800 font-mono tracking-tight">{bmi}</div>
            <div className={`text-sm font-bold mt-1 ${catColor}`}>{bmiCategory}</div>
          </div>
        )}

        {bmi && (
          <div className="pt-6 border-t border-slate-100">
            <p className="font-semibold text-slate-800 text-sm mb-4">{t('obesity.difficultyLosingWeight', 'Do you face difficulty in losing weight despite effort?')}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setDifficultyLosing(true);
                  handleSaveObesity(true);
                }}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${difficultyLosing === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {t('common.yes', 'Yes')}
              </button>
              <button 
                onClick={() => {
                  setDifficultyLosing(false);
                  handleSaveObesity(false);
                }}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${difficultyLosing === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {t('common.no', 'No')}
              </button>
            </div>

            {difficultyLosing === true && (
              <ConsultationBanner
                sourceModule="Obesity"
                reason="Endocrinologist Consultation"
                triggerCondition="Has difficulty losing weight"
                riskLevel="High"
                recommendedSpecialty="Endocrinologist"
                title={t('recommendationTitle')}
                description={t('obesity.endocrinologistDesc', 'We suggest consulting an endocrinologist to rule out any hormonal imbalances.')}
                colorTheme="amber"
                onBookAppointment={onBookAppointment!}
              />
            )}

            {difficultyLosing === false && (
              <ConsultationBanner
                sourceModule="Obesity"
                reason="Endocrinologist Consultation"
                triggerCondition="Tracking weekly weight"
                riskLevel="Low"
                recommendedSpecialty="Endocrinologist"
                title={t('common.great', 'Great!')}
                description={t('obesity.weeklyWeightDesc', 'Please log your weekly weight in the app until your target weight is achieved. If a decrease is not happening over time, click below:')}
                colorTheme="emerald"
                onBookAppointment={onBookAppointment!}
              />
            )}
          </div>
        )}

        {bmi && (
          <div className="mt-4">
            <button
              onClick={() => handleSaveObesity(difficultyLosing)}
              disabled={saving}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-sm transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? t('common.saving', 'Saving...') : t('obesity.saveLog', 'Save Weight & BMI Log')}
            </button>
          </div>
        )}
      </div>

      {/* Obesity History Section */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
            {historyFilter === '365'
              ? t('obesity.recentHistory365', 'BMI History (1 Year)')
              : historyFilter === '30'
              ? t('obesity.recentHistory30', 'BMI History (30 Days)')
              : t('obesity.recentHistory', 'BMI History (7 Days)')}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setHistoryFilter('7')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                historyFilter === '7'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
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
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
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
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              1Y
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400">{t('common.loading', 'Loading history...')}</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            {t('obesity.noHistoryYet', 'No BMI logs yet. Calculate and save above!')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => {
              const val = h.value || {};
              const bmiVal = val.bmi ? parseFloat(val.bmi) : null;
              const isOverweight = (bmiVal !== null && bmiVal >= 25) || val.difficultyLosing === true;

              return (
                <div key={h.id || (h as any)._id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm ${isOverweight ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">
                        BMI: {val.bmi || 'Logged'} {val.weight ? `· ${val.weight} kg` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(h.timestamp || (h as any).createdAt).toLocaleDateString(activeLocale, { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(h.timestamp || (h as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverweight ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        Risk -1
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Optimal
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
    </div>
  );
};
