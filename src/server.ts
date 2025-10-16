import express from 'express';
import dotenv from 'dotenv';
import env from './config/env';
import { setupCors } from './config/cors';
import authRoutes from './routes/auth.routes';

// Load environment variables FIRST
dotenv.config();

console.log('');
console.log('🚀 SERVER STARTUP');
console.log('='.repeat(80));
console.log('Environment Variables:');
console.log('  PORT:', env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN || '[NOT SET - will auto-allow Vercel]');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('='.repeat(80));
console.log('');

// Initialize Express app
const app = express();

// Trust proxy - Required for Render and other reverse proxies
app.set('trust proxy', 1);

// CRITICAL: CORS MUST BE FIRST - before any other middleware
console.log('🔒 Loading CORS configuration from config/cors.ts...');
app.use(setupCors);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'AutoSaaz Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   🚗 AutoSaaz Server Started! 🚗    ║
╠══════════════════════════════════════╣
║  Port: ${PORT}                         ║
║  Environment: ${env.NODE_ENV}          ║
║  Health: http://localhost:${PORT}/health  ║
╚══════════════════════════════════════╝
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
    console.error('❌ Unhandled Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

export default app;
