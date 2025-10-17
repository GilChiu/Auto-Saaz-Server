/**
 * Inspection TypeScript Types
 * Defines interfaces for inspection-related data structures
 */

export interface Inspection {
    id: string;
    inspection_number: string;
    garage_owner_id: string;
    
    // Customer information
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    
    // Vehicle information
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    
    // Inspection details
    inspection_date: string;
    scheduled_time?: string;
    assigned_technician?: string;
    status: InspectionStatus;
    priority: InspectionPriority;
    
    // Tasks and results
    tasks: string[];
    findings?: string;
    recommendations?: string;
    internal_notes?: string;
    
    // Cost information
    estimated_cost?: number;
    actual_cost?: number;
    
    // Timestamps
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InspectionPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateInspectionRequest {
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    inspection_date: string;
    scheduled_time?: string;
    assigned_technician?: string;
    priority?: InspectionPriority;
    tasks?: string[];
    estimated_cost?: number;
    internal_notes?: string;
}

export interface UpdateInspectionRequest {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate_number?: string;
    inspection_date?: string;
    scheduled_time?: string;
    assigned_technician?: string;
    status?: InspectionStatus;
    priority?: InspectionPriority;
    tasks?: string[];
    findings?: string;
    recommendations?: string;
    internal_notes?: string;
    estimated_cost?: number;
    actual_cost?: number;
}

export interface InspectionFilters {
    status?: InspectionStatus;
    priority?: InspectionPriority;
    assigned_technician?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    vehicle_make?: string;
}

export interface InspectionStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    completed_today: number;
    pending_overdue: number;
    average_completion_time?: number; // in hours
}

export interface InspectionListResponse {
    inspections: Inspection[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}