# VoiceVedic Real-Time Location API

## Overview

The VoiceVedic Real-Time Location API provides continuous location tracking for accurate ritual timings and location-based features. This implementation uses Supabase's real-time capabilities combined with browser geolocation APIs.

## Features

### 🎯 Core Features
- **Real-time GPS tracking** with high accuracy
- **Automatic location updates** every 30 seconds
- **Location history** and analytics
- **Geofencing capabilities** for location-based features
- **Privacy-protected** location data with RLS
- **Cross-device sync** via Supabase real-time subscriptions
- **Battery-optimized** updates with configurable intervals

### 🔧 Technical Features
- **Supabase real-time subscriptions** for live updates
- **Row Level Security (RLS)** for data protection
- **Automatic geocoding** with fallback mechanisms
- **Location accuracy tracking** and reporting
- **Offline location caching** for reliability
- **Error handling** with graceful fallbacks

## Architecture

### Database Schema

```sql
CREATE TABLE user_locations (
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
```

### Real-Time Subscriptions

The API uses Supabase's real-time subscriptions to:
- Broadcast location updates to all connected clients
- Sync location data across multiple devices
- Provide instant location-based notifications
- Enable collaborative location features

## Implementation

### Custom Hook: `useLocation`

```typescript
const {
  currentLocation,
  isTracking,
  error,
  accuracy,
  startLocationTracking,
  stopLocationTracking,
  getLocationName
} = useLocation(userId);
```

### Key Methods

#### `startLocationTracking()`
- Initializes GPS tracking
- Sets up real-time subscriptions
- Saves location to database
- Starts continuous monitoring

#### `stopLocationTracking()`
- Stops GPS tracking
- Clears real-time subscriptions
- Marks location as inactive
- Cleans up resources

#### `getLocationName(latitude, longitude)`
- Converts coordinates to location names
- Uses reliable geocoding service
- Provides fallback mechanisms
- Handles errors gracefully

## Usage Examples

### Basic Location Tracking

```typescript
import { useLocation } from './hooks/useLocation';

function MyComponent() {
  const { currentLocation, isTracking, startLocationTracking } = useLocation(userId);

  useEffect(() => {
    if (userId && !isTracking) {
      startLocationTracking();
    }
  }, [userId, isTracking]);

  return (
    <div>
      <p>Current Location: {currentLocation?.location_name}</p>
      <p>Tracking: {isTracking ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

### Location-Based Features

```typescript
// Geofencing example
const isInIndia = currentLocation && 
  currentLocation.latitude >= 6 && 
  currentLocation.latitude <= 37 && 
  currentLocation.longitude >= 68 && 
  currentLocation.longitude <= 97;

// Location-based notifications
useEffect(() => {
  if (isInIndia) {
    showIndianRitualTimings();
  }
}, [currentLocation]);
```

## Security & Privacy

### Row Level Security (RLS)
- Users can only access their own location data
- Automatic data isolation per user
- Secure API endpoints with authentication

### Data Protection
- Location data is encrypted in transit
- Automatic data retention policies
- User consent for location tracking
- GDPR-compliant data handling

## Performance Optimization

### Battery Optimization
- Configurable update intervals (default: 30 seconds)
- High-accuracy mode only when needed
- Background location updates disabled by default
- Smart location caching

### Network Optimization
- Efficient real-time subscriptions
- Minimal data transfer
- Offline capability with local caching
- Automatic reconnection handling

## Error Handling

### Common Error Scenarios
1. **Permission Denied**: User hasn't granted location access
2. **Position Unavailable**: GPS signal unavailable
3. **Timeout**: Location request timed out
4. **Network Error**: Connection issues
5. **Geocoding Failure**: Location name lookup failed

### Fallback Mechanisms
- Default location (India) when tracking fails
- Coordinate-based location detection
- Offline location caching
- Graceful degradation of features

## Deployment

### Database Migration
```bash
# Run the migration
./deploy-location-api.sh
```

### Environment Variables
```bash
export SUPABASE_URL=your_supabase_project_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Real-Time Setup
The migration automatically:
- Creates the `user_locations` table
- Enables real-time subscriptions
- Sets up RLS policies
- Creates necessary indexes

## Monitoring & Analytics

### Location Metrics
- Tracking accuracy statistics
- Update frequency monitoring
- Error rate tracking
- Battery usage optimization

### Performance Metrics
- Real-time subscription health
- Database query performance
- API response times
- User engagement analytics

## Future Enhancements

### Planned Features
- **Advanced Geofencing**: Custom boundary definitions
- **Location History**: Historical location tracking
- **Route Tracking**: Movement path analysis
- **Location Sharing**: Collaborative features
- **Offline Maps**: Local map caching
- **Location Analytics**: Usage insights

### Technical Improvements
- **WebSocket Optimization**: Better real-time performance
- **Machine Learning**: Predictive location features
- **Edge Computing**: Local processing capabilities
- **Progressive Web App**: Enhanced mobile experience

## Troubleshooting

### Common Issues

#### Location Not Updating
1. Check browser permissions
2. Verify GPS signal
3. Ensure user is authenticated
4. Check network connectivity

#### Real-Time Not Working
1. Verify Supabase real-time is enabled
2. Check subscription status
3. Ensure RLS policies are correct
4. Monitor network connectivity

#### High Battery Usage
1. Reduce update frequency
2. Disable high-accuracy mode
3. Implement smart tracking intervals
4. Use location caching

## Support

For technical support or questions about the Real-Time Location API:
- Check the Supabase documentation
- Review the error logs
- Test with the provided examples
- Contact the development team

---

**Note**: This API is designed for spiritual and wellness applications. Always respect user privacy and provide clear consent mechanisms for location tracking. 