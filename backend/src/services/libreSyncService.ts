import { User, IUser } from '../models/User';
import { GlucoseReading } from '../models/GlucoseReading';

export class LibreSyncService {
  /**
   * Retrieves the base URL based on the user's selected region.
   */
  private static getBaseUrl(region: string): string {
    const r = (region || 'ap').toLowerCase().trim();
    switch (r) {
      case 'us':
        return 'https://api-us.libreview.io';
      case 'eu':
        return 'https://api-eu.libreview.io';
      case 'de':
        return 'https://api-de.libreview.io';
      case 'fr':
        return 'https://api-fr.libreview.io';
      case 'jp':
        return 'https://api-jp.libreview.io';
      case 'au':
        return 'https://api-au.libreview.io';
      case 'ap':
      default:
        return 'https://api-ap.libreview.io';
    }
  }

  /**
   * Gets the standard headers required for Abbott LLU API calls.
   */
  private static getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Product': 'llu.android',
      'Version': '4.7.0',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; LLU) AppleWebKit/537.36'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Verifies LLU credentials by performing a test login.
   * Returns true if login is successful.
   */
  public static async verifyCredentials(email: string, passwordHash: string, region: string): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl(region);
      const url = `${baseUrl}/llu/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password: passwordHash })
      });
      if (!response.ok) return false;
      const data = await response.json() as any;
      return !!(data?.data?.authTicket?.token);
    } catch (err) {
      console.error('LibreLinkUp login verification failed:', err);
      return false;
    }
  }

  /**
   * Syncs glucose readings for a single user from LibreLinkUp.
   */
  public static async syncUserReadings(user: IUser): Promise<{ success: boolean; count: number; error?: string }> {
    if (!user.libreEmail || !user.librePassword || !user.libreActive) {
      return { success: false, count: 0, error: 'LibreLinkUp not fully configured or active for this user.' };
    }

    try {
      const baseUrl = this.getBaseUrl(user.libreRegion || 'ap');
      
      // 1. Authenticate with LLU API
      const loginUrl = `${baseUrl}/llu/auth/login`;
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email: user.libreEmail, password: user.librePassword })
      });

      if (!loginRes.ok) {
        throw new Error(`Login API responded with status ${loginRes.status}`);
      }

      const loginData = await loginRes.json() as any;
      const token = loginData?.data?.authTicket?.token;
      if (!token) {
        throw new Error('LLU login failed, token not found in response.');
      }

      // 2. Fetch connections (patients sharing data with this caregiver account)
      const connectionsUrl = `${baseUrl}/llu/connections`;
      const connectionsRes = await fetch(connectionsUrl, {
        method: 'GET',
        headers: this.getHeaders(token)
      });
      if (!connectionsRes.ok) {
        throw new Error(`Connections API responded with status ${connectionsRes.status}`);
      }
      
      const connectionsData = await connectionsRes.json() as any;
      const connections = connectionsData?.data || [];

      if (connections.length === 0) {
        return { success: true, count: 0, error: 'No connected patients found in this LibreLinkUp account.' };
      }

      // We will sync measurements from the connections
      let totalInserted = 0;

      for (const connection of connections) {
        const connectionId = connection.id;
        if (!connectionId) continue;

        // Fetch measurements for this connection
        const measurementsUrl = `${baseUrl}/llu/connections/${connectionId}/measurements`;
        const measurementsRes = await fetch(measurementsUrl, {
          method: 'GET',
          headers: this.getHeaders(token)
        });
        if (!measurementsRes.ok) continue;

        const resBody = await measurementsRes.json() as any;
        const measurementsData = resBody?.data || {};
        
        // Combine real-time value and graph data (historical measurements)
        const readingsToSave: Array<{ value: number; timestamp: Date }> = [];

        // A. Real-time active reading
        if (measurementsData.connection?.glucoseMeasurement) {
          const m = measurementsData.connection.glucoseMeasurement;
          const val = m.ValueInMgPerDl || m.Value;
          const tsStr = m.Timestamp || m.FactoryTimestamp;
          if (val && tsStr) {
            readingsToSave.push({
              value: Math.round(val),
              timestamp: new Date(tsStr)
            });
          }
        }

        // B. Graph readings (historic)
        const graphData = measurementsData.graphData || [];
        for (const item of graphData) {
          const val = item.ValueInMgPerDl || item.Value;
          const tsStr = item.Timestamp || item.FactoryTimestamp;
          if (val && tsStr) {
            readingsToSave.push({
              value: Math.round(val),
              timestamp: new Date(tsStr)
            });
          }
        }

        // Filter valid readings and insert into DB, avoiding duplicates using unique index catch
        for (const r of readingsToSave) {
          if (isNaN(r.timestamp.getTime()) || r.value <= 0) continue;

          try {
            await GlucoseReading.create({
              userId: user._id,
              value: r.value,
              timestamp: r.timestamp,
              source: 'CGM'
            });
            totalInserted++;
          } catch (dbErr: any) {
            // Duplicate key error is expected code: 11000 due to compound index (userId + timestamp)
            if (dbErr.code !== 11000) {
              console.error('Error saving glucose reading:', dbErr);
            }
          }
        }
      }

      // Update user last sync timestamp
      await User.updateOne({ _id: user._id }, { $set: { libreLastSyncAt: new Date() } });

      return { success: true, count: totalInserted };
    } catch (err: any) {
      console.error(`LibreLinkUp sync failed for user ${user.email}:`, err.message || err);
      return { success: false, count: 0, error: err.message || 'Sync operation failed.' };
    }
  }

  /**
   * Performs a background sync of all active LibreLinkUp users.
   */
  public static async runGlobalBackgroundSync(): Promise<{ succeeded: number; failed: number }> {
    const activeUsers = await User.find({ libreActive: true, isDeleted: false, isBlocked: false });
    let succeeded = 0;
    let failed = 0;

    for (const user of activeUsers) {
      const res = await this.syncUserReadings(user);
      if (res.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return { succeeded, failed };
  }
}
