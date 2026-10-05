import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Clock, Calendar, ExternalLink, RotateCcw, Stethoscope, ChevronRight, ShieldAlert } from 'lucide-react';
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

export const getNextCheckinDueDate = (): { nextDue: Date | null; isDue: boolean } => {
  const history = getStoredSymptomCheckins();
  if (!history.length) return { nextDue: null, isDue: true };
  const last = history[history.length - 1];
  const due = new Date(last.date);
  due.setDate(due.getDate() + INTERVAL_DAYS);
  return { nextDue: due, isDue: due <= new Date() };
};

interface SymptomCheckinScreenProps {
  onBack: () => void;
  onBookAppointment?: (recommendationId?: string) => void;
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
      className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-24 font-sans text-slate-800 dark:text-slate-100"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* HEADER - MATCHES APP HABIT SCREENS */}
      <div className="flex items-center justify-between gap-4 mb-2 sub-page-internal-header px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.2em] uppercase flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-emerald-500" /> {t('symptomCheck.tagline', 'Early Warning · Prevention')}
            </span>
            <h2 className="text-2xl font-sans font-bold text-slate-800 dark:text-slate-50 leading-none mt-1">
              {t('symptomCheck.title', '3-Weekly Symptom Check-in')}
            </h2>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border shrink-0 ${
          isDue 
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50'
        }`}>
          {isDue ? t('dashboard.dueNow', 'Due Now') : t('dashboard.activeCheck', 'Active')}
        </span>
      </div>

      {/* Due / Interval Banner */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs p-4 rounded-2xl font-semibold flex items-center gap-2.5">
        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          {!history.length ? (
            <span>{t('symptomCheck.dueFirst', 'First check-in. Your next reminder will be set 3 weeks after you finish.')}</span>
          ) : isDue ? (
            <span className="font-bold text-amber-700 dark:text-amber-300">
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
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
            result.score === 0 
              ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-900/40' 
              : 'bg-white dark:bg-slate-900 border-rose-200/80 dark:border-rose-900/40'
          }`}>
            {result.score === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs p-4 rounded-2xl font-bold flex items-center gap-3">
                <Award className="h-6 w-6 shrink-0 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100">
                    {t('symptomCheck.scoreZero', 'Score 0 of 11: All Clear')}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-normal mt-0.5">
                    {t('symptomCheck.msgZero', "No symptoms reported. We'll remind you again in 3 weeks.")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-xs p-4 rounded-2xl font-bold flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-100">
                    {result.red || result.score >= 2 
                      ? t('symptomCheck.scoreDoctorSoon', { score: result.score }, 'Score {{score}} of 11: Please see a doctor soon')
                      : t('symptomCheck.scoreWatching', 'Score 1 of 11: Keep watching')
                    }
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-normal mt-0.5 leading-relaxed">
                    {result.red || result.score >= 2 
                      ? t('symptomCheck.msgDoctorSoon', "Book a clinic visit within the next week or two, and tell the doctor how long each symptom has been present.")
                      : t('symptomCheck.msgWatching', "If this symptom is still there at your next check-in, or gets worse, see a doctor.")
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Reported Symptoms Breakdown */}
            {result.score > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2.5">
                    {t('symptomCheck.reportedSymptoms', 'Reported symptoms lasting over 3 weeks')}
                  </p>
                  <div className="space-y-2">
                    {result.yesItems.map((q) => (
                      <div key={q.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{q.t}</span>
                        </div>
                        {q.red === 1 && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded shrink-0">
                            Priority Review
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Specialists */}
                {result.specialties.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                      {t('symptomCheck.suggestedSpecialists', 'Suggested Specialist(s)')}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {result.specialties.join(' · ')}
                    </p>
                  </div>
                )}

                {/* Primary Consultation Action Callout */}
                <div className="pt-2 space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-center">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      {t('symptomCheck.yesWarning', 'If Yes to any symptom, consult a specialist for thorough clinical evaluation.')}
                    </p>
                  </div>

                  <button
                    onClick={handleConsultSpecialist}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('symptomCheck.consultSpecialist', 'Consult Specialist (HCG Virtual / Hospital)')}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  {onBookAppointment && (
                    <button
                      onClick={() => onBookAppointment('symptom_checkin')}
                      className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('symptomCheck.bookApptInApp', 'Book Doctor Consultation in App')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Restart Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('symptomCheck.startNew', 'Start a new check-in')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN QUESTIONNAIRE CARD - MATCHES KITCHEN SAFETY QUESTIONS LAYOUT */
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Card Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {t('symptomCheck.cardHeaderTag', 'Clinical Red Flag & Early Detection')}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {t('symptomCheck.cardHeaderTitle', '11 Early Warning Symptom Questions')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t('symptomCheck.subtitle', 'Answer Yes or No for the last 3 weeks. It takes about a minute.')}
            </p>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {SYMPTOM_QUESTIONS.map((q, idx) => {
              const currentAnswer = answers[q.id];
              return (
                <div key={q.id} className={idx > 0 ? "pt-5 border-t border-slate-100 dark:border-slate-800" : ""}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Question {idx + 1}
                    </p>
                    {q.red === 1 && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40 px-2 py-0.5 rounded">
                        Key Sign
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 leading-relaxed mb-1">
                    {idx + 1}. {q.t}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
                    {q.h}
                  </p>

                  {/* Option Buttons */}
                  <div className="flex gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(q.id, 'no')}
                      className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer min-h-[44px] flex items-center justify-center ${
                        currentAnswer === 'no'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      No
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectOption(q.id, 'yes')}
                      className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer min-h-[44px] flex items-center justify-center ${
                        currentAnswer === 'yes'
                          ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      Yes
                    </button>

                    {q.na && (
                      <button
                        type="button"
                        onClick={() => handleSelectOption(q.id, 'na')}
                        className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs transition-all border cursor-pointer min-h-[44px] flex items-center justify-center ${
                          currentAnswer === 'na'
                            ? 'bg-slate-600 border-slate-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        Not applicable
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isComplete}
              className={`w-full py-4 px-5 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-sm ${
                isComplete
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('symptomCheck.pastCheckins', 'Past check-ins')}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history
              .slice()
              .reverse()
              .slice(0, 6)
              .map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {formatDate(item.date)}
                  </span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    item.score === 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
                  }`}>
                    {item.score} of 11
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Clinical Disclaimer Note */}
      <p className="text-[11px] text-slate-400 leading-relaxed px-2 text-center">
        {t('symptomCheck.disclaimer', "This check-in is a screening reminder, not a diagnosis. Many of these symptoms have common, harmless causes, but any that last more than 3 weeks deserve a doctor's review.")}
      </p>
    </div>
  );
};
