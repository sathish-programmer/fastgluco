import jwt from 'jsonwebtoken';
import { AppHealthConfig } from '../models/AppHealthConfig';
import { AppStoreMetrics } from '../models/AppStoreMetrics';
import { AppCrashReport } from '../models/AppCrashReport';

export interface GoogleConnectionTestResult {
  success: boolean;
  message: string;
  tokenAcquired?: boolean;
  reportingApiAccessible?: boolean;
  httpStatus?: number;
  errorDetails?: string;
}

export class GooglePlayReportingService {
  private static OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static REPORTING_BASE_URL = 'https://playdeveloperreporting.googleapis.com/v1beta1';
  private static REPORTING_SCOPE = 'https://www.googleapis.com/auth/playdeveloperreporting';

  /**
   * Generates a signed Google Service Account JWT and exchanges it for an OAuth2 access token.
   */
  public static async getAccessToken(clientEmail: string, privateKeyRaw: string): Promise<string> {
    if (!clientEmail || !privateKeyRaw) {
      throw new Error('Google Service Account email and private key are required.');
    }

    // Clean up private key formatting (replace literal \n if present)
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: this.REPORTING_SCOPE,
      aud: this.OAUTH_TOKEN_URL,
      exp: now + 3600,
      iat: now
    };

    let assertionToken: string;
    try {
      assertionToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    } catch (signErr: any) {
      throw new Error(`Failed to sign JWT with provided private key: ${signErr.message}`);
    }

    const postBody = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertionToken
    });

    const response = await fetch(this.OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postBody.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google OAuth2 token exchange failed (HTTP ${response.status}): ${errText}`);
    }

    const data = (await response.json()) as any;
    if (!data.access_token) {
      throw new Error('OAuth response did not include access_token.');
    }

    return data.access_token;
  }

  /**
   * Tests the connection to Google Play Developer Reporting API.
   */
  public static async testConnection(
    clientEmail: string,
    privateKey: string,
    packageName: string
  ): Promise<GoogleConnectionTestResult> {
    try {
      if (!clientEmail || !privateKey) {
        return {
          success: false,
          message: 'Google Service Account email or private key is missing.'
        };
      }

      const accessToken = await this.getAccessToken(clientEmail, privateKey);

      // Attempt to query crash rate metric set for the package
      const testUrl = `${this.REPORTING_BASE_URL}/apps/${packageName || 'com.mitoreboot.app'}/crashRateMetricSet`;
      const res = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok || res.status === 200) {
        return {
          success: true,
          tokenAcquired: true,
          reportingApiAccessible: true,
          httpStatus: res.status,
          message: 'Successfully authenticated with Google Play Developer Reporting API!'
        };
      } else if (res.status === 403) {
        return {
          success: false,
          tokenAcquired: true,
          reportingApiAccessible: false,
          httpStatus: 403,
          message: 'Authenticated with Google Cloud, but permission to Google Play Reporting API was denied (HTTP 403). Ensure the Service Account is invited in Google Play Console with "View app quality information" permissions.'
        };
      } else if (res.status === 404) {
        return {
          success: false,
          tokenAcquired: true,
          reportingApiAccessible: false,
          httpStatus: 404,
          message: `Package "${packageName}" not found or not associated with this developer account (HTTP 404).`
        };
      } else {
        const errorText = await res.text();
        return {
          success: false,
          tokenAcquired: true,
          reportingApiAccessible: false,
          httpStatus: res.status,
          message: `Google Reporting API returned HTTP ${res.status}`,
          errorDetails: errorText
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection test failed',
        errorDetails: String(err)
      };
    }
  }

  /**
   * Synchronizes Android metrics and error reports from Google Play Developer Reporting API.
   */
  public static async syncMetrics(config: any): Promise<{ success: boolean; message: string; recordsUpdated: number }> {
    if (!config.googleServiceAccountEmail || !config.googlePrivateKey) {
      return {
        success: false,
        message: 'Google Play Reporting credentials are not configured.',
        recordsUpdated: 0
      };
    }

    try {
      const accessToken = await this.getAccessToken(
        config.googleServiceAccountEmail,
        config.googlePrivateKey
      );

      const packageName = config.googlePackageName || 'com.mitoreboot.app';
      let recordsUpdated = 0;

      // 1. Query Crash Rate Metric Set
      try {
        const today = new Date();
        const start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        const crashQueryUrl = `${this.REPORTING_BASE_URL}/apps/${packageName}/crashRateMetricSet:query`;
        const crashRes = await fetch(crashQueryUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timelineSpec: {
              aggregationPeriod: 'DAILY',
              startTime: {
                year: start.getUTCFullYear(),
                month: start.getUTCMonth() + 1,
                day: start.getUTCDate()
              },
              endTime: {
                year: today.getUTCFullYear(),
                month: today.getUTCMonth() + 1,
                day: today.getUTCDate()
              }
            },
            metrics: ['crashRate', 'distinctUsersWithCrashRate']
          })
        });

        if (crashRes.ok) {
          const crashData = (await crashRes.json()) as any;
          const rows = crashData.rows || [];
          for (const row of rows) {
            const dateObj = row.startTime;
            if (!dateObj) continue;
            const dateStr = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
            const metrics = row.metrics || {};
            const crashRate = metrics.crashRate?.decimalValue ? parseFloat(metrics.crashRate.decimalValue) : null;
            const userCrashRate = metrics.distinctUsersWithCrashRate?.decimalValue
              ? parseFloat(metrics.distinctUsersWithCrashRate.decimalValue)
              : null;

            await AppStoreMetrics.findOneAndUpdate(
              { platform: 'android', metricDate: dateStr },
              {
                platform: 'android',
                metricDate: dateStr,
                crashRate,
                distinctUsersWithCrashRate: userCrashRate,
                source: 'GOOGLE_PLAY_REPORTING',
                isStoreReported: true,
                fetchedAt: new Date(),
                rawPayload: row
              },
              { upsert: true, new: true }
            );
            recordsUpdated++;
          }
        }
      } catch (queryErr) {
        console.warn('[GooglePlayReporting] Error querying crashRateMetricSet:', queryErr);
      }

      // 2. Query ANR Rate Metric Set
      try {
        const today = new Date();
        const start = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        const anrQueryUrl = `${this.REPORTING_BASE_URL}/apps/${packageName}/anrRateMetricSet:query`;
        const anrRes = await fetch(anrQueryUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timelineSpec: {
              aggregationPeriod: 'DAILY',
              startTime: {
                year: start.getUTCFullYear(),
                month: start.getUTCMonth() + 1,
                day: start.getUTCDate()
              },
              endTime: {
                year: today.getUTCFullYear(),
                month: today.getUTCMonth() + 1,
                day: today.getUTCDate()
              }
            },
            metrics: ['anrRate', 'distinctUsersWithAnrRate']
          })
        });

        if (anrRes.ok) {
          const anrData = (await anrRes.json()) as any;
          const rows = anrData.rows || [];
          for (const row of rows) {
            const dateObj = row.startTime;
            if (!dateObj) continue;
            const dateStr = `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
            const metrics = row.metrics || {};
            const anrRate = metrics.anrRate?.decimalValue ? parseFloat(metrics.anrRate.decimalValue) : null;
            const userAnrRate = metrics.distinctUsersWithAnrRate?.decimalValue
              ? parseFloat(metrics.distinctUsersWithAnrRate.decimalValue)
              : null;

            await AppStoreMetrics.findOneAndUpdate(
              { platform: 'android', metricDate: dateStr },
              {
                platform: 'android',
                metricDate: dateStr,
                anrRate,
                distinctUsersWithAnrRate: userAnrRate,
                source: 'GOOGLE_PLAY_REPORTING',
                isStoreReported: true,
                fetchedAt: new Date()
              },
              { upsert: true, new: true }
            );
          }
        }
      } catch (anrErr) {
        console.warn('[GooglePlayReporting] Error querying anrRateMetricSet:', anrErr);
      }

      // 3. Query Error Issues (Crashes and ANRs)
      try {
        const errorIssuesUrl = `${this.REPORTING_BASE_URL}/apps/${packageName}/errorIssues?pageSize=20`;
        const errorRes = await fetch(errorIssuesUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (errorRes.ok) {
          const errorData = (await errorRes.json()) as any;
          const issues = errorData.errorIssues || [];
          for (const issue of issues) {
            const issueId = issue.name || issue.issueId;
            if (!issueId) continue;

            const errorType = issue.type === 'ANR' ? 'ANR' : 'CRASH';
            const title = issue.cause || issue.location || 'App Error';
            const subtitle = issue.subtitle || issue.name || '';

            await AppCrashReport.findOneAndUpdate(
              { platform: 'android', issueId },
              {
                platform: 'android',
                issueId,
                title,
                subtitle,
                errorType,
                crashCount: issue.errorReportCount || 1,
                affectedUsers: issue.distinctUsers || 1,
                sampleStackTrace: issue.sampleErrorReports?.[0]?.reportText || '',
                diagnosticUrl: `https://play.google.com/console/developers/app/quality/vitals/crashes`,
                status: 'OPEN',
                source: 'GOOGLE_PLAY_REPORTING',
                lastSeen: new Date()
              },
              { upsert: true, new: true }
            );
          }
        }
      } catch (errIssuesErr) {
        console.warn('[GooglePlayReporting] Error querying errorIssues:', errIssuesErr);
      }

      await AppHealthConfig.updateOne(
        {},
        {
          googleStatus: 'AUTHENTICATED',
          googleLastSyncAt: new Date(),
          googleLastError: ''
        }
      );

      return {
        success: true,
        message: 'Google Play Developer Reporting synchronization completed.',
        recordsUpdated
      };
    } catch (error: any) {
      await AppHealthConfig.updateOne(
        {},
        {
          googleStatus: 'ERROR',
          googleLastError: error.message || 'Synchronization failed'
        }
      );
      return {
        success: false,
        message: error.message || 'Google Play sync error',
        recordsUpdated: 0
      };
    }
  }
}
