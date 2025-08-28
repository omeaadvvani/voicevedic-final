# Location Tracking Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to start location tracking" Error

**Possible Causes:**
- Missing Supabase environment variables
- Browser location permissions denied
- Database table missing
- Network connectivity issues

**Solutions:**

#### A. Check Environment Variables
Create a `.env` file in the `homepage` directory with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### B. Check Browser Permissions
1. Open browser settings
2. Go to Privacy & Security > Site Settings > Location
3. Allow location access for localhost:5173
4. Refresh the page

#### C. Check Database Table
Ensure the `user_locations` table exists in your Supabase database with this structure:
```sql
CREATE TABLE user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  location_name TEXT NOT NULL,
  accuracy DECIMAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### 2. Location Permission Denied

**Solution:**
1. Click the location icon in your browser's address bar
2. Select "Allow" for location access
3. Refresh the page

### 3. HTTPS Requirement

**Issue:** Modern browsers require HTTPS for geolocation API
**Solution:** Use `localhost` for development (HTTPS not required for localhost)

### 4. Debugging Steps

1. **Open Browser Console** (F12)
2. **Look for these log messages:**
   - "Starting location tracking for user: [user-id]"
   - "Geolocation permission status: [status]"
   - "Location obtained: [coordinates]"
   - "Location saved to database successfully"

3. **Check for errors:**
   - Permission denied errors
   - Database connection errors
   - Network timeout errors

### 5. Fallback Behavior

If location tracking fails, the app will:
- Use a default location (India)
- Show a warning message
- Continue functioning with limited location-based features

### 6. Testing Location

To test if location is working:
1. Open browser console
2. Look for location-related log messages
3. Check if coordinates are being obtained
4. Verify location name is being resolved

### 7. Manual Location Override

If location tracking continues to fail, you can manually set your location in the app preferences.

## Getting Help

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify your Supabase configuration
3. Ensure you're using a modern browser with geolocation support
4. Try clearing browser cache and cookies 