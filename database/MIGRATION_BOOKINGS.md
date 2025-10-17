# Database Migration: Add Bookings Table

This migration adds the `bookings` table to support the booking management system.

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy and paste the SQL below
   - Click "Run" or press `Ctrl+Enter`

```sql
-- ============================================================
-- TABLE: bookings
-- Description: Customer bookings for garage services
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  garage_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Service Information
  service_type VARCHAR(50) NOT NULL,
  service_description TEXT,
  booking_date DATE NOT NULL,
  scheduled_time VARCHAR(10),
  
  -- Vehicle Information
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_plate_number VARCHAR(20),
  
  -- Financial Information
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- Status Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Assignment
  assigned_technician VARCHAR(255),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS idx_bookings_garage_id ON bookings(garage_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = garage_id);

CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = garage_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = garage_id);

CREATE POLICY "Users can delete own bookings" ON bookings
  FOR DELETE USING (auth.uid() = garage_id);

CREATE POLICY "Service role full access bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');
```

4. **Verify Migration**
   - Run the verification query:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'bookings'
   ORDER BY ordinal_position;
   ```

### Option 2: Using Full Schema (Fresh Database)

If you're setting up a fresh database or want to recreate everything:

1. **Backup existing data** (if any)
2. **Run the full schema**:
   - Use the complete `database/schema.sql` file
   - This includes all tables: users, garage_profiles, verification_codes, registration_sessions, file_uploads, **bookings**

### Option 3: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migration
supabase db push

# Or apply manually
supabase db execute --file database/migration_add_bookings.sql
```

## Sample Data (Optional for Testing)

```sql
-- Insert sample bookings (replace <garage-user-id> with actual user ID)
INSERT INTO bookings (
  booking_number,
  garage_id,
  customer_name,
  customer_phone,
  customer_email,
  service_type,
  service_description,
  booking_date,
  scheduled_time,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_plate_number,
  estimated_cost,
  status,
  payment_status
) VALUES
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '001', '<garage-user-id>', 'Ali Khan', '+971501234567', 'ali@example.com', 'oil_change', 'Full synthetic oil change', CURRENT_DATE, '10:00', 'Toyota', 'Camry', 2020, 'ABC123', 250.00, 'in_progress', 'pending'),
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '002', '<garage-user-id>', 'Sara Malik', '+971509876543', 'sara@example.com', 'ac_repair', 'AC compressor replacement', CURRENT_DATE, '11:30', 'Honda', 'Civic', 2019, 'XYZ789', 800.00, 'completed', 'paid'),
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '003', '<garage-user-id>', 'Hamza Ahmed', '+971505555555', null, 'battery_change', 'Battery replacement', CURRENT_DATE + 1, '09:00', 'Nissan', 'Altima', 2021, 'DEF456', 350.00, 'pending', 'pending'),
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '004', '<garage-user-id>', 'Rehman Ali', '+971501111111', 'rehman@example.com', 'tire_service', 'All four tires replacement', CURRENT_DATE - 1, '14:00', 'Ford', 'Explorer', 2018, 'GHI789', 1200.00, 'completed', 'paid'),
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '005', '<garage-user-id>', 'Noor Khan', '+971502222222', null, 'brake_service', 'Brake pads and rotors', CURRENT_DATE, '15:30', 'Chevrolet', 'Malibu', 2020, 'JKL012', 600.00, 'in_progress', 'pending'),
  ('BK' || (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint || '006', '<garage-user-id>', 'Sunny Ahmed', '+971503333333', 'sunny@example.com', 'engine_diagnostic', 'Check engine light diagnostic', CURRENT_DATE + 2, '10:30', 'BMW', '3 Series', 2022, 'MNO345', 150.00, 'confirmed', 'pending');
```

## Post-Migration Verification

Run these queries to verify everything is working:

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'bookings'
);

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'bookings';

-- Check RLS policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'bookings';

-- Count records (should be 0 for new migration, or 6 if you ran sample data)
SELECT COUNT(*) FROM bookings;
```

## Rollback (If Needed)

To rollback this migration:

```sql
-- Drop the table (WARNING: This deletes all data)
DROP TABLE IF EXISTS bookings CASCADE;
```

## Environment Variables

No new environment variables are required for this migration. The booking system uses the existing Supabase configuration.

## Next Steps

After running this migration:

1. ✅ Test booking creation: `POST /api/bookings`
2. ✅ Test booking listing: `GET /api/bookings`
3. ✅ Test dashboard stats: `GET /api/dashboard/stats`
4. ✅ Update frontend to use new endpoints

## Troubleshooting

### Error: "relation bookings does not exist"
- Make sure you ran the migration SQL in the correct database
- Check if you're connected to the right Supabase project

### Error: "permission denied for table bookings"
- Verify RLS policies are created
- Check that you're using the service role key in your backend (not anon key)

### Error: "duplicate key value violates unique constraint"
- The `booking_number` must be unique
- BookingModel.generateBookingNumber() creates unique IDs automatically

## Support

If you encounter issues, check:
- Supabase Dashboard > Table Editor > bookings
- Supabase Dashboard > Database > Roles (verify service_role permissions)
- Backend logs for detailed error messages
