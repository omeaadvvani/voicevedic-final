import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  UserCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Logo from './Logo';

interface GuestOnboardingScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const GuestOnboardingScreen: React.FC<GuestOnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [showSacredText, setShowSacredText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
      </div>
      
      {/* Sacred Beginning Text - Bottom Right with Continuous Animation */}
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
        <div className="text-center mb-12 max-w-2xl mt-16 animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-spiritual-900 mb-4 leading-spiritual tracking-spiritual">
            Welcome, Guest! Let's
            <br />
            <span className="bg-gradient-to-r from-spiritual-600 to-spiritual-900 bg-clip-text text-transparent">
              Begin Your Journey
            </span>
            <UserCheck className="inline-block w-8 h-8 ml-3 text-spiritual-600" />
          </h1>
          
          <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
            Welcome to VoiceVedic! Start exploring spiritual guidance and Panchangam details.
          </p>
        </div>

        {/* Welcome Message */}
        <div className="w-full max-w-2xl space-y-8 animate-slide-up">
          
          {/* Welcome Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-8 shadow-spiritual border border-spiritual-200/50 text-center">
            <div className="mb-6">
              <Sparkles className="w-16 h-16 text-spiritual-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-spiritual-900 tracking-spiritual mb-3">
                Ready to Begin Your Spiritual Journey?
              </h3>
              <p className="text-spiritual-700 tracking-spiritual">
                VoiceVedic is ready to provide you with accurate Panchangam details, spiritual guidance, and personalized insights.
              </p>
            </div>
            
            <button
              onClick={onComplete}
              className="group relative overflow-hidden flex items-center justify-center gap-3 w-full max-w-md mx-auto py-4 px-8 bg-gradient-to-r from-spiritual-600 to-spiritual-700 hover:from-spiritual-700 hover:to-spiritual-800 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-800/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 tracking-spiritual"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 group-active:translate-x-0.5 transition-transform duration-300" />
              <span className="text-lg">Continue to VoiceVedic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestOnboardingScreen;