import { Request, Response } from 'express';
import { BookingModel } from '../models/booking.model';
import { asyncHandler } from '../middleware/asyncHandler';
import { successResponse, badRequestResponse, notFoundResponse, createdResponse } from '../utils/responses';
import logger from '../config/logger';
import { GarageModel } from '../models/user.model';

/**
 * Booking Controller
 * Handles all booking and dashboard related operations
 */
export class BookingController {
    /**
     * Get dashboard statistics
     * GET /api/dashboard/stats
     */
    getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        // Get user's garage profile
        const profile = await GarageModel.getProfileByUserId(userId);
        if (!profile) {
            return badRequestResponse(res, 'Garage profile not found');
        }

        const stats = await BookingModel.getDashboardStats(userId);
        
        if (!stats) {
            return badRequestResponse(res, 'Failed to fetch dashboard statistics');
        }

        return successResponse(res, stats, 'Dashboard statistics fetched successfully');
    });

    /**
     * Get all bookings with filters
     * GET /api/bookings
     */
    getBookings = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            status,
            service_type,
            payment_status,
            date_from,
            date_to,
            search,
            limit = '50',
            offset = '0',
        } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (service_type) filters.service_type = service_type;
        if (payment_status) filters.payment_status = payment_status;
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;
        if (search) filters.search = search;

        const result = await BookingModel.getBookings(
            userId,
            filters,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        logger.info(`Fetched ${result.bookings.length} bookings for user: ${userId}`);
        
        return successResponse(res, result, 'Bookings fetched successfully');
    });

    /**
     * Get booking by ID
     * GET /api/bookings/:id
     */
    getBookingById = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Booking ID is required');
        }

        const booking = await BookingModel.getBookingById(id, userId);
        
        if (!booking) {
            return notFoundResponse(res, 'Booking not found');
        }

        return successResponse(res, booking, 'Booking fetched successfully');
    });

    /**
     * Create a new booking
     * POST /api/bookings
     */
    createBooking = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            service_description,
            booking_date,
            scheduled_time,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            estimated_cost,
            notes,
        } = req.body;

        // Validation
        if (!customer_name || !customer_phone || !service_type || !booking_date) {
            return badRequestResponse(
                res,
                'Customer name, phone, service type, and booking date are required'
            );
        }

        const booking = await BookingModel.createBooking(userId, {
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            service_description,
            booking_date,
            scheduled_time,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            estimated_cost,
            notes,
        });

        if (!booking) {
            return badRequestResponse(res, 'Failed to create booking');
        }

        logger.info(`Booking created: ${booking.booking_number} by user: ${userId}`);
        return createdResponse(res, booking, 'Booking created successfully');
    });

    /**
     * Update booking
     * PATCH /api/bookings/:id
     */
    updateBooking = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return badRequestResponse(res, 'Booking ID is required');
        }

        // Check if booking exists
        const existingBooking = await BookingModel.getBookingById(id, userId);
        if (!existingBooking) {
            return notFoundResponse(res, 'Booking not found');
        }

        const updatedBooking = await BookingModel.updateBooking(id, userId, updates);
        
        if (!updatedBooking) {
            return badRequestResponse(res, 'Failed to update booking');
        }

        logger.info(`Booking updated: ${id} by user: ${userId}`);
        return successResponse(res, updatedBooking, 'Booking updated successfully');
    });

    /**
     * Delete booking
     * DELETE /api/bookings/:id
     */
    deleteBooking = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Booking ID is required');
        }

        // Check if booking exists
        const existingBooking = await BookingModel.getBookingById(id, userId);
        if (!existingBooking) {
            return notFoundResponse(res, 'Booking not found');
        }

        const deleted = await BookingModel.deleteBooking(id, userId);
        
        if (!deleted) {
            return badRequestResponse(res, 'Failed to delete booking');
        }

        logger.info(`Booking deleted: ${id} by user: ${userId}`);
        return successResponse(res, null, 'Booking deleted successfully');
    });

    /**
     * Get booking statistics
     * GET /api/dashboard/booking-stats
     */
    getBookingStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        const stats = await BookingModel.getBookingStats(userId);
        
        if (!stats) {
            return badRequestResponse(res, 'Failed to fetch booking statistics');
        }

        return successResponse(res, stats, 'Booking statistics fetched successfully');
    });
}

export default new BookingController();
