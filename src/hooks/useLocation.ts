import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LocationData {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  accuracy?: number;
  timestamp: string;
  is_active: boolean;
}

export interface LocationState {
  currentLocation: LocationData | null;
  isTracking: boolean;
  error: string | null;
  accuracy: number | null;
  lastUpdate: Date | null;
}

export const useLocation = (userId?: string) => {
  const [locationState, setLocationState] = useState<LocationState>({
    currentLocation: null,
    isTracking: false,
    error: null,
    accuracy: null,
    lastUpdate: null
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  // Initialize location tracking
  const startLocationTracking = useCallback(async () => {
    console.log('Starting location tracking for user:', userId);
    
    if (!userId) {
      console.log('No user ID provided, using fallback location detection');
      setLocationState(prev => ({ ...prev, error: 'User ID required for location tracking' }));
      return;
    }

    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported by browser');
      setLocationState(prev => ({ ...prev, error: 'Geolocation not supported by browser' }));
      return;
    }

    try {
      setLocationState(prev => ({ ...prev, isTracking: true, error: null }));

      // Check if we have permission first
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('Geolocation permission status:', permission.state);
      
      if (permission.state === 'denied') {
        throw new Error('Location permission denied by user');
      }

      // Get initial position with better error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, 20000); // 20 second timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (error) => {
            clearTimeout(timeoutId);
            let errorMessage = 'Failed to get location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your device location settings.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = `Location error: ${error.message}`;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      console.log('Location obtained:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      const locationData: LocationData = {
        user_id: userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_name: await getLocationName(position.coords.latitude, position.coords.longitude),
        accuracy: position.coords.accuracy || undefined,
        timestamp: new Date().toISOString(),
        is_active: true
      };

      console.log('Location data prepared:', locationData);

      // Try to save to Supabase, but don't fail if it doesn't work
      try {
        await saveLocationToDatabase(locationData);
        console.log('Location saved to database successfully');
      } catch (dbError) {
        console.warn('Failed to save location to database:', dbError);
        // Continue with local state even if database save fails
      }

      setLocationState(prev => ({
        ...prev,
        currentLocation: locationData,
        accuracy: position.coords.accuracy,
        lastUpdate: new Date(),
        isTracking: true
      }));

      // Start watching for position changes
      const newWatchId = navigator.geolocation.watchPosition(
        async (position) => {
          console.log('Location update received:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });

          const updatedLocationData: LocationData = {
            user_id: userId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_name: await getLocationName(position.coords.latitude, position.coords.longitude),
            accuracy: position.coords.accuracy || undefined,
            timestamp: new Date().toISOString(),
            is_active: true
          };

          // Try to save to database, but don't fail if it doesn't work
          try {
            await saveLocationToDatabase(updatedLocationData);
          } catch (dbError) {
            console.warn('Failed to save location update to database:', dbError);
          }

          setLocationState(prev => ({
            ...prev,
            currentLocation: updatedLocationData,
            accuracy: position.coords.accuracy,
            lastUpdate: new Date()
          }));
        },
        (error) => {
          console.error('Location watch error:', error);
          let errorMessage = 'Location tracking error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied during tracking';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable during tracking';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location tracking timed out';
              break;
            default:
              errorMessage = `Location tracking error: ${error.message}`;
          }
          
          setLocationState(prev => ({
            ...prev,
            error: errorMessage,
            isTracking: false
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000 // Update every 30 seconds
        }
      );

      setWatchId(newWatchId);
      console.log('Location tracking started successfully');

    } catch (error) {
      console.error('Location tracking start error:', error);
      setLocationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start location tracking',
        isTracking: false
      }));
    }
  }, [userId]);

  // Stop location tracking
  const stopLocationTracking = useCallback(async () => {
    console.log('Stopping location tracking');
    
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (userId) {
      // Try to mark location as inactive in database
      try {
        const { error } = await supabase
          .from('user_locations')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating location status:', error);
        } else {
          console.log('Location tracking stopped and database updated');
        }
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      }
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      currentLocation: null
    }));
  }, [watchId, userId]);

  // Get location name from coordinates with improved fallback
  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('Getting location name for coordinates:', latitude, longitude);
      
      // Use HTTPS Nominatim service for reverse geocoding (works on HTTPS)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`);
        const data = await response.json();
        
        if (data.address) {
          let cityName = data.address.city || data.address.town || data.address.village;
          let countryName = data.address.country;
          
          if (cityName && countryName) {
            console.log('Location resolved via Nominatim:', cityName, countryName);
            return `${cityName}, ${countryName}`;
          } else if (cityName) {
            return cityName;
          } else if (countryName) {
            return countryName;
          }
        }
      } catch (nominatimError) {
        console.warn('Nominatim geocoding failed:', nominatimError);
      }
      
      // Fallback to coordinate-based detection for major regions
      if (latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
        return 'India';
      } else if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
        return 'United States';
      } else if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
        return 'Europe';
      } else if (latitude >= -60 && latitude <= 15 && longitude >= -80 && longitude <= -35) {
        return 'South America';
      } else if (latitude >= -35 && latitude <= 37 && longitude >= -20 && longitude <= 55) {
        return 'Africa';
      } else if (latitude >= -10 && latitude <= 50 && longitude >= 60 && longitude <= 180) {
        return 'Asia';
      } else if (latitude >= -45 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
        return 'Australia';
      } else {
        // If we can't determine region, show coordinates
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.warn('Location detection failed, using coordinates:', error);
      // Return coordinates instead of hardcoded "India"
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // Save location to Supabase database with better error handling
  const saveLocationToDatabase = async (locationData: LocationData) => {
    try {
      console.log('Attempting to save location to database:', locationData);
      
      // First, deactivate any existing active location for this user
      const { error: deactivateError } = await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', locationData.user_id)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('Failed to deactivate existing location:', deactivateError);
      }

      // Then insert the new location
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: locationData.user_id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          location_name: locationData.location_name,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp,
          is_active: locationData.is_active
        });

      if (error) {
        console.error('Error saving location to database:', error);
        throw error;
      }
      
      console.log('Location saved to database successfully');
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  };

  // Subscribe to real-time location updates from other users
  useEffect(() => {
    if (!userId) return;

    console.log('Setting up real-time location subscription for user:', userId);

    const channel = supabase
      .channel('user_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time location update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const locationData = payload.new as LocationData;
            setLocationState(prev => ({
              ...prev,
              currentLocation: locationData,
              lastUpdate: new Date()
            }));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time location subscription');
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        console.log('Cleaning up location watch on unmount');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...locationState,
    startLocationTracking,
    stopLocationTracking,
    getLocationName
  };
}; 