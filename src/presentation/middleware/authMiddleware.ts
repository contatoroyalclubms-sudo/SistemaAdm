import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/logger';

interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
  apiKey?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      logger.warn('API_KEY not configured - API unprotected');
      req.isAuthenticated = true;
      return next();
    }

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'API key required. Include X-API-Key header.'
      });
      return;
    }

    if (apiKey !== expectedApiKey) {
      logger.warn('Invalid API key attempt', {
        providedKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
      return;
    }

    req.isAuthenticated = true;
    req.apiKey = apiKey;
    next();

  } catch (error) {
    logger.error('Error in auth middleware', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
}
