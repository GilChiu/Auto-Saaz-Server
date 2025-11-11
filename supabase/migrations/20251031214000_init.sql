-- Initial schema migration (renamed to match CLI pattern)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	email VARCHAR(255) UNIQUE NOT NULL,
	password TEXT NOT NULL,
	role VARCHAR(50) NOT NULL DEFAULT 'garage_owner' CHECK (role IN ('garage_owner', 'admin', 'mobile_user')),
	status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'active', 'suspended', 'rejected')),
	failed_login_attempts INTEGER DEFAULT 0,
	locked_until TIMESTAMP WITH TIME ZONE,
	last_login_at TIMESTAMP WITH TIME ZONE,
	last_login_ip VARCHAR(50),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- garage_profiles
CREATE TABLE IF NOT EXISTS garage_profiles (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
	full_name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	phone_number VARCHAR(20) NOT NULL,
	address TEXT,
	street VARCHAR(255),
	state VARCHAR(100),
	location VARCHAR(255),
	coordinates JSONB,
	company_legal_name VARCHAR(255),
	emirates_id_url TEXT,
	trade_license_number VARCHAR(100),
	vat_certification VARCHAR(100),
	role VARCHAR(50) DEFAULT 'garage_owner',
	status VARCHAR(50) DEFAULT 'pending_verification',
	is_email_verified BOOLEAN DEFAULT FALSE,
	is_phone_verified BOOLEAN DEFAULT FALSE,
	email_verified_at TIMESTAMP WITH TIME ZONE,
	phone_verified_at TIMESTAMP WITH TIME ZONE,
	failed_login_attempts INTEGER DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	CONSTRAINT unique_user_profile UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_garage_profiles_user_id ON garage_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_email ON garage_profiles(email);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_phone ON garage_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_garage_profiles_status ON garage_profiles(status);

-- verification_codes
CREATE TABLE IF NOT EXISTS verification_codes (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	email VARCHAR(255),
	phone_number VARCHAR(20),
	code VARCHAR(10) NOT NULL,
	method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'phone', 'both')),
	attempts INTEGER DEFAULT 0,
	is_used BOOLEAN DEFAULT FALSE,
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- registration_sessions
CREATE TABLE IF NOT EXISTS registration_sessions (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	session_id VARCHAR(255) UNIQUE NOT NULL,
	full_name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	phone_number VARCHAR(20) NOT NULL,
	address TEXT,
	street VARCHAR(255),
	state VARCHAR(100),
	location VARCHAR(255),
	coordinates JSONB,
	company_legal_name VARCHAR(255),
	emirates_id_url TEXT,
	trade_license_number VARCHAR(100),
	vat_certification VARCHAR(100),
	step_completed INTEGER DEFAULT 1,
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_sessions_session_id ON registration_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_email ON registration_sessions(email);
CREATE INDEX IF NOT EXISTS idx_registration_sessions_expires ON registration_sessions(expires_at);

-- file_uploads
CREATE TABLE IF NOT EXISTS file_uploads (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	file_name VARCHAR(255) NOT NULL,
	original_name VARCHAR(255) NOT NULL,
	file_type VARCHAR(100) NOT NULL,
	file_size INTEGER NOT NULL,
	storage_path TEXT NOT NULL,
	public_url TEXT NOT NULL,
	upload_type VARCHAR(50) NOT NULL CHECK (upload_type IN ('emirates_id', 'trade_license', 'vat_certificate', 'other')),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(upload_type);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	booking_number VARCHAR(50) UNIQUE NOT NULL,
	garage_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	customer_name VARCHAR(255) NOT NULL,
	customer_phone VARCHAR(20) NOT NULL,
	customer_email VARCHAR(255),
	service_type VARCHAR(50) NOT NULL,
	service_description TEXT,
	booking_date DATE NOT NULL,
	scheduled_time VARCHAR(10),
	vehicle_make VARCHAR(100),
	vehicle_model VARCHAR(100),
	vehicle_year INTEGER,
	vehicle_plate_number VARCHAR(20),
	estimated_cost DECIMAL(10,2),
	actual_cost DECIMAL(10,2),
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
	payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
	completion_date TIMESTAMP WITH TIME ZONE,
	assigned_technician VARCHAR(255),
	notes TEXT,
	internal_notes TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_garage_id ON bookings(garage_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	appointment_number VARCHAR(50) UNIQUE NOT NULL,
	garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	customer_name VARCHAR(255) NOT NULL,
	customer_phone VARCHAR(20) NOT NULL,
	customer_email VARCHAR(255),
	vehicle_make VARCHAR(100),
	vehicle_model VARCHAR(100),
	vehicle_year INTEGER,
	vehicle_plate_number VARCHAR(20),
	service_type VARCHAR(100) NOT NULL,
	service_description TEXT,
	appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
	scheduled_time VARCHAR(10),
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
	priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
	estimated_duration INTEGER,
	estimated_cost DECIMAL(10,2),
	actual_cost DECIMAL(10,2),
	assigned_technician VARCHAR(255),
	completion_date TIMESTAMP WITH TIME ZONE,
	notes TEXT,
	internal_notes TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_garage_owner_id ON appointments(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_number ON appointments(appointment_number);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_name ON appointments(customer_name);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_make ON appointments(vehicle_make);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_model ON appointments(vehicle_model);
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle_plate ON appointments(vehicle_plate_number);

-- inspections
CREATE TABLE IF NOT EXISTS inspections (
	id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
	inspection_number VARCHAR(50) UNIQUE NOT NULL,
	garage_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	customer_name VARCHAR(255) NOT NULL,
	customer_phone VARCHAR(20),
	customer_email VARCHAR(255),
	vehicle_make VARCHAR(100),
	vehicle_model VARCHAR(100),
	vehicle_year INTEGER,
	vehicle_plate_number VARCHAR(20),
	inspection_date DATE NOT NULL,
	scheduled_time TIME,
	assigned_technician VARCHAR(255),
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
	priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
	tasks JSONB DEFAULT '[]',
	findings TEXT,
	recommendations TEXT,
	internal_notes TEXT,
	estimated_cost DECIMAL(10,2),
	actual_cost DECIMAL(10,2),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_inspections_garage_owner_id ON inspections(garage_owner_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_customer_name ON inspections(customer_name);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_make, vehicle_model, vehicle_year);
CREATE INDEX IF NOT EXISTS idx_inspections_assigned_technician ON inspections(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at);
CREATE INDEX IF NOT EXISTS idx_inspections_garage_status_date ON inspections(garage_owner_id, status, inspection_date);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE ON users
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_garage_profiles_updated_at ON garage_profiles;
CREATE TRIGGER update_garage_profiles_updated_at
	BEFORE UPDATE ON garage_profiles
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registration_sessions_updated_at ON registration_sessions;
CREATE TRIGGER update_registration_sessions_updated_at
	BEFORE UPDATE ON registration_sessions
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
	BEFORE UPDATE ON bookings
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
	BEFORE UPDATE ON appointments
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at
	BEFORE UPDATE ON inspections
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- RLS enable
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Service role wide access
DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access profiles" ON garage_profiles;
CREATE POLICY "Service role full access profiles" ON garage_profiles FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access codes" ON verification_codes;
CREATE POLICY "Service role full access codes" ON verification_codes FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access registration_sessions" ON registration_sessions;
CREATE POLICY "Service role full access registration_sessions" ON registration_sessions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access files" ON file_uploads;
CREATE POLICY "Service role full access files" ON file_uploads FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access bookings" ON bookings;
CREATE POLICY "Service role full access bookings" ON bookings FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access appointments" ON appointments;
CREATE POLICY "Service role full access appointments" ON appointments FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access inspections" ON inspections;
CREATE POLICY "Service role full access inspections" ON inspections FOR ALL USING (auth.role() = 'service_role');
