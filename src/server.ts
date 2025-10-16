import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import env from './config/env';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust proxy - Required for Render and other reverse proxies
app.set('trust proxy', 1);

// CORS Configuration - Allow Vercel frontends and local development
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://auto-saaz-garage-client.vercel.app',
            'https://auto-saaz-admin-client.vercel.app',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
        ];
        
        const allowedPatterns = [
            /^https:\/\/auto-saaz-garage-client-.*\.vercel\.app$/,
            /^https:\/\/auto-saaz-admin-client-.*\.vercel\.app$/,
        ];
        
        // Check exact matches
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Check pattern matches
        if (allowedPatterns.some(pattern => pattern.test(origin))) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
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
