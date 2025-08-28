/*
  # Add email column to user_preferences table

  1. Changes
    - Add `email` column to `user_preferences` table
    - Set it as NOT NULL with a default empty string for existing records
    - Add index for email lookups

  2. Security
    - No changes to RLS policies needed
    - Email will be populated from auth.user.email automatically
*/

-- Add email column to user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS user_preferences_email_idx ON user_preferences(email);