import express from 'express';
import { setupCors } from './config/cors';
import { setupRateLimit } from './config/rateLimit';
import { setupRoutes } from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';

const app = express();

// CORS must be first - before any other middleware
app.use(setupCors);

// Handle preflight requests explicitly
app.options('*', setupCors);

// Body parser
app.use(express.json());

// Rate limiting
app.use(setupRateLimit);

// Health check endpoint (before routes)
app.get('/health', (req, res) => {
  logger.info('Health check called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes setup
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;