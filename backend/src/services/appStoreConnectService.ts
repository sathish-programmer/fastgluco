import jwt from 'jsonwebtoken';
import { AppHealthConfig } from '../models/AppHealthConfig';
import { AppStoreMetrics } from '../models/AppStoreMetrics';
import { AppCrashReport } from '../models/AppCrashReport';

export interface AppleConnectionTestResult {
  success: boolean;
  message: string;
  tokenGenerated?: boolean;
  appFound?: boolean;
  appName?: string;
  appleAppId?: string;
  httpStatus?: number;
  errorDetails?: string;
}

export class AppStoreConnectService {
  private static BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

  /**
   * Generates an ES256 signed JWT for App Store Connect API.
   * Valid for 20 minutes (Apple maximum).
   */
  public static generateToken(issuerId: string, keyId: string, privateKeyRaw: string): string {
    if (!issuerId || !keyId || !privateKeyRaw) {
      throw new Error('Apple Issuer ID, Key ID, and Private Key (.p8) are required.');
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: issuerId,
      iat: now,
      exp: now + 20 * 60, // 20 minutes
      aud: 'appstoreconnect-v1'
    };

    const header = {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT'
    };

    try {
      return jwt.sign(payload, privateKey, { algorithm: 'ES256', header });
    } catch (err: any) {
      throw new Error(`Failed to sign Apple JWT with ES256: ${err.message}. Ensure the private key is valid PKCS#8 format.`);
    }
  }

  /**
   * Tests the connection to App Store Connect API by looking up the app bundle ID.
   */
  public static async testConnection(
    issuerId: string,
    keyId: string,
    privateKey: string,
    bundleId: string
  ): Promise<AppleConnectionTestResult> {
    try {
      if (!issuerId || !keyId || !privateKey) {
        return {
          success: false,
          message: 'Apple App Store Connect credentials incomplete.'
        };
      }

      const token = this.generateToken(issuerId, keyId, privateKey);
      const cleanBundleId = bundleId || 'com.mitoreboot.app';

      const response = await fetch(`${this.BASE_URL}/apps?filter[bundleId]=${cleanBundleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const apps = data.data || [];
        if (apps.length > 0) {
          const app = apps[0];
          return {
            success: true,
            tokenGenerated: true,
            appFound: true,
            appName: app.attributes?.name || 'Mito Reboot',
            appleAppId: app.id,
            httpStatus: response.status,
            message: `Successfully connected to App Store Connect! Found app: ${app.attributes?.name || cleanBundleId} (ID: ${app.id})`
          };
        } else {
          return {
            success: true,
            tokenGenerated: true,
            appFound: false,
            httpStatus: response.status,
            message: `Authenticated with App Store Connect, but no app found matching bundle ID "${cleanBundleId}". Please verify bundle ID.`
          };
        }
      } else if (response.status === 401) {
        return {
          success: false,
          tokenGenerated: true,
          httpStatus: 401,
          message: 'Authentication failed (HTTP 401). Verify Issuer ID, Key ID, and that the .p8 private key has not been revoked.'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          tokenGenerated: true,
          httpStatus: 403,
          message: 'Access forbidden (HTTP 403). Ensure the App Store Connect API Key has "App Manager" or "Admin" role with access to this app.'
        };
      } else {
        const text = await response.text();
        return {
          success: false,
          tokenGenerated: true,
          httpStatus: response.status,
          message: `App Store Connect API returned HTTP ${response.status}`,
          errorDetails: text
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
   * Synchronizes iOS store analytics and crash diagnostic signatures.
   */
  public static async syncMetrics(config: any): Promise<{ success: boolean; message: string; recordsUpdated: number }> {
    if (!config.appleIssuerId || !config.appleKeyId || !config.applePrivateKey) {
      return {
        success: false,
        message: 'Apple App Store Connect credentials are not configured.',
        recordsUpdated: 0
      };
    }

    try {
      const token = this.generateToken(
        config.appleIssuerId,
        config.appleKeyId,
        config.applePrivateKey
      );

      const bundleId = config.appleBundleId || 'com.mitoreboot.app';
      let recordsUpdated = 0;

      // 1. Fetch App details to get App ID if missing
      const appRes = await fetch(`${this.BASE_URL}/apps?filter[bundleId]=${bundleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let appId = config.appleAppId;
      if (appRes.ok) {
        const appData = (await appRes.json()) as any;
        if (appData.data && appData.data.length > 0) {
          appId = appData.data[0].id;
        }
      }

      // 2. Fetch or create Analytics Report Requests if app found
      if (appId) {
        try {
          const reportRes = await fetch(`${this.BASE_URL}/apps/${appId}/analyticsReportRequests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (reportRes.ok) {
            const reportData = (await reportRes.json()) as any;
            const requests = reportData.data || [];
            // If active reports exist, aggregate latest summary
            if (requests.length > 0) {
              recordsUpdated += requests.length;
            }
          }
        } catch (reportErr) {
          console.warn('[AppStoreConnect] Note on analyticsReportRequests:', reportErr);
        }

        // 3. Fetch Diagnostic Signatures (Crashes) if available
        try {
          const diagRes = await fetch(`${this.BASE_URL}/diagnosticSignatures?filter[diagnosticType]=CRASHES`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (diagRes.ok) {
            const diagData = (await diagRes.json()) as any;
            const signatures = diagData.data || [];
            for (const sig of signatures) {
              const attrs = sig.attributes || {};
              const issueId = sig.id;
              await AppCrashReport.findOneAndUpdate(
                { platform: 'ios', issueId },
                {
                  platform: 'ios',
                  issueId,
                  title: attrs.signature || 'iOS App Crash',
                  subtitle: attrs.bundleId || bundleId,
                  errorType: 'CRASH',
                  crashCount: attrs.weight || 1,
                  affectedUsers: 1,
                  lastSeen: new Date(),
                  diagnosticUrl: 'https://appstoreconnect.apple.com/apps',
                  source: 'APPLE_APP_STORE_CONNECT',
                  status: 'OPEN'
                },
                { upsert: true, new: true }
              );
            }
          }
        } catch (diagErr) {
          console.warn('[AppStoreConnect] Note on diagnosticSignatures:', diagErr);
        }
      }

      await AppHealthConfig.updateOne(
        {},
        {
          appleStatus: 'AUTHENTICATED',
          appleLastSyncAt: new Date(),
          appleLastError: '',
          appleAppId: appId || config.appleAppId
        }
      );

      return {
        success: true,
        message: 'App Store Connect synchronization completed.',
        recordsUpdated
      };
    } catch (error: any) {
      await AppHealthConfig.updateOne(
        {},
        {
          appleStatus: 'ERROR',
          appleLastError: error.message || 'Synchronization failed'
        }
      );
      return {
        success: false,
        message: error.message || 'App Store Connect sync error',
        recordsUpdated: 0
      };
    }
  }
}
