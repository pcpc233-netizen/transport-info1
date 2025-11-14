/*
  # Fix automation_logs INSERT policy
  
  1. Problem
    - automation_logs table only has SELECT policy
    - Edge Functions cannot INSERT logs
    - Result: 0 content published, no logs recorded
  
  2. Solution
    - Add INSERT policy for service_role
    - Allow Edge Functions to write logs
  
  3. Security
    - service_role only (Edge Functions)
    - No public INSERT allowed
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can insert automation logs" ON automation_logs;

-- Create INSERT policy for service_role
CREATE POLICY "Service role can insert automation logs"
ON automation_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add UPDATE policy for service_role (in case needed)
CREATE POLICY "Service role can update automation logs"
ON automation_logs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
