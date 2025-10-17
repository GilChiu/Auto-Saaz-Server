import supabase from '../config/supabase';
import logger from '../config/logger';
import {
    Booking,
    BookingStatus,
    CreateBookingInput,
    UpdateBookingInput,
    BookingFilters,
    BookingStats,
    DashboardStats,
} from '../types/booking.types';

/**
 * Booking Model
 * Handles all booking-related database operations
 */
export class BookingModel {
    /**
     * Generate unique booking number
     */
    private static generateBookingNumber(): string {
        const prefix = 'BK';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Create a new booking
     */
    static async createBooking(
        garageId: string,
        data: CreateBookingInput
    ): Promise<Booking | null> {
        try {
            const bookingNumber = this.generateBookingNumber();
            
            const { data: booking, error } = await supabase
                .from('bookings')
                .insert([
                    {
                        booking_number: bookingNumber,
                        garage_id: garageId,
                        customer_name: data.customer_name,
                        customer_phone: data.customer_phone,
                        customer_email: data.customer_email,
                        service_type: data.service_type,
                        service_description: data.service_description,
                        booking_date: data.booking_date,
                        scheduled_time: data.scheduled_time,
                        vehicle_make: data.vehicle_make,
                        vehicle_model: data.vehicle_model,
                        vehicle_year: data.vehicle_year,
                        vehicle_plate_number: data.vehicle_plate_number,
                        estimated_cost: data.estimated_cost,
                        notes: data.notes,
                        status: BookingStatus.PENDING,
                        payment_status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                logger.error('Error creating booking:', error);
                return null;
            }

            logger.info(`Booking created: ${bookingNumber}`);
            return booking as Booking;
        } catch (error) {
            logger.error('BookingModel.createBooking error:', error);
            return null;
        }
    }

    /**
     * Get booking by ID
     */
    static async getBookingById(
        bookingId: string,
        garageId: string
    ): Promise<Booking | null> {
        try {
            // Clean the booking ID (remove # prefix if present)
            const cleanId = bookingId.replace('#', '');
            
            // First try to find by UUID (id field)
            let { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', cleanId)
                .eq('garage_id', garageId)
                .single();

            // If not found by UUID, try by booking_number
            if (error && error.code === 'PGRST116') {
                ({ data, error } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('booking_number', cleanId)
                    .eq('garage_id', garageId)
                    .single());
            }

            if (error) {
                if (error.code === 'PGRST116') {
                    logger.info(`Booking not found: ${cleanId} for garage: ${garageId}`);
                    return null;
                }
                logger.error('Error fetching booking:', error);
                return null;
            }

            return data as Booking;
        } catch (error) {
            logger.error('BookingModel.getBookingById error:', error);
            return null;
        }
    }

    /**
     * Get all bookings for a garage with filters
     */
    static async getBookings(
        garageId: string,
        filters?: BookingFilters,
        limit: number = 50,
        offset: number = 0
    ): Promise<{ bookings: Booking[]; total: number }> {
        try {
            let query = supabase
                .from('bookings')
                .select('*', { count: 'exact' })
                .eq('garage_id', garageId);

            // Apply filters
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.service_type) {
                query = query.eq('service_type', filters.service_type);
            }
            if (filters?.payment_status) {
                query = query.eq('payment_status', filters.payment_status);
            }
            if (filters?.date_from) {
                query = query.gte('booking_date', filters.date_from);
            }
            if (filters?.date_to) {
                query = query.lte('booking_date', filters.date_to);
            }
            if (filters?.search) {
                query = query.or(
                    `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,booking_number.ilike.%${filters.search}%`
                );
            }

            // Order and pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                logger.error('Error fetching bookings:', error);
                return { bookings: [], total: 0 };
            }

            return {
                bookings: (data as Booking[]) || [],
                total: count || 0,
            };
        } catch (error) {
            logger.error('BookingModel.getBookings error:', error);
            return { bookings: [], total: 0 };
        }
    }

    /**
     * Update booking
     */
    static async updateBooking(
        bookingId: string,
        garageId: string,
        updates: UpdateBookingInput
    ): Promise<Booking | null> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', bookingId)
                .eq('garage_id', garageId)
                .select()
                .single();

            if (error) {
                logger.error('Error updating booking:', error);
                return null;
            }

            logger.info(`Booking updated: ${bookingId}`);
            return data as Booking;
        } catch (error) {
            logger.error('BookingModel.updateBooking error:', error);
            return null;
        }
    }

    /**
     * Delete booking
     */
    static async deleteBooking(bookingId: string, garageId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId)
                .eq('garage_id', garageId);

            if (error) {
                logger.error('Error deleting booking:', error);
                return false;
            }

            logger.info(`Booking deleted: ${bookingId}`);
            return true;
        } catch (error) {
            logger.error('BookingModel.deleteBooking error:', error);
            return false;
        }
    }

    /**
     * Get booking statistics
     */
    static async getBookingStats(garageId: string): Promise<BookingStats | null> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('status, actual_cost')
                .eq('garage_id', garageId);

            if (error) {
                logger.error('Error fetching booking stats:', error);
                return null;
            }

            const bookings = data || [];
            const stats: BookingStats = {
                total_bookings: bookings.length,
                pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
                in_progress: bookings.filter(b => b.status === BookingStatus.IN_PROGRESS).length,
                completed: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
                cancelled: bookings.filter(b => b.status === BookingStatus.CANCELLED).length,
                total_revenue: bookings
                    .filter(b => b.actual_cost)
                    .reduce((sum, b) => sum + (b.actual_cost || 0), 0),
                avg_service_cost: 0,
            };

            if (stats.completed > 0) {
                stats.avg_service_cost = stats.total_revenue / stats.completed;
            }

            return stats;
        } catch (error) {
            logger.error('BookingModel.getBookingStats error:', error);
            return null;
        }
    }

    /**
     * Get dashboard statistics
     */
    static async getDashboardStats(garageId: string): Promise<DashboardStats | null> {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Get all bookings
            const { data: allBookings } = await supabase
                .from('bookings')
                .select('*')
                .eq('garage_id', garageId);

            if (!allBookings) return null;

            // Today's stats
            const todayBookings = allBookings.filter(b => b.created_at >= today);
            const todayCompleted = todayBookings.filter(b => b.status === BookingStatus.COMPLETED);

            // This week's stats
            const weekBookings = allBookings.filter(b => b.created_at >= weekAgo);
            const weekCompleted = weekBookings.filter(b => b.status === BookingStatus.COMPLETED);

            // This month's stats
            const monthBookings = allBookings.filter(b => b.created_at >= monthAgo);
            const monthCompleted = monthBookings.filter(b => b.status === BookingStatus.COMPLETED);

            // All time stats
            const completedBookings = allBookings.filter(b => b.status === BookingStatus.COMPLETED);
            const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.actual_cost || 0), 0);

            const stats: DashboardStats = {
                today: {
                    bookings: todayBookings.length,
                    revenue: todayCompleted.reduce((sum, b) => sum + (b.actual_cost || 0), 0),
                    completed_services: todayCompleted.length,
                },
                this_week: {
                    bookings: weekBookings.length,
                    revenue: weekCompleted.reduce((sum, b) => sum + (b.actual_cost || 0), 0),
                    completed_services: weekCompleted.length,
                },
                this_month: {
                    bookings: monthBookings.length,
                    revenue: monthCompleted.reduce((sum, b) => sum + (b.actual_cost || 0), 0),
                    completed_services: monthCompleted.length,
                },
                all_time: {
                    total_bookings: allBookings.length,
                    pending: allBookings.filter(b => b.status === BookingStatus.PENDING).length,
                    in_progress: allBookings.filter(b => b.status === BookingStatus.IN_PROGRESS).length,
                    completed: completedBookings.length,
                    cancelled: allBookings.filter(b => b.status === BookingStatus.CANCELLED).length,
                    total_revenue: totalRevenue,
                    avg_service_cost: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
                },
            };

            return stats;
        } catch (error) {
            logger.error('BookingModel.getDashboardStats error:', error);
            return null;
        }
    }
}
