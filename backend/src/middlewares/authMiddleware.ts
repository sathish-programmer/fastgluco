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
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'User',
      laboratoryId: decoded.laboratoryId
    };
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
