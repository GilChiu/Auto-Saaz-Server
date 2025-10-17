import { Request, Response } from 'express';
import { InspectionModel } from '../models/inspection.model';
import { asyncHandler } from '../middleware/asyncHandler';
import { successResponse, badRequestResponse, notFoundResponse, createdResponse } from '../utils/responses';
import logger from '../config/logger';

/**
 * Inspection Controller
 * Handles all inspection-related operations
 */
export class InspectionController {
    /**
     * Get all inspections with filters
     * GET /api/inspections
     */
    getInspections = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            status,
            priority,
            assigned_technician,
            vehicle_make,
            date_from,
            date_to,
            search,
            limit = '50',
            offset = '0',
        } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (assigned_technician) filters.assigned_technician = assigned_technician;
        if (vehicle_make) filters.vehicle_make = vehicle_make;
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;
        if (search) filters.search = search;

        const result = await InspectionModel.getInspections(
            userId,
            filters,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        logger.info(`Fetched ${result.inspections.length} inspections for user: ${userId}`);
        
        return successResponse(res, result, 'Inspections fetched successfully');
    });

    /**
     * Get inspection by ID
     * GET /api/inspections/:id
     */
    getInspectionById = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Inspection ID is required');
        }

        const inspection = await InspectionModel.getInspectionById(id, userId);
        
        if (!inspection) {
            return notFoundResponse(res, 'Inspection not found');
        }

        return successResponse(res, inspection, 'Inspection fetched successfully');
    });

    /**
     * Create a new inspection
     * POST /api/inspections
     */
    createInspection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const {
            customer_name,
            customer_phone,
            customer_email,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            inspection_date,
            scheduled_time,
            assigned_technician,
            priority,
            tasks,
            estimated_cost,
            internal_notes
        } = req.body;

        // Validate required fields
        if (!customer_name || !inspection_date) {
            return badRequestResponse(res, 'Customer name and inspection date are required');
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inspection_date)) {
            return badRequestResponse(res, 'Invalid date format. Use YYYY-MM-DD');
        }

        const inspectionData = {
            customer_name,
            customer_phone,
            customer_email,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            inspection_date,
            scheduled_time,
            assigned_technician,
            priority: priority || 'normal',
            tasks: tasks || [],
            estimated_cost,
            internal_notes
        };

        const inspection = await InspectionModel.createInspection(userId, inspectionData);

        logger.info(`Created inspection ${inspection.id} for user: ${userId}`);
        
        return createdResponse(res, inspection, 'Inspection created successfully');
    });

    /**
     * Update an existing inspection
     * PATCH /api/inspections/:id
     */
    updateInspection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Inspection ID is required');
        }

        // Check if inspection exists
        const existingInspection = await InspectionModel.getInspectionById(id, userId);
        if (!existingInspection) {
            return notFoundResponse(res, 'Inspection not found');
        }

        const {
            customer_name,
            customer_phone,
            customer_email,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_plate_number,
            inspection_date,
            scheduled_time,
            assigned_technician,
            status,
            priority,
            tasks,
            findings,
            recommendations,
            internal_notes,
            estimated_cost,
            actual_cost
        } = req.body;

        // Validate date format if provided
        if (inspection_date && !/^\d{4}-\d{2}-\d{2}$/.test(inspection_date)) {
            return badRequestResponse(res, 'Invalid date format. Use YYYY-MM-DD');
        }

        const updates: any = {};
        if (customer_name !== undefined) updates.customer_name = customer_name;
        if (customer_phone !== undefined) updates.customer_phone = customer_phone;
        if (customer_email !== undefined) updates.customer_email = customer_email;
        if (vehicle_make !== undefined) updates.vehicle_make = vehicle_make;
        if (vehicle_model !== undefined) updates.vehicle_model = vehicle_model;
        if (vehicle_year !== undefined) updates.vehicle_year = vehicle_year;
        if (vehicle_plate_number !== undefined) updates.vehicle_plate_number = vehicle_plate_number;
        if (inspection_date !== undefined) updates.inspection_date = inspection_date;
        if (scheduled_time !== undefined) updates.scheduled_time = scheduled_time;
        if (assigned_technician !== undefined) updates.assigned_technician = assigned_technician;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;
        if (tasks !== undefined) updates.tasks = tasks;
        if (findings !== undefined) updates.findings = findings;
        if (recommendations !== undefined) updates.recommendations = recommendations;
        if (internal_notes !== undefined) updates.internal_notes = internal_notes;
        if (estimated_cost !== undefined) updates.estimated_cost = estimated_cost;
        if (actual_cost !== undefined) updates.actual_cost = actual_cost;

        const updatedInspection = await InspectionModel.updateInspection(existingInspection.id, userId, updates);

        logger.info(`Updated inspection ${id} for user: ${userId}`);
        
        return successResponse(res, updatedInspection, 'Inspection updated successfully');
    });

    /**
     * Delete an inspection
     * DELETE /api/inspections/:id
     */
    deleteInspection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;

        if (!id) {
            return badRequestResponse(res, 'Inspection ID is required');
        }

        // Check if inspection exists
        const existingInspection = await InspectionModel.getInspectionById(id, userId);
        if (!existingInspection) {
            return notFoundResponse(res, 'Inspection not found');
        }

        await InspectionModel.deleteInspection(existingInspection.id, userId);

        logger.info(`Deleted inspection ${id} for user: ${userId}`);
        
        return successResponse(res, null, 'Inspection deleted successfully');
    });

    /**
     * Get inspection statistics
     * GET /api/inspections/stats
     */
    getInspectionStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        const stats = await InspectionModel.getInspectionStats(userId);
        
        return successResponse(res, stats, 'Inspection statistics fetched successfully');
    });

    /**
     * Mark inspection as completed
     * PATCH /api/inspections/:id/complete
     */
    completeInspection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { findings, recommendations, actual_cost } = req.body;

        if (!id) {
            return badRequestResponse(res, 'Inspection ID is required');
        }

        // Check if inspection exists
        const existingInspection = await InspectionModel.getInspectionById(id, userId);
        if (!existingInspection) {
            return notFoundResponse(res, 'Inspection not found');
        }

        const updates = {
            status: 'completed' as const,
            findings,
            recommendations,
            actual_cost
        };

        const updatedInspection = await InspectionModel.updateInspection(existingInspection.id, userId, updates);

        logger.info(`Completed inspection ${id} for user: ${userId}`);
        
        return successResponse(res, updatedInspection, 'Inspection marked as completed');
    });
}

export default new InspectionController();