import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Sparkles, RotateCcw, Volume2 } from 'lucide-react';
import Logo from './Logo';

interface DemoScreenProps {
  onBack: () => void;
}

const DemoScreen: React.FC<DemoScreenProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSacredText, setShowSacredText] = useState(false);

  const demoQuestions = [
    {
      question: "When is Amavasya this month?",
      response: {
        line1: "Amavasya falls on Sunday, June 30.",
        line2: "It marks the new moon and is ideal for spiritual cleansing.",
        line3: "A good day for silence, prayers, and ancestral offerings."
      }
    },
    {
      question: "When is Pradosham this week?",
      response: {
        line1: "Pradosham falls on Friday, June 28.",
        line2: "It's a time to honor Lord Shiva and seek forgiveness.",
        line3: "Fasting and evening prayer are recommended."
      }
    },
    {
      question: "What is Rahukalam today?",
      response: {
        line1: "Today's Rahukalam is from 1:30 PM to 3:00 PM.",
        line2: "Avoid starting new tasks during this period.",
        line3: "Used in Vedic astrology for timing awareness."
      }
    }
  ];

  const currentDemo = demoQuestions[currentQuestionIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-show response after question appears
    const timer = setTimeout(() => {
      handleAskQuestion();
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const handleAskQuestion = () => {
    setIsTyping(true);
    setShowResponse(false);
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      setShowResponse(true);
    }, 2000);
  };

  const handleTryAnother = () => {
    setShowResponse(false);
    setIsTyping(false);
    
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => (prev + 1) % demoQuestions.length);
    }, 300);
  };

  const handleReset = () => {
    setShowResponse(false);
    setIsTyping(false);
    setCurrentQuestionIndex(0);
  };

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

      {/* Reset Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleReset}
          className="group flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-spiritual shadow-spiritual border border-spiritual-200/50 hover:bg-white hover:shadow-spiritual-lg transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Reset Demo"
        >
          <RotateCcw className="w-5 h-5 text-spiritual-600 group-hover:rotate-180 transition-transform duration-300" />
          <span className="text-sm">Reset</span>
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
        <div className="text-center mb-12 max-w-2xl animate-fade-in">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="medium" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-spiritual-900 mb-6 leading-spiritual tracking-spiritual">
            Ask VoiceVedic
          </h1>
          
          <p className="text-xl text-spiritual-800/80 font-medium mb-3 tracking-spiritual line-height-spiritual-relaxed">
            Try how it works — without signing in
          </p>
          
          <div className="flex items-center justify-center gap-3 text-spiritual-700/70">
            <Volume2 className="w-5 h-5" />
            <span className="text-sm tracking-spiritual">Experience our spiritual AI assistant</span>
          </div>
        </div>

        {/* Demo Chat Interface */}
        <div className="w-full max-w-2xl space-y-6 animate-slide-up">
          
          {/* User Question Bubble */}
          <div className="flex justify-end">
            <div className="max-w-md">
              <div className="bg-gradient-to-r from-spiritual-400 to-spiritual-500 text-white px-6 py-4 rounded-card rounded-tr-md shadow-spiritual">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium opacity-90 tracking-spiritual">You asked:</span>
                </div>
                <p className="text-lg font-medium tracking-spiritual">
                  {currentDemo.question}
                </p>
              </div>
            </div>
          </div>

          {/* VoiceVedic Response Bubble */}
          <div className="flex justify-start">
            <div className="max-w-md">
              {/* Typing Indicator */}
              {isTyping && (
                <div className="bg-white/90 backdrop-blur-sm border border-spiritual-200/50 px-6 py-4 rounded-card rounded-tl-md shadow-spiritual mb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-spiritual-600 animate-pulse" />
                    <span className="text-spiritual-800 font-medium tracking-spiritual">VoiceVedic is thinking...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-spiritual-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actual Response */}
              {showResponse && (
                <div className={`bg-white/90 backdrop-blur-sm border border-spiritual-200/50 px-6 py-5 rounded-card rounded-tl-md shadow-spiritual transition-all duration-500 transform ${
                  showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-spiritual-600" />
                    <span className="text-sm font-medium text-spiritual-800 tracking-spiritual">VoiceVedic says:</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-spiritual-900 tracking-spiritual">
                      {currentDemo.response.line1}
                    </p>
                    <p className="text-base text-spiritual-800 tracking-spiritual">
                      {currentDemo.response.line2}
                    </p>
                    <p className="text-base text-spiritual-700/80 tracking-spiritual">
                      {currentDemo.response.line3}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Try Another Button */}
          {showResponse && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleTryAnother}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white font-semibold rounded-button shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 tracking-spiritual"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-button bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
                
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 group-active:rotate-90 transition-transform duration-300" />
                <span className="text-lg">Try Another Question</span>
              </button>
            </div>
          )}

          {/* Demo Progress Indicator */}
          <div className="flex justify-center pt-4">
            <div className="flex gap-2">
              {demoQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentQuestionIndex
                      ? 'bg-spiritual-500 w-6'
                      : 'bg-spiritual-200 w-2'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          {showResponse && (
            <div className="text-center pt-8">
              <div className="bg-gradient-to-r from-spiritual-50 to-spiritual-100 border border-spiritual-200/50 rounded-card p-6">
                <h3 className="text-xl font-semibold text-spiritual-900 mb-3 tracking-spiritual">
                  Ready to start your spiritual journey?
                </h3>
                <p className="text-spiritual-700/80 mb-4 tracking-spiritual line-height-spiritual-relaxed">
                  Sign up to get personalized daily guidance, ritual reminders, and access to our complete spiritual calendar.
                </p>
                <button
                  onClick={onBack}
                  className="group relative overflow-hidden inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-spiritual-900 to-red-600 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 tracking-spiritual"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-spiritual bg-gradient-to-r from-spiritual-900 to-red-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
                  
                  <span>Get Started</span>
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoScreen;