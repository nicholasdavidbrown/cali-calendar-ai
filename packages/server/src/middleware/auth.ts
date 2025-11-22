import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import * as userStorage from '../services/userStorageService';
import { StoredUser } from '../services/userStorageService';

/**
 * JWT Authentication Middleware
 *
 * This middleware extracts the JWT from the httpOnly cookie,
 * verifies it, and attaches the user object to the request.
 */

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: StoredUser;
    }
  }
}

/**
 * Middleware to verify JWT and authenticate requests
 * Extracts token from httpOnly cookie and validates it
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from cookie
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authentication token found',
      });
      return;
    }

    // Verify and decode token
    const decoded = verifyToken(token);

    // Fetch user from storage
    const user = await userStorage.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token does not exist',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        error: 'Account inactive',
        message: 'This account has been deactivated',
      });
      return;
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.',
        });
        return;
      }
      if (error.message === 'Invalid token') {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Your authentication token is invalid.',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (token) {
      const decoded = verifyToken(token);
      const user = await userStorage.findUserById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Silently continue without user if token is invalid
    next();
  }
};
