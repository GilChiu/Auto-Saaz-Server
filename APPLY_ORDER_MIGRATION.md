# Apply Order Management Migration

## Instructions

To enable the Order Management features, you need to run this SQL migration in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/lblcjyeiwgyanadssqac/sql/new
2. This will open a new SQL query editor

### Step 2: Copy and Run This SQL

```sql
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

-- Drop old status constraint and add new one with only 3 statuses
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check CHECK (
  status IN ('pending', 'in_progress', 'completed')
);

-- Update existing statuses to match new constraint
UPDATE bookings SET status = 'pending' WHERE status IN ('confirmed', 'no_show');
UPDATE bookings SET status = 'completed' WHERE status = 'cancelled';

-- Comments for documentation
COMMENT ON COLUMN bookings.user_id IS 'Reference to customer user account';
COMMENT ON COLUMN bookings.recovery_status IS 'Vehicle recovery status: awaiting_confirmation, awaiting_pickup, assigned, driver_en_route, picked_up, at_garage, etc.';
COMMENT ON COLUMN bookings.inspection_report IS 'Detailed inspection findings and issues discovered';
COMMENT ON COLUMN bookings.quotation IS 'Quote amount provided to customer (AED)';
```

### Step 3: Click "RUN" button

The migration will add the necessary columns to support:
- ✅ Customer user reference (user_id)
- ✅ Recovery status tracking (awaiting_confirmation, assigned, driver_en_route, etc.)
- ✅ Inspection report storage
- ✅ Quotation amounts
- ✅ Simplified status workflow (pending → in_progress → completed)

### Step 4: Verify Success

Run this to confirm the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('user_id', 'recovery_status', 'inspection_report', 'quotation');
```

You should see 4 rows returned.

---

## What This Migration Does

1. **Customer Reference**: Adds `user_id` to link bookings to customer accounts
2. **Recovery Status**: Adds `recovery_status` field to track vehicle pickup and delivery stages
3. **Inspection Report**: Adds `inspection_report` text field for detailed findings
4. **Quotation**: Adds `quotation` numeric field for quote amounts (separate from estimated_cost)
5. **Status Simplification**: Updates status constraint to only allow: `pending`, `in_progress`, `completed`
6. **Performance**: Creates indexes on `user_id` and `recovery_status` for faster queries

---

## Recovery Status Values

The `recovery_status` field supports these values:
- `awaiting_confirmation` - Customer hasn't confirmed booking yet
- `awaiting_pickup` - Waiting for vehicle pickup
- `assigned` - Garage assigned to order
- `driver_en_route` - Driver on the way to pickup
- `picked_up` - Vehicle picked up from customer
- `at_garage` - Vehicle arrived at garage
- `diagnosing` - Garage diagnosing issues
- `parts_ordered` - Waiting for parts
- `under_repair` - Actively being repaired
- `painting` - In paint shop
- `quality_check` - Final quality inspection
- `completed` - Service completed

---

## Deployed Edge Functions

✅ **orders** - https://lblcjyeiwgyanadssqac.functions.supabase.co/orders (69.89kB)
- GET: List orders with pagination, search (customer + garage name), filter by status
- PATCH: Assign/change garage for an order

✅ **order-detail** - https://lblcjyeiwgyanadssqac.functions.supabase.co/order-detail/:id (67.53kB)
- GET: Fetch detailed order information with customer, garage, vehicle, service info

✅ **active-garages** - https://lblcjyeiwgyanadssqac.functions.supabase.co/active-garages (65.1kB)
- GET: List all active garages (for assignment dropdown)

---

## Admin Client Updated

✅ Deployed to Vercel: https://auto-saaz-admin-client-git-implement-api-gilchius-projects.vercel.app/orders/pending

Features:
- **Search**: By customer name and garage name
- **Pagination**: 10 orders per page
- **Status Filtering**: Pending, In Progress, Completed tabs
- **Assign Garage**: Click any order to assign/change garage
- **Professional UI**: Loading states, empty states, error handling
- **Real-time Data**: Live from Supabase database

### Recovery Status Display

The UI automatically formats recovery_status values:
- `awaiting_confirmation` → "Awaiting Confirmation"
- `driver_en_route` → "Driver En Route"
- `under_repair` → "Under Repair"
- etc.

### Payment Status Display

The UI shows payment_status values:
- `pending` → "Pending"
- `paid` → "Paid via Escrow"
- `partial` → "Partially Paid"
- `refunded` → "Refunded"

---

## Testing Checklist

After running the migration:

- [ ] Navigate to Order Management → Pending tab
- [ ] Verify orders load from database
- [ ] Test search by customer name
- [ ] Test search by garage name
- [ ] Click "Assign / Change Garage" button
- [ ] Verify active garages appear in modal
- [ ] Select a garage and click "Assign Garage"
- [ ] Verify order updates with new garage
- [ ] Check pagination works
- [ ] Test filtering by status (Pending/In Progress/Completed)

---

## Notes

- The migration updates existing bookings statuses to match the new constraint
- Old statuses like 'confirmed', 'no_show', 'cancelled' are automatically converted
- All Edge Functions are deployed and ready to use
- No changes needed to garage_profiles table (already has what we need)
