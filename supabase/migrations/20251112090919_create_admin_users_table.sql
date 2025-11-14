/*
  # Create Admin Users System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Admin username
      - `password_hash` (text) - Hashed password
      - `email` (text, unique) - Admin email
      - `is_active` (boolean) - Account status
      - `last_login_at` (timestamptz) - Last login time
      - `created_at` (timestamptz) - Account creation time
      - `updated_at` (timestamptz) - Last update time
    
    - `admin_sessions`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key) - Reference to admin_users
      - `session_token` (text, unique) - Session token
      - `ip_address` (text) - Login IP
      - `user_agent` (text) - Browser info
      - `expires_at` (timestamptz) - Session expiry
      - `created_at` (timestamptz) - Session creation time
    
    - `admin_activity_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key) - Reference to admin_users
      - `action` (text) - Action performed
      - `resource_type` (text) - Type of resource
      - `resource_id` (uuid) - Resource ID
      - `details` (jsonb) - Additional details
      - `ip_address` (text) - Request IP
      - `created_at` (timestamptz) - Log time

  2. Security
    - Enable RLS on all tables
    - Admin tables are completely isolated from public access
    - Only accessible through secure Edge Functions
    - All actions are logged for audit trail

  3. Important Notes
    - Passwords are stored as bcrypt hashes
    - Sessions expire after 24 hours
    - All admin actions are logged
    - Initial admin account must be created manually
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (restrictive - no direct access)
-- These tables are only accessible through Edge Functions with service role key

CREATE POLICY "No direct access to admin_users"
  ON admin_users FOR ALL
  USING (false);

CREATE POLICY "No direct access to admin_sessions"
  ON admin_sessions FOR ALL
  USING (false);

CREATE POLICY "No direct access to admin_activity_logs"
  ON admin_activity_logs FOR ALL
  USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();