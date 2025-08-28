/*
  # Upgrade user_preferences table for monitoring & security

  1. New Columns Added
    - `updated_at` (timestamptz) - Track when preferences were last updated
    - `updated_by_admin` (boolean) - Flag for admin-made changes
    - `timezone` (text) - Full timezone string for accurate ritual timing
    - `device_type` (text) - Track user device for analytics
    - `is_active` (boolean) - Soft delete/deactivation capability

  2. Features
    - Auto-updating timestamp trigger for updated_at
    - Proper defaults for all new fields
    - Indexes for performance on commonly queried fields
    - Maintains existing RLS policies

  3. Security
    - No changes to existing RLS policies
    - All new fields respect existing user isolation
*/

-- Add new columns to user_preferences table
DO $$
BEGIN
  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL;
  END IF;

  -- Add updated_by_admin column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'updated_by_admin'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN updated_by_admin boolean DEFAULT false NOT NULL;
  END IF;

  -- Add timezone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN timezone text;
  END IF;

  -- Add device_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN device_type text;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS user_preferences_updated_at_idx ON user_preferences(updated_at);
CREATE INDEX IF NOT EXISTS user_preferences_is_active_idx ON user_preferences(is_active);
CREATE INDEX IF NOT EXISTS user_preferences_timezone_idx ON user_preferences(timezone);
CREATE INDEX IF NOT EXISTS user_preferences_device_type_idx ON user_preferences(device_type);
CREATE INDEX IF NOT EXISTS user_preferences_updated_by_admin_idx ON user_preferences(updated_by_admin);

-- Update existing records to have proper updated_at values (set to created_at if available)
UPDATE user_preferences 
SET updated_at = created_at 
WHERE updated_at IS NULL AND created_at IS NOT NULL;

-- For records without created_at, set updated_at to now
UPDATE user_preferences 
SET updated_at = now() 
WHERE updated_at IS NULL;