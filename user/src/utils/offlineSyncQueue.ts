import { HabitsService } from '../services/habitsService';

const QUEUE_KEY = 'mito_offline_habit_queue';

interface QueuedHabit {
  id: string;
  type: string;
  value: any;
  timestamp: string;
}

export const getPendingSyncCount = (): number => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const items: QueuedHabit[] = JSON.parse(raw);
    return items.length;
  } catch {
    return 0;
  }
};

export const enqueueOfflineHabit = (type: string, value: any) => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: QueuedHabit[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      value,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[OfflineQueue] Failed to enqueue habit:', err);
  }
};

export const flushOfflineQueue = async (
  apiUrl?: string,
  token?: string
): Promise<number> => {
  if (!navigator.onLine) return 0;

  const resolvedApiUrl = apiUrl || localStorage.getItem('mito_api_url') || 'https://app.mitoreboot.in/api';
  const resolvedToken = token || localStorage.getItem('token') || localStorage.getItem('mito_token') || '';

  if (!resolvedToken) return 0;

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const queue: QueuedHabit[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let successfulSyncs = 0;
    const remaining: QueuedHabit[] = [];

    for (const item of queue) {
      try {
        await HabitsService.logHabit(resolvedApiUrl, resolvedToken, item.type, item.value, item.timestamp);
        successfulSyncs++;
      } catch {
        // Keep in queue to retry on next connectivity event
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(QUEUE_KEY);
    }

    return successfulSyncs;
  } catch {
    return 0;
  }
};

// Auto-register online sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue().catch(() => {});
  });
}
