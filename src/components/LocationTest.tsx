import React, { useState, useEffect } from 'react';

const LocationTest: React.FC = () => {
  const [locationStatus, setLocationStatus] = useState<string>('Checking...');
  const [coordinates, setCoordinates] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testLocation = () => {
      if (!('geolocation' in navigator)) {
        setLocationStatus('Geolocation not supported');
        return;
      }

      setLocationStatus('Requesting location...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCoordinates(`${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
          setLocationStatus('Location obtained successfully!');
          setError('');
        },
        (error) => {
          setLocationStatus('Location error');
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError('Location permission denied. Please allow location access.');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Location information unavailable.');
              break;
            case error.TIMEOUT:
              setError('Location request timed out.');
              break;
            default:
              setError(`Location error: ${error.message}`);
          }
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    };

    testLocation();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <h3>Location Test</h3>
      <p><strong>Status:</strong> {locationStatus}</p>
      {coordinates && <p><strong>Coordinates:</strong> {coordinates}</p>}
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      <button onClick={() => window.location.reload()}>Refresh Test</button>
    </div>
  );
};

export default LocationTest; 