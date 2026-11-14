export interface CheckinHistoryItem {
  date: string;
  score: number;
  yes: string[];
  yesIds?: string[];
  answers?: Record<string, 'yes' | 'no' | 'na'>;
}

const STORAGE_KEY = 'mito_symptom_checkins';
const INTERVAL_DAYS = 21; // 3 weeks

const isSameCalendarDay = (d1: string | Date, d2: string | Date): boolean => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const deduplicateHistory = (items: CheckinHistoryItem[]): CheckinHistoryItem[] => {
  if (!items || items.length <= 1) return items || [];
  const result: CheckinHistoryItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const curr = items[i];
    const prev = result[result.length - 1];
    if (!prev) {
      result.push(curr);
      continue;
    }
    // If on the exact same calendar day, merge/keep the latest one
    if (isSameCalendarDay(prev.date, curr.date)) {
      result[result.length - 1] = curr;
    } else {
      result.push(curr);
    }
  }
  return result;
};

export const getStoredSymptomCheckins = (): CheckinHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const deduped = deduplicateHistory(parsed);
    if (deduped.length !== parsed.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      } catch {}
    }
    return deduped;
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
