import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Headphones, 
  MessageCircle, 
  LogOut, 
  ArrowRight,
  ChevronRight,
  MapPin, 
  Clock, 
  Sparkles, 
  Moon, 
  Sun, 
  Bell,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';


interface MainExperienceScreenProps {
  onShowSettings: () => void;
  onLogout?: () => void;
  locationWarning?: string;
  currentLocation?: string;
}

interface SpiritualEvent {
  id: string;
  name: string;
  date: string;
  time_start: string;
  time_end: string;
  guidance: string;
  type: 'tithi' | 'festival' | 'fast' | 'prayer';
}



const MainExperienceScreen: React.FC<MainExperienceScreenProps> = ({ 
  onShowSettings,
  onLogout,
  locationWarning,
  currentLocation
}) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [showSacredText, setShowSacredText] = useState(false);
  const [todayEvent, setTodayEvent] = useState<SpiritualEvent | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyGreeting, setDailyGreeting] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);

  // Set daily greeting on mount
  useEffect(() => {
    const day = new Date().toLocaleDateString("en-IN", { weekday: 'long' });
    
    let greeting = "";
    
    switch (day) {
      case "Monday":
        greeting = "Om Namah Shivaya – It's Monday";
        break;
      case "Tuesday":
        greeting = "Jai Hanuman – Tuesday brings strength and focus";
        break;
      case "Wednesday":
        greeting = "Chant Ram Naam – Stay balanced this Wednesday";
        break;
      case "Thursday":
        greeting = "Hari Om – Thursday is for Vishnu worship and knowledge";
        break;
      case "Friday":
        greeting = "Jai Maa Lakshmi – Invite abundance this Friday";
        break;
      case "Saturday":
        greeting = "Shani Dev's day – Reflect and stay disciplined";
        break;
      case "Sunday":
        greeting = "Surya Arghya – Offer sunlight to your soul today";
        break;
      default:
        greeting = "Welcome to VoiceVedic";
    }
    
    setDailyGreeting(greeting);
    
    // Show greeting with fade-in after a short delay
    setTimeout(() => {
      setShowGreeting(true);
    }, 1200);
  }, []);

  // Sample spiritual events data (in production, this would come from your database)
  const sampleEvents: SpiritualEvent[] = useMemo(() => [
    {
      id: '1',
      name: 'Pradosham',
      date: new Date().toISOString().split('T')[0],
      time_start: '16:40',
      time_end: '18:10',
      guidance: 'Offer water to Lord Shiva and observe silence during this auspicious time.',
      type: 'prayer'
    }
  ], []);



  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load today's event
  useEffect(() => {
    // In production, fetch from Supabase based on user's calendar type and location
    setTodayEvent(sampleEvents[0]);
  }, [sampleEvents]);



  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // const getGreeting = () => {
  //   const hour = currentTime.getHours();
  //   if (hour < 12) return 'Good Morning';
  //   if (hour < 17) return 'Good Afternoon';
  //   return 'Good Evening';
  // };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'prayer': return <Moon className="w-5 h-5" />;
      case 'festival': return <Sun className="w-5 h-5" />;
      case 'fast': return <Bell className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  // Get display values with fallbacks - use current location if available
  const displayLocation = currentLocation || userProfile?.location || 'Location not detected';

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Location Warning Banner */}
      {locationWarning && (
        <div className="w-full bg-yellow-100 text-yellow-800 text-center py-2 font-semibold">
          {locationWarning}
        </div>
      )}
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Settings Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">

      </div>
      
      {/* Sacred Beginning Text - Bottom Right */}
      <div className={`absolute bottom-24 right-8 z-10 transition-opacity duration-1000 ${showSacredText ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-right">
          <p className="text-2xl md:text-3xl font-spiritual text-spiritual-900 tracking-spiritual select-none animate-float animate-glow opacity-30" 
             style={{ lineHeight: '1.3' }}>
            शुभ आरंभ।
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start min-h-screen px-6 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8 max-w-4xl mt-8 animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-spiritual-900 mb-4 leading-spiritual tracking-spiritual">
            <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
              VoiceVedic
            </span>
          </h1>
          
          {/* Daily Spiritual Greeting - Replaces welcome text */}
          {dailyGreeting && (
            <div className={`mb-6 transition-all duration-1000 ${showGreeting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-3xl md:text-4xl font-bold text-spiritual-900 leading-spiritual tracking-spiritual">
                {dailyGreeting}
              </p>
            </div>
          )}
          
          {/* User Context Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-spiritual-700">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-spiritual border border-spiritual-200/50">
              <MapPin className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium tracking-spiritual">{displayLocation}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="w-full max-w-4xl space-y-8 animate-slide-up">
          
          {/* Today's Spiritual Timing Block */}
          {todayEvent && (
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
              <div className="flex items-center gap-3 mb-4">
                {getEventIcon(todayEvent.type)}
                <h2 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Today's Spiritual Focus</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold text-spiritual-800 mb-2 tracking-spiritual">
                    {todayEvent.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4 text-spiritual-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium tracking-spiritual">
                      {formatTime(todayEvent.time_start)} – {formatTime(todayEvent.time_end)}
                    </span>
                  </div>
                  <p className="text-spiritual-700 leading-relaxed tracking-spiritual">
                    {todayEvent.guidance}
                  </p>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-center p-4 bg-spiritual-50 rounded-spiritual border border-spiritual-200/50">
                    <div className="text-2xl font-bold text-spiritual-800 tracking-spiritual">
                      {formatTime(currentTime.toTimeString().slice(0, 5))}
                    </div>
                    <div className="text-sm text-spiritual-600 tracking-spiritual">Current Time</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ask VoiceVedic Block */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-spiritual-600" />
              <h2 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">Ask VoiceVedic</h2>
            </div>
            
            <p className="text-spiritual-700/80 tracking-spiritual mb-6 line-height-spiritual-relaxed">
              Get personalized spiritual guidance, festival timings, and ritual advice in a dedicated conversation space.
            </p>
            
            <button
              onClick={() => navigate('/ask')}
              className="group relative overflow-hidden flex items-center justify-center gap-3 w-full max-w-md mx-auto py-4 px-6 bg-gradient-to-r from-spiritual-600 to-spiritual-700 hover:from-spiritual-700 hover:to-spiritual-800 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-800/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 tracking-spiritual"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-600 to-spiritual-700 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              
              <MessageCircle className="w-5 h-5 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
              <span className="text-lg">Start Your Spiritual Session</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 group-active:translate-x-0.5 transition-transform duration-300" />
            </button>
          </div>



          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {onLogout && (
              <button
                onClick={onLogout}
                className="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-gray-100 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-200/50 tracking-spiritual"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainExperienceScreen;