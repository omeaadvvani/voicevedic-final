-- Create voice_settings table for ElevenLabs integration
CREATE TABLE IF NOT EXISTS voice_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  stability DECIMAL(3,2) DEFAULT 0.5 CHECK (stability >= 0 AND stability <= 1),
  similarity_boost DECIMAL(3,2) DEFAULT 0.5 CHECK (similarity_boost >= 0 AND similarity_boost <= 1),
  style DECIMAL(3,2) DEFAULT 0.0 CHECK (style >= 0 AND style <= 1),
  use_speaker_boost BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_settings_user_id ON voice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_settings_voice_id ON voice_settings(voice_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_voice_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_voice_settings_updated_at
  BEFORE UPDATE ON voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own voice settings" ON voice_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice settings" ON voice_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice settings" ON voice_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice settings" ON voice_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default voice settings for existing users (optional)
-- This can be run manually if needed
-- INSERT INTO voice_settings (user_id, voice_id, voice_name, stability, similarity_boost, style, use_speaker_boost)
-- SELECT id, '21m00Tcm4TlvDq8ikWAM', 'Rachel', 0.7, 0.75, 0.0, true
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM voice_settings); 