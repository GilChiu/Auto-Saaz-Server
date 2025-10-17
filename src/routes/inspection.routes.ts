import { Router } from 'express';
import inspectionController from '../controllers/inspection.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

/**
 * All inspection routes require authentication
 */
router.use(authGuard);

/**
 * Inspection Statistics Routes
 */

/**
 * @route   GET /api/inspections/stats
 * @desc    Get inspection statistics (total, pending, completed, etc.)
 * @access  Private (Garage Owners)
 */
router.get('/stats', inspectionController.getInspectionStats);

/**
 * Inspection CRUD Routes
 */

/**
 * @route   GET /api/inspections
 * @desc    Get all inspections with filters and pagination
 * @access  Private (Garage Owners)
 * @query   ?status=pending&priority=high&assigned_technician=Ahmad&vehicle_make=Honda&date_from=2024-01-01&date_to=2024-12-31&search=Ali&limit=50&offset=0
 */
router.get('/', inspectionController.getInspections);

/**
 * @route   GET /api/inspections/:id
 * @desc    Get inspection by ID
 * @access  Private (Garage Owners)
 */
router.get('/:id', inspectionController.getInspectionById);

/**
 * @route   POST /api/inspections
 * @desc    Create a new inspection
 * @access  Private (Garage Owners)
 * @body    { customer_name, customer_phone?, customer_email?, vehicle_make?, vehicle_model?, vehicle_year?, vehicle_plate_number?, inspection_date, scheduled_time?, assigned_technician?, priority?, tasks?, estimated_cost?, internal_notes? }
 */
router.post('/', inspectionController.createInspection);

/**
 * @route   PATCH /api/inspections/:id
 * @desc    Update inspection
 * @access  Private (Garage Owners)
 * @body    { customer_name?, customer_phone?, customer_email?, vehicle_make?, vehicle_model?, vehicle_year?, vehicle_plate_number?, inspection_date?, scheduled_time?, assigned_technician?, status?, priority?, tasks?, findings?, recommendations?, internal_notes?, estimated_cost?, actual_cost? }
 */
router.patch('/:id', inspectionController.updateInspection);

/**
 * @route   PATCH /api/inspections/:id/complete
 * @desc    Mark inspection as completed
 * @access  Private (Garage Owners)
 * @body    { findings?, recommendations?, actual_cost? }
 */
router.patch('/:id/complete', inspectionController.completeInspection);

/**
 * @route   DELETE /api/inspections/:id
 * @desc    Delete inspection
 * @access  Private (Garage Owners)
 */
router.delete('/:id', inspectionController.deleteInspection);

export default router;