/*
  # Fix Admin Sessions RLS for Service Role Access

  1. Changes
    - Modify admin_sessions table RLS policies to allow service_role access
    - Service role needs to create and verify sessions for admin login/verify functions

  2. Security
    - Service role bypass is intentional for server-side authentication operations
    - Authenticated users can still only read their own sessions
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service role can manage admin sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON admin_sessions;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role can manage admin sessions"
  ON admin_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read only their own sessions
CREATE POLICY "Users can read own sessions"
  ON admin_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
