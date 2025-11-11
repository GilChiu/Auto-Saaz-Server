# Apply Garage Management Migration

## Instructions

To enable the suspend and delete features for Garage Management, you need to run this SQL migration in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/lblcjyeiwgyanadssqac/sql/new
2. This will open a new SQL query editor

### Step 2: Copy and Run This SQL

```sql
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
```

### Step 3: Click "RUN" button

The migration will add the necessary columns to support:
- ✅ Garage suspension (with reason and admin tracking)
- ✅ Soft deletion (with admin tracking)
- ✅ Garage name field
- ✅ Rating system

### Step 4: Verify Success

Run this to confirm the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'garage_profiles' 
AND column_name IN ('suspended_at', 'deleted_at', 'garage_name', 'rating', 'suspended_by', 'deleted_by', 'suspension_reason');
```

You should see 7 rows returned.

---

## What This Migration Does

1. **Suspension Support**: Adds `suspended_at`, `suspended_by`, `suspension_reason` to track when and why a garage was suspended
2. **Soft Delete Support**: Adds `deleted_at`, `deleted_by` to track deleted garages (they remain in DB but marked as deleted)
3. **Garage Name**: Adds `garage_name` field for better display (separate from owner's full name)
4. **Rating System**: Adds `rating` field (0.0 to 5.0) for garage ratings
5. **Performance**: Creates indexes on `suspended_at` and `deleted_at` for faster queries

---

## Deployed Edge Functions

✅ **garages** - https://lblcjyeiwgyanadssqac.functions.supabase.co/garages
- GET: List garages with pagination, search, filtering
- PATCH: Suspend/unsuspend garage
- DELETE: Soft delete garage

✅ **garage-detail** - https://lblcjyeiwgyanadssqac.functions.supabase.co/garage-detail/:id
- GET: Fetch detailed garage info with statistics

---

## Admin Client Updated

✅ Deployed to Vercel: https://auto-saaz-admin-client-git-implement-api-gilchius-projects.vercel.app/garages

Features:
- Search garages by name, email, phone, location
- Pagination (10 per page)
- View garage details
- Suspend/unsuspend garage
- Delete garage (soft delete)
- Professional loading and empty states
- Real-time data from Supabase
