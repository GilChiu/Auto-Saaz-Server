import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import logger from './logger';

// Use CORS_ORIGIN from env (matches .env.example and other configs)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
      return;
    }

    // Allow all Vercel preview deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      logger.info(`CORS: Allowing Vercel preview deployment: ${origin}`);
      callback(null, true);
      return;
    }

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      logger.info(`CORS: Allowing localhost: ${origin}`);
      callback(null, true);
      return;
    }

    logger.warn(`CORS: Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200,
};

export const setupCors = cors(corsOptions);
export const corsMiddleware = cors(corsOptions);