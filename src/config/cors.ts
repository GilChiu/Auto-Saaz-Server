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
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
};

console.log('✅ CORS middleware configured and ready');
console.log('');

// Custom middleware that ALWAYS sets CORS headers
export const setupCors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  console.log('');
  console.log('━'.repeat(80));
  console.log(`🔍 CUSTOM CORS MIDDLEWARE at ${new Date().toISOString()}`);
  console.log('━'.repeat(80));
  console.log('📱 Origin:', origin || '[NO ORIGIN]');
  console.log('🔧 Method:', req.method);
  console.log('🛣️  Path:', req.path);
  
  // Determine if origin is allowed
  let isAllowed = false;
  let reason = '';
  
  if (!origin) {
    isAllowed = true;
    reason = 'no origin (mobile/Postman)';
  } else if (origin.endsWith('.vercel.app')) {
    isAllowed = true;
    reason = 'Vercel deployment';
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    isAllowed = true;
    reason = 'localhost';
  } else if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
    isAllowed = true;
    reason = 'in CORS_ORIGIN list';
  }
  
  console.log('✅ Allowed:', isAllowed, reason ? `(${reason})` : '');
  
  if (isAllowed) {
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    console.log('📤 Headers set:');
    console.log('   Access-Control-Allow-Origin:', origin || '*');
    console.log('   Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    console.log('   Access-Control-Allow-Credentials: true');
  } else {
    console.log('❌ BLOCKED - origin not allowed');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('⚡ OPTIONS preflight - responding with 204');
    console.log('━'.repeat(80));
    console.log('');
    res.status(204).end();
    return;
  }
  
  console.log('➡️  Continuing to route handler');
  console.log('━'.repeat(80));
  console.log('');
  next();
};

export const corsMiddleware = setupCors;