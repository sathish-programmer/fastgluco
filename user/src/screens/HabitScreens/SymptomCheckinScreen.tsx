import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, Calendar, ExternalLink, RefreshCw, Stethoscope, ChevronRight, ShieldAlert } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { HabitsService } from '../../services/habitsService';
import { HCG_HOSPITALS_URL } from './CancerScreeningScreen';

export interface SymptomQuestion {
  id: string;
  t: string;
  h: string;
  red: number;
  na?: boolean;
}

export const SYMPTOM_QUESTIONS: SymptomQuestion[] = [
  { id: "wt", t: "Unexplained weight loss", h: "Losing weight without trying (diet or exercise)", red: 0 },
  { id: "ap", t: "Loss of appetite", h: "Not feeling hungry or full after a few bites", red: 0 },
  { id: "vo", t: "Change in voice", h: "Hoarseness or a changed voice that doesn't clear up", red: 0 },
  { id: "ea", t: "Difficulty in eating or swallowing", h: "Food sticking, pain or trouble swallowing", red: 1 },
  { id: "ga", t: "Repeated gastritis or indigestion", h: "Burning, acidity or upper-stomach discomfort that keeps returning", red: 0 },
  { id: "mo", t: "Ulcer or growth in the mouth", h: "A sore, white/red patch or lump that hasn't healed in 3 weeks", red: 1 },
  { id: "bl", t: "Blood in stool", h: "Red or black stools", red: 1 },
  { id: "bh", t: "Change in bowel habit", h: "New constipation, diarrhoea or a feeling of incomplete emptying", red: 0 },
  { id: "ab", t: "Abdominal fullness", h: "Persistent bloating or a feeling of fullness or swelling", red: 0 },
  { id: "vg", t: "Abnormal bleeding or vaginal discharge", h: "Bleeding between periods, after sex or after menopause; unusual discharge", red: 1, na: true },
  { id: "br", t: "Lump in the breast", h: "A new lump, thickening or change in the breast or underarm", red: 1, na: true }
];

export const SPECIALIST_MAP: Record<string, string> = {
  wt: "General physician or oncologist",
  ap: "General physician or oncologist",
  vo: "ENT / head and neck specialist",
  ea: "Gastroenterologist or ENT specialist",
  ga: "Gastroenterologist",
  mo: "Oral or head and neck oncologist",
  bl: "Gastroenterologist or colorectal specialist",
  bh: "Gastroenterologist or colorectal specialist",
  ab: "Gastroenterologist",
  vg: "Gynaecologist",
  br: "Breast specialist"
};

export interface CheckinHistoryItem {
  date: string;
  score: number;
  yes: string[];
}

const STORAGE_KEY = "symptomCheckins";
const INTERVAL_DAYS = 21; // 3 weeks

export const getStoredSymptomCheckins = (): CheckinHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getNextCheckinDueDate = (): { nextDue: Date | null; isDue: boolean; lastItem: CheckinHistoryItem | null } => {
  const history = getStoredSymptomCheckins();
  if (!history.length) return { nextDue: null, isDue: true, lastItem: null };
  const last = history[history.length - 1];
  const due = new Date(last.date);
  due.setDate(due.getDate() + INTERVAL_DAYS);
  return { nextDue: due, isDue: due <= new Date(), lastItem: last };
};

interface SymptomCheckinScreenProps {
  onBack: () => void;
  onBookAppointment?: () => void;
}

export const SymptomCheckinScreen: React.FC<SymptomCheckinScreenProps> = ({ onBack, onBookAppointment }) => {
  const { apiUrl, token } = useAuth();
  const { t } = useLanguage();

  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | 'na'>>({});
  const [history, setHistory] = useState<CheckinHistoryItem[]>([]);
  const [result, setResult] = useState<{
    score: number;
    red: boolean;
    yesItems: SymptomQuestion[];
    specialties: string[];
  } | null>(null);

  useEffect(() => {
    const loaded = getStoredSymptomCheckins();
    setHistory(loaded);
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const { nextDue, isDue } = getNextCheckinDueDate();

  const handleSelectOption = (questionId: string, val: 'yes' | 'no' | 'na') => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const isComplete = SYMPTOM_QUESTIONS.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    const yesQuestions = SYMPTOM_QUESTIONS.filter(q => answers[q.id] === 'yes');
    const score = yesQuestions.length;
    const hasRedFlag = yesQuestions.some(q => q.red === 1);

    const specs: string[] = [];
    yesQuestions.forEach(q => {
      const sp = SPECIALIST_MAP[q.id];
      if (sp && !specs.includes(sp)) {
        specs.push(sp);
      }
    });

    const newRecord: CheckinHistoryItem = {
      date: new Date().toISOString(),
      score,
      yes: yesQuestions.map(q => q.t)
    };

    const updated = [...history, newRecord];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
    setHistory(updated);

    setResult({
      score,
      red: hasRedFlag,
      yesItems: yesQuestions,
      specialties: specs
    });

    // Optionally sync with backend habits
    if (apiUrl && token) {
      try {
        await HabitsService.logHabit(apiUrl, token, 'SymptomCheckin', {
          score,
          redFlag: hasRedFlag,
          symptoms: yesQuestions.map(q => q.t),
          answers
        });
      } catch (err) {
        console.warn('Failed to sync symptom checkin with backend', err);
      }
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConsultSpecialist = async () => {
    try {
      await Browser.open({ url: HCG_HOSPITALS_URL });
    } catch {
      window.open(HCG_HOSPITALS_URL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="pb-28 pt-6 px-4 max-w-2xl mx-auto min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-5">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.14em] uppercase">
            {t('symptomCheck.tagline', 'Early Warning · Prevention')}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 leading-tight">
            {t('symptomCheck.title', 'Your 3-weekly symptom check-in')}
          </h1>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('symptomCheck.subtitle', 'Answer Yes or No for the last 3 weeks. It takes about a minute.')}
      </p>

      {/* Due / Interval Status Box */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3.5 mb-5 flex items-start gap-3">
        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          {!history.length ? (
            <span>{t('symptomCheck.dueFirst', 'First check-in. Your next reminder will be set 3 weeks after you finish.')}</span>
          ) : isDue ? (
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {t('symptomCheck.dueLate', { date: nextDue ? formatDate(nextDue.toISOString()) : '' }, 'Your check-in was due on {{date}}. Please complete it now.')}
            </span>
          ) : (
            <span>
              {t('symptomCheck.dueNext', { date: nextDue ? formatDate(nextDue.toISOString()) : '' }, 'Next check-in due {{date}}.')}
            </span>
          )}
        </div>
      </div>

      {/* RESULT VIEW */}
      {result ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${
            result.score === 0 
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-start gap-3.5">
              {result.score === 0 ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {result.score === 0 
                    ? t('symptomCheck.scoreZero', 'Score 0 of 11')
                    : result.red || result.score >= 2 
                      ? t('symptomCheck.scoreDoctorSoon', { score: result.score }, 'Score {{score}} of 11: please see a doctor soon')
                      : t('symptomCheck.scoreWatching', 'Score 1 of 11: keep watching')
                  }
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {result.score === 0 
                    ? t('symptomCheck.msgZero', "No symptoms reported. We'll remind you again in 3 weeks.")
                    : result.red || result.score >= 2
                      ? t('symptomCheck.msgDoctorSoon', "Book a clinic visit within the next week or two, and tell the doctor how long each symptom has been present.")
                      : t('symptomCheck.msgWatching', "If this symptom is still there at your next check-in, or gets worse, see a doctor.")
                  }
                </p>
              </div>
            </div>

            {/* List of reported symptoms */}
            {result.score > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t('symptomCheck.reportedSymptoms', 'Reported symptoms lasting over 3 weeks:')}</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  {result.yesItems.map((q) => (
                    <li key={q.id} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium">{q.t}</span>
                      {q.red === 1 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded ml-1">
                          Priority Review
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Suggested Specialists */}
                {result.specialties.length > 0 && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      {t('symptomCheck.suggestedSpecialists', 'Suggested Specialist(s)')}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {result.specialties.join(' · ')}
                    </p>
                  </div>
                )}

                {/* Call to action: Consult Specialist */}
                <div className="mt-5 space-y-2.5">
                  <div className="p-3 bg-rose-600/10 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-center">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      {t('symptomCheck.yesWarning', 'If Yes to any symptom, consult a specialist for thorough clinical evaluation.')}
                    </p>
                  </div>

                  <button
                    onClick={handleConsultSpecialist}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('symptomCheck.consultSpecialist', 'Consult Specialist (HCG Virtual / Hospital)')}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  {onBookAppointment && (
                    <button
                      onClick={onBookAppointment}
                      className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('symptomCheck.bookApptInApp', 'Book Doctor Consultation in App')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Restart button */}
            <div className="mt-5 pt-3 flex justify-center">
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('symptomCheck.startNew', 'Start a new check-in')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* QUESTION FORM */
        <div className="space-y-3">
          {SYMPTOM_QUESTIONS.map((q, idx) => {
            const currentAnswer = answers[q.id];
            return (
              <div 
                key={q.id}
                className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs transition-colors"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-sm sm:text-base font-bold font-serif text-slate-900 dark:text-slate-100">
                    <span className="text-slate-400 font-sans text-xs mr-1.5 font-normal">{idx + 1}.</span>
                    {q.t}
                  </h3>
                  {q.red === 1 && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/40 dark:border-amber-900/40 shrink-0">
                      Key Sign
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {q.h}
                </p>

                {/* Option Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOption(q.id, 'no')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-h-[44px] flex items-center justify-center ${
                      currentAnswer === 'no'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    No
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOption(q.id, 'yes')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-h-[44px] flex items-center justify-center ${
                      currentAnswer === 'yes'
                        ? 'bg-[#b4531a] border-[#b4531a] text-white shadow-xs'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    Yes
                  </button>

                  {q.na && (
                    <button
                      type="button"
                      onClick={() => handleSelectOption(q.id, 'na')}
                      className={`flex-1 py-2.5 px-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer min-h-[44px] flex items-center justify-center ${
                        currentAnswer === 'na'
                          ? 'bg-slate-700 border-slate-700 text-white shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      Not applicable
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={!isComplete}
              className={`w-full py-4 px-5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                isComplete
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer active:scale-[0.99]'
                  : 'bg-emerald-800/40 text-emerald-200/50 cursor-not-allowed border border-emerald-900/20'
              }`}
            >
              <span>{t('symptomCheck.seeScore', 'See my score')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Past Check-ins History */}
      {history.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('symptomCheck.pastCheckins', 'Past check-ins')}</span>
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3.5">
            {history
              .slice()
              .reverse()
              .slice(0, 6)
              .map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {formatDate(item.date)}
                  </span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                    item.score === 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                  }`}>
                    {item.score} of 11 {item.score > 0 ? 'symptoms' : 'symptoms'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Disclaimer Note */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-6 leading-relaxed bg-slate-100/60 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60">
        {t('symptomCheck.disclaimer', "This check-in is a screening reminder, not a diagnosis. Many of these symptoms have common, harmless causes, but any that last more than 3 weeks deserve a doctor's review.")}
      </p>
    </div>
  );
};
