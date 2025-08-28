import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Globe, LogIn, UserPlus, Headphones, ChevronDown, MapPin, AlertCircle, Navigation } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import Logo from './components/Logo';
import GuestOnboardingScreen from './components/GuestOnboardingScreen';
import SignUpScreen from './components/SignUpScreen';
import LoginScreen from './components/LoginScreen';
import DemoScreen from './components/DemoScreen';
import ResetPinScreen from './components/ResetPinScreen';
import MainExperienceScreen from './components/MainExperienceScreen';
import SettingsScreen from './components/SettingsScreen';
import AskVoiceVedicExperience from './components/AskVoiceVedicExperience';
import SupabaseTest from './components/SupabaseTest';

function App() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSacredText, setShowSacredText] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'signup' | 'guest-onboarding' | 'login' | 'demo' | 'reset-pin' | 'main-experience' | 'settings'>('home');
  const [location, setLocation] = useState<string>('Detecting location...');
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [supabaseError, setSupabaseError] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<string>('home');
  const [isNavigating, setIsNavigating] = useState(false);
  // Add a new state for location timeout and error
  // const [locationTimeout, setLocationTimeout] = useState(false); // Removed as not needed with real-time tracking
  const [authTimeout, setAuthTimeout] = useState(false);
  const [authError, setAuthError] = useState('');
  const [locationWarning, setLocationWarning] = useState('');
  
  // Conversation state to persist across navigation and app switching
  const [conversationMessages, setConversationMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>(() => {
    // Load conversations from localStorage on app start
    try {
      const saved = localStorage.getItem('voicevedic-conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load conversations from localStorage:', error);
    }
    return [];
  });

  const { user, userProfile, loading: authLoading, error: authHookError, signOut } = useAuth();
  const { 
    currentLocation, 
    isTracking, 
    error: locationError, 
    accuracy, 
    startLocationTracking,
    stopLocationTracking 
  } = useLocation(user?.id);

  const languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Malayalam',
    'Kannada'
  ];

  // Check for reset-pin route on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/reset-pin') {
      setCurrentScreen('reset-pin');
    }
  }, []);

  // Check Supabase configuration on mount
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'your_supabase_project_url' || 
        supabaseAnonKey === 'your_supabase_anon_key' ||
        supabaseUrl.includes('placeholder') ||
        supabaseAnonKey.includes('placeholder')) {
      setSupabaseError('Supabase is not fully configured. App will run in demo mode.');
    }
  }, []);

  // Auto-detect location on component mount
  useEffect(() => {
    console.log('Location hook state:', { 
      userId: user?.id, 
      isTracking, 
      currentLocation: currentLocation?.location_name,
      locationError 
    });
    
    if (user?.id && !isTracking && !currentLocation) {
      console.log('Starting location tracking...');
      // Start real-time location tracking when user is authenticated
      startLocationTracking();
    } else if (!user?.id) {
      console.log('No user logged in, using simple location detection');
      // Simple location detection for non-authenticated users
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude, accuracy } = position.coords;
              console.log(`Location detected: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
              
              // Use simple location detection
              const locationName = await getPreciseLocationName(latitude, longitude);
              
              setLocation(locationName);
              setLocationStatus('success');
              setLocationWarning(''); // Clear any previous warnings
              console.log('Location detected:', locationName);
            } catch (error) {
              console.error('Location detection error:', error);
              setLocation('Location not detected');
              setLocationStatus('success');
              setLocationWarning('Location detection failed. Please try again.');
            }
          },
          (error) => {
            console.error('Location detection failed:', error);
            setLocation('Location not detected');
            setLocationStatus('success'); // Set as success to not show error
            // Only show warning for actual errors, not fallbacks
            if (error.code === error.PERMISSION_DENIED) {
              setLocationWarning('Location access denied. Please enable location permissions.');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              setLocationWarning('Location unavailable. Please check your device settings.');
            } else if (error.code === error.TIMEOUT) {
              setLocationWarning('Location request timed out. Please try again.');
            } else {
              setLocationWarning(''); // Don't show warning for normal fallbacks
            }
          },
          { 
            timeout: 10000, // Reduced timeout
            enableHighAccuracy: false, // Don't require high accuracy
            maximumAge: 300000 // Allow cached location up to 5 minutes
          }
        );
      } else {
        console.log('Geolocation not supported, using default location');
        setLocation('Location not supported');
        setLocationStatus('success');
        setLocationWarning(''); // Don't show warning for normal fallbacks
      }
    }
  }, [user?.id, isTracking, currentLocation, startLocationTracking, locationError]);

  // Update location state when real-time location changes
  useEffect(() => {
    console.log('Location update effect:', { 
      currentLocation: currentLocation?.location_name,
      accuracy,
      locationStatus 
    });
    
    if (currentLocation) {
      console.log('Setting location to:', currentLocation.location_name);
      setLocation(currentLocation.location_name);
      setLocationStatus('success');
      setLocationWarning(''); // Clear any warnings when location is successfully detected
      if (accuracy) {
        console.log(`Location accuracy: ${accuracy} meters`);
      }
    }
  }, [currentLocation, accuracy, locationStatus]);

  // Set loading status when tracking starts
  useEffect(() => {
    if (isTracking && !currentLocation) {
      setLocationStatus('loading');
      setLocation('Detecting location...');
        }
  }, [isTracking, currentLocation]);

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      console.error('Location tracking error:', locationError);
      // Only show warning for actual errors, not normal fallbacks
      if (locationError.includes('permission denied') || 
          locationError.includes('unavailable') || 
          locationError.includes('timeout')) {
        setLocationWarning(locationError);
      } else {
        setLocationWarning(''); // Clear warnings for normal fallbacks
      }
      setLocation('Location not detected');
      setLocationStatus('success'); // Set as success to not show error UI
    }
  }, [locationError]);

  // Handle user authentication state changes
  useEffect(() => {
    if (!authLoading && user) {
      // If user already has profile, show main experience
      if (userProfile || guestMode) {
        setCurrentScreen('main-experience');
      }
    }
    
    // Handle authentication errors
    if (authHookError && !authLoading) {
      console.error('Authentication error:', authHookError);
      // If authentication fails, allow user to continue as guest or retry
      setAuthError(authHookError);
    }
  }, [user, userProfile, authLoading, authHookError, guestMode]);

  // Add a timeout for authLoading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (authLoading) {
      timeoutId = setTimeout(() => {
        setAuthTimeout(true);
        setAuthError('Authentication is taking too long. Please check your connection or try again.');
      }, 10000);
    } else {
      setAuthTimeout(false);
      // Don't clear authError here as it might be set by the useAuth hook
    }
    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogin = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('login');
      setIsNavigating(false);
    }, 100);
  };

  const handleSignUp = () => {
    if (supabaseError) {
      alert(supabaseError);
      return;
    }
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('signup');
      setIsNavigating(false);
    }, 100);
  };

  const handleContinueAsGuest = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('guest-onboarding');
      setIsNavigating(false);
    }, 100);
  };

  const handleBackToHome = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('home');
      setGuestMode(false);
      setPreviousScreen('home');
      setIsNavigating(false);
      // Clear URL if we're on reset-pin route
      if (window.location.pathname === '/reset-pin') {
        window.history.pushState({}, '', '/');
      }
    }, 100);
  };

  const handleBackToMainExperience = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleSignUpComplete = () => {
    // After successful sign-up, move directly to main experience
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleGuestOnboardingComplete = () => {
    // Guest onboarding completed - move to main experience in guest mode
    setGuestMode(true);
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleLoginComplete = () => {
    // Login completed - move to main experience
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('main-experience');
      setIsNavigating(false);
    }, 100);
  };

  const handleTryDemo = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('demo');
      setIsNavigating(false);
    }, 100);
  };

  const handleShowSettings = () => {
    // Store current screen as previous for proper back navigation
    setPreviousScreen(currentScreen);
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('settings');
      setIsNavigating(false);
    }, 100);
  };

  const handleResetPinComplete = () => {
    // PIN reset completed, redirect to login
    alert('Your PIN has been reset successfully! Please log in with your new PIN.');
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentScreen('login');
      setIsNavigating(false);
      // Clear URL
      window.history.pushState({}, '', '/');
    }, 100);
  };

  // High-precision location name detection
  const getPreciseLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
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
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };


  // Conversation management functions with localStorage persistence
  const addMessage = (message: { id: string; type: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    setConversationMessages(prev => {
      const newMessages = [...prev, message];
      // Save to localStorage
      try {
        localStorage.setItem('voicevedic-conversations', JSON.stringify(newMessages));
      } catch (error) {
        console.warn('Failed to save conversation to localStorage:', error);
      }
      return newMessages;
    });

  };

  const clearConversation = () => {
    setConversationMessages([]);
    // Clear from localStorage
    try {
      localStorage.removeItem('voicevedic-conversations');
    } catch (error) {
      console.warn('Failed to clear conversation from localStorage:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      
      // Call Supabase signOut
      await signOut();
      
      // Reset all state
      setGuestMode(false);
      setPreviousScreen('home');
      setConversationMessages([]); // Clear conversation on logout
      // Also clear from localStorage
      try {
        localStorage.removeItem('voicevedic-conversations');
      } catch (error) {
        console.warn('Failed to clear localStorage on logout:', error);
      }
      
      // Navigate to home screen with delay to prevent loading screen flash
      setTimeout(() => {
        setCurrentScreen('home');
        setIsNavigating(false);
      }, 300);
      
      // Optional: Show logout success message
      console.log('Logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, still redirect to home for UX
      setTimeout(() => {
        setCurrentScreen('home');
        setIsNavigating(false);
      }, 300);
    }
  };

  // Fade in the sacred text after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth state or navigating
  if ((authLoading && !authTimeout) || isNavigating) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-spiritual-700 tracking-spiritual">
            {authLoading ? 'Loading...' : 'Navigating...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if auth loading timed out
  if (authTimeout) {
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-700 tracking-spiritual font-semibold mb-2">
            {authError || 'Could not authenticate your session.'}
          </p>
          <button
            className="px-4 py-2 bg-spiritual-500 text-white rounded shadow"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show error if location detection failed or timed out
  if (locationStatus === 'error' && currentScreen === 'home') {
    // Set default location and proceed
    if (!locationWarning) {
      setLocation('India');
      setLocationStatus('success');
      setLocationWarning('Location unavailable. Using default location: India.');
      setCurrentScreen('main-experience');
    }
    // Show a quick message before proceeding
    return (
      <div className="min-h-screen bg-spiritual-diagonal flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-yellow-700 tracking-spiritual font-semibold mb-2">
            Location unavailable. Please check your device settings.
          </p>
          <p className="text-spiritual-700">You can continue using the app.</p>
        </div>
      </div>
    );
  }

  // Show Reset PIN screen if on that route
  if (currentScreen === 'reset-pin') {
    return <ResetPinScreen onComplete={handleResetPinComplete} onBack={handleBackToHome} />;
  }

  // Show Main Experience if user is authenticated or in guest mode
  if (currentScreen === 'main-experience') {
    return (
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <MainExperienceScreen 
                onShowSettings={handleShowSettings}
                onLogout={guestMode ? handleBackToHome : handleLogout}
                locationWarning={locationWarning}
                currentLocation={location}
              />
            } 
          />
          <Route 
            path="/ask" 
            element={
              <AskVoiceVedicExperience 
                onBack={() => window.history.back()}
                messages={conversationMessages}
                onAddMessage={addMessage}
                onClearConversation={clearConversation}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  if (currentScreen === 'signup') {
    return <SignUpScreen onComplete={handleSignUpComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'guest-onboarding') {
    return <GuestOnboardingScreen onComplete={handleGuestOnboardingComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onComplete={handleLoginComplete} onBack={handleBackToHome} />;
  }

  if (currentScreen === 'demo') {
    return <DemoScreen onBack={handleBackToHome} />;
  }

  if (currentScreen === 'settings') {
    // Determine the correct back handler based on previous screen
    const backHandler = previousScreen === 'main-experience' ? handleBackToMainExperience : handleBackToHome;
    return (
      <SettingsScreen 
        onBack={backHandler}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Supabase Error Banner */}
      {supabaseError && (
        <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-3 z-30">
          <div className="flex items-center justify-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium tracking-spiritual">{supabaseError}</p>
          </div>
        </div>
      )}
      
      {/* Location Warning Banner */}
      {locationWarning && (
        <div className={`absolute ${supabaseError ? 'top-16' : 'top-0'} left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-3 z-30`}>
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium tracking-spiritual">{locationWarning}</p>
            <button
              onClick={() => setLocationWarning('')}
              className="ml-2 p-1 text-yellow-600 hover:text-yellow-700 transition-colors"
              title="Dismiss warning"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
      <div className={`absolute bottom-24 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-spiritual text-spiritual-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ lineHeight: '1.3' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Top Right Controls - Language & Location */}
      <div className={`absolute ${supabaseError && locationWarning ? 'top-32' : supabaseError || locationWarning ? 'top-20' : 'top-6'} right-6 z-20 flex items-center gap-4`}>
        
        {/* Real-Time Location Tracking */}
        <div className="group relative">
          <div 
            className={`flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 ${
              locationStatus === 'success' ? 'hover:bg-white hover:shadow-spiritual-lg' : ''
            }`}
            title="Real-time location tracking for accurate ritual timings"
          >
            {isTracking ? (
              <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
            ) : (
            <MapPin className={`w-5 h-5 transition-colors duration-300 ${
              locationStatus === 'loading' ? 'text-spiritual-500 animate-pulse' :
              locationStatus === 'success' ? 'text-accent-600' :
              'text-gray-400'
            }`} />
            )}
            <span className={`text-sm font-medium transition-colors duration-300 tracking-spiritual ${
              locationStatus === 'loading' ? 'text-spiritual-700' :
              locationStatus === 'success' ? 'text-spiritual-800' :
              'text-gray-500'
            }`}>
              {location}
            </span>
            {locationStatus === 'loading' && (
              <div className="w-3 h-3 border border-spiritual-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            {isTracking && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            )}
            {(locationStatus === 'error' || locationStatus === 'loading') && (
              <button
                onClick={() => {
                  if (user?.id) {
                    console.log('Manual start location tracking');
                    startLocationTracking();
                  } else {
                    setLocationWarning('Please log in to enable real-time location tracking.');
                  }
                }}
                className="ml-2 p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors"
                title="Start location tracking"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {isTracking && (
              <button
                onClick={() => stopLocationTracking()}
                className="ml-2 p-1 text-red-600 hover:text-red-700 transition-colors"
                title="Stop location tracking"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-spiritual-900 text-white text-xs rounded-spiritual opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30 shadow-spiritual-lg">
            Real-time location tracking for accurate ritual timings
            <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-spiritual-900"></div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          >
            <Globe className="w-5 h-5 text-spiritual-600" />
            <span className="text-sm">{selectedLanguage}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-card shadow-spiritual-lg border border-spiritual-100 overflow-hidden min-w-32 z-30">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-spiritual-50 transition-colors duration-200 tracking-spiritual ${
                    selectedLanguage === language 
                      ? 'bg-spiritual-100 text-spiritual-800 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Authentication Loading Screen */}
      {(authLoading || authTimeout || authError) && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {authLoading && !authTimeout && (
              <>
                <div className="w-16 h-16 border-4 border-spiritual-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-spiritual-900 mb-4 tracking-spiritual">
                  Connecting to VoiceVedic...
                </h2>
                <p className="text-spiritual-700 mb-8 tracking-spiritual">
                  Please wait while we authenticate your session.
                </p>
              </>
            )}
            
            {(authTimeout || authError) && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-spiritual-900 mb-4 tracking-spiritual">
                  Connection Issue
                </h2>
                <p className="text-spiritual-700 mb-6 tracking-spiritual">
                  {authError || 'Authentication is taking too long. Please check your connection.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-spiritual-600 text-white rounded-button font-medium tracking-spiritual hover:bg-spiritual-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleContinueAsGuest}
                    className="px-6 py-3 bg-white border-2 border-spiritual-300 text-spiritual-700 rounded-button font-medium tracking-spiritual hover:border-spiritual-400 transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Location Test Component - Removed to avoid obstruction */}

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center min-h-screen px-6 pb-24 relative z-10 ${supabaseError ? 'pt-20' : ''}`}>
        
        {/* Center Block */}
        <div className="text-center mb-12 max-w-2xl animate-fade-in">
          {/* Logo */}
          <div className="mb-8">
            <Logo size="large" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
            Namaste. Welcome to
            <br />
            <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          <h2 className="text-xl md:text-2xl text-spiritual-800/80 font-medium mb-8 tracking-spiritual line-height-spiritual-relaxed">
            Your daily spiritual companion
          </h2>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-6 w-full max-w-sm animate-slide-up">
          {/* Login Button */}
          <button 
            onClick={handleLogin}
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <LogIn className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Login</span>
          </button>

          {/* Sign Up Button - Direct to Sign Up */}
          <button 
            onClick={handleSignUp}
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-900/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-900 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            
            <UserPlus className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
            <span className="text-lg tracking-spiritual">Sign Up</span>
          </button>

          {/* Try Demo Button */}
          <button 
            onClick={handleTryDemo}
            disabled={isNavigating}
            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 bg-white border-2 border-spiritual-300 hover:border-spiritual-400 text-spiritual-900 font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Subtle Background Glow */}
            <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-100 to-spiritual-200 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            
            <Headphones className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300 relative z-10" />
            <span className="text-lg tracking-spiritual relative z-10">Try Demo</span>
          </button>


        </div>

        {/* Guest Access */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleContinueAsGuest}
            disabled={isNavigating}
            className="group text-spiritual-700 hover:text-spiritual-600 font-medium transition-colors duration-300 relative tracking-spiritual disabled:opacity-50 disabled:cursor-not-allowed"
            title="Explore basic features without logging in"
          >
            <span className="relative">
              Continue as Guest
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-spiritual-400 group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cream-100/60 to-transparent py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Terms of Service
            </a>
            <span className="text-spiritual-400">|</span>
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              Privacy Policy
            </a>
            <span className="text-spiritual-400">|</span>
            <a href="#" className="text-spiritual-700 hover:text-spiritual-600 transition-colors duration-300 hover:underline tracking-spiritual">
              About Us
            </a>
          </div>
          <div className="text-center text-spiritual-600 text-sm font-medium tracking-spiritual">
            Made with love by the VoiceVedic Team
          </div>
        </div>
      </footer>

      {/* Click outside to close dropdown */}
      {isLanguageDropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsLanguageDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;