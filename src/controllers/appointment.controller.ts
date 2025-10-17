import { Request, Response } from 'express';
import { AppointmentModel } from '../models/appointment.model';
import { asyncHandler } from '../middleware/asyncHandler';
import { 
    successResponse, 
    badRequestResponse, 
    notFoundResponse, 
    createdResponse 
} from '../utils/responses';
import logger from '../config/logger';

/**
 * Appointment Controller
 * Handles all appointment-related operations
 */
export class AppointmentController {
    /**
     * Get all appointments with filters
     * GET /api/appointments
     */
    getAppointments = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            status,
            priority,
            service_type,
            date_from,
            date_to,
            search,
            limit = '50',
            offset = '0',
        } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (service_type) filters.service_type = service_type;
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;
        if (search) filters.search = search;

        const result = await AppointmentModel.getAppointments(
            userId,
            filters,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        logger.info(`Fetched ${result.appointments.length} appointments for user: ${userId}`);
        
        return successResponse(res, result, 'Appointments fetched successfully');
    });

    /**
     * Get appointment by ID
     * GET /api/appointments/:id
     */
    getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Appointment ID is required');
        }

        const appointment = await AppointmentModel.getAppointmentById(id, userId);
        
        if (!appointment) {
            return notFoundResponse(res, 'Appointment not found');
        }

        return successResponse(res, appointment, 'Appointment fetched successfully');
    });

    /**
     * Create a new appointment
     * POST /api/appointments
     */
    createAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            customer_name,
            customer_phone,
            customer_email,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            service_type,
            service_description,
            appointment_date,
            scheduled_time,
            priority,
            estimated_duration,
            estimated_cost,
            notes,
        } = req.body;

        // Validation
        if (!customer_name || !customer_phone || !service_type || !appointment_date) {
            return badRequestResponse(
                res,
                'Customer name, phone, service type, and appointment date are required'
            );
        }

        const appointment = await AppointmentModel.createAppointment(userId, {
            customer_name,
            customer_phone,
            customer_email,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            service_type,
            service_description,
            appointment_date,
            scheduled_time,
            priority,
            estimated_duration,
            estimated_cost,
            notes,
        });

        if (!appointment) {
            return badRequestResponse(res, 'Failed to create appointment');
        }

        logger.info(`Appointment created: ${appointment.appointment_number} by user: ${userId}`);
        return createdResponse(res, appointment, 'Appointment created successfully');
    });

    /**
     * Update appointment
     * PATCH /api/appointments/:id
     */
    updateAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return badRequestResponse(res, 'Appointment ID is required');
        }

        // Check if appointment exists
        const existingAppointment = await AppointmentModel.getAppointmentById(id, userId);
        if (!existingAppointment) {
            return notFoundResponse(res, 'Appointment not found');
        }

        const updatedAppointment = await AppointmentModel.updateAppointment(id, userId, updates);
        
        if (!updatedAppointment) {
            return badRequestResponse(res, 'Failed to update appointment');
        }

        logger.info(`Appointment updated: ${id} by user: ${userId}`);
        return successResponse(res, updatedAppointment, 'Appointment updated successfully');
    });

    /**
     * Delete appointment
     * DELETE /api/appointments/:id
     */
    deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Appointment ID is required');
        }

        // Check if appointment exists
        const existingAppointment = await AppointmentModel.getAppointmentById(id, userId);
        if (!existingAppointment) {
            return notFoundResponse(res, 'Appointment not found');
        }

        const deleted = await AppointmentModel.deleteAppointment(id, userId);
        
        if (!deleted) {
            return badRequestResponse(res, 'Failed to delete appointment');
        }

        logger.info(`Appointment deleted: ${id} by user: ${userId}`);
        return successResponse(res, null, 'Appointment deleted successfully');
    });

    /**
     * Get upcoming appointments
     * GET /api/appointments/upcoming
     */
    getUpcomingAppointments = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { limit = '10' } = req.query;

        const appointments = await AppointmentModel.getUpcomingAppointments(
            userId,
            parseInt(limit as string)
        );

        return successResponse(res, appointments, 'Upcoming appointments fetched successfully');
    });

    /**
     * Get appointment statistics
     * GET /api/appointments/stats
     */
    getAppointmentStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        const stats = await AppointmentModel.getAppointmentStats(userId);
        
        if (!stats) {
            return badRequestResponse(res, 'Failed to fetch appointment statistics');
        }

        return successResponse(res, stats, 'Appointment statistics fetched successfully');
    });

    /**
     * Get dashboard appointment statistics
     * GET /api/dashboard/appointment-stats
     */
    getDashboardAppointmentStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        const stats = await AppointmentModel.getDashboardAppointmentStats(userId);
        
        if (!stats) {
            return badRequestResponse(res, 'Failed to fetch dashboard appointment statistics');
        }

        return successResponse(res, stats, 'Dashboard appointment statistics fetched successfully');
    });

    /**
     * Accept/Confirm appointment
     * POST /api/appointments/:id/accept
     */
    acceptAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Appointment ID is required');
        }

        const updatedAppointment = await AppointmentModel.updateAppointment(id, userId, {
            status: 'confirmed' as any,
        });

        if (!updatedAppointment) {
            return notFoundResponse(res, 'Appointment not found');
        }

        logger.info(`Appointment accepted: ${id} by user: ${userId}`);
        return successResponse(res, updatedAppointment, 'Appointment accepted successfully');
    });

    /**
     * Cancel appointment
     * POST /api/appointments/:id/cancel
     */
    cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Appointment ID is required');
        }

        const updatedAppointment = await AppointmentModel.updateAppointment(id, userId, {
            status: 'cancelled' as any,
        });

        if (!updatedAppointment) {
            return notFoundResponse(res, 'Appointment not found');
        }

        logger.info(`Appointment cancelled: ${id} by user: ${userId}`);
        return successResponse(res, updatedAppointment, 'Appointment cancelled successfully');
    });
}

export default new AppointmentController();