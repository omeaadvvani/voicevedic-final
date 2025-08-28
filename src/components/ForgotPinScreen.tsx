import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

interface ForgotPinScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const ForgotPinScreen: React.FC<ForgotPinScreenProps> = ({ onBack, onComplete }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSacredText, setShowSacredText] = useState(false);

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
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleSendResetLink = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setEmailError('');

      // Send password reset email using Supabase Magic Link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-pin`,
      });

      if (error) {
        setEmailError(error.message);
        return;
      }

      setSuccessMessage("We've sent you a reset link! Check your email and click the link to reset your PIN.");
      
      // Auto-complete after showing success message
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset link';
      setEmailError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email && validateEmail(email);

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Login"
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
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 relative z-10">
        
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="mb-6">
              <Logo size="medium" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
              Forgot Your PIN?
            </h1>
            <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
              We'll send you a reset link to your email.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-spiritual p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 tracking-spiritual">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Email Input Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
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
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border-2 rounded-spiritual focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual ${
                  emailError 
                    ? 'border-red-400 focus:border-red-500' 
                    : email && isEmailValid
                      ? 'border-accent-400 focus:border-accent-500'
                      : 'border-spiritual-200 focus:border-spiritual-400 hover:border-spiritual-300'
                }`}
                disabled={loading || !!successMessage}
              />
              
              {email && isEmailValid && !successMessage && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {emailError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1 tracking-spiritual">
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </p>
            )}
          </div>

          {/* Send Reset Link Button */}
          {!successMessage && (
            <button
              onClick={handleSendResetLink}
              disabled={!isEmailValid || loading}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                isEmailValid && !loading
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {/* Glow Effect */}
              {isEmailValid && !loading && (
                <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Send className={`w-5 h-5 transition-transform duration-300 ${isEmailValid ? 'group-hover:translate-x-1 group-active:translate-x-0.5' : ''}`} />
                  <span className="text-lg">Send Reset Link</span>
                </>
              )}
            </button>
          )}

          {/* Instructions */}
          {!successMessage && (
            <div className="mt-6 text-center">
              <p className="text-sm text-spiritual-700/70 tracking-spiritual">
                You'll receive an email with a secure link to reset your PIN.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPinScreen;