import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import logger from './logger';

// Use CORS_ORIGIN from env (matches .env.example and other configs)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

// Log CORS configuration on startup
logger.info(`CORS Configuration:`);
logger.info(`- Allowed Origins: ${allowedOrigins.join(', ') || 'None specified'}`);
logger.info(`- Auto-allowing: *.vercel.app domains`);
logger.info(`- Auto-allowing: localhost and 127.0.0.1`);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      logger.info('CORS: Allowing request with no origin (mobile/Postman)');
      callback(null, true);
      return;
    }

    logger.info(`CORS: Checking origin: ${origin}`);

    // Check if origin is in the allowed list
    if (allowedOrigins.length > 0 && allowedOrigins.indexOf(origin) !== -1) {
      logger.info(`CORS: ✅ Allowed (in CORS_ORIGIN list): ${origin}`);
      callback(null, true);
      return;
    }

    // Allow all Vercel preview deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      logger.info(`CORS: ✅ Allowed (Vercel deployment): ${origin}`);
      callback(null, true);
      return;
    }

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      logger.info(`CORS: ✅ Allowed (localhost): ${origin}`);
      callback(null, true);
      return;
    }

    logger.warn(`CORS: ❌ BLOCKED: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const setupCors = cors(corsOptions);
export const corsMiddleware = cors(corsOptions);