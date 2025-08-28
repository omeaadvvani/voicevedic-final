import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

interface ResetPinScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const ResetPinScreen: React.FC<ResetPinScreenProps> = ({ onComplete, onBack }) => {
  const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSacredText, setShowSacredText] = useState(false);

  const newPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    if (isConfirm) {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);
      
      if (pinError) setPinError('');

      // Auto-focus next input
      if (value && index < 5) {
        confirmPinInputRefs.current[index + 1]?.focus();
      }
    } else {
      const newNewPin = [...newPin];
      newNewPin[index] = value;
      setNewPin(newNewPin);

      // Auto-focus next input
      if (value && index < 5) {
        newPinInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : newPin;
      if (!currentPin[index] && index > 0) {
        const refs = isConfirm ? confirmPinInputRefs : newPinInputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent, isConfirm = false) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newPinArray = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    
    if (isConfirm) {
      setConfirmPin(newPinArray);
      const nextIndex = Math.min(pastedData.length, 5);
      confirmPinInputRefs.current[nextIndex]?.focus();
    } else {
      setNewPin(newPinArray);
      const nextIndex = Math.min(pastedData.length, 5);
      newPinInputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSaveNewPin = async () => {
    const newPinString = newPin.join('');
    const confirmPinString = confirmPin.join('');

    if (newPinString.length !== 6) {
      setPinError('PIN must be 6 digits');
      return;
    }

    if (newPinString !== confirmPinString) {
      setPinError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '', '', '']);
      setTimeout(() => {
        confirmPinInputRefs.current[0]?.focus();
      }, 100);
      return;
    }

    try {
      setLoading(true);
      setPinError('');

      // Update the user's password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPinString
      });

      if (error) {
        setPinError(error.message);
        return;
      }

      setSuccessMessage('Your PIN has been reset successfully!');
      
      // Redirect after showing success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save new PIN';
      setPinError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isNewPinComplete = newPin.every(digit => digit !== '');
  const isConfirmPinComplete = confirmPin.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans">
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Back Button - Top Left (optional) */}
      {onBack && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm">Back</span>
          </button>
        </div>
      )}

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
            
            <h1 className="text-4xl md:text-2xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
              Set a New PIN
            </h1>
            <p className="text-lg text-spiritual-800/80 font-medium tracking-spiritual line-height-spiritual-relaxed">
              Create a secure 6-digit PIN for your account.
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

          {/* New PIN Input */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-spiritual-600" />
                <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">New 6-digit PIN</h3>
              </div>
              <button
                onClick={() => setShowNewPin(!showNewPin)}
                className="p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors duration-300"
                title={showNewPin ? "Hide PIN" : "Show PIN"}
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              {newPin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => newPinInputRefs.current[index] = el}
                  type={showNewPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? (e) => handlePaste(e) : undefined}
                  className="w-10 h-10 text-center text-lg font-bold border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105"
                  placeholder={showNewPin ? "0" : "•"}
                  disabled={loading || !!successMessage}
                />
              ))}
            </div>
            
            <p className="text-sm text-spiritual-700/70 text-center tracking-spiritual">
              Choose a secure 6-digit PIN you'll remember.
            </p>
          </div>

          {/* Confirm PIN Input */}
          <div className="bg-white/90 backdrop-blur-sm rounded-card p-6 shadow-spiritual border border-spiritual-200/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-spiritual-600" />
                <h3 className="text-lg font-semibold text-spiritual-900 tracking-spiritual">Confirm PIN</h3>
              </div>
              <button
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="p-1 text-spiritual-600 hover:text-spiritual-700 transition-colors duration-300"
                title={showConfirmPin ? "Hide PIN" : "Show PIN"}
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              {confirmPin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => confirmPinInputRefs.current[index] = el}
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, true)}
                  onKeyDown={(e) => handleKeyDown(index, e, true)}
                  onPaste={index === 0 ? (e) => handlePaste(e, true) : undefined}
                  className={`w-10 h-10 text-center text-lg font-bold border-2 rounded-spiritual focus:outline-none focus:ring-4 transition-all duration-300 bg-white/70 text-spiritual-900 hover:border-spiritual-300 focus:scale-105 ${
                    pinError 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : 'border-spiritual-200 focus:border-spiritual-400 focus:ring-spiritual-200/50'
                  }`}
                  placeholder={showConfirmPin ? "0" : "•"}
                  disabled={loading || !!successMessage}
                />
              ))}
            </div>
            
            {pinError && (
              <div className="text-center mb-4">
                <p className="text-sm text-red-600 flex items-center justify-center gap-2 tracking-spiritual">
                  <AlertCircle className="w-4 h-4" />
                  {pinError}
                </p>
              </div>
            )}
            
            <p className="text-sm text-spiritual-700/70 text-center tracking-spiritual">
              Re-enter the same PIN to confirm.
            </p>
          </div>

          {/* Save New PIN Button */}
          {!successMessage && (
            <button
              onClick={handleSaveNewPin}
              disabled={!isNewPinComplete || !isConfirmPinComplete || loading}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 px-6 font-semibold rounded-button shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                isNewPinComplete && isConfirmPinComplete && !loading
                  ? 'bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-900/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {/* Glow Effect */}
              {isNewPinComplete && isConfirmPinComplete && !loading && (
                <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-900 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Saving PIN...</span>
                </>
              ) : (
                <>
                  <CheckCircle className={`w-5 h-5 transition-transform duration-300 ${isNewPinComplete && isConfirmPinComplete ? 'group-hover:rotate-12 group-active:rotate-6' : ''}`} />
                  <span className="text-lg">Save New PIN</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPinScreen;