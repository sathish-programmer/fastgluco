export interface OfflineMeal {
  id?: string;
  name: string;
  category: string;
  mealType: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  quantity: number;
  unit: string;
  loggedAt: string;
}

export class SyncService {
  private static STORAGE_KEY = 'fastgluco_offline_meals';

  /**
   * Save a meal either online or offline depending on internet state
   */
  public static async logMeal(meal: Omit<OfflineMeal, 'id'>, token: string, apiUrl: string): Promise<{ success: boolean; offline: boolean; data?: any }> {
    if (!navigator.onLine) {
      this.enqueueOffline(meal);
      return { success: true, offline: true };
    }

    try {
      const response = await fetch(`${apiUrl}/food-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meal)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, offline: false, data: data.log };
      }
      
      // Fallback to offline queue if server is unreachable
      this.enqueueOffline(meal);
      return { success: true, offline: true };
    } catch (error) {
      console.warn('Network request failed, queuing meal offline:', error);
      this.enqueueOffline(meal);
      return { success: true, offline: true };
    }
  }

  /**
   * Try to sync all queued offline meals to the server
   */
  public static async syncOfflineQueue(token: string, apiUrl: string): Promise<number> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    console.log(`Attempting to sync ${queue.length} offline meals...`);
    let syncedCount = 0;
    const remainingQueue: OfflineMeal[] = [];

    for (const meal of queue) {
      try {
        const response = await fetch(`${apiUrl}/food-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(meal)
        });

        if (response.ok) {
          syncedCount++;
        } else {
          remainingQueue.push(meal);
        }
      } catch (error) {
        console.error('Failed to sync meal:', error);
        remainingQueue.push(meal);
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remainingQueue));
    return syncedCount;
  }

  /**
   * Fetch all queued offline meals
   */
  public static getOfflineQueue(): OfflineMeal[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  /**
   * Push meal onto the offline queue
   */
  private static enqueueOffline(meal: Omit<OfflineMeal, 'id'>) {
    const queue = this.getOfflineQueue();
    const newMeal: OfflineMeal = {
      ...meal,
      id: 'offline-' + Date.now() + '-' + Math.round(Math.random() * 1000)
    };
    queue.push(newMeal);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    console.log('Meal enqueued offline:', newMeal);
  }
}
