import { CronLock } from '../models/CronLock';

export class CronLockService {
  /**
   * Tries to acquire a distributed lock for a scheduled cron job.
   * Returns true if lock was acquired, false if another instance is already executing this job.
   */
  public static async acquire(jobKey: string, lockDurationMs: number = 45000): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + lockDurationMs);

      // Atomic findOneAndUpdate: only lock if record exists and is expired
      const updated = await CronLock.findOneAndUpdate(
        {
          key: jobKey,
          expiresAt: { $lt: now }
        },
        {
          $set: {
            lockedAt: now,
            expiresAt
          }
        },
        { new: true }
      );

      if (updated) {
        return true;
      }

      // If record does not exist yet, attempt creation (unique constraint prevents races)
      try {
        await CronLock.create({
          key: jobKey,
          lockedAt: now,
          expiresAt
        });
        return true;
      } catch (insertErr: any) {
        if (insertErr.code === 11000) {
          // Another instance created the lock first
          return false;
        }
        throw insertErr;
      }
    } catch (err) {
      // Fail-open: If DB check fails, execute to avoid missing critical reminders
      console.warn(`[CronLock] Warning checking lock for "${jobKey}":`, err);
      return true;
    }
  }
}

