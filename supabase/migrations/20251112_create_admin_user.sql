-- Create admin user for admin panel login
-- Password: admin123 (hashed with bcrypt)

-- Insert admin user
INSERT INTO users (id, email, password, role, status, created_at, updated_at)
VALUES (
  '1c142243-3b97-4b8b-91f1-d4e5e7a4431b',
  'admin@autosaaz.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosgTBNTGzrm',
  'admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Create admin profile in garage_profiles
INSERT INTO garage_profiles (user_id, email, garage_name, status, created_at, updated_at)
VALUES (
  '1c142243-3b97-4b8b-91f1-d4e5e7a4431b',
  'admin@autosaaz.com',
  'AutoSaaz Admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  garage_name = EXCLUDED.garage_name,
  status = EXCLUDED.status,
  updated_at = NOW();
