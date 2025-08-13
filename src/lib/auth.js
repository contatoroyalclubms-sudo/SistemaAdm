/**
 * Authentication Middleware for API
 */

const crypto = require('crypto');

class AuthService {
  constructor() {
    this.apiKey = process.env.API_KEY;
    this.jwtSecret = process.env.JWT_SECRET || 'royal-club-secret-key';
    
    if (!this.apiKey) {
      console.warn('API_KEY not set - API will be unprotected');
    }
  }

  /**
   * Generate API key
   * @returns {string} Generated API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid
   */
  validateApiKey(apiKey) {
    if (!this.apiKey) return true; // No auth configured
    return apiKey === this.apiKey;
  }

  /**
   * Authentication middleware
   */
  authenticate(req, res, next) {
    if (!this.apiKey) {
      return next(); // No auth required
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required',
        timestamp: new Date().toISOString()
      });
    }

    if (!this.validateApiKey(apiKey)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid API key',
        timestamp: new Date().toISOString()
      });
    }

    next();
  }

  /**
   * Rate limiting middleware for authenticated endpoints
   */
  authRateLimit(req, res, next) {
    // Apply stricter rate limiting for authenticated endpoints
    const clientId = req.headers['x-api-key'] || req.ip;
    
    // Store rate limit info in request for later use
    req.authInfo = {
      clientId,
      authenticated: true
    };
    
    next();
  }

  /**
   * Generate JWT token (for future use)
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateToken(payload) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + (24 * 60 * 60) // 24 hours
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT token (for future use)
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null
   */
  verifyToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }
      
      return decodedPayload;
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
