import React, { useState } from 'react';
import { HeartHandshake, Calendar, Cloud, CheckCircle2, Loader2, History, X, Trash2, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/** Colour scale used everywhere a 0-100% score is shown */
export function pctColor(pct: number): string {
  if (pct >= 70) return '#10B981'; // Emerald
  if (pct >= 40) return '#F59E0B'; // Amber
  return '#EF4444'; // Rose
}

/** Colour scale for a raw 1-10 severity value where 10 = worst */
export function severityColor(v: number): string {
  if (v <= 3) return '#10B981'; // Emerald (Low/Calm)
  if (v <= 6) return '#F59E0B'; // Amber (Moderate)
  return '#EF4444'; // Rose (High/Severe)
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs transition-all ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, color, icon: Icon }: { children: React.ReactNode; color?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200" style={{ color: color || undefined }}>
        {children}
      </h2>
    </div>
  );
}

/** Yes/No toggle with premium pill styling */
export function YesNoToggle({
  label,
  value,
  onChange,
  goodAnswer = true,
  sublabel
}: {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
  goodAnswer?: boolean;
  sublabel?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        {sublabel && <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            value === true
              ? goodAnswer === true
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                : 'bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          {t('common.yes', 'Yes')}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            value === false
              ? goodAnswer === false
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs shadow-emerald-500/20'
                : 'bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          {t('common.no', 'No')}
        </button>
      </div>
    </div>
  );
}

export function ScoreBadge({ pct }: { pct: number }) {
  const color = pctColor(pct);
  return (
    <span
      className="text-xs font-black px-2.5 py-1 rounded-full border shadow-xs"
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`
      }}
    >
      {Math.round(pct)}%
    </span>
  );
}

export function ModeTabs({
  modes,
  active,
  onChange
}: {
  modes: string[];
  active: string;
  onChange: (m: string) => void;
}) {
  const { t } = useLanguage();
  const getModeLabel = (m: string) => {
    if (m === 'Prevention') return t('modes.preventionShort', 'Prevention');
    if (m === 'Treatment') return t('modes.treatmentShort', 'Treatment');
    if (m === 'Secondary Prevention' || m === 'Recurrence') return t('modes.secondaryPreventionShort', 'Recurrence Care');
    return m;
  };
  return (
    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0,1fr))` }}>
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`py-2 px-3 rounded-2xl text-xs font-black border transition-all cursor-pointer text-center ${
            active === m
              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
          }`}
        >
          {getModeLabel(m)}
        </button>
      ))}
    </div>
  );
}

export function Slider1to10({
  label,
  value,
  onChange,
  worstLabel,
  bestLabel
}: {
  label: string;
  value?: number;
  onChange: (val: number) => void;
  worstLabel?: string;
  bestLabel?: string;
}) {
  const { t } = useLanguage();
  const v = value ?? 1;
  const col = severityColor(v);
  const best = bestLabel || t('habits.minimal', 'Minimal');
  const worst = worstLabel || t('habits.severe', 'Severe');
  return (
    <div className="py-2">
      <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
        <span className="text-slate-800 dark:text-slate-200">{label}</span>
        <span className="font-black px-2 py-0.5 rounded-md text-[11px]" style={{ color: col, backgroundColor: `${col}15` }}>
          {v}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
        <span>1 · {best}</span>
        <span>10 · {worst}</span>
      </div>
    </div>
  );
}

export function StressTracker({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const { t } = useLanguage();
  const v = value ?? 5;
  const col = severityColor(v);
  return (
    <div className="py-2">
      <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
        <span className="text-slate-800 dark:text-slate-200">{t('habits.stressLevelToday', 'Stress level today')}</span>
        <span className="font-black px-2 py-0.5 rounded-md text-[11px]" style={{ color: col, backgroundColor: `${col}15` }}>
          {v}/10
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
        <span>1 · {t('habits.calmRelaxed', 'Calm / Relaxed')}</span>
        <span>10 · {t('habits.overwhelmed', 'Overwhelmed')}</span>
      </div>
      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 leading-snug">
        🫁 <span className="font-bold text-slate-700 dark:text-slate-300">{t('stress.breathTipLabel', 'Count your breath:')}</span> {t('stress.breathTipDetail', 'If your inhalations are more than 12 per minute, you need to calm down and do a breathing exercise.')}
      </p>
    </div>
  );
}

export function TalkToDoctorCard({
  specialty,
  note,
  onBook
}: {
  specialty: string;
  note: string;
  onBook?: () => void;
}) {
  const { t } = useLanguage();
  const handleBookClick = () => {
    sessionStorage.setItem('mito_target_specialty', specialty);
    if (onBook) {
      onBook();
    } else {
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Book Appointment' }));
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-3xl p-5 shadow-xs transition-all">
      <div className="flex gap-3.5 items-start">
        <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1.5">
            <p className="text-xs font-black text-blue-950 dark:text-blue-200">
              {t('appointment.consultSpecialist', { specialty }, `Consult Your ${specialty}`)}
            </p>
            <button
              type="button"
              onClick={handleBookClick}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('appointment.bookAppointment', 'Book Appointment')}</span>
            </button>
          </div>
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {note}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2">
            {t('disclaimer.lifestyleSupportNote', 'This tracker supports your daily lifestyle habits and does not replace professional clinical diagnosis.')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ConditionSaveButton({
  onSave,
  isSaving,
  lastSaved,
  saveButtonText,
  onViewHistory,
  historyCount = 0
}: {
  onSave: () => Promise<void> | void;
  isSaving: boolean;
  lastSaved?: Date | null;
  saveButtonText?: string;
  onViewHistory?: () => void;
  historyCount?: number;
}) {
  const { t } = useLanguage();
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveClick = async () => {
    if (isSaving) return;
    await onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
          justSaved 
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
        }`}>
          {justSaved ? <CheckCircle2 className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
        </div>
        <div>
          <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
            {justSaved ? t('common.savedToCloud', 'Saved to Cloud') : t('common.syncNotice', 'Cloud Sync Enabled')}
          </p>
          <p className="text-[10.5px]">
            {lastSaved 
              ? `${t('common.lastSaved', 'Last saved')}: ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : t('common.cloudSyncHint', 'Data automatically syncs across your web & mobile app')
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>{t('common.history', 'History')}</span>
            {historyCount > 0 && (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            justSaved
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t('common.saving', 'Saving...')}</span>
            </>
          ) : justSaved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>{t('common.saved', 'Saved!')}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>{saveButtonText || t('common.saveEntry', "Save Today's Entry")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ConditionHistoryModal({
  title,
  isOpen,
  onClose,
  logs,
  onDelete,
  renderLogDetails,
  activeLocale = 'en-US'
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  logs: any[];
  onDelete?: (id: string) => Promise<void> | void;
  renderLogDetails: (logValue: any) => React.ReactNode;
  activeLocale?: string;
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-[10.5px] text-slate-400">{t('protocols.totalEntries', { count: logs.length }, `${logs.length} logged records`)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <p>{t('protocols.noHistoryLogs', 'No previous records found.')}</p>
              <p className="text-[11px] mt-1">{t('protocols.startLoggingHint', 'Log your daily values to track progress over time.')}</p>
            </div>
          ) : (
            logs.map((log) => {
              const logDate = new Date(log.timestamp || log.createdAt);
              return (
                <div
                  key={log.id || log._id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        {logDate.toLocaleDateString(activeLocale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(log.id || log._id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    {renderLogDetails(log.value)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
