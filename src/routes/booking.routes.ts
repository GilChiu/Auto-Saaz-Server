import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

/**
 * All booking routes require authentication
 */
router.use(authGuard);

/**
 * Dashboard Routes
 */

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics (bookings, revenue, etc.)
 * @access  Private (Garage Owners)
 */
router.get('/stats', bookingController.getDashboardStats);

/**
 * @route   GET /api/dashboard/booking-stats
 * @desc    Get booking statistics (total, completed, pending, etc.)
 * @access  Private (Garage Owners)
 */
router.get('/booking-stats', bookingController.getBookingStats);

/**
 * Booking Routes
 */

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filters and pagination
 * @access  Private (Garage Owners)
 * @query   ?status=pending&service_type=oil_change&payment_status=paid&date_from=2024-01-01&date_to=2024-12-31&search=Ali&limit=50&offset=0
 */
router.get('/', bookingController.getBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (Garage Owners)
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Garage Owners)
 * @body    { customer_name, customer_phone, customer_email?, service_type, service_description?, booking_date, scheduled_time?, vehicle_make?, vehicle_model?, vehicle_year?, vehicle_plate_number?, estimated_cost?, notes? }
 */
router.post('/', bookingController.createBooking);

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking (status, payment, costs, etc.)
 * @access  Private (Garage Owners)
 * @body    { status?, payment_status?, actual_cost?, assigned_technician?, notes?, internal_notes?, completion_date? }
 */
router.patch('/:id', bookingController.updateBooking);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete booking
 * @access  Private (Garage Owners)
 */
router.delete('/:id', bookingController.deleteBooking);

export default router;
