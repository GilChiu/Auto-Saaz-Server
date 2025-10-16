import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import logger from './logger';

// Use CORS_ORIGIN from env (matches .env.example and other configs)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

// DETAILED startup logging
console.log('='.repeat(80));
console.log('🔒 CORS CONFIGURATION LOADED');
console.log('='.repeat(80));
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS_ORIGIN env variable:', process.env.CORS_ORIGIN);
console.log('Parsed allowed origins:', JSON.stringify(allowedOrigins, null, 2));
console.log('Total allowed origins:', allowedOrigins.length);
console.log('');
console.log('🌐 AUTO-ALLOWED PATTERNS:');
console.log('  ✅ All *.vercel.app domains');
console.log('  ✅ All localhost:* addresses');
console.log('  ✅ All 127.0.0.1:* addresses');
console.log('  ✅ Requests with no origin (mobile apps, Postman)');
console.log('='.repeat(80));
console.log('');

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const timestamp = new Date().toISOString();
    
    console.log('');
    console.log('━'.repeat(80));
    console.log(`🔍 CORS REQUEST at ${timestamp}`);
    console.log('━'.repeat(80));
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      console.log('📱 Origin: [NO ORIGIN]');
      console.log('✅ DECISION: ALLOWED (no origin - mobile/Postman/server)');
      console.log('━'.repeat(80));
      callback(null, true);
      return;
    }

    console.log('🌐 Origin:', origin);
    console.log('');
    
    // Check 1: Exact match in allowed origins
    console.log('🔎 Check 1: Checking against CORS_ORIGIN list...');
    console.log('   Allowed origins:', JSON.stringify(allowedOrigins));
    if (allowedOrigins.length > 0) {
      const exactMatch = allowedOrigins.indexOf(origin) !== -1;
      console.log('   Exact match found:', exactMatch);
      
      if (exactMatch) {
        console.log('✅ DECISION: ALLOWED (exact match in CORS_ORIGIN)');
        console.log('━'.repeat(80));
        callback(null, true);
        return;
      }
    } else {
      console.log('   No origins in CORS_ORIGIN env variable');
    }
    console.log('');

    // Check 2: Vercel deployment
    console.log('🔎 Check 2: Checking if Vercel deployment...');
    console.log('   Origin ends with .vercel.app?', origin.endsWith('.vercel.app'));
    if (origin.endsWith('.vercel.app')) {
      console.log('✅ DECISION: ALLOWED (Vercel deployment - auto-allowed)');
      console.log('━'.repeat(80));
      callback(null, true);
      return;
    }
    console.log('');

    // Check 3: Localhost
    console.log('🔎 Check 3: Checking if localhost...');
    console.log('   Contains "localhost"?', origin.includes('localhost'));
    console.log('   Contains "127.0.0.1"?', origin.includes('127.0.0.1'));
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ DECISION: ALLOWED (localhost - auto-allowed)');
      console.log('━'.repeat(80));
      callback(null, true);
      return;
    }
    console.log('');

    // If we get here, block it
    console.log('❌ DECISION: BLOCKED');
    console.log('   Reason: Origin not in allowed list and not auto-allowed');
    console.log('━'.repeat(80));
    console.log('');
    
    logger.warn(`CORS BLOCKED: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

console.log('✅ CORS middleware configured and ready');
console.log('');

export const setupCors = cors(corsOptions);
export const corsMiddleware = cors(corsOptions);