import supabase from '../config/supabase';
import { 
    Appointment, 
    AppointmentStatus, 
    AppointmentPriority,
    CreateAppointmentData,
    UpdateAppointmentData,
    AppointmentFilters,
    AppointmentStats,
    DashboardAppointmentStats
} from '../types/appointment.types';
import logger from '../config/logger';

export class AppointmentModel {
    /**
     * Generate a unique appointment number
     */
    private static generateAppointmentNumber(): string {
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `APT${timestamp}${random}`;
    }

    /**
     * Create a new appointment
     */
    static async createAppointment(
        garageOwnerId: string, 
        data: CreateAppointmentData
    ): Promise<Appointment | null> {
        try {
            const appointmentNumber = this.generateAppointmentNumber();

            const { data: appointment, error } = await supabase
                .from('appointments')
                .insert([
                    {
                        appointment_number: appointmentNumber,
                        garage_owner_id: garageOwnerId,
                        customer_name: data.customer_name,
                        customer_phone: data.customer_phone,
                        customer_email: data.customer_email,
                        vehicle_make: data.vehicle_make,
                        vehicle_model: data.vehicle_model,
                        vehicle_year: data.vehicle_year,
                        vehicle_plate_number: data.vehicle_plate_number,
                        service_type: data.service_type,
                        service_description: data.service_description,
                        appointment_date: data.appointment_date,
                        scheduled_time: data.scheduled_time,
                        status: AppointmentStatus.PENDING,
                        priority: data.priority || AppointmentPriority.NORMAL,
                        estimated_duration: data.estimated_duration,
                        estimated_cost: data.estimated_cost,
                        notes: data.notes,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                logger.error('Error creating appointment:', error);
                throw new Error(error.message);
            }

            return appointment as Appointment;
        } catch (error) {
            logger.error('AppointmentModel.createAppointment error:', error);
            throw error;
        }
    }

    /**
     * Get appointments with filters and pagination
     */
    static async getAppointments(
        garageOwnerId: string,
        filters: AppointmentFilters = {},
        limit: number = 50,
        offset: number = 0
    ): Promise<{ appointments: Appointment[]; total: number }> {
        try {
            let query = supabase
                .from('appointments')
                .select('*', { count: 'exact' })
                .eq('garage_owner_id', garageOwnerId)
                .order('appointment_date', { ascending: true });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters.service_type) {
                query = query.ilike('service_type', `%${filters.service_type}%`);
            }
            if (filters.date_from) {
                query = query.gte('appointment_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('appointment_date', filters.date_to);
            }
            if (filters.search) {
                query = query.or(
                    `customer_name.ilike.%${filters.search}%,` +
                    `customer_phone.ilike.%${filters.search}%,` +
                    `vehicle_make.ilike.%${filters.search}%,` +
                    `vehicle_model.ilike.%${filters.search}%,` +
                    `vehicle_plate_number.ilike.%${filters.search}%`
                );
            }

            // Apply pagination
            query = query.range(offset, offset + limit - 1);

            const { data: appointments, error, count } = await query;

            if (error) {
                logger.error('Error fetching appointments:', error);
                throw new Error(error.message);
            }

            return {
                appointments: appointments as Appointment[],
                total: count || 0,
            };
        } catch (error) {
            logger.error('AppointmentModel.getAppointments error:', error);
            throw error;
        }
    }

    /**
     * Get appointment by ID
     */
    static async getAppointmentById(
        appointmentId: string, 
        garageOwnerId: string
    ): Promise<Appointment | null> {
        try {
            const { data: appointment, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', appointmentId)
                .eq('garage_owner_id', garageOwnerId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }

            return appointment as Appointment;
        } catch (error) {
            logger.error('AppointmentModel.getAppointmentById error:', error);
            throw error;
        }
    }

    /**
     * Update appointment
     */
    static async updateAppointment(
        appointmentId: string,
        garageOwnerId: string,
        updates: UpdateAppointmentData
    ): Promise<Appointment | null> {
        try {
            const { data: appointment, error } = await supabase
                .from('appointments')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', appointmentId)
                .eq('garage_owner_id', garageOwnerId)
                .select()
                .single();

            if (error) {
                logger.error('Error updating appointment:', error);
                throw new Error(error.message);
            }

            return appointment as Appointment;
        } catch (error) {
            logger.error('AppointmentModel.updateAppointment error:', error);
            throw error;
        }
    }

    /**
     * Delete appointment
     */
    static async deleteAppointment(
        appointmentId: string, 
        garageOwnerId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId)
                .eq('garage_owner_id', garageOwnerId);

            if (error) {
                logger.error('Error deleting appointment:', error);
                throw new Error(error.message);
            }

            return true;
        } catch (error) {
            logger.error('AppointmentModel.deleteAppointment error:', error);
            throw error;
        }
    }

    /**
     * Get upcoming appointments (for dashboard)
     */
    static async getUpcomingAppointments(
        garageOwnerId: string,
        limit: number = 10
    ): Promise<Appointment[]> {
        try {
            const now = new Date().toISOString();

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('garage_owner_id', garageOwnerId)
                .gte('appointment_date', now)
                .in('status', [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
                .order('appointment_date', { ascending: true })
                .limit(limit);

            if (error) {
                logger.error('Error fetching upcoming appointments:', error);
                throw new Error(error.message);
            }

            return appointments as Appointment[];
        } catch (error) {
            logger.error('AppointmentModel.getUpcomingAppointments error:', error);
            throw error;
        }
    }

    /**
     * Get appointment statistics
     */
    static async getAppointmentStats(garageOwnerId: string): Promise<AppointmentStats> {
        try {
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('status, priority, estimated_cost, actual_cost')
                .eq('garage_owner_id', garageOwnerId);

            if (error) {
                logger.error('Error fetching appointment stats:', error);
                throw new Error(error.message);
            }

            const stats: AppointmentStats = {
                totalAppointments: appointments.length,
                pendingAppointments: 0,
                confirmedAppointments: 0,
                completedAppointments: 0,
                cancelledAppointments: 0,
                noShowAppointments: 0,
                todayAppointments: 0,
                weekAppointments: 0,
                monthAppointments: 0,
                statusBreakdown: {
                    [AppointmentStatus.PENDING]: 0,
                    [AppointmentStatus.CONFIRMED]: 0,
                    [AppointmentStatus.IN_PROGRESS]: 0,
                    [AppointmentStatus.COMPLETED]: 0,
                    [AppointmentStatus.CANCELLED]: 0,
                    [AppointmentStatus.NO_SHOW]: 0,
                },
                priorityBreakdown: {
                    [AppointmentPriority.LOW]: 0,
                    [AppointmentPriority.NORMAL]: 0,
                    [AppointmentPriority.HIGH]: 0,
                    [AppointmentPriority.URGENT]: 0,
                },
                averageAppointmentValue: 0,
                totalRevenue: 0,
            };

            let totalValue = 0;

            appointments.forEach((appointment) => {
                // Status breakdown
                stats.statusBreakdown[appointment.status as AppointmentStatus]++;
                
                // Priority breakdown
                stats.priorityBreakdown[appointment.priority as AppointmentPriority]++;

                // Revenue calculation
                const cost = appointment.actual_cost || appointment.estimated_cost || 0;
                totalValue += cost;
            });

            stats.pendingAppointments = stats.statusBreakdown[AppointmentStatus.PENDING];
            stats.confirmedAppointments = stats.statusBreakdown[AppointmentStatus.CONFIRMED];
            stats.completedAppointments = stats.statusBreakdown[AppointmentStatus.COMPLETED];
            stats.cancelledAppointments = stats.statusBreakdown[AppointmentStatus.CANCELLED];
            stats.noShowAppointments = stats.statusBreakdown[AppointmentStatus.NO_SHOW];

            stats.totalRevenue = totalValue;
            stats.averageAppointmentValue = appointments.length > 0 ? totalValue / appointments.length : 0;

            return stats;
        } catch (error) {
            logger.error('AppointmentModel.getAppointmentStats error:', error);
            throw error;
        }
    }

    /**
     * Get dashboard appointment statistics
     */
    static async getDashboardAppointmentStats(garageOwnerId: string): Promise<DashboardAppointmentStats> {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
            const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

            // Get today's appointments
            const { data: todayAppointments, error: todayError } = await supabase
                .from('appointments')
                .select('status')
                .eq('garage_owner_id', garageOwnerId)
                .gte('appointment_date', startOfDay)
                .lt('appointment_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

            // Get this week's appointments
            const { data: weekAppointments, error: weekError } = await supabase
                .from('appointments')
                .select('status')
                .eq('garage_owner_id', garageOwnerId)
                .gte('appointment_date', startOfWeek);

            // Get this month's appointments
            const { data: monthAppointments, error: monthError } = await supabase
                .from('appointments')
                .select('status')
                .eq('garage_owner_id', garageOwnerId)
                .gte('appointment_date', startOfMonth);

            // Get upcoming appointments
            const upcomingAppointments = await this.getUpcomingAppointments(garageOwnerId, 5);

            if (todayError || weekError || monthError) {
                throw new Error('Error fetching dashboard stats');
            }

            const countByStatus = (appointments: any[]) => {
                const counts = { appointments: 0, confirmed: 0, pending: 0, completed: 0 };
                appointments.forEach(appt => {
                    counts.appointments++;
                    if (appt.status === AppointmentStatus.CONFIRMED) counts.confirmed++;
                    if (appt.status === AppointmentStatus.PENDING) counts.pending++;
                    if (appt.status === AppointmentStatus.COMPLETED) counts.completed++;
                });
                return counts;
            };

            return {
                today: countByStatus(todayAppointments || []),
                week: countByStatus(weekAppointments || []),
                month: countByStatus(monthAppointments || []),
                upcoming: upcomingAppointments,
            };
        } catch (error) {
            logger.error('AppointmentModel.getDashboardAppointmentStats error:', error);
            throw error;
        }
    }
}