import express from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit to 100 requests
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter for Stripe
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit to 10 requests
  skipSuccessfulRequests: true,
});

// General API limiter for trip data
export const tripDataLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit to 30 requests
  message: 'Too many trip data requests',
});

// Enhanced security headers
export const securityHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

  const isDev = process.env.NODE_ENV !== 'production';

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""} https://*.firebaseapp.com https://*.firebase.com https://*.googletagmanager.com`,
    `connect-src 'self' ${isDev ? "ws: wss:" : ""} https://*.googleapis.com https://*.firebaseio.com https://api.anthropic.com wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`,
    "img-src 'self' data: https://*.openstreetmap.org https://*.googletagmanager.com https://*.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src https://*.firebaseapp.com",
    "object-src 'none'",
    "base-uri 'self'",
  ];

  res.setHeader('Content-Security-Policy', csp.join('; '));

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim().replace(/[<>]/g, '');
      }
    });
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim().replace(/[<>]/g, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    sanitizeObject(req.body);
  }

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      code: 500,
      timestamp: new Date().toISOString()
    }
  });
};