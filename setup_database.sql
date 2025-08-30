-- VoiceVedic Database Setup Script
-- Run this in your Supabase SQL Editor to fix account creation and location issues

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  calendar_tradition text NOT NULL DEFAULT 'North Indian',
  preferred_language text NOT NULL DEFAULT 'English',
  selected_rituals text[] NOT NULL DEFAULT '{}',
  notification_time text NOT NULL DEFAULT '07:00',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create user_locations table
CREATE TABLE IF NOT EXISTS public.user_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL,
    accuracy DOUBLE PRECISION,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security on both tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Create policies for user_locations
DROP POLICY IF EXISTS "Users can view their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can delete their own location" ON public.user_locations;

CREATE POLICY "Users can view their own location" ON public.user_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location" ON public.user_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" ON public.user_locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location" ON public.user_locations
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON public.user_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON public.user_locations(is_active);

-- Create unique constraint on user_id to ensure one active location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_unique_user ON public.user_locations(user_id) WHERE is_active = true;

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for both tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_locations_updated_at ON public.user_locations;
CREATE TRIGGER update_user_locations_updated_at 
    BEFORE UPDATE ON public.user_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable real-time for user_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- 10. Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON public.user_locations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Success message
SELECT 'VoiceVedic database setup completed successfully!' as status;
