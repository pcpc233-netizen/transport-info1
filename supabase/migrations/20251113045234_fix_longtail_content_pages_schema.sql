/*
  # Fix longtail_content_pages schema for content publishing
  
  1. Problem
    - publish-longtail-content Edge Function expects:
      - `content` column (not `content_html`)
      - `service_id` and `location_id` columns (not `route_id` and `stop_id`)
    - Current schema has:
      - `content_html` column
      - `route_id` and `stop_id` columns
    - Result: "Could not find the 'content' column" error
  
  2. Solution
    - Add `content` column (alias for content_html or separate)
    - Add `service_id` and `location_id` columns
    - Keep existing columns for backward compatibility
  
  3. Data Migration
    - Existing data remains intact
    - New content can use either schema
*/

-- Add missing columns to longtail_content_pages
DO $$
BEGIN
  -- Add content column (for markdown content)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'longtail_content_pages' AND column_name = 'content'
  ) THEN
    ALTER TABLE longtail_content_pages ADD COLUMN content text;
  END IF;

  -- Add service_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'longtail_content_pages' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE longtail_content_pages ADD COLUMN service_id uuid REFERENCES services(id) ON DELETE CASCADE;
  END IF;

  -- Add location_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'longtail_content_pages' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE longtail_content_pages ADD COLUMN location_id uuid REFERENCES keyword_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_longtail_pages_service ON longtail_content_pages(service_id);
CREATE INDEX IF NOT EXISTS idx_longtail_pages_location ON longtail_content_pages(location_id);

-- Update content_html to be nullable since we now have content column
ALTER TABLE longtail_content_pages ALTER COLUMN content_html DROP NOT NULL;
