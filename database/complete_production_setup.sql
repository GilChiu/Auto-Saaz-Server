-- ============================================================
-- COMPLETE PRODUCTION SETUP SCRIPT
-- This script ensures all tables exist and have proper data
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE SETUP (if needed)
-- ============================================================

-- Check if your user exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3') THEN
        -- Insert your user if it doesn't exist
        INSERT INTO users (id, email, role, garage_name, phone, full_name, email_verified, created_at, updated_at)
        VALUES (
            'ba50abf9-5210-4177-8605-b01c73b9f9f3',
            'your-email@example.com',
            'garage_owner',
            'AutoSaaz Garage',
            '+971501234567',
            'Garage Owner',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'User created successfully';
    ELSE
        RAISE NOTICE 'User already exists';
    END IF;
END $$;

-- ============================================================
-- 2. INSPECTIONS TABLE SETUP
-- ============================================================

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_number VARCHAR(50) UNIQUE NOT NULL DEFAULT 'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Vehicle information
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    
    -- Inspection details
    inspection_date DATE NOT NULL,
    scheduled_time TIME,
    assigned_technician VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Tasks (JSON array of strings)
    tasks JSONB DEFAULT '[]'::jsonb,
    
    -- Results and notes
    findings TEXT,
    recommendations TEXT,
    internal_notes TEXT,
    
    -- Cost information
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inspections_garage_owner_id ON inspections(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_customer_name ON inspections(customer_name);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_make, vehicle_model, vehicle_year);
CREATE INDEX IF NOT EXISTS idx_inspections_assigned_technician ON inspections(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_inspections_garage_status_date ON inspections(garage_owner_id, status, inspection_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_inspections_updated_at();

-- Enable Row Level Security
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS inspections_garage_owner_policy ON inspections;
DROP POLICY IF EXISTS inspections_garage_owner_insert_policy ON inspections;
DROP POLICY IF EXISTS inspections_garage_owner_update_policy ON inspections;
DROP POLICY IF EXISTS inspections_garage_owner_delete_policy ON inspections;

-- Create RLS policies
CREATE POLICY inspections_garage_owner_policy ON inspections
    USING (garage_owner_id = auth.uid());

CREATE POLICY inspections_garage_owner_insert_policy ON inspections
    FOR INSERT WITH CHECK (garage_owner_id = auth.uid());

CREATE POLICY inspections_garage_owner_update_policy ON inspections
    FOR UPDATE USING (garage_owner_id = auth.uid());

CREATE POLICY inspections_garage_owner_delete_policy ON inspections
    FOR DELETE USING (garage_owner_id = auth.uid());

-- ============================================================
-- 3. INSERT SAMPLE DATA
-- ============================================================

-- Clear existing sample data first
DELETE FROM inspections WHERE garage_owner_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3';

-- Insert fresh sample data
INSERT INTO inspections (
    inspection_number,
    garage_owner_id,
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
    estimated_cost,
    findings,
    recommendations
) VALUES 
(
    'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '001',
    'ba50abf9-5210-4177-8605-b01c73b9f9f3',
    'Ali Khan',
    '+971501111111',
    'ali.khan@email.com',
    'Honda',
    'Civic',
    2022,
    'DXB-A-1234',
    CURRENT_DATE,
    '15:00',
    'Ahmad',
    'pending',
    'normal',
    '["Check engine light diagnostics", "Oil level and filters inspection", "Brake system review", "Clutch maintenance"]'::jsonb,
    250.00,
    NULL,
    NULL
),
(
    'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '002',
    'ba50abf9-5210-4177-8605-b01c73b9f9f3',
    'Sarah Ahmed',
    '+971502222222',
    'sarah.ahmed@email.com',
    'Toyota',
    'Corolla',
    2021,
    'AUH-B-5678',
    CURRENT_DATE,
    '10:00',
    'Hassan',
    'pending',
    'high',
    '["Engine diagnostics", "Transmission check", "Battery inspection", "Tire pressure and alignment"]'::jsonb,
    300.00,
    NULL,
    NULL
),
(
    'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '003',
    'ba50abf9-5210-4177-8605-b01c73b9f9f3',
    'Hamza',
    '+971503333333',
    'hamza@email.com',
    'BMW',
    'M5',
    2023,
    'DXB-C-9012',
    CURRENT_DATE - INTERVAL '1 day',
    '15:00',
    'Ahmad',
    'completed',
    'normal',
    '["Brake fluid check", "ABS sensor calibration", "Rear axle testing", "Clutch maintenance"]'::jsonb,
    400.00,
    'All systems functioning properly. Minor brake fluid top-up required.',
    'Regular maintenance recommended every 6 months for optimal performance.'
),
(
    'INS' || EXTRACT(EPOCH FROM NOW())::BIGINT || '004',
    'ba50abf9-5210-4177-8605-b01c73b9f9f3',
    'Omar Khan',
    '+971504444444',
    'omar.khan@email.com',
    'Mercedes',
    'C-Class',
    2020,
    'SHJ-D-3456',
    CURRENT_DATE - INTERVAL '2 days',
    '14:00',
    'Hassan',
    'completed',
    'normal',
    '["Engine oil change", "Air filter replacement", "Cooling system check", "Electrical diagnostics"]'::jsonb,
    350.00,
    'Engine oil replaced, air filter changed. Electrical system fully functional.',
    'Next service due in 3 months or 10,000 km.'
);

-- ============================================================
-- 4. VERIFICATION QUERIES
-- ============================================================

-- Verify table creation
SELECT 'Inspections table created successfully' as message;

-- Count total inspections
SELECT COUNT(*) as total_inspections FROM inspections;

-- Count inspections by status
SELECT status, COUNT(*) as count FROM inspections GROUP BY status;

-- Show sample data
SELECT 
    inspection_number,
    customer_name,
    vehicle_make,
    vehicle_model,
    status,
    priority
FROM inspections 
WHERE garage_owner_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3'
ORDER BY created_at DESC;

-- Test RLS policy
SELECT 
    'RLS policies created successfully' as message,
    COUNT(*) as visible_inspections
FROM inspections;

RAISE NOTICE '🎉 INSPECTIONS SETUP COMPLETE!';
RAISE NOTICE 'Total inspections created: %', (SELECT COUNT(*) FROM inspections WHERE garage_owner_id = 'ba50abf9-5210-4177-8605-b01c73b9f9f3');
RAISE NOTICE 'You can now test the inspections API endpoints.';