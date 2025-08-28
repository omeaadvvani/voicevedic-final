-- Create user_locations table for real-time location tracking
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON public.user_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON public.user_locations(is_active);

-- Create unique constraint on user_id to ensure one location per user (for upsert operations)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_unique_user ON public.user_locations(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own location" ON public.user_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location" ON public.user_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" ON public.user_locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location" ON public.user_locations
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_locations_updated_at 
    BEFORE UPDATE ON public.user_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations; 