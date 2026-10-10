import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export interface TelemetryMeta {
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceModel: string;
  deviceId: string;
}

export interface VersionCheckResult {
  isUpdateAvailable: boolean;
  isUpdateRequired: boolean;
  latestReleasedVersion: string;
  latestBuildNumber: string;
  minSupportedVersion: string;
  recommendedVersion: string;
  updateUrl: string;
  releaseNotes?: string;
}

class TelemetryService {
  private cachedMeta: TelemetryMeta | null = null;

  /**
   * Retrieves or creates a persistent anonymous device identifier.
   */
  public getOrCreateDeviceId(): string {
    const STORAGE_KEY = 'mito_telemetry_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      // Generate anonymous UUID
      deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Parses OS version and Device Model from User Agent string safely.
   */
  private parseUserAgent(): { osVersion: string; deviceModel: string } {
    if (typeof navigator === 'undefined') {
      return { osVersion: 'Unknown', deviceModel: 'Unknown' };
    }
    const ua = navigator.userAgent || '';
    let osVersion = 'Unknown';
    let deviceModel = 'Unknown';

    if (/android/i.test(ua)) {
      const androidMatch = ua.match(/Android\s([0-9\.]+)/i);
      osVersion = androidMatch ? `Android ${androidMatch[1]}` : 'Android';

      const modelMatch = ua.match(/;\s([^;]+)\sBuild\//i);
      if (modelMatch && modelMatch[1]) {
        deviceModel = modelMatch[1].trim();
      } else {
        deviceModel = 'Android Device';
      }
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      const iosMatch = ua.match(/OS\s([0-9_]+)/i);
      osVersion = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
      deviceModel = /iPad/.test(ua) ? 'iPad' : 'iPhone';
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      osVersion = 'macOS';
      deviceModel = 'Mac';
    } else if (/Windows/.test(ua)) {
      osVersion = 'Windows';
      deviceModel = 'PC';
    }

    return { osVersion, deviceModel };
  }

  /**
   * Initializes and caches device metadata.
   */
  public async getTelemetryMeta(): Promise<TelemetryMeta> {
    if (this.cachedMeta) return this.cachedMeta;

    const platformRaw = Capacitor.getPlatform();
    const platform = (['android', 'ios', 'web'].includes(platformRaw) ? platformRaw : 'android') as 'android' | 'ios' | 'web';
    const { osVersion, deviceModel } = this.parseUserAgent();
    const deviceId = this.getOrCreateDeviceId();

    let appVersion = '5.26.0';
    let buildNumber = '90';

    try {
      const appInfo = await App.getInfo();
      if (appInfo && appInfo.version) {
        appVersion = appInfo.version;
      }
      if (appInfo && appInfo.build) {
        buildNumber = appInfo.build;
      }
    } catch {
      // Fallback to default build values in web/testing environments
    }

    this.cachedMeta = {
      platform,
      appVersion,
      buildNumber,
      osVersion,
      deviceModel,
      deviceId
    };

    return this.cachedMeta;
  }

  /**
   * Returns standard telemetry headers for API requests.
   */
  public async getHeaders(): Promise<Record<string, string>> {
    const meta = await this.getTelemetryMeta();
    return {
      'x-app-platform': meta.platform,
      'x-app-version': meta.appVersion,
      'x-app-build': meta.buildNumber,
      'x-os-version': meta.osVersion,
      'x-device-model': meta.deviceModel,
      'x-device-id': meta.deviceId
    };
  }

  /**
   * Sends a lightweight telemetry heartbeat to the server.
   */
  public async sendHeartbeat(apiUrl: string, authToken?: string | null): Promise<void> {
    try {
      const meta = await this.getTelemetryMeta();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(await this.getHeaders())
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      await fetch(`${apiUrl}/telemetry/heartbeat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(meta)
      });
    } catch (err) {
      // Non-blocking background telemetry failure
      console.warn('[Telemetry] Heartbeat skipped:', err);
    }
  }

  /**
   * Checks with backend if minimum version rules require an update.
   */
  public async checkVersion(apiUrl: string): Promise<VersionCheckResult | null> {
    try {
      const meta = await this.getTelemetryMeta();
      const res = await fetch(
        `${apiUrl}/config/version-check?platform=${meta.platform}&version=${meta.appVersion}&build=${meta.buildNumber}`
      );
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.warn('[Telemetry] Version check failed:', err);
      return null;
    }
  }
}

export const telemetryService = new TelemetryService();
