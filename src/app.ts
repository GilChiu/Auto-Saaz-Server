import express from 'express';
import { setupCors } from './config/cors';
import { setupRateLimit } from './config/rateLimit';
import { setupRoutes } from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware setup
app.use(setupCors);
app.use(express.json());
app.use(setupRateLimit);

// Routes setup
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

export default app;