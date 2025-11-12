-- Migration: Enhance bookings table for Order Management
-- Created: 2025-11-13
-- Purpose: Add necessary columns and constraints for admin order management

-- Add user_id for customer reference
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add recovery status (Awaiting Pickup, Assigned, Driver En Route, etc.)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS recovery_status VARCHAR(50) DEFAULT 'awaiting_confirmation';

-- Add inspection report text
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS inspection_report TEXT;

-- Add quotation amount
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS quotation NUMERIC(10,2);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Create index for recovery_status
CREATE INDEX IF NOT EXISTS idx_bookings_recovery_status ON bookings(recovery_status);

-- Update existing statuses to match new constraint FIRST (before dropping constraint)
UPDATE bookings SET status = 'pending' WHERE status IN ('confirmed', 'no_show');
UPDATE bookings SET status = 'completed' WHERE status = 'cancelled';

-- Drop old status constraint and add new one with only 3 statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check CHECK (
  status IN ('pending', 'in_progress', 'completed')
);

-- Comments for documentation
COMMENT ON COLUMN bookings.user_id IS 'Reference to customer user account';
COMMENT ON COLUMN bookings.recovery_status IS 'Vehicle recovery status: awaiting_confirmation, awaiting_pickup, assigned, driver_en_route, picked_up, at_garage, etc.';
COMMENT ON COLUMN bookings.inspection_report IS 'Detailed inspection findings and issues discovered';
COMMENT ON COLUMN bookings.quotation IS 'Quote amount provided to customer (AED)';
