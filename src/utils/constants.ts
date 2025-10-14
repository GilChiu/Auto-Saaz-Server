export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key';
export const FILE_UPLOAD_LIMIT = process.env.FILE_UPLOAD_LIMIT || '5mb';
export const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 100; // 100 requests per window
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'; // Allow all origins by default