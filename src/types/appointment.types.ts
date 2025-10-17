/**
 * Appointment Types
 * Defines TypeScript interfaces for appointment-related data structures
 */

export interface Appointment {
    id: string;
    appointment_number: string;
    garage_owner_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    service_type: string;
    service_description?: string;
    appointment_date: string; // ISO date string
    scheduled_time?: string; // Time in HH:MM format
    status: AppointmentStatus;
    priority: AppointmentPriority;
    estimated_duration?: number; // in minutes
    estimated_cost?: number;
    actual_cost?: number;
    notes?: string;
    internal_notes?: string;
    assigned_technician?: string;
    completion_date?: string;
    created_at: string;
    updated_at: string;
}

export enum AppointmentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export enum AppointmentPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export interface CreateAppointmentData {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    service_type: string;
    service_description?: string;
    appointment_date: string;
    scheduled_time?: string;
    priority?: AppointmentPriority;
    estimated_duration?: number;
    estimated_cost?: number;
    notes?: string;
}

export interface UpdateAppointmentData {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    service_type?: string;
    service_description?: string;
    appointment_date?: string;
    scheduled_time?: string;
    status?: AppointmentStatus;
    priority?: AppointmentPriority;
    estimated_duration?: number;
    estimated_cost?: number;
    actual_cost?: number;
    notes?: string;
    internal_notes?: string;
    assigned_technician?: string;
    completion_date?: string;
}

export interface AppointmentFilters {
    status?: AppointmentStatus;
    priority?: AppointmentPriority;
    service_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string; // Search by customer name, phone, vehicle, etc.
}

export interface AppointmentStats {
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    todayAppointments: number;
    weekAppointments: number;
    monthAppointments: number;
    statusBreakdown: {
        [key in AppointmentStatus]: number;
    };
    priorityBreakdown: {
        [key in AppointmentPriority]: number;
    };
    averageAppointmentValue: number;
    totalRevenue: number;
}

export interface DashboardAppointmentStats {
    today: {
        appointments: number;
        confirmed: number;
        pending: number;
        completed: number;
    };
    week: {
        appointments: number;
        confirmed: number;
        pending: number;
        completed: number;
    };
    month: {
        appointments: number;
        confirmed: number;
        pending: number;
        completed: number;
    };
    upcoming: Appointment[];
}