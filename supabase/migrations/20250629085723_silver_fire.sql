/*
  # Create user_preferences table for VoiceVedic app

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, foreign key to auth.users)
      - `language` (text, user's selected app language)
      - `calendar_type` (text, Hindu calendar style)
      - `location` (text, auto-detected location - optional)
      - `notification_time` (time, daily spiritual reminders - optional)
      - `created_at` (timestamp, auto-set to now())

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policy for authenticated users to read/write their own preferences only
    - Foreign key constraint with cascade delete

  3. Features
    - Supports upsert operations to prevent duplicates
    - Optimized with indexes for fast lookups
    - Auto-timestamps for audit trail
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language text NOT NULL,
  calendar_type text NOT NULL,
  location text,
  notification_time time,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow logged-in users to read and write their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_preferences_language_idx ON user_preferences(language);
CREATE INDEX IF NOT EXISTS user_preferences_calendar_type_idx ON user_preferences(calendar_type);

-- Add unique constraint to prevent duplicate preferences per user
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);