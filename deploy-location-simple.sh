#!/bin/bash

# VoiceVedic Real-Time Location API - Simple Deployment Script

set -e

echo "🚀 Deploying VoiceVedic Real-Time Location API (Simple Method)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    echo -e "${BLUE}📋 Loading environment variables...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Check required environment variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not set in .env file${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded successfully${NC}"

# Create a temporary SQL file with the migration
echo -e "${BLUE}🗄️  Creating migration file...${NC}"

cat > temp_location_migration.sql << 'EOF'
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

-- Create unique constraint on user_id to ensure one active location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_unique_user ON public.user_locations(user_id) WHERE is_active = true;

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
EOF

echo -e "${GREEN}✅ Migration file created${NC}"

echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Navigate to your project: lsreburdljvhqksbrckc"
echo "3. Go to SQL Editor"
echo "4. Copy and paste the contents of temp_location_migration.sql"
echo "5. Run the SQL commands"

echo -e "${BLUE}📋 Alternative: Use Supabase CLI${NC}"
echo "If you have Supabase CLI set up:"
echo "1. Run: supabase db push"
echo "2. This will apply all migrations including the new location table"

echo -e "${GREEN}✅ Real-time location API is ready to deploy!${NC}"
echo -e "${BLUE}📍 Once deployed, users can track their location in real-time.${NC}"

# Clean up
rm temp_location_migration.sql

echo -e "${BLUE}🔧 To test the real-time location tracking:${NC}"
echo "1. Start your development server: npm run dev"
echo "2. Log in to the app"
echo "3. Grant location permissions"
echo "4. Watch the 'Live' indicator appear"
echo "5. See real-time location updates" 