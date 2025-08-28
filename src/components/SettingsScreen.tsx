import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  MessageCircle, 
  FileText, 
  LogOut, 
  ArrowLeft,
  User,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  onLogout 
}) => {
  const { user, userProfile } = useAuth();
  const [showSacredText, setShowSacredText] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);



  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);



  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSendFeedback = () => {
    // In production, this would open a feedback form or mailto
    const subject = encodeURIComponent('VoiceVedic App Feedback');
    const body = encodeURIComponent('Hi VoiceVedic Team,\n\nI have feedback about the app:\n\n');
    window.open(`mailto:feedback@voicevedic.com?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePrivacyPolicy = () => {
    // In production, this would navigate to privacy policy page
    alert('Privacy Policy & Terms would be displayed here. This would typically open a dedicated page or modal with legal information.');
  };

  const settingsOptions = [

    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Coming soon - Manage your alerts',
      icon: Bell,
      action: () => alert('Notification settings coming soon! This will allow you to customize when and how you receive spiritual reminders.'),
      showChevron: true,
      disabled: true
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      description: 'Help us improve VoiceVedic',
      icon: MessageCircle,
      action: handleSendFeedback,
      showChevron: true
    },
    {
      id: 'privacy',
      title: 'Privacy Policy & Terms',
      description: 'Read our terms and privacy policy',
      icon: FileText,
      action: handlePrivacyPolicy,
      showChevron: true
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      icon: LogOut,
      action: handleLogout,
      showChevron: false,
      isDestructive: true
    }
  ];

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Main Experience"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
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
        <div className="text-center mb-12 max-w-2xl mt-16 animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-spiritual-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-spiritual-900 leading-spiritual tracking-spiritual">
              Settings
            </h1>
          </div>
          
          <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
            Manage your app preferences and account options.
          </p>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="w-full max-w-2xl mb-8 animate-slide-up">
            <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-spiritual-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-spiritual-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">
                    {user.email}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-accent-600" />
                    <span className="text-sm text-spiritual-700 tracking-spiritual">
                      Account Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Options */}
        <div className="w-full max-w-2xl space-y-4 animate-slide-up">
          {settingsOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              disabled={option.disabled || (option.id === 'logout' && logoutLoading)}
              className={`group w-full p-6 rounded-card border-2 transition-all duration-300 text-left hover:shadow-spiritual ${
                option.disabled
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                  : option.isDestructive
                    ? 'bg-white/90 backdrop-blur-sm border-red-200/50 hover:border-red-300 hover:bg-red-50/50'
                    : 'bg-white/90 backdrop-blur-sm border-spiritual-200/50 hover:border-spiritual-300 hover:bg-spiritual-50/50'
              } ${option.id === 'logout' && logoutLoading ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-spiritual flex items-center justify-center ${
                    option.disabled
                      ? 'bg-gray-100'
                      : option.isDestructive
                        ? 'bg-red-100 group-hover:bg-red-200'
                        : 'bg-spiritual-100 group-hover:bg-spiritual-200'
                  } transition-colors duration-300`}>
                    {option.id === 'logout' && logoutLoading ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <option.icon className={`w-5 h-5 ${
                        option.disabled
                          ? 'text-gray-400'
                          : option.isDestructive
                            ? 'text-red-600'
                            : 'text-spiritual-600'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold tracking-spiritual ${
                      option.disabled
                        ? 'text-gray-500'
                        : option.isDestructive
                          ? 'text-red-800 group-hover:text-red-700'
                          : 'text-spiritual-900 group-hover:text-spiritual-700'
                    } transition-colors duration-300`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm tracking-spiritual mt-1 ${
                      option.disabled
                        ? 'text-gray-400'
                        : option.isDestructive
                          ? 'text-red-600/80'
                          : 'text-spiritual-700/70'
                    }`}>
                      {option.description}
                    </p>
                    {option.value && (
                      <p className="text-sm font-medium text-spiritual-600 mt-1 tracking-spiritual">
                        Current: {option.value}
                      </p>
                    )}
                  </div>
                </div>
                
                {option.showChevron && !option.disabled && (
                  <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                    option.isDestructive
                      ? 'text-red-400 group-hover:translate-x-1'
                      : 'text-spiritual-400 group-hover:translate-x-1'
                  }`} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* App Version Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-spiritual-600/70 tracking-spiritual">
            VoiceVedic App v1.0.0
          </p>
          <p className="text-xs text-spiritual-600/50 tracking-spiritual mt-1">
            Made with love for your spiritual journey
          </p>
        </div>
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-card p-6 w-full max-w-md shadow-spiritual-lg">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-spiritual-600" />
              <h3 className="text-xl font-semibold text-spiritual-900 tracking-spiritual">
                Select App Language
              </h3>
            </div>
            
            <div className="space-y-2 mb-6">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageChange(language)}
                  className={`w-full p-3 rounded-spiritual text-left transition-all duration-300 tracking-spiritual ${
                    selectedLanguage === language
                      ? 'bg-spiritual-100 border-2 border-spiritual-400 text-spiritual-800 font-medium'
                      : 'bg-spiritual-50 border-2 border-transparent hover:border-spiritual-200 text-spiritual-700 hover:bg-spiritual-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{language}</span>
                    {selectedLanguage === language && (
                      <CheckCircle className="w-5 h-5 text-spiritual-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-spiritual transition-colors duration-300 tracking-spiritual"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;