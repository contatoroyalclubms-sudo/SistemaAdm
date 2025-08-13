import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/logger';

// Rate limiter configurations
const rateLimiters = {
  // General API rate limiter
  api: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds if exceeded
  }),

  // WhatsApp message sending rate limiter
  whatsapp: new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MSGS_PER_MIN || '12'),
    duration: 60,
    blockDuration: 60,
  }),

  // Webhook rate limiter (more permissive)
  webhook: new RateLimiterMemory({
    points: 200,
    duration: 60,
    blockDuration: 30,
  }),

  // Authentication attempts rate limiter
  auth: new RateLimiterMemory({
    points: 10,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes
  })
};

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  let limiter = rateLimiters.api;

  // Choose appropriate rate limiter based on route
  if (req.path.startsWith('/api/whatsapp/send') || req.path.startsWith('/api/whatsapp/broadcast')) {
    limiter = rateLimiters.whatsapp;
  } else if (req.path.startsWith('/api/webhook/')) {
    limiter = rateLimiters.webhook;
  } else if (req.path.includes('auth') || req.headers['x-api-key']) {
    limiter = rateLimiters.auth;
  }

  limiter.consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const remainingPoints = rejRes?.remainingPoints || 0;
      const msBeforeNext = rejRes?.msBeforeNext || 60000;
      const totalHits = rejRes?.totalHits || 0;

      logger.warn('Rate limit exceeded', {
        ip: key,
        path: req.path,
        method: req.method,
        remainingPoints,
        msBeforeNext,
        totalHits,
        userAgent: req.get('User-Agent')
      });

      res.status(429).json({
        success: false,
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(msBeforeNext / 1000),
        remainingRequests: remainingPoints
      });
    });
}

// Specific rate limiter for WhatsApp operations
export function whatsappRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  
  rateLimiters.whatsapp.consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const msBeforeNext = rejRes?.msBeforeNext || 60000;
      
      logger.warn('WhatsApp rate limit exceeded', {
        ip: key,
        path: req.path,
        msBeforeNext
      });

      res.status(429).json({
        success: false,
        error: 'WhatsApp Rate Limit Exceeded',
        message: 'Too many WhatsApp messages. Please wait before sending more.',
        retryAfter: Math.ceil(msBeforeNext / 1000)
      });
    });
}

// Rate limiter for webhook endpoints
export function webhookRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  
  rateLimiters.webhook.consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const msBeforeNext = rejRes?.msBeforeNext || 30000;
      
      logger.warn('Webhook rate limit exceeded', {
        ip: key,
        path: req.path,
        msBeforeNext
      });

      res.status(429).json({
        success: false,
        error: 'Webhook Rate Limit Exceeded',
        message: 'Too many webhook requests.',
        retryAfter: Math.ceil(msBeforeNext / 1000)
      });
    });
}
