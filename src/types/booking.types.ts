/**
 * Booking and Appointment Types
 * For AutoSaaz Garage Management System
 */

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export enum ServiceType {
    OIL_CHANGE = 'oil_change',
    AC_REPAIR = 'ac_repair',
    BATTERY_CHANGE = 'battery_change',
    TIRE_SERVICE = 'tire_service',
    BRAKE_SERVICE = 'brake_service',
    ENGINE_DIAGNOSTIC = 'engine_diagnostic',
    GENERAL_MAINTENANCE = 'general_maintenance',
    BODY_WORK = 'body_work',
    PAINTING = 'painting',
    ELECTRICAL = 'electrical',
    OTHER = 'other',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PARTIAL = 'partial',
    REFUNDED = 'refunded',
}

export interface Booking {
    id: string;
    booking_number: string;
    
    // Customer Information
    customer_id?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    
    // Vehicle Information
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    
    // Service Details
    service_type: ServiceType;
    service_description?: string;
    estimated_cost?: number;
    actual_cost?: number;
    
    // Booking Details
    booking_date: Date | string;
    scheduled_time?: string;
    completion_date?: Date | string;
    
    // Status
    status: BookingStatus;
    payment_status: PaymentStatus;
    
    // Garage Information
    garage_id: string;
    assigned_technician?: string;
    
    // Notes
    notes?: string;
    internal_notes?: string;
    
    // Timestamps
    created_at: Date | string;
    updated_at: Date | string;
}

export interface BookingStats {
    total_bookings: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    total_revenue: number;
    avg_service_cost: number;
}

export interface DashboardStats {
    today: {
        bookings: number;
        revenue: number;
        completed_services: number;
    };
    this_week: {
        bookings: number;
        revenue: number;
        completed_services: number;
    };
    this_month: {
        bookings: number;
        revenue: number;
        completed_services: number;
    };
    all_time: BookingStats;
}

export interface CreateBookingInput {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    service_type: ServiceType;
    service_description?: string;
    booking_date: string;
    scheduled_time?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    estimated_cost?: number;
    notes?: string;
}

export interface UpdateBookingInput {
    status?: BookingStatus;
    payment_status?: PaymentStatus;
    actual_cost?: number;
    completion_date?: string;
    assigned_technician?: string;
    internal_notes?: string;
}

export interface BookingFilters {
    status?: BookingStatus;
    service_type?: ServiceType;
    payment_status?: PaymentStatus;
    date_from?: string;
    date_to?: string;
    search?: string; // Search by customer name, phone, booking number
}
