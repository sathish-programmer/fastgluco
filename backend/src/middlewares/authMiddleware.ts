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

// Throttling map to update DB at most once every 5 minutes per user/device
const userActivityThrottle = new Map<string, number>();

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token.', tokenExpired: true });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'User',
      laboratoryId: decoded.laboratoryId
    };

    // Safe, non-blocking telemetry update (throttled to once every 5 minutes)
    if (req.user && req.user.role === 'User') {
      const userId = req.user.id;
      const now = Date.now();
      const lastRecorded = userActivityThrottle.get(userId) || 0;

      if (now - lastRecorded > 5 * 60 * 1000) {
        userActivityThrottle.set(userId, now);

        const platformHeader = (req.headers['x-app-platform'] as string) || 'android';
        const platform = (['android', 'ios', 'web'].includes(platformHeader) ? platformHeader : 'android') as 'android' | 'ios' | 'web';
        const appVersion = (req.headers['x-app-version'] as string) || '5.26.0';
        const buildNumber = (req.headers['x-app-build'] as string) || '90';
        const osVersion = (req.headers['x-os-version'] as string) || 'Unknown';
        const deviceModel = (req.headers['x-device-model'] as string) || 'Unknown';
        const deviceId = (req.headers['x-device-id'] as string) || `user_${userId}`;
        const sessionDate = new Date().toISOString().split('T')[0];

        // Fire and forget non-blocking updates
        Promise.all([
          User.findByIdAndUpdate(userId, {
            lastActiveAt: new Date(),
            lastPlatform: platform,
            lastAppVersion: appVersion,
            lastBuildNumber: buildNumber,
            lastOsVersion: osVersion,
            lastDeviceModel: deviceModel
          }).catch(() => {}),
          AppTelemetrySession.findOneAndUpdate(
            { deviceId, sessionDate },
            {
              userId: userId as any,
              deviceId,
              platform,
              appVersion,
              buildNumber,
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
  });
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
