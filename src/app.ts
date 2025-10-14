import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { setupCors } from './config/cors';
import { setupRateLimit } from './config/rateLimit';
import { setupRoutes } from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

const app = express();

// Middleware setup
app.use(cors(setupCors()));
app.use(express.json());
app.use(setupRateLimit());

// Routes setup
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Logger
app.use(logger);

export default app;