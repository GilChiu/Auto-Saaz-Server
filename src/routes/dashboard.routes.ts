import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

/**
 * All dashboard routes require authentication
 */
router.use(authGuard);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get comprehensive dashboard statistics (today, week, month, all-time)
 * @access  Private (Garage Owners)
 * @returns { today: {...}, thisWeek: {...}, thisMonth: {...}, allTime: {...} }
 */
router.get('/stats', bookingController.getDashboardStats);

/**
 * @route   GET /api/dashboard/booking-stats
 * @desc    Get all-time booking statistics
 * @access  Private (Garage Owners)
 * @returns { totalBookings, completedBookings, pendingBookings, cancelledBookings, totalRevenue, averageBookingCost }
 */
router.get('/booking-stats', bookingController.getBookingStats);

export default router;
