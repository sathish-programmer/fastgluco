export interface HabitLog {
  id: string;
  userId: string;
  type: string;
  value: any;
  timestamp: string;
}

// In-memory cache with 30s TTL for instant 0ms screen navigation, invalidated on mutation
const habitMemoryCache = new Map<string, { data: HabitLog[]; expiry: number }>();
const CACHE_TTL_MS = 30 * 1000;

export const HabitsService = {
  clearCache: () => {
    habitMemoryCache.clear();
  },

  logHabit: async (apiUrl: string, token: string, type: string, value: any, timestamp?: string): Promise<void> => {
    habitMemoryCache.clear();
    const res = await fetch(`${apiUrl}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, value, timestamp: timestamp || new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Failed to log habit');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habit_logged', { detail: { type, value } }));
    }
  },

  getRecentHabits: async (apiUrl: string, token: string, type: string, days: number = 7, forceRefresh = false): Promise<HabitLog[]> => {
    const cacheKey = `${type}_${days}`;
    const cached = habitMemoryCache.get(cacheKey);
    const now = Date.now();
    if (!forceRefresh && cached && cached.expiry > now) {
      return cached.data;
    }

    const res = await fetch(`${apiUrl}/habits?type=${type}&days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch habits');
    const data = await res.json();
    const mapped = data.map((d: any) => ({ ...d, id: d._id }));
    habitMemoryCache.set(cacheKey, { data: mapped, expiry: now + CACHE_TTL_MS });
    return mapped;
  },
  
  deleteHabit: async (apiUrl: string, token: string, id: string): Promise<void> => {
    habitMemoryCache.clear();
    const res = await fetch(`${apiUrl}/habits/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete habit');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habit_logged', { detail: { id } }));
    }
  }
};
