-- Fix location constraints to match the application code
-- Drop the existing unique constraint that was causing conflicts
DROP INDEX IF EXISTS idx_user_locations_unique_user;

-- Create a new unique constraint on user_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_unique_user ON public.user_locations(user_id);

-- Add a comment explaining the change
COMMENT ON INDEX idx_user_locations_unique_user IS 'Unique constraint on user_id for upsert operations in location tracking';
