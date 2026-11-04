import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'User' | 'SuperAdmin' | 'Admin' | 'Editor' | 'Doctor' | 'Vendor' | 'LabPartner';
    laboratoryId?: string;
  };
}

import { User } from '../models/User';
import { AppTelemetrySession } from '../models/AppTelemetrySession';
import { AppHealthSyncService } from '../services/appHealthSyncService';
import { AppHealthController } from '../controllers/appHealthController';

// Throttling map to update DB at most once every 5 minutes per user/device
const userActivityThrottle = new Map<string, number>();

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Authorization: Bearer <token>

  // Fallback to query parameter (needed for direct window.open PDF downloads)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

  try {
    const decoded: any = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'User',
      laboratoryId: decoded.laboratoryId
    };

    // Immediate check if user has been suspended or blocked by administrator
    if (req.user && req.user.role === 'User') {
      try {
        const dbUser = await User.findById(req.user.id).select('isBlocked isDeleted lastAppVersion lastPlatform').lean();
        if (!dbUser || dbUser.isBlocked || dbUser.isDeleted) {
          return res.status(403).json({
            message: 'Your account has been suspended by an administrator. Please contact support.',
            isBlocked: true,
            isSuspended: true
          });
        }

        // Enforce Minimum Version Rule for mobile clients when forceUpdate is enabled
        const clientPlatformHeader = req.headers['x-app-platform'] as string;
        const clientVersionHeader = (req.headers['x-app-version'] as string) || (req.query.version as string);

        // ONLY enforce if client explicitly reports its platform and version, and ignore obsolete dummy fallback 5.28.0
        if (clientPlatformHeader && ['android', 'ios'].includes(clientPlatformHeader) && clientVersionHeader && clientVersionHeader !== '5.28.0') {
          const config = await AppHealthSyncService.getOrCreateConfig();
          const rules = clientPlatformHeader === 'ios' ? config.iosVersionRules : config.androidVersionRules;
          if (rules?.forceUpdate && rules.minSupportedVersion && AppHealthController.compareVersions(rules.minSupportedVersion, clientVersionHeader) > 0) {
            return res.status(403).json({
              message: `App Update Required: Your app version (${clientVersionHeader}) is outdated. Please update to version ${rules.minSupportedVersion} or higher from the ${clientPlatformHeader === 'ios' ? 'Apple App Store' : 'Google Play Store'} to continue.`,
              isUpdateRequired: true,
              minSupportedVersion: rules.minSupportedVersion,
              latestVersion: rules.latestReleasedVersion,
              updateUrl: rules.updateUrl
            });
          }
        }
      } catch (dbErr) {
        // Safe fallback in case of transient DB connectivity issue
      }
    }

    // Safe, non-blocking telemetry update (throttled to once every 5 minutes)
    if (req.user && req.user.role === 'User') {
      const userId = req.user.id;
      const now = Date.now();
      const lastRecorded = userActivityThrottle.get(userId) || 0;

      if (now - lastRecorded > 5 * 60 * 1000) {
        userActivityThrottle.set(userId, now);

        const platformHeader = req.headers['x-app-platform'] as string;
        let platform = (['android', 'ios', 'web'].includes(platformHeader) ? platformHeader : 'android') as 'android' | 'ios' | 'web';
        const rawAppVersion = (req.headers['x-app-version'] as string) || (req.body?.appVersion as string);
        const rawBuildNumber = (req.headers['x-app-build'] as string) || (req.body?.buildNumber as string);
        let osVersion = (req.headers['x-os-version'] as string) || 'Unknown';
        let deviceModel = (req.headers['x-device-model'] as string) || 'Unknown';
        const deviceId = (req.headers['x-device-id'] as string) || `user_${userId}`;
        const sessionDate = new Date().toISOString().split('T')[0];

        // Parse User-Agent for accurate device and OS info when headers are not sent
        const ua = (req.headers['user-agent'] as string) || '';
        if (osVersion === 'Unknown' || deviceModel === 'Unknown' || !platformHeader) {
          if (/android/i.test(ua)) {
            platform = 'android';
            const androidMatch = ua.match(/Android\s([0-9\.]+)/i);
            if (osVersion === 'Unknown') osVersion = androidMatch ? `Android ${androidMatch[1]}` : 'Android';

            const modelMatch = ua.match(/;\s([^;]+)\sBuild\//i);
            if (deviceModel === 'Unknown' && modelMatch && modelMatch[1]) {
              deviceModel = modelMatch[1].trim();
            } else if (deviceModel === 'Unknown') {
              deviceModel = 'Android Device';
            }
          } else if (/iPad|iPhone|iPod/.test(ua)) {
            platform = 'ios';
            const iosMatch = ua.match(/OS\s([0-9_]+)/i);
            if (osVersion === 'Unknown') osVersion = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
            if (deviceModel === 'Unknown') deviceModel = /iPad/.test(ua) ? 'iPad' : 'iPhone';
          }
        }

        // Fire and forget non-blocking updates without corrupting version with dummy fallbacks
        const userUpdate: any = {
          lastActiveAt: new Date(),
          lastPlatform: platform,
          lastOsVersion: osVersion,
          lastDeviceModel: deviceModel
        };
        if (rawAppVersion && rawAppVersion !== '5.28.0') userUpdate.lastAppVersion = rawAppVersion;
        if (rawBuildNumber && rawBuildNumber !== '92') userUpdate.lastBuildNumber = rawBuildNumber;

        Promise.all([
          User.findByIdAndUpdate(userId, userUpdate).catch(() => {}),
          AppTelemetrySession.findOneAndUpdate(
            { deviceId, sessionDate },
            {
              userId: userId as any,
              deviceId,
              platform,
              ...(rawAppVersion && rawAppVersion !== '5.28.0' ? { appVersion: rawAppVersion } : {}),
              ...(rawBuildNumber && rawBuildNumber !== '92' ? { buildNumber: rawBuildNumber } : {}),
              osVersion,
              deviceModel,
              sessionDate,
              lastActiveAt: new Date(),
              $inc: { requestCount: 1 }
            },
            { upsert: true, new: true }
          ).catch(() => {})
        ]).catch(() => {});
      }
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ message: 'Invalid or expired token.', tokenExpired: true });
  }
};

type AllowedRole = 'User' | 'Vendor' | 'SuperAdmin' | 'Admin' | 'Editor' | 'Doctor' | 'LabPartner';

export const requireRole = (allowedRoles: AllowedRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role as AllowedRole)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
    }

    next();
  };
};
