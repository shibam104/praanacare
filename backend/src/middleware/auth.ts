import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * authMiddleware - verifies Bearer token and attaches decoded payload to req.user
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'change_this_secret';
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * roleMiddleware - factory that returns middleware allowing only specified roles
 * Usage: router.get('/', authMiddleware, roleMiddleware('doctor','admin'), handler)
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
};
