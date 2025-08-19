import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { JWTPayload } from '../types';

// Enhanced authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    
    // Verify user still exists and is not blocked
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication error' });
    return;
  }
};

// Require email verification
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      res.status(403).json({ 
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Verification check failed' });
    return;
  }
};

// Admin only middleware (for future admin features)
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // TODO: Add admin role to user model and check here
    // For now, this is a placeholder
    res.status(403).json({ error: 'Admin access required' });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
    return;
  }
};

// Check if user owns the resource
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const resourceId = parseInt(req.params[resourceIdParam]);
      
      if (isNaN(resourceId)) {
        res.status(400).json({ error: 'Invalid resource ID' });
        return;
      }

      if (req.user.id !== resourceId) {
        res.status(403).json({ error: 'Access denied - insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Ownership check failed' });
      return;
    }
  };
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    req.user = decoded;
  } catch (error) {
    // Don't fail on optional auth, just continue without user
  }

  next();
};

// Generate JWT token
export const generateTokens = (user: { id: number; email: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload & { type?: string };
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    return null;
  }
};

// Generate email verification token
export const generateEmailVerificationToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'email_verification' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: number; type: string };

    if (decoded.type !== 'email_verification') {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
};

// Generate password reset token
export const generatePasswordResetToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'password_reset' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: number; type: string };

    if (decoded.type !== 'password_reset') {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
};