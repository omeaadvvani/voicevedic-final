import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowLeft, Mail, Eye, EyeOff, LogIn, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import ForgotPinScreen from './ForgotPinScreen';

interface LoginScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onComplete, onBack }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showSacredText, setShowSacredText] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { signIn, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && validateEmail(value)) {
      setEmailError('');
    }
    if (authError) setAuthError('');
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Clear errors when user starts typing
    if (pinError) setPinError('');
    if (emailError) setEmailError('');
    if (authError) setAuthError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setPin(newPin);
    
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isEmailValid = email && validateEmail(email);
  const isFormValid = isEmailValid && isPinComplete;

  const handleLogin = async () => {
    if (!isFormValid) return;

    const pinString = pin.join('');
    const { data, error } = await signIn(email, pinString);

    if (error) {
      console.error('Login error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Invalid login credentials')) {
        setAuthError('Invalid email or PIN. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setAuthError('Please confirm your email address before logging in.');
      } else if (error.message?.includes('Too many requests')) {
        setAuthError('Too many login attempts. Please wait a moment and try again.');
      } else {
        setAuthError('Login failed. Please check your credentials and try again.');
      }
      return;
    }

    if (data?.user) {
      onComplete();
    }
  };

  const handleForgotPin = () => {
    setShowForgotPin(true);
  };

  const handleForgotPinComplete = () => {
    setShowForgotPin(false);
    // Optionally show a success message or redirect to login
    setAuthError('');
    setEmail('');
    setPin(['', '', '', '', '', '']);
  };

  const handleForgotPinBack = () => {
    setShowForgotPin(false);
  };

  const clearForm = () => {
    setEmail('');
    setPin(['', '', '', '', '', '']);
    setEmailError('');
    setPinError('');
    setAuthError('');
  };

  // Show Forgot PIN screen if requested
  if (showForgotPin) {
    return <ForgotPinScreen onBack={handleForgotPinBack} onComplete={handleForgotPinComplete} />;
  }

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

      {/* Clear Form Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={clearForm}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Clear Form"
        >
          <RotateCcw className="w-5 h-5 text-spiritual-600 group-hover:rotate-180 transition-transform duration-300" />
          <span className="text-sm">Clear</span>
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
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-lg animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
            Welcome Back
          </h1>
          
          <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
            Enter your details to continue your spiritual journey
          </p>
        </div>

        {/* Error Display */}
        {authError && (
          <div className="w-full max-w-md mb-6 animate-slide-up">
            <div className="bg-red-50 border border-red-200 rounded-spiritual p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 tracking-spiritual">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          
          {/* Email Address Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-spiritual-600" />
              <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Email Address</h3>
            </div>
            
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="yourname@example.com"
                className={`w-full px-4 py-3 border-2 rounded-spiritual focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual ${
                  emailError 
                    ? 'border-red-400 focus:border-red-500' 
                    : email && isEmailValid
                      ? 'border-accent-400 focus:border-accent-500'
                      : 'border-spiritual-200 focus:border-spiritual-400 hover:border-spiritual-300'
                }`}
              />
              
              {email && isEmailValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {emailError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1 tracking-spiritual">
                <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
                {emailError}
              </p>
            )}
          </div>

          {/* PIN Entry Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-spiritual-600" />
                <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Enter your 6-digit PIN</h3>
              </div>
              <button
                onClick={() => setShowPin(!showPin)}
                className="p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors duration-300"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* PIN Input Fields */}
            <div className="flex justify-center gap-2 mb-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-10 h-10 text-center text-lg font-bold border-2 rounded-spiritual focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105 ${
                    pinError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : 'border-spiritual-200 focus:border-spiritual-400 focus:ring-spiritual-200/50'
                  }`}
                  placeholder={showPin ? "0" : "•"}
                />
              ))}
            </div>
            
            {pinError && (
              <div className="text-center mb-4">
                <p className="text-sm text-red-600 flex items-center justify-center gap-2 tracking-spiritual">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </span>
                  {pinError}
                </p>
              </div>
            )}
            
            <p className="text-sm text-spiritual-700/70 text-center tracking-spiritual">
              Enter the 6-digit PIN you created when signing up.
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!isFormValid || loading}
            className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
              isFormValid && !loading
                ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 hover:border-spiritual-500/50 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isFormValid ? "Please enter your email and PIN" : "Login to your account"}
          >
            {/* Ripple Effect Background */}
            {isFormValid && !loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-spiritual-300/20 to-spiritual-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-button"></div>
            )}
            
            {/* Button Content */}
            <div className="relative z-10 flex items-center gap-3">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className={`w-5 h-5 transition-transform duration-300 ${isFormValid ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Login</span>
                </>
              )}
            </div>
            
            {/* Glow Effect */}
            {isFormValid && !loading && (
              <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
            )}
          </button>

          {/* Forgot PIN Link */}
          <div className="text-center">
            <button
              onClick={handleForgotPin}
              className="group text-spiritual-700 hover:text-spiritual-600 font-medium transition-colors duration-300 relative tracking-spiritual"
              title="Reset your PIN via email"
            >
              <span className="relative">
                Forgot your PIN?
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-spiritual-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;