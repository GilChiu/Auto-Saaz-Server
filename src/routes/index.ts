import { Router, Application } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import mobileRoutes from './mobile.routes';
import filesRoutes from './files.routes';
import bookingRoutes from './booking.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

const setupRoutes = (app: Application) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/mobile', mobileRoutes);
    app.use('/api/files', filesRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/dashboard', dashboardRoutes);
};

export { setupRoutes };
export default setupRoutes;