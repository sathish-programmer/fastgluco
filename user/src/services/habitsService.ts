export interface HabitLog {
  id: string;
  userId: string;
  type: string;
  value: any;
  timestamp: string;
}

export const HabitsService = {
  logHabit: async (apiUrl: string, token: string, type: string, value: any): Promise<void> => {
    const res = await fetch(`${apiUrl}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, value, timestamp: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Failed to log habit');
  },

  getRecentHabits: async (apiUrl: string, token: string, type: string, days: number = 7): Promise<HabitLog[]> => {
    const res = await fetch(`${apiUrl}/habits?type=${type}&days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch habits');
    const data = await res.json();
    return data.map((d: any) => ({ ...d, id: d._id }));
  },
  
  deleteHabit: async (apiUrl: string, token: string, id: string): Promise<void> => {
    const res = await fetch(`${apiUrl}/habits/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete habit');
  }
};
