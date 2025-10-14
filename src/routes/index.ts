import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import mobileRoutes from './mobile.routes';
import filesRoutes from './files.routes';

const router = Router();

const setupRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/mobile', mobileRoutes);
    app.use('/api/files', filesRoutes);
};

export default setupRoutes;