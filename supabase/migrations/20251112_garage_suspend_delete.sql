-- Migration: Add suspend and soft delete support for garage_profiles
-- Created: 2025-11-12
-- Purpose: Add columns to support garage suspension and soft deletion

-- Add suspended_at column for tracking garage suspension
ALTER TABLE garage_profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add deleted_at column for soft deletion
ALTER TABLE garage_profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Add garage_name column if it doesn't exist (for display purposes)
ALTER TABLE garage_profiles 
ADD COLUMN IF NOT EXISTS garage_name VARCHAR(255);

-- Add rating column if it doesn't exist
ALTER TABLE garage_profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0;

-- Create index for suspended garages
CREATE INDEX IF NOT EXISTS idx_garage_profiles_suspended_at ON garage_profiles(suspended_at);

-- Create index for deleted garages
CREATE INDEX IF NOT EXISTS idx_garage_profiles_deleted_at ON garage_profiles(deleted_at);

-- Update status values to include 'suspended' if needed
-- The status field already exists, we just use it with new values: 'active', 'suspended', 'pending_verification', etc.

COMMENT ON COLUMN garage_profiles.suspended_at IS 'Timestamp when garage was suspended. NULL means not suspended.';
COMMENT ON COLUMN garage_profiles.deleted_at IS 'Timestamp for soft deletion. NULL means not deleted.';
COMMENT ON COLUMN garage_profiles.rating IS 'Garage rating from 0.0 to 5.0';
