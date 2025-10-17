import { supabase } from '../config/supabase';
import logger from '../config/logger';
import type { 
    Inspection, 
    CreateInspectionRequest, 
    UpdateInspectionRequest, 
    InspectionFilters,
    InspectionStats,
    InspectionListResponse
} from '../types/inspection.types';

export class InspectionModel {
    /**
     * Get inspection by ID
     */
    static async getInspectionById(
        inspectionId: string,
        garageOwnerId: string
    ): Promise<Inspection | null> {
        try {
            // Clean the inspection ID (remove # prefix if present)
            const cleanId = inspectionId.replace('#', '');
            
            // Check if the ID looks like a UUID or inspection number
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanId);
            
            let data = null;
            let error = null;
            
            if (isUUID) {
                // Try UUID lookup first
                ({ data, error } = await supabase
                    .from('inspections')
                    .select('*')
                    .eq('id', cleanId)
                    .eq('garage_owner_id', garageOwnerId)
                    .single());
                    
                // If not found by UUID, try inspection_number as fallback
                if (error && error.code === 'PGRST116') {
                    ({ data, error } = await supabase
                        .from('inspections')
                        .select('*')
                        .eq('inspection_number', cleanId)
                        .eq('garage_owner_id', garageOwnerId)
                        .single());
                }
            } else {
                // Try inspection_number first (most likely case)
                ({ data, error } = await supabase
                    .from('inspections')
                    .select('*')
                    .eq('inspection_number', cleanId)
                    .eq('garage_owner_id', garageOwnerId)
                    .single());
                    
                // If not found by inspection_number, try UUID as fallback (rare case)
                if (error && error.code === 'PGRST116') {
                    try {
                        ({ data, error } = await supabase
                            .from('inspections')
                            .select('*')
                            .eq('id', cleanId)
                            .eq('garage_owner_id', garageOwnerId)
                            .single());
                    } catch (uuidError) {
                        // Ignore UUID type errors for non-UUID strings
                        logger.debug('UUID lookup failed for non-UUID string, expected behavior');
                    }
                }
            }

            if (error) {
                if (error.code === 'PGRST116') {
                    logger.info(`Inspection not found: ${cleanId} for garage: ${garageOwnerId}`);
                    return null;
                }
                logger.error('Error fetching inspection:', error);
                return null;
            }

            return data as Inspection;
        } catch (error) {
            logger.error('InspectionModel.getInspectionById error:', error);
            return null;
        }
    }

    /**
     * Get all inspections for a garage with filters
     */
    static async getInspections(
        garageOwnerId: string,
        filters?: InspectionFilters,
        limit: number = 50,
        offset: number = 0
    ): Promise<InspectionListResponse> {
        try {
            let query = supabase
                .from('inspections')
                .select('*', { count: 'exact' })
                .eq('garage_owner_id', garageOwnerId);

            // Apply filters
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            
            if (filters?.priority) {
                query = query.eq('priority', filters.priority);
            }
            
            if (filters?.assigned_technician) {
                query = query.eq('assigned_technician', filters.assigned_technician);
            }
            
            if (filters?.vehicle_make) {
                query = query.eq('vehicle_make', filters.vehicle_make);
            }
            
            if (filters?.date_from) {
                query = query.gte('inspection_date', filters.date_from);
            }
            
            if (filters?.date_to) {
                query = query.lte('inspection_date', filters.date_to);
            }
            
            if (filters?.search) {
                query = query.or(`customer_name.ilike.%${filters.search}%,vehicle_make.ilike.%${filters.search}%,vehicle_model.ilike.%${filters.search}%,inspection_number.ilike.%${filters.search}%`);
            }

            // Apply pagination and ordering
            query = query
                .order('inspection_date', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                logger.error('Error fetching inspections:', error);
                throw new Error('Failed to fetch inspections');
            }

            const total = count || 0;
            const page = Math.floor(offset / limit) + 1;
            const has_more = offset + limit < total;

            return {
                inspections: data as Inspection[],
                total,
                page,
                limit,
                has_more
            };
        } catch (error) {
            logger.error('InspectionModel.getInspections error:', error);
            throw error;
        }
    }

    /**
     * Create a new inspection
     */
    static async createInspection(
        garageOwnerId: string,
        inspectionData: CreateInspectionRequest
    ): Promise<Inspection> {
        try {
            const { data, error } = await supabase
                .from('inspections')
                .insert({
                    garage_owner_id: garageOwnerId,
                    ...inspectionData,
                    tasks: inspectionData.tasks || []
                })
                .select()
                .single();

            if (error) {
                logger.error('Error creating inspection:', error);
                throw new Error('Failed to create inspection');
            }

            return data as Inspection;
        } catch (error) {
            logger.error('InspectionModel.createInspection error:', error);
            throw error;
        }
    }

    /**
     * Update an existing inspection
     */
    static async updateInspection(
        inspectionId: string,
        garageOwnerId: string,
        updates: UpdateInspectionRequest
    ): Promise<Inspection> {
        try {
            const { data, error } = await supabase
                .from('inspections')
                .update(updates)
                .eq('id', inspectionId)
                .eq('garage_owner_id', garageOwnerId)
                .select()
                .single();

            if (error) {
                logger.error('Error updating inspection:', error);
                throw new Error('Failed to update inspection');
            }

            return data as Inspection;
        } catch (error) {
            logger.error('InspectionModel.updateInspection error:', error);
            throw error;
        }
    }

    /**
     * Delete an inspection
     */
    static async deleteInspection(
        inspectionId: string,
        garageOwnerId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('inspections')
                .delete()
                .eq('id', inspectionId)
                .eq('garage_owner_id', garageOwnerId);

            if (error) {
                logger.error('Error deleting inspection:', error);
                throw new Error('Failed to delete inspection');
            }

            return true;
        } catch (error) {
            logger.error('InspectionModel.deleteInspection error:', error);
            throw error;
        }
    }

    /**
     * Get inspection statistics
     */
    static async getInspectionStats(
        garageOwnerId: string
    ): Promise<InspectionStats> {
        try {
            const { data, error } = await supabase
                .from('inspections')
                .select('status, created_at, completed_at, inspection_date')
                .eq('garage_owner_id', garageOwnerId);

            if (error) {
                logger.error('Error fetching inspection stats:', error);
                throw new Error('Failed to fetch inspection statistics');
            }

            const inspections = data || [];
            const today = new Date().toISOString().split('T')[0];
            
            const stats: InspectionStats = {
                total: inspections.length,
                pending: inspections.filter(i => i.status === 'pending').length,
                in_progress: inspections.filter(i => i.status === 'in_progress').length,
                completed: inspections.filter(i => i.status === 'completed').length,
                cancelled: inspections.filter(i => i.status === 'cancelled').length,
                completed_today: inspections.filter(i => 
                    i.status === 'completed' && 
                    i.completed_at && 
                    i.completed_at.startsWith(today)
                ).length,
                pending_overdue: inspections.filter(i => 
                    i.status === 'pending' && 
                    i.inspection_date < today
                ).length
            };

            // Calculate average completion time
            const completedInspections = inspections.filter(i => 
                i.status === 'completed' && i.created_at && i.completed_at
            );
            
            if (completedInspections.length > 0) {
                const totalHours = completedInspections.reduce((sum, inspection) => {
                    const created = new Date(inspection.created_at);
                    const completed = new Date(inspection.completed_at!);
                    const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
                    return sum + hours;
                }, 0);
                
                stats.average_completion_time = Math.round(totalHours / completedInspections.length * 100) / 100;
            }

            return stats;
        } catch (error) {
            logger.error('InspectionModel.getInspectionStats error:', error);
            throw error;
        }
    }
}