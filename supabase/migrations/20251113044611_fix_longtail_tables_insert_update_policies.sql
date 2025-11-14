/*
  # Fix longtail tables INSERT/UPDATE policies
  
  1. Problem
    - longtail_content_pages only has SELECT policy
    - longtail_combinations only has SELECT policy
    - Edge Functions cannot INSERT/UPDATE
    - Result: 0 content published
  
  2. Solution
    - Add INSERT policy for longtail_content_pages
    - Add UPDATE policy for longtail_combinations
    - Allow Edge Functions to write/update content
  
  3. Security
    - service_role only (Edge Functions)
    - No public INSERT/UPDATE allowed
    - Public can only SELECT published content
*/

-- longtail_content_pages policies
DROP POLICY IF EXISTS "Service role can insert content pages" ON longtail_content_pages;
DROP POLICY IF EXISTS "Service role can update content pages" ON longtail_content_pages;

CREATE POLICY "Service role can insert content pages"
ON longtail_content_pages
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update content pages"
ON longtail_content_pages
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- longtail_combinations policies
DROP POLICY IF EXISTS "Service role can update combinations" ON longtail_combinations;

CREATE POLICY "Service role can update combinations"
ON longtail_combinations
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
