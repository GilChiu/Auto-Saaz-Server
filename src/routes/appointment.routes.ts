import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

/**
 * All appointment routes require authentication
 */
router.use(authGuard);

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments with filters and pagination
 * @access  Private (Garage Owners)
 * @query   ?status=pending&priority=high&service_type=oil_change&date_from=2024-01-01&date_to=2024-12-31&search=John&limit=50&offset=0
 */
router.get('/', appointmentController.getAppointments);

/**
 * @route   GET /api/appointments/upcoming
 * @desc    Get upcoming appointments
 * @access  Private (Garage Owners)
 * @query   ?limit=10
 */
router.get('/upcoming', appointmentController.getUpcomingAppointments);

/**
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics
 * @access  Private (Garage Owners)
 */
router.get('/stats', appointmentController.getAppointmentStats);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private (Garage Owners)
 */
router.get('/:id', appointmentController.getAppointmentById);

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Private (Garage Owners)
 * @body    { customer_name, customer_phone, customer_email?, vehicle_make?, vehicle_model?, vehicle_year?, vehicle_plate_number?, service_type, service_description?, appointment_date, scheduled_time?, priority?, estimated_duration?, estimated_cost?, notes? }
 */
router.post('/', appointmentController.createAppointment);

/**
 * @route   PATCH /api/appointments/:id
 * @desc    Update appointment
 * @access  Private (Garage Owners)
 * @body    { status?, priority?, estimated_cost?, actual_cost?, assigned_technician?, notes?, internal_notes?, completion_date? }
 */
router.patch('/:id', appointmentController.updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment
 * @access  Private (Garage Owners)
 */
router.delete('/:id', appointmentController.deleteAppointment);

/**
 * @route   POST /api/appointments/:id/accept
 * @desc    Accept/Confirm appointment
 * @access  Private (Garage Owners)
 */
router.post('/:id/accept', appointmentController.acceptAppointment);

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private (Garage Owners)
 */
router.post('/:id/cancel', appointmentController.cancelAppointment);

export default router;