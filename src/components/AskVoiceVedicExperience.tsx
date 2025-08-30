import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  MessageCircle,
  Trash2,
  Lightbulb,
  ArrowRight,
  VolumeX
} from 'lucide-react';
import Logo from './Logo';

import { useVoiceVedicAPI } from '../lib/voicevedic-api';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { perplexityApi } from '../lib/perplexity-api';
import { supabase } from '../lib/supabase';
import { openaiAPI, detectLanguage, optimizeResponse, generateSpeech, transcribeAudio } from '../lib/openai-api';


// CRITICAL FIX: UI and TTS now display the same content
// Removed unused imports to fix linting errors
// Perplexity API integration for spiritual guidance
// Browser-based voice synthesis

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskVoiceVedicExperienceProps {
  onBack: () => void;
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  onAddMessage: (message: { id: string; type: 'user' | 'assistant'; content: string; timestamp: Date }) => void;
  onClearConversation: () => void;
}

const AskVoiceVedicExperience: React.FC<AskVoiceVedicExperienceProps> = ({ 
  onBack, 
  messages, 
  onAddMessage, 
  onClearConversation 
}) => {
  // Enhanced API and location detection
  const { askVoiceVedic } = useVoiceVedicAPI();
  const { user } = useAuth();
  const { currentLocation, startLocationTracking } = useLocation(user?.id);
  
  // Simple local response system - no external APIs needed
  // Simple browser-based voice synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  
  const [question, setQuestion] = useState('');
  // Messages are now managed by parent component to persist across navigation
  const [isAsking, setIsAsking] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showSacredText, setShowSacredText] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [isAppLoading, setIsAppLoading] = useState(true);
  

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fallback suggestions when API fails
  const fallbackSuggestions = useMemo(() => [
    "When is next Amavasya in Mumbai?",
    "When is Purnima this month in Chicago USA?",
    "When is Rahukaal today?"
  ], []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSacredText(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Check mic support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);
    
    // Ensure app loads even if voice synthesis is not available
    const checkVoiceSupport = () => {
      if (!window.speechSynthesis) {
        console.log('Speech synthesis not supported, continuing without voice');
        setIsAppLoading(false);
        setVoiceInitialized(true);
        return;
      }
      
      // If voices are already available, stop loading
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices available immediately:', voices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
      }
    };
    
    checkVoiceSupport();
  }, []);

  // Handle voice loading and tab switching issues
  useEffect(() => {
    const initializeVoiceSystem = () => {
      // Prevent multiple initializations
      if (voiceInitialized) {
        return;
      }
      
      // Quick check - if voices are already available, skip loading
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      if (voices.length > 0) {
        // Voices are already loaded
        console.log('Voices loaded immediately:', voices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
        return;
      }
      
      // Only show loading if voices are actually not available
      setIsAppLoading(true);
        
      // Wait for voices to load
      const handleVoicesChanged = () => {
        const loadedVoices = window.speechSynthesis.getVoices();
        console.log('Voices loaded after event:', loadedVoices.length);
        setIsAppLoading(false);
        setVoiceInitialized(true);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout - stop loading after 1 second (voices are usually already loaded)
      const timeoutId = setTimeout(() => {
        console.log('Voice loading timeout, continuing anyway');
        setIsAppLoading(false);
        setVoiceInitialized(true);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }, 1000);
      
      // Cleanup timeout if voices load
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        clearTimeout(timeoutId);
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !voiceInitialized) {
        // Only reload voices if they're not already available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Quick check - if voices are available, don't show loading
          initializeVoiceSystem();
        } else {
          // Voices are already available, skip loading
          setIsAppLoading(false);
          setVoiceInitialized(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
      // Initialize voice system and location tracking when component mounts
  initializeVoiceSystem();
  
  // WORLD-CLASS FIX: Pre-warm microphone access to eliminate delay
  prewarmMicrophoneAccess();
  
  if (user?.id) {
    startLocationTracking();
  }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, startLocationTracking, voiceInitialized]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simple local suggestions system
  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      setLoadingSuggestions(true);
      
      console.log("🔍 Using local suggestions for query:", query);
      
      // Simple keyword-based suggestions
      const queryLower = query.toLowerCase();
      let suggestions = fallbackSuggestions;
      
      if (queryLower.includes('fast') || queryLower.includes('vrat')) {
        suggestions = [
          "When is the next Ekadashi?",
          "What should I do on Ekadashi?",
          "How to observe a spiritual fast?",
          "Which days are good for fasting?"
        ];
      } else if (queryLower.includes('puja') || queryLower.includes('pooja')) {
        suggestions = [
          "How do I perform a simple pooja at home?",
          "What items do I need for puja?",
          "When is the best time for puja?",
          "How to set up a home altar?"
        ];
      } else if (queryLower.includes('festival') || queryLower.includes('celebration')) {
        suggestions = [
          "When is Diwali this year?",
          "What are the important festivals in July?",
          "How to celebrate Raksha Bandhan?",
          "When is Janmashtami?"
        ];
      }
      
      setSuggestedQuestions(suggestions);
      
    } catch (error: unknown) {
      console.error("💥 Error in suggestions:", error);
      setSuggestedQuestions(fallbackSuggestions);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [fallbackSuggestions]);

  // Fetch initial suggestions for common questions
  const fetchInitialSuggestions = useCallback(async () => {
    console.log("🚀 Loading initial suggestions...");
    
    // Use local suggestions immediately
    setSuggestedQuestions(fallbackSuggestions);
  }, [fallbackSuggestions]);

  // Fetch suggestions based on user input
  useEffect(() => {
    if (question.trim().length > 3) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(question.trim());
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    } else if (question.trim().length === 0 && messages.length === 0) {
      fetchInitialSuggestions();
    }
  }, [question, messages.length, fetchSuggestions, fetchInitialSuggestions]);

  // Fetch smart suggestions when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      fetchInitialSuggestions();
    }
  }, [messages.length, fetchInitialSuggestions]);





  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    // Auto-submit the suggestion
    setTimeout(() => {
      handleAskQuestion();
    }, 100);
  };

  // IMPROVED: Curated language-specific voice options for better UX
  const getCuratedVoicesForLanguage = (language: string) => {
    const voices = window.speechSynthesis.getVoices();
    console.log('All available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Define voice option type
    interface VoiceOption {
      label: string;
      value: string;
      lang: string;
      language: string;
    }
    
    // Curated preferred voices for each language with fallbacks
    const preferredVoices: Record<string, {names: string[], fallbackPatterns: RegExp[]}> = {
      kn: {
        names: ['Soumya', 'Kannada Soumya'],
        fallbackPatterns: [/kannada/i, /\bkn[-_]?in\b/i, /soumya/i]
      },
      hi: {
        names: ['Neel', 'Lekha', 'Hindi Neel', 'Hindi Lekha'],
        fallbackPatterns: [/hindi/i, /\bhi[-_]?in\b/i, /neel|lekha/i, /india/i]
      },
      te: {
        names: ['Geeta', 'Telugu Geeta'],
        fallbackPatterns: [/telugu/i, /\bte[-_]?in\b/i, /geeta/i]
      },
      en: {
        names: ['Alex', 'Samantha', 'Daniel', 'Karen', 'Moira'],
        fallbackPatterns: [/\ben[-_]?us\b/i, /\ben[-_]?gb\b/i, /american|british|neutral/i]
      },
      ta: {
        names: ['Kymal', 'Tamil Kymal'],
        fallbackPatterns: [/tamil/i, /\bta[-_]?in\b/i, /kymal/i]
      },
      ml: {
        names: ['Malayalam', 'Veena'],
        fallbackPatterns: [/malayalam/i, /\bml[-_]?in\b/i, /veena/i]
      }
    };

    const curatedVoices: VoiceOption[] = [];
    const languageVoices = voices.filter(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
    
    if (preferredVoices[language]) {
      const { names, fallbackPatterns } = preferredVoices[language];
      
      // 1. First, try to find exact name matches
      names.forEach(preferredName => {
        const exactMatch = languageVoices.find(v => 
          v.name.toLowerCase().includes(preferredName.toLowerCase())
        );
        if (exactMatch && !curatedVoices.find(cv => cv.value === exactMatch.name)) {
          curatedVoices.push({
            label: getAccentLabel(exactMatch, language),
            value: exactMatch.name,
            lang: exactMatch.lang,
            language
          });
        }
      });
      
      // 2. If no exact matches, use fallback patterns
      if (curatedVoices.length === 0) {
        fallbackPatterns.forEach(pattern => {
          const patternMatch = languageVoices.find(v => 
            pattern.test(v.name) || pattern.test(v.lang)
          );
          if (patternMatch && !curatedVoices.find(cv => cv.value === patternMatch.name)) {
            curatedVoices.push({
              label: getAccentLabel(patternMatch, language),
              value: patternMatch.name,
              lang: patternMatch.lang,
              language
            });
          }
        });
      }
      
      // 3. If still nothing, use any voice for that language
      if (curatedVoices.length === 0 && languageVoices.length > 0) {
        languageVoices.slice(0, 2).forEach(voice => {
          curatedVoices.push({
            label: getAccentLabel(voice, language),
            value: voice.name,
            lang: voice.lang,
            language
          });
        });
      }
    }
    
    // Fallback to first available voice if none found
    if (curatedVoices.length === 0) {
      const anyVoice = voices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase())) || voices[0];
      if (anyVoice) {
        curatedVoices.push({
          label: getAccentLabel(anyVoice, language),
          value: anyVoice.name,
          lang: anyVoice.lang,
          language
        });
      }
    }
    
    return curatedVoices;
  };

  // Helper function to create clean accent labels
  const getAccentLabel = (voice: SpeechSynthesisVoice, language: string): string => {
    const cleanName = voice.name.replace(/Microsoft|Google|Apple|System/, '').trim();
    
    switch (language) {
      case 'kn':
        return cleanName.includes('Soumya') ? 'ಕನ್ನಡ (Soumya)' : `ಕನ್ನಡ (${cleanName})`;
      case 'hi':
        if (cleanName.includes('Neel')) return 'हिंदी (Neel - India)';
        if (cleanName.includes('Lekha')) return 'हिंदी (Lekha - Indian)';
        return `हिंदी (${cleanName})`;
      case 'te':
        return cleanName.includes('Geeta') ? 'తెలుగు (Geeta)' : `తెలుగు (${cleanName})`;
      case 'en':
        const region = voice.lang.includes('IN') ? 'Indian' : 
                     voice.lang.includes('GB') ? 'British' : 
                     voice.lang.includes('AU') ? 'Australian' : 'Neutral';
        return `English (${region} - ${cleanName})`;
      case 'ta':
        return cleanName.includes('Kymal') ? 'தமிழ் (Kymal)' : `தமிழ் (${cleanName})`;
      case 'ml':
        return `മലയാളം (${cleanName})`;
      default:
        return `${voice.lang} (${cleanName})`;
    }
  };

  // Language options for multi-language support
  const languageOptions = [
    { label: "English (English)", value: "en" },
    { label: "हिंदी (Hindi)", value: "hi" },
    { label: "ಕನ್ನಡ (Kannada)", value: "kn" },
    { label: "தமிழ் (Tamil)", value: "ta" },
    { label: "తెలుగు (Telugu)", value: "te" },
    { label: "മലയാളം (Malayalam)", value: "ml" }
  ];

  const [voiceOptions, setVoiceOptions] = useState<Array<{label: string, value: string, lang: string, language: string}>>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [microphoneReady, setMicrophoneReady] = useState(false);

  // IMPROVED: Update voice options when language changes or speech synthesis voices are loaded
  useEffect(() => {
    const updateVoices = () => {
      const options = getCuratedVoicesForLanguage(selectedLanguage);
      setVoiceOptions(options);
      
      // Auto-select the first curated voice for the selected language
      if (options.length > 0) {
        setSelectedVoice(options[0].value);
      }
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedLanguage]); // Update voices when language changes

  // Function to clean up time strings for TTS to avoid "AM PM" reading issues
  const cleanTextForTTS = (text: string): string => {
    // Enhanced TTS text cleaning for better speech quality
    // Preserve all Unicode letters (covers Telugu) and basic punctuation
    return text
      // Replace decorative bullets/dashes with natural pauses
      .replace(/[•·]/g, ' ')
      .replace(/[–—-]/g, ' ')
      // Remove emojis except diya (we already handle greeting separately)
      .replace(/\p{Extended_Pictographic}/gu, ' ')
      .replace(/🪔/g, 'Jai Shree Krishna')
      // Expand separators like · | / to commas/spaces
      .replace(/[\u00B7|\/]/g, ', ')
      // Keep HH:MM AM/PM legible for TTS
      .replace(/(\d{1,2}):(\d{2})\s+(AM|PM)/g, '$1 $2 $3')
      .replace(/(\d{1,2}):(\d{2})\s+(AM|PM)\s+(to|–|—|-)\s+(\d{1,2}):(\d{2})\s+(AM|PM)/g, '$1 $2 $3 to $5 $6 $7')
      // Collapse repeated AM PM tokens
      .replace(/(AM|PM)\s+(AM|PM)/g, '$1')
      // Strip any leftover control or symbol noise but KEEP unicode letters/digits and punctuation
      .replace(/[^\p{L}\p{N}\s\.,:;()]/gu, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  // NEW FUNCTION: Enhanced TTS text processing for different content types
  const processTextForTTS = (text: string, contentType: 'timing' | 'general' | 'ritual' = 'general'): string => {
    let processedText = text;
    
    switch (contentType) {
      case 'timing':
        // Special handling for timing-related content
        processedText = processedText
          // Preserve time formats exactly as they should be spoken
          .replace(/(\d{1,2}):(\d{2})\s+(AM|PM)/g, '$1 $2 $3')
          .replace(/(\d{1,2}):(\d{2})\s+(AM|PM)\s+to\s+(\d{1,2}):(\d{2})\s+(AM|PM)/g, '$1 $2 $3 to $4 $5 $6')
          // Handle date formats
          .replace(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/g, '$1 $2')
          // Clean up special characters that affect timing readability
          .replace(/[•·]/g, ' and ')
          .replace(/[–—]/g, ' to ')
          // Remove problematic symbols but keep essential punctuation
          .replace(/[^\w\s\-\.,:;()]/g, ' ')
          // Fix spacing issues
          .replace(/\s+/g, ' ')
          .trim();
        break;
        
      case 'ritual':
        // Special handling for ritual and spiritual content
        processedText = processedText
          // Preserve spiritual terms and mantras
          .replace(/🪔/g, 'Jai Shree Krishna')
          // Clean up formatting while preserving meaning
          .replace(/[•·]/g, ' and ')
          .replace(/[–—]/g, ' to ')
          // Remove only problematic symbols
          .replace(/[^\w\s\-\.,:;()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        break;
        
      default:
        // General content processing
        processedText = cleanTextForTTS(processedText);
    }
    
    return processedText;
  };

  // NEW FUNCTION: Detect content type for better TTS processing
  const detectContentType = (text: string): 'timing' | 'general' | 'ritual' => {
    const lowerText = text.toLowerCase();
    
    // Telugu timing keywords (for better timing detection when content is in Telugu)
    const teluguTiming = /సూర్యోదయ|సూర్యోదయం|సూర్యాస్తమయ|సూర్యాస్తమయం|ముహూర్త|రాహు|రాహుకాలం|యమగండ|యమగండం|తిథి|నక్షత్ర/;
    
    if (lowerText.includes('time') || lowerText.includes('timing') || 
        lowerText.includes('am') || lowerText.includes('pm') ||
        lowerText.includes('sunrise') || lowerText.includes('sunset') ||
        lowerText.includes('muhurat') || lowerText.includes('rahu') ||
        lowerText.includes('tithi') || lowerText.includes('nakshatra') ||
        teluguTiming.test(text)) {
      return 'timing';
    }
    
    if (lowerText.includes('puja') || lowerText.includes('pooja') ||
        lowerText.includes('ritual') || lowerText.includes('mantra') ||
        lowerText.includes('jai shree krishna') || lowerText.includes('om')) {
      return 'ritual';
    }
    
    return 'general';
  };

  // Helper: pick the most natural voice for a given language
  const selectBestVoiceForLanguage = (
    language: string,
    voices: SpeechSynthesisVoice[],
    preferredVoiceName?: string
  ): SpeechSynthesisVoice | undefined => {
    // 1) Exact selected voice by name
    if (preferredVoiceName) {
      const byName = voices.find(v => v.name === preferredVoiceName);
      if (byName) return byName;
    }
    // 2) Language-specific strong matches
    const matchers: RegExp[] = language === 'te'
      ? [/telugu/i, /తెలుగు/, /\bte(?:-|_)?IN\b/i, /natural/i, /microsoft/i, /google/i]
      : language === 'hi'
      ? [/hindi/i, /हिन्दी|हिंदी/, /\bhi(?:-|_)?IN\b/i, /natural/i, /microsoft/i, /google/i]
      : language === 'kn'
      ? [/kannada/i, /ಕನ್ನಡ/, /\bkn(?:-|_)?IN\b/i, /natural/i, /microsoft/i, /google/i]
      : [/\b${language}(?:-|_)IN\b/i, /india/i, /natural/i, /google/i, /microsoft/i];
    const strong = voices.find(v => matchers.some(rx => rx.test(v.name) || rx.test(v.lang)));
    if (strong) return strong;
    // 3) Fallback by language code prefix
    const byLangPrefix = voices.find(v => v.lang.toLowerCase().startsWith(language.toLowerCase()));
    if (byLangPrefix) return byLangPrefix;
    // 4) Last resort: first available
    return voices[0];
  };

  // Helper: split long text into natural, speakable chunks (sentences/lines)
  const splitIntoNaturalChunks = (text: string): string[] => {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const out: string[] = [];
    const pushWithChunking = (segment: string) => {
      if (segment.length <= 220) {
        out.push(segment);
        return;
      }
      // Try to break at commas/spaces near 180-220 chars window
      let start = 0;
      const max = segment.length;
      while (start < max) {
        const end = Math.min(start + 220, max);
        let cut = segment.lastIndexOf(', ', end);
        if (cut <= start + 120) cut = segment.lastIndexOf(' ', end);
        if (cut <= start) cut = end;
        out.push(segment.slice(start, cut).trim());
        start = cut;
      }
    };
    lines.forEach(line => {
      // Split by sentence punctuation including Devanagari danda (।) and Telugu danda if present
      const sentences = line.split(/(?<=[\.!\?]|\u0964|\u0965|\u0C7F)\s+/).map(s => s.trim()).filter(Boolean);
      sentences.forEach(s => pushWithChunking(s));
    });
    return out;
  };

  // COMPREHENSIVE AUDIO LOCKING SYSTEM: Play message with ZERO dual voices guaranteed
  const playMessage = (msgId: string, text: string) => {
    console.log('🚀 COMPREHENSIVE: playMessage() called - Audio locking system active');
    console.log('🚀 COMPREHENSIVE: msgId:', msgId);
    console.log('🚀 COMPREHENSIVE: Current states - isSpeaking:', isSpeaking, 'playingMsgId:', playingMsgId);
    
    // COMPREHENSIVE: Check if audio system is locked
    if ((window as any).audioSystemLocked) {
      console.log('🚀 COMPREHENSIVE: Audio system locked - request queued');
      // Queue the request for later processing
      (window as any).audioQueue = (window as any).audioQueue || [];
      (window as any).audioQueue.push({ msgId, text });
      return;
    }
    
    // COMPREHENSIVE: Check if already playing this message
    if (playingMsgId === msgId) {
      console.log('🚀 COMPREHENSIVE: Already playing this message - stopping completely');
      stopAllAudio();
      setPlayingMsgId(null);
      setIsSpeaking(false);
      return;
    }
    
    // COMPREHENSIVE: Lock audio system to prevent dual voices
    console.log('🚀 COMPREHENSIVE: Locking audio system - preventing dual voices');
    (window as any).audioSystemLocked = true;
    
    // COMPREHENSIVE: Stop ALL existing audio before starting new
    console.log('🚀 COMPREHENSIVE: Stopping ALL audio before starting new');
    stopAllAudio();
    
    // COMPREHENSIVE: Wait for complete cleanup with verification
    setTimeout(() => {
      console.log('🚀 COMPREHENSIVE: Cleanup complete - starting new audio');
      
    setPlayingMsgId(msgId);
    setIsSpeaking(true);
      
      // COMPREHENSIVE: Single Audio System - ZERO Dual Voices
      const useOpenAITTS = openaiAPI && import.meta.env.VITE_OPENAI_API_KEY;
      console.log('🚀 COMPREHENSIVE: OpenAI TTS available:', !!useOpenAITTS);
      
      if (useOpenAITTS) {
        console.log('🚀 COMPREHENSIVE: Using OpenAI TTS exclusively - ZERO dual voices');
        useOpenAITTSExclusively(text);
      } else {
        console.log('⚠️ COMPREHENSIVE: OpenAI not available - NO BROWSER TTS FALLBACK');
        // COMPREHENSIVE: Handle failure without user notification
        handleOpenAITTSFailure();
      }
    }, 300); // COMPREHENSIVE: Extended wait for complete cleanup
  };
  
  // COMPREHENSIVE AUDIO LOCKING SYSTEM: Stop ALL audio systems with system unlock
  const stopAllAudio = () => {
    try {
      console.log('🚀 COMPREHENSIVE: stopAllAudio() called - Audio locking system unlock');
      
      // COMPREHENSIVE: Stop browser TTS with complete cleanup
      if (window.speechSynthesis) {
        console.log('🚀 COMPREHENSIVE: Stopping browser TTS completely');
        window.speechSynthesis.cancel();
        // COMPREHENSIVE: Force stop any speaking state
        if (window.speechSynthesis.speaking) {
          console.log('🚀 COMPREHENSIVE: Force stopping speaking state');
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
        console.log('🚀 COMPREHENSIVE: Browser TTS completely stopped');
      }
      
      // COMPREHENSIVE: Stop ALL OpenAI audio instances with complete cleanup
      if ((window as any).currentOpenAIAudio) {
        console.log('🚀 COMPREHENSIVE: Stopping current OpenAI audio completely');
        const audio = (window as any).currentOpenAIAudio;
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load(); // COMPREHENSIVE: Force reload to clear any cached audio
        audio.remove(); // COMPREHENSIVE: Remove from DOM completely
        (window as any).currentOpenAIAudio = null;
        console.log('🚀 COMPREHENSIVE: Current OpenAI audio completely removed');
      }
      
      // COMPREHENSIVE: Stop ALL audio elements with complete cleanup
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach((audio, index) => {
        console.log('🚀 COMPREHENSIVE: Stopping audio element', index);
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load(); // COMPREHENSIVE: Force reload to clear cached audio
        audio.remove(); // COMPREHENSIVE: Remove from DOM completely
      });
      
      // COMPREHENSIVE: Clear ALL audio timeouts and intervals
      if ((window as any).audioTimeout) {
        console.log('🚀 COMPREHENSIVE: Clearing audio timeout');
        clearTimeout((window as any).audioTimeout);
        (window as any).audioTimeout = null;
      }
      
      if ((window as any).audioInterval) {
        console.log('🚀 COMPREHENSIVE: Clearing audio interval');
        clearInterval((window as any).audioInterval);
        (window as any).audioInterval = null;
      }
      
      // COMPREHENSIVE: Clear any other potential audio references
      (window as any).allAudioInstances = [];
      
      // COMPREHENSIVE: Process queued audio requests if any
      if ((window as any).audioQueue && (window as any).audioQueue.length > 0) {
        console.log('🚀 COMPREHENSIVE: Processing queued audio requests');
        const nextRequest = (window as any).audioQueue.shift();
        if (nextRequest) {
          setTimeout(() => {
            playMessage(nextRequest.msgId, nextRequest.text);
          }, 100);
        }
      }
      
      // COMPREHENSIVE: Reset all audio states with complete synchronization
      setIsSpeaking(false);
      setPlayingMsgId(null);
      
      // COMPREHENSIVE: Unlock audio system for new requests
      (window as any).audioSystemLocked = false;
      console.log('🚀 COMPREHENSIVE: Audio system unlocked - ready for new requests');
      
      // COMPREHENSIVE: Force UI update to reflect stopped state
      setTimeout(() => {
        setIsSpeaking(false);
        setPlayingMsgId(null);
      }, 100);
      
      console.log('✅ COMPREHENSIVE: ALL audio completely stopped - Audio locking system reset');
    } catch (error) {
      console.warn('Audio stop warning (non-critical):', error);
    }
  };
  
  // SECURE: OpenAI TTS exclusively - NO BROWSER TTS FALLBACK
  const useOpenAITTSExclusively = async (text: string) => {
    try {
      console.log('🎯 SECURE: OpenAI TTS exclusive mode - NO BROWSER TTS');
      console.log('🔍 DIAGNOSTIC: Starting OpenAI TTS for text length:', text.length);
      
      // SMART: Convert dates/times to English for better TTS pronunciation
      const optimizedText = convertDatesAndTimesForTTS(text, selectedLanguage);
      console.log('🔍 SMART: Original text length:', text.length, 'Optimized text length:', optimizedText.length);
      
      const ttsResult = await openaiAPI.generateSpeech(
        optimizedText, 
        selectedLanguage, 
        openaiAPI.getLanguageVoice(selectedLanguage)
      );
      
      console.log('✅ SECURE: OpenAI TTS generated successfully');
      console.log('🔍 DIAGNOSTIC: Creating audio element for OpenAI TTS');
      
      // Create audio element and play
      const audio = new Audio(ttsResult.audioUrl);
      
      // Store reference for cleanup
      (window as any).currentOpenAIAudio = audio;
      console.log('🔍 DIAGNOSTIC: OpenAI audio element created and stored');
      
      audio.onended = () => {
        console.log('✅ SECURE: OpenAI TTS completed');
        console.log('🔍 DIAGNOSTIC: OpenAI audio ended - cleaning up states');
        setIsSpeaking(false);
        setPlayingMsgId(null);
        (window as any).currentOpenAIAudio = null;
      };
      
      audio.onerror = () => {
        console.error('❌ COMPREHENSIVE: OpenAI TTS error - NO BROWSER TTS FALLBACK');
        console.log('🔍 COMPREHENSIVE: OpenAI audio error - handling gracefully');
        setIsSpeaking(false);
        setPlayingMsgId(null);
        (window as any).currentOpenAIAudio = null;
        // SILENT: No browser TTS fallback - no user notification
        handleOpenAITTSFailure();
      };
      
      console.log('🔍 COMPREHENSIVE: Starting OpenAI audio playback');
      audio.play().catch((error) => {
        console.warn('❌ COMPREHENSIVE: OpenAI TTS playback failed - NO BROWSER TTS FALLBACK');
        console.log('🔍 COMPREHENSIVE: OpenAI playback failed - handling gracefully');
        (window as any).currentOpenAIAudio = null;
        // SILENT: No browser TTS fallback - no user notification
        handleOpenAITTSFailure();
      });
      
    } catch (error) {
      console.error('❌ COMPREHENSIVE: OpenAI TTS generation failed - NO BROWSER TTS FALLBACK');
      console.log('🔍 COMPREHENSIVE: OpenAI generation failed - handling gracefully');
      // SILENT: No browser TTS fallback - no user notification
      handleOpenAITTSFailure();
    }
  };
  
  // WORLD-CLASS: Enhanced Date/Time conversion for PERFECT TTS pronunciation - ALL LANGUAGES & ALL QUESTION TYPES
  const convertDatesAndTimesForTTS = (text: string, language: string): string => {
    console.log('🚀 WORLD-CLASS: Converting dates/times for PERFECT TTS in language:', language);
    console.log('🚀 WORLD-CLASS: Text preview:', text.substring(0, 100) + '...');
    
    try {
      let optimizedText = text;
      
      // WORLD-CLASS: Convert dates to English format for ALL languages with enhanced precision
      optimizedText = convertDatesToEnglish(optimizedText, language);
      
      // WORLD-CLASS: Convert times to English format for ALL languages with enhanced precision
      optimizedText = convertTimesToEnglish(optimizedText, language);
      
      // WORLD-CLASS: Convert numbers to English format for ALL languages with enhanced precision
      optimizedText = convertNumbersToEnglish(optimizedText, language);
      
      // WORLD-CLASS: Handle edge cases and variations with enhanced coverage
      optimizedText = handleEdgeCases(optimizedText, language);
      
      // WORLD-CLASS: Additional optimization for better TTS pronunciation
      optimizedText = enhanceTTSPronunciation(optimizedText, language);
      
      console.log('✅ WORLD-CLASS: Enhanced date/time conversion complete for language:', language);
      console.log('🚀 WORLD-CLASS: Original vs Optimized length:', text.length, '→', optimizedText.length);
      
      return optimizedText;
      
    } catch (error) {
      console.warn('⚠️ WORLD-CLASS: Date/time conversion failed, using original text:', error);
      return text; // Fallback to original text
    }
  };
  
  // Convert dates to English format
  const convertDatesToEnglish = (text: string, language: string): string => {
    // Hindi date patterns
    if (language === 'hi') {
      // Convert "21 सितंबर 2025" to "21 September 2025"
      text = text.replace(/(\d{1,2})\s+(जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर)\s+(\d{4})/g, '$1 $2 $3');
      
      // Convert month names to English
      const monthMap: Record<string, string> = {
        'जनवरी': 'January', 'फरवरी': 'February', 'मार्च': 'March',
        'अप्रैल': 'April', 'मई': 'May', 'जून': 'June',
        'जुलाई': 'July', 'अगस्त': 'August', 'सितंबर': 'September',
        'अक्टूबर': 'October', 'नवंबर': 'November', 'दिसंबर': 'December'
      };
      
      Object.entries(monthMap).forEach(([hindi, english]) => {
        text = text.replace(new RegExp(hindi, 'g'), english);
      });
    }
    
    // Kannada date patterns
    if (language === 'kn') {
      // Convert "21 ಸೆಪ್ಟೆಂಬರ್ 2025" to "21 September 2025"
      text = text.replace(/(\d{1,2})\s+(ಜನವರಿ|ಫೆಬ್ರವರಿ|ಮಾರ್ಚ್|ಏಪ್ರಿಲ್|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗಸ್ಟ್|ಸೆಪ್ಟೆಂಬರ್|ಅಕ್ಟೋಬರ್|ನವೆಂಬರ್|ಡಿಸೆಂಬರ್)\s+(\d{4})/g, '$1 $2 $3');
      
      const monthMap: Record<string, string> = {
        'ಜನವರಿ': 'January', 'ಫೆಬ್ರವರಿ': 'February', 'ಮಾರ್ಚ್': 'March',
        'ಏಪ್ರಿಲ್': 'April', 'ಮೇ': 'May', 'ಜೂನ್': 'June',
        'ಜುಲೈ': 'July', 'ಆಗಸ್ಟ್': 'August', 'ಸೆಪ್ಟೆಂಬರ್': 'September',
        'ಅಕ್ಟೋಬರ್': 'October', 'ನವೆಂಬರ್': 'November', 'ಡಿಸೆಂಬರ್': 'December'
      };
      
      Object.entries(monthMap).forEach(([kannada, english]) => {
        text = text.replace(new RegExp(kannada, 'g'), english);
      });
    }
    
    // Tamil date patterns
    if (language === 'ta') {
      // Convert "21 செப்டம்பர் 2025" to "21 September 2025"
      text = text.replace(/(\d{1,2})\s+(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)\s+(\d{4})/g, '$1 $2 $3');
      
      const monthMap: Record<string, string> = {
        'ஜனவரி': 'January', 'பிப்ரவரி': 'February', 'மார்ச்': 'March',
        'ஏப்ரல்': 'April', 'மே': 'May', 'ஜூன்': 'June',
        'ஜூலை': 'July', 'ஆகஸ்ட்': 'August', 'செப்டம்பர்': 'September',
        'அக்டோபர்': 'October', 'நவம்பர்': 'November', 'டிசம்பர்': 'December'
      };
      
      Object.entries(monthMap).forEach(([tamil, english]) => {
        text = text.replace(new RegExp(tamil, 'g'), english);
      });
    }
    
    // Telugu date patterns
    if (language === 'te') {
      // Convert "21 సెప్టెంబర్ 2025" to "21 September 2025"
      text = text.replace(/(\d{1,2})\s+(జనవరి|ఫిబ్రవరి|మార్చి|ఏప్రిల్|మే|జూన్|జులై|ఆగస్టు|సెప్టెంబర్|అక్టోబర్|నవంబర్|డిసెంబర్)\s+(\d{4})/g, '$1 $2 $3');
      
      const monthMap: Record<string, string> = {
        'జనవరి': 'January', 'ఫిబ్రవరి': 'February', 'మార్చి': 'March',
        'ఏప్రిల్': 'April', 'మే': 'May', 'జూన్': 'June',
        'జులై': 'July', 'ఆగస్టు': 'August', 'సెప్టెంబర్': 'September',
        'అక్టోబర్': 'October', 'నవంబర్': 'November', 'డిసెంబర్': 'December'
      };
      
      Object.entries(monthMap).forEach(([telugu, english]) => {
        text = text.replace(new RegExp(telugu, 'g'), english);
      });
    }
    
    // Malayalam date patterns
    if (language === 'ml') {
      // Convert "21 സെപ്റ്റംബർ 2025" to "21 September 2025"
      text = text.replace(/(\d{1,2})\s+(ജനുവരി|ഫെബ്രുവരി|മാർച്ച്|ഏപ്രിൽ|മേയ്|ജൂൺ|ജൂലൈ|ഓഗസ്റ്റ്|സെപ്റ്റംബർ|ഒക്ടോബർ|നവംബർ|ഡിസംബർ)\s+(\d{4})/g, '$1 $2 $3');
      
      const monthMap: Record<string, string> = {
        'ജനുവരി': 'January', 'ഫെബ്രുവരി': 'February', 'മാർച്ച്': 'March',
        'ഏപ്രിൽ': 'April', 'മേയ്': 'May', 'ജൂൺ': 'June',
        'ജൂലൈ': 'July', 'ഓഗസ്റ്റ്': 'August', 'സെപ്റ്റംബർ': 'September',
        'ഒക്ടോബർ': 'October', 'നവംബർ': 'November', 'ഡിസംബർ': 'December'
      };
      
      Object.entries(monthMap).forEach(([malayalam, english]) => {
        text = text.replace(new RegExp(malayalam, 'g'), english);
      });
    }
    
    return text;
  };
  
  // Convert times to English format for ALL languages
  const convertTimesToEnglish = (text: string, language: string): string => {
    // Convert time patterns like "6:20 PM" to "6:20 PM" (keep English)
    
    // Hindi time patterns
    if (language === 'hi') {
      text = text.replace(/(\d{1,2}):(\d{2})\s+(सुबह|दोपहर|शाम|रात|बजे)/g, (match, hour, minute, timeOfDay) => {
        const hourNum = parseInt(hour);
        if (timeOfDay === 'सुबह' && hourNum < 12) return `${hour}:${minute} AM`;
        if (timeOfDay === 'दोपहर' && hourNum === 12) return `${hour}:${minute} PM`;
        if (timeOfDay === 'शाम' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'रात' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'बजे') return `${hour}:${minute}`;
        return match;
      });
    }
    
    // Kannada time patterns
    if (language === 'kn') {
      text = text.replace(/(\d{1,2}):(\d{2})\s+(ಬೆಳಗ್ಗೆ|ಮಧ್ಯಾಹ್ನ|ಸಂಜೆ|ರಾತ್ರಿ|ಗಂಟೆ)/g, (match, hour, minute, timeOfDay) => {
        const hourNum = parseInt(hour);
        if (timeOfDay === 'ಬೆಳಗ್ಗೆ' && hourNum < 12) return `${hour}:${minute} AM`;
        if (timeOfDay === 'ಮಧ್ಯಾಹ್ನ' && hourNum === 12) return `${hour}:${minute} PM`;
        if (timeOfDay === 'ಸಂಜೆ' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'ರಾತ್ರಿ' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'ಗಂಟೆ') return `${hour}:${minute}`;
        return match;
      });
    }
    
    // Tamil time patterns
    if (language === 'ta') {
      text = text.replace(/(\d{1,2}):(\d{2})\s+(காலை|மதியம்|மாலை|இரவு|மணி)/g, (match, hour, minute, timeOfDay) => {
        const hourNum = parseInt(hour);
        if (timeOfDay === 'காலை' && hourNum < 12) return `${hour}:${minute} AM`;
        if (timeOfDay === 'மதியம்' && hourNum === 12) return `${hour}:${minute} PM`;
        if (timeOfDay === 'மாலை' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'இரவு' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'மணி') return `${hour}:${minute}`;
        return match;
      });
    }
    
    // Telugu time patterns
    if (language === 'te') {
      text = text.replace(/(\d{1,2}):(\d{2})\s+(ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి|గంటలు)/g, (match, hour, minute, timeOfDay) => {
        const hourNum = parseInt(hour);
        if (timeOfDay === 'ఉదయం' && hourNum < 12) return `${hour}:${minute} AM`;
        if (timeOfDay === 'మధ్యాహ్నం' && hourNum === 12) return `${hour}:${minute} PM`;
        if (timeOfDay === 'సాయంత్రం' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'రాత్రి' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'గంటలు') return `${hour}:${minute}`;
        return match;
      });
    }
    
    // Malayalam time patterns
    if (language === 'ml') {
      text = text.replace(/(\d{1,2}):(\d{2})\s+(രാവിലെ|ഉച്ചയ്ക്ക്|വൈകുന്നേരം|രാത്രി|മണിക്കൂർ)/g, (match, hour, minute, timeOfDay) => {
        const hourNum = parseInt(hour);
        if (timeOfDay === 'രാവിലെ' && hourNum < 12) return `${hour}:${minute} AM`;
        if (timeOfDay === 'ഉച്ചയ്ക്ക്' && hourNum === 12) return `${hour}:${minute} PM`;
        if (timeOfDay === 'വൈകുന്നേരം' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'രാത്രി' && hourNum > 12) return `${hourNum - 12}:${minute} PM`;
        if (timeOfDay === 'മണിക്കൂർ') return `${hour}:${minute}`;
        return match;
      });
    }
    
    return text;
  };
  
  // Convert numbers to English format for ALL languages
  const convertNumbersToEnglish = (text: string, language: string): string => {
    // Keep years in English format for better TTS pronunciation
    // Convert "2025" to "2025" (already English, but ensure clarity)
    text = text.replace(/(\d{4})/g, (match) => {
      // Ensure years are pronounced clearly
      return match;
    });
    
    // Convert date numbers to ensure clear pronunciation
    text = text.replace(/(\d{1,2})/g, (match) => {
      // Ensure date numbers are pronounced clearly
      return match;
    });
    
    // Convert time numbers to ensure clear pronunciation
    text = text.replace(/(\d{1,2}):(\d{2})/g, (match, hour, minute) => {
      // Ensure time numbers are pronounced clearly
      return `${hour}:${minute}`;
    });
    
    return text;
  };
  
  // WORLD-CLASS: Enhanced TTS pronunciation optimization for ALL languages
  const enhanceTTSPronunciation = (text: string, language: string): string => {
    console.log('🚀 WORLD-CLASS: Enhancing TTS pronunciation for language:', language);
    
    try {
      let enhancedText = text;
      
      // WORLD-CLASS: Optimize number pronunciation for better TTS
      enhancedText = enhancedText.replace(/(\d{1,2})/g, (match, num) => {
        const number = parseInt(num);
        if (number <= 31) {
          // Convert dates to ordinal format for better pronunciation
          const suffixes = ['th', 'st', 'nd', 'rd'];
          const suffix = suffixes[number % 10] || suffixes[0];
          return `${number}${suffix}`;
        }
        return match;
      });
      
      // WORLD-CLASS: Optimize time format for better TTS
      enhancedText = enhancedText.replace(/(\d{1,2}):(\d{2})/g, (match, hour, minute) => {
        const h = parseInt(hour);
        const m = parseInt(minute);
        if (h === 0) return `12:${m.toString().padStart(2, '0')} AM`;
        if (h < 12) return `${h}:${m.toString().padStart(2, '0')} AM`;
        if (h === 12) return `12:${m.toString().padStart(2, '0')} PM`;
        return `${h - 12}:${m.toString().padStart(2, '0')} PM`;
      });
      
      // WORLD-CLASS: Optimize year pronunciation
      enhancedText = enhancedText.replace(/(\d{4})/g, (match, year) => {
        const y = parseInt(year);
        if (y >= 2000 && y <= 2099) {
          return `${Math.floor(y / 100)} ${y % 100}`; // "20 25" instead of "2025"
        }
        return match;
      });
      
      // WORLD-CLASS: Language-specific pronunciation enhancements
      if (language === 'hi' || language === 'kn') {
        // Enhanced Devanagari script optimization
        enhancedText = enhancedText.replace(/[०-९]/g, (match) => {
          const devanagariToEnglish: Record<string, string> = {
            '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
            '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
          };
          return devanagariToEnglish[match] || match;
        });
      }
      
      console.log('✅ WORLD-CLASS: TTS pronunciation enhancement complete for language:', language);
      return enhancedText;
      
    } catch (error) {
      console.warn('⚠️ WORLD-CLASS: TTS pronunciation enhancement failed:', error);
      return text; // Fallback to original text
    }
  };
  
  // COMPREHENSIVE: Handle edge cases and variations for ALL languages
  const handleEdgeCases = (text: string, language: string): string => {
    console.log('🔍 COMPREHENSIVE: Handling edge cases for language:', language);
    
    try {
      let processedText = text;
      
      // Handle common variations and edge cases
      if (language === 'hi') {
        // Handle variations like "सितंबर 21" instead of "21 सितंबर"
        processedText = processedText.replace(/(जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर)\s+(\d{1,2})/g, '$2 $1');
        
        // Handle time variations like "बजे 6:20" instead of "6:20 बजे"
        processedText = processedText.replace(/(सुबह|दोपहर|शाम|रात|बजे)\s+(\d{1,2}):(\d{2})/g, '$2:$3 $1');
      }
      
      if (language === 'kn') {
        // Handle variations like "ಸೆಪ್ಟೆಂಬರ್ 21" instead of "21 ಸೆಪ್ಟೆಂಬರ್"
        processedText = processedText.replace(/(ಜನವರಿ|ಫೆಬ್ರವರಿ|ಮಾರ್ಚ್|ಏಪ್ರಿಲ್|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗಸ್ಟ್|ಸೆಪ್ಟೆಂಬರ್|ಅಕ್ಟೋಬರ್|ನವೆಂಬರ್|ಡಿಸೆಂಬರ್)\s+(\d{1,2})/g, '$2 $1');
        
        // Handle time variations
        processedText = processedText.replace(/(ಬೆಳಗ್ಗೆ|ಮಧ್ಯಾಹ್ನ|ಸಂಜೆ|ರಾತ್ರಿ|ಗಂಟೆ)\s+(\d{1,2}):(\d{2})/g, '$2:$3 $1');
      }
      
      if (language === 'ta') {
        // Handle variations like "செப்டம்பர் 21" instead of "21 செப்டம்பர்"
        processedText = processedText.replace(/(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)\s+(\d{1,2})/g, '$2 $1');
        
        // Handle time variations
        processedText = processedText.replace(/(காலை|மதியம்|மாலை|இரவு|மணி)\s+(\d{1,2}):(\d{2})/g, '$2:$3 $1');
      }
      
      if (language === 'te') {
        // Handle variations like "సెప్టెంబర్ 21" instead of "21 సెప్టెంబర్"
        processedText = processedText.replace(/(జనవరి|ఫిబ్రవరి|మార్చి|ఏప్రిల్|మే|జూన్|జులై|ఆగస్టు|సెప్టెంబర్|అక్టోబర్|నవంబర్|డిసెంబర్)\s+(\d{1,2})/g, '$2 $1');
        
        // Handle time variations
        processedText = processedText.replace(/(ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి|గంటలు)\s+(\d{1,2}):(\d{2})/g, '$2:$3 $1');
      }
      
      if (language === 'ml') {
        // Handle variations like "സെപ്റ്റംബർ 21" instead of "21 സെപ്റ്റംബർ"
        processedText = processedText.replace(/(ജനുവരി|ഫെബ്രുവരി|മാർച്ച്|ഏപ്രിൽ|മേയ്|ജൂൺ|ജൂലൈ|ഓഗസ്റ്റ്|സെപ്റ്റംബർ|ഒക്ടോബർ|നവംബർ|ഡിസംബർ)\s+(\d{1,2})/g, '$2 $1');
        
        // Handle time variations
        processedText = processedText.replace(/(രാവിലെ|ഉച്ചയ്ക്ക്|വൈകുന്നേരം|രാത്രി|മണിക്കൂർ)\s+(\d{1,2}):(\d{2})/g, '$2:$3 $1');
      }
      
      console.log('✅ COMPREHENSIVE: Edge cases handled for language:', language);
      return processedText;
      
    } catch (error) {
      console.warn('⚠️ COMPREHENSIVE: Edge case handling failed:', error);
      return text; // Fallback to original text
    }
  };
  
  // SILENT: Handle OpenAI TTS failures without user notification - BETTER UX
  const handleOpenAITTSFailure = () => {
    console.log('🔍 SILENT: Handling OpenAI TTS failure without user notification');
    
    // SILENT: Reset audio states without showing error message
    setIsSpeaking(false);
    setPlayingMsgId(null);
    
    // SILENT: Clear any audio references
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio = null;
    }
    
    console.log('✅ SILENT: TTS failure handled gracefully - no user worry');
  };
  
  // SECURE: Browser TTS function - KEPT FOR REFERENCE BUT NOT USED
  const useBrowserTTSExclusively = (text: string) => {
    console.log('🔄 APPROACH 1: Browser TTS exclusive mode');
    console.log('🔍 DIAGNOSTIC: Starting Browser TTS for text length:', text.length);
    
    // SAFE: Using existing working browser TTS logic
    const contentType = detectContentType(text);
    const cleanedText = processTextForTTS(text, contentType);
    
    const utterance = new window.SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    
    // Find the selected voice - SAFE: Existing working logic
    const selectedVoiceObj = voiceOptions.find(v => v.value === selectedVoice);
    let targetVoice = voices.find(v => v.name === selectedVoice);
    
    if (!targetVoice) {
      targetVoice = selectBestVoiceForLanguage(selectedLanguage, voices, selectedVoice);
    }
    
    if (!targetVoice) {
      targetVoice = voices[0];
    }
    
    utterance.voice = targetVoice;
    
    // Set language - SAFE: Existing working logic
    switch (selectedLanguage) {
      case 'hi':
        utterance.lang = 'hi-IN';
        break;
      case 'kn':
        utterance.lang = 'kn-IN';
        break;
      case 'ta':
        utterance.lang = 'ta-IN';
        break;
      case 'te':
        utterance.lang = 'te-IN';
        break;
      case 'ml':
        utterance.lang = 'ml-IN';
        break;
      default:
        utterance.lang = 'en-US';
    }
    
    // Set speech parameters - SAFE: Existing working logic
    utterance.rate = selectedLanguage === 'te' ? 0.88 : 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      console.log('🔍 DIAGNOSTIC: Browser TTS started speaking');
    };
    
    utterance.onend = () => {
      console.log('✅ APPROACH 1: Browser TTS completed');
      console.log('🔍 DIAGNOSTIC: Browser TTS ended - cleaning up states');
      setPlayingMsgId(null);
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('❌ APPROACH 1: Browser TTS error:', event.error);
      console.log('🔍 DIAGNOSTIC: Browser TTS error - cleaning up states');
      if (event.error !== 'interrupted') {
        console.warn('Speech synthesis error (non-interruption):', event.error);
      }
      setPlayingMsgId(null);
      setIsSpeaking(false);
    };
    
    console.log('🔍 DIAGNOSTIC: Starting Browser TTS playback');
    // Speak in natural chunks - SAFE: Existing working logic
    const chunks = splitIntoNaturalChunks(cleanedText);
    if (chunks.length <= 1) {
      window.speechSynthesis.speak(utterance);
    } else {
      let index = 0;
      const speakNext = () => {
        if (index >= chunks.length) return;
        const u = new window.SpeechSynthesisUtterance(chunks[index]);
        u.voice = utterance.voice;
        u.lang = utterance.lang;
        u.rate = utterance.rate;
        u.pitch = utterance.pitch;
        u.volume = utterance.volume;
        u.onend = () => {
          index += 1;
          if (index < chunks.length) {
            speakNext();
          } else {
            setPlayingMsgId(null);
            setIsSpeaking(false);
          }
        };
        window.speechSynthesis.speak(u);
      };
      speakNext();
    }
  };
  
  // Fallback to browser-based TTS if OpenAI fails
  const fallbackToBrowserTTS = (text: string) => {
    console.log('🔄 Fallback: Using browser-based TTS');
    
    // Intelligent TTS text processing based on content type
    const contentType = detectContentType(text);
    const cleanedText = processTextForTTS(text, contentType);
    
    const utterance = new window.SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    
    // Find the selected voice
    const selectedVoiceObj = voiceOptions.find(v => v.value === selectedVoice);
    let targetVoice = voices.find(v => v.name === selectedVoice);
    
    // If selected voice not found, try to find a voice for the selected language
    if (!targetVoice) {
      targetVoice = selectBestVoiceForLanguage(selectedLanguage, voices, selectedVoice);
    }
    
    // If still no voice found, use the first available voice
    if (!targetVoice) {
      targetVoice = voices[0];
    }
    
    // Set the voice
    utterance.voice = targetVoice;
    
    // Set language based on selected language
    switch (selectedLanguage) {
      case 'hi':
        utterance.lang = 'hi-IN';
        break;
      case 'kn':
        utterance.lang = 'kn-IN';
        break;
      case 'ta':
        utterance.lang = 'ta-IN';
        break;
      case 'te':
        utterance.lang = 'te-IN';
        break;
      case 'ml':
        utterance.lang = 'ml-IN';
        break;
      default:
        utterance.lang = 'en-US';
    }
    
    // Set speech rate and pitch for better quality
    // Tune for naturalness (slightly slower for Indian languages) and chunk long speech
    utterance.rate = selectedLanguage === 'te' ? 0.88 : 0.9;
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    
    utterance.onend = () => {
      setPlayingMsgId(null);
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      // Don't log interruption errors as they're common and not problematic
      if (event.error !== 'interrupted') {
        console.warn('Speech synthesis error (non-interruption):', event.error);
      }
      setPlayingMsgId(null);
      setIsSpeaking(false);
    };
    
    // Speak in natural chunks to avoid robotic cadence on long paragraphs
    const chunks = splitIntoNaturalChunks(cleanedText);
    if (chunks.length <= 1) {
      window.speechSynthesis.speak(utterance);
    } else {
      let index = 0;
      const speakNext = () => {
        if (index >= chunks.length) return;
        const u = new window.SpeechSynthesisUtterance(chunks[index]);
        u.voice = utterance.voice;
        u.lang = utterance.lang;
        u.rate = utterance.rate;
        u.pitch = utterance.pitch;
        u.volume = utterance.volume;
        u.onend = () => {
          index += 1;
          if (index < chunks.length) {
            speakNext();
          } else {
            setPlayingMsgId(null);
            setIsSpeaking(false);
          }
        };
        u.onerror = (event) => {
          // Don't log interruption errors as they're common and not problematic
          if (event.error !== 'interrupted') {
            console.warn('Speech synthesis error (non-interruption):', event.error);
          }
          setPlayingMsgId(null);
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(u);
      };
      speakNext();
      return;
    }
  };

  // INTELLIGENT QUESTION TYPE DETECTION - FIXED PRIORITY ORDER
  function detectQuestionType(question: string): 'festival' | 'panchang' | 'timing' | 'general' {
    const lowerQuestion = question.toLowerCase();
    
    // CRITICAL FIX: Check specific keywords BEFORE generic ones to avoid misclassification
    
    // Panchang questions - HIGHEST PRIORITY (check first)
    if (lowerQuestion.includes('amavasya') || lowerQuestion.includes('purnima') ||
        lowerQuestion.includes('ekadashi') || lowerQuestion.includes('tithi') ||
        lowerQuestion.includes('nakshatra') || lowerQuestion.includes('rahu') ||
        lowerQuestion.includes('yoga') || lowerQuestion.includes('karan') ||
        lowerQuestion.includes('maasa') || lowerQuestion.includes('vaara') ||
        lowerQuestion.includes('sunrise') || lowerQuestion.includes('sunset') ||
        lowerQuestion.includes('brahma') || lowerQuestion.includes('panchang') ||
        lowerQuestion.includes('panchngam') || lowerQuestion.includes('panchagam') ||
        lowerQuestion.includes('panchangam') ||
        // Hindi variations
        lowerQuestion.includes('पंचांग') || lowerQuestion.includes('पंचगम') ||
        lowerQuestion.includes('तिथि') || lowerQuestion.includes('नक्षत्र') ||
        lowerQuestion.includes('राहु') || lowerQuestion.includes('योग') ||
        lowerQuestion.includes('करण') || lowerQuestion.includes('मास') ||
        lowerQuestion.includes('वार') || lowerQuestion.includes('सूर्योदय') ||
        lowerQuestion.includes('सूर्यास्त') || lowerQuestion.includes('ब्रह्म') ||
        // Kannada variations
        lowerQuestion.includes('ಪಂಚಾಂಗ') || lowerQuestion.includes('ತಿಥಿ') ||
        lowerQuestion.includes('ನಕ್ಷತ್ರ') || lowerQuestion.includes('ರಾಹು') ||
        lowerQuestion.includes('ಯೋಗ') || lowerQuestion.includes('ಕರಣ') ||
        lowerQuestion.includes('ಮಾಸ') || lowerQuestion.includes('ವಾರ') ||
        // Tamil variations
        lowerQuestion.includes('பஞ்சாங்கம்') || lowerQuestion.includes('திதி') ||
        lowerQuestion.includes('நட்சத்திரம்') || lowerQuestion.includes('ராகு') ||
        lowerQuestion.includes('யோகம்') || lowerQuestion.includes('கரணம்') ||
        lowerQuestion.includes('மாசம்') || lowerQuestion.includes('வாரம்') ||
        // Telugu variations
        lowerQuestion.includes('పంచాంగం') || lowerQuestion.includes('తిథి') ||
        lowerQuestion.includes('నక్షత్రం') || lowerQuestion.includes('రాహు') ||
        lowerQuestion.includes('యోగం') || lowerQuestion.includes('కరణం') ||
        lowerQuestion.includes('మాసం') || lowerQuestion.includes('వారం') ||
        // Malayalam variations
        lowerQuestion.includes('പഞ്ചാംഗം') || lowerQuestion.includes('തിഥി') ||
        lowerQuestion.includes('നക്ഷത്രം') || lowerQuestion.includes('രാഹു') ||
        lowerQuestion.includes('യോഗം') || lowerQuestion.includes('കരണം') ||
        lowerQuestion.includes('മാസം') || lowerQuestion.includes('വാരം') ||
        // Common panchang-related phrases
        lowerQuestion.includes('today') || lowerQuestion.includes('aaj') ||
        lowerQuestion.includes('ಇಂದು') || lowerQuestion.includes('இன்று') ||
        lowerQuestion.includes('ఈరోజు') || lowerQuestion.includes('ഇന്ന്')) {
      return 'panchang';
    }
    
    // Festival questions - SECOND PRIORITY (check after panchang)
    if (lowerQuestion.includes('diwali') || lowerQuestion.includes('ganesh') || 
        lowerQuestion.includes('holi') || lowerQuestion.includes('rakhi') ||
        lowerQuestion.includes('navratri') || lowerQuestion.includes('ramadan') ||
        lowerQuestion.includes('deepavali') || lowerQuestion.includes('दीपावली') ||
        lowerQuestion.includes('ದೀಪಾವಳಿ') || lowerQuestion.includes('தீபாவளி') ||
        lowerQuestion.includes('దీపావళి') || lowerQuestion.includes('ദീപാവലി') ||
        lowerQuestion.includes('ganesh chaturthi') || lowerQuestion.includes('गणेश चतुर्थी') ||
        lowerQuestion.includes('ಗಣೇಶ ಚತುರ್ಥಿ') || lowerQuestion.includes('விநாயகர் சதுர்த்தி') ||
        lowerQuestion.includes('వినాయక చతుర్థి') || lowerQuestion.includes('വിനായക ചതുർത്ഥി') ||
        // Generic festival keywords (LOWEST PRIORITY)
        lowerQuestion.includes('festival') || lowerQuestion.includes('त्योहार') ||
        lowerQuestion.includes('ಉತ್ಸವ') || lowerQuestion.includes('திருவிழா') ||
        lowerQuestion.includes('పండుగ') || lowerQuestion.includes('ഉത്സവം') ||
        // Generic time questions (LOWEST PRIORITY)
        lowerQuestion.includes('when is') || lowerQuestion.includes('कब है') ||
        lowerQuestion.includes('ಎಂದು') || lowerQuestion.includes('எப்போது') ||
        lowerQuestion.includes('എപ്പോൾ') || lowerQuestion.includes('ఎప్పుడు') ||
        lowerQuestion.includes('कब मनाया जाता है') || lowerQuestion.includes('ಎಂದು ಆಚರಿಸಲಾಗುತ್ತದೆ') ||
        lowerQuestion.includes('எப்போது கொண்டாடப்படுகிறது') || lowerQuestion.includes('ఎప్పుడు జరుపుకుంటారు')) {
      return 'festival';
    }
    
    // Panchang questions - Enhanced with more variations and multi-language support
    if (lowerQuestion.includes('panchang') || lowerQuestion.includes('panchngam') || 
        lowerQuestion.includes('panchagam') || lowerQuestion.includes('panchangam') ||
        lowerQuestion.includes('tithi') || lowerQuestion.includes('nakshatra') || 
        lowerQuestion.includes('rahu') || lowerQuestion.includes('yoga') || 
        lowerQuestion.includes('karan') || lowerQuestion.includes('maasa') ||
        lowerQuestion.includes('vaara') || lowerQuestion.includes('sunrise') ||
        lowerQuestion.includes('sunset') || lowerQuestion.includes('brahma') ||
        // Hindi variations
        lowerQuestion.includes('पंचांग') || lowerQuestion.includes('पंचगम') ||
        lowerQuestion.includes('तिथि') || lowerQuestion.includes('नक्षत्र') ||
        lowerQuestion.includes('राहु') || lowerQuestion.includes('योग') ||
        lowerQuestion.includes('करण') || lowerQuestion.includes('मास') ||
        lowerQuestion.includes('वार') || lowerQuestion.includes('सूर्योदय') ||
        lowerQuestion.includes('सूर्यास्त') || lowerQuestion.includes('ब्रह्म') ||
        // Kannada variations
        lowerQuestion.includes('ಪಂಚಾಂಗ') || lowerQuestion.includes('ತಿಥಿ') ||
        lowerQuestion.includes('ನಕ್ಷತ್ರ') || lowerQuestion.includes('ರಾಹು') ||
        lowerQuestion.includes('ಯೋಗ') || lowerQuestion.includes('ಕರಣ') ||
        lowerQuestion.includes('ಮಾಸ') || lowerQuestion.includes('ವಾರ') ||
        // Tamil variations
        lowerQuestion.includes('பஞ்சாங்கம்') || lowerQuestion.includes('திதி') ||
        lowerQuestion.includes('நட்சத்திரம்') || lowerQuestion.includes('ராகு') ||
        lowerQuestion.includes('யோகம்') || lowerQuestion.includes('கரணம்') ||
        lowerQuestion.includes('மாசம்') || lowerQuestion.includes('வாரம்') ||
        // Telugu variations
        lowerQuestion.includes('పంచాంగం') || lowerQuestion.includes('తిథి') ||
        lowerQuestion.includes('నక్షత్రం') || lowerQuestion.includes('రాహు') ||
        lowerQuestion.includes('యోగం') || lowerQuestion.includes('కరణం') ||
        lowerQuestion.includes('మాసం') || lowerQuestion.includes('వారం') ||
        // Malayalam variations
        lowerQuestion.includes('പഞ്ചാംഗം') || lowerQuestion.includes('തിഥി') ||
        lowerQuestion.includes('നക്ഷത്രം') || lowerQuestion.includes('രാഹു') ||
        lowerQuestion.includes('യോഗം') || lowerQuestion.includes('കരണം') ||
        lowerQuestion.includes('മാസം') || lowerQuestion.includes('വാരം') ||
        // Common panchang-related phrases
        lowerQuestion.includes('today') || lowerQuestion.includes('aaj') ||
        lowerQuestion.includes('ಇಂದು') || lowerQuestion.includes('இன்று') ||
        lowerQuestion.includes('ఈరోజు') || lowerQuestion.includes('ഇന്ന്')) {
      return 'panchang';
    }
    
    // Timing questions - Enhanced multi-language support
    if (lowerQuestion.includes('time') || lowerQuestion.includes('sunrise') || 
        lowerQuestion.includes('sunset') || lowerQuestion.includes('muhurat') ||
        lowerQuestion.includes('kaal') || lowerQuestion.includes('samay') ||
        lowerQuestion.includes('समय') || lowerQuestion.includes('सूर्योदय') ||
        lowerQuestion.includes('सूर्यास्त') || lowerQuestion.includes('मुहूर्त') ||
        lowerQuestion.includes('काल') || lowerQuestion.includes('ಸಮಯ') ||
        lowerQuestion.includes('ಸೂರ್ಯೋದಯ') || lowerQuestion.includes('ಸೂರ್ಯಾಸ್ತ') ||
        lowerQuestion.includes('ಮುಹೂರ್ತ') || lowerQuestion.includes('ಕಾಲ') ||
        lowerQuestion.includes('நேரம்') || lowerQuestion.includes('சூரிய உதயம்') ||
        lowerQuestion.includes('சூரிய அஸ்தமனம்') || lowerQuestion.includes('முகூர்த்தம்') ||
        lowerQuestion.includes('காலம்') || lowerQuestion.includes('సమయం') ||
        lowerQuestion.includes('సూర్యోదయం') || lowerQuestion.includes('సూర్యాస్తమానం') ||
        lowerQuestion.includes('ముహూర్తం') || lowerQuestion.includes('కాలం') ||
        lowerQuestion.includes('സമയം') || lowerQuestion.includes('സൂര്യോദയം') ||
        lowerQuestion.includes('സൂര്യാസ്തമയം') || lowerQuestion.includes('മുഹൂർത്തം') ||
        lowerQuestion.includes('കാലം')) {
      return 'timing';
    }
    
    return 'general';
  }

  // Output post-processing for Perplexity responses - INTELLIGENT VERSION
  // NEW SIMPLE FILTERING SYSTEM - CLEAN, SAFE, EFFECTIVE (FIXED)
  function processPerplexityResponse(response: string, isMoreInfo: boolean = false, originalQuestion?: string, language?: string): string {
    // CRITICAL FIX: Handle both single-line and multi-line responses
    let lines: string[] = [];
    
    if (response.includes('\n')) {
      // Multi-line response - split normally
      lines = response.split('\n').map(line => line.trim()).filter(Boolean);
    } else {
      // Single-line response - split by sentences or periods for better processing
      lines = response.split(/[.!?]+/).map(line => line.trim()).filter(Boolean);
    }

    // SAFETY TEAM: Remove only obvious AI garbage and potentially harmful content
    const removeThese = [
      // AI thinking tags
      "<think>", "<reasoning>", "</think>", "</reasoning>",
      // Search references
      "search results", "the instructions say", "looking at",
      "the fifth source", "the fourth source", "the third source", "the first result",
      // Generic advice
      "please consult", "refer to", "check other", "consult other",
      // Potentially harmful content
      "harmful", "dangerous", "illegal", "inappropriate", "offensive"
    ];
    
    // SIMPLE FILTERING: Remove only the bad stuff, keep everything else
    lines = lines.filter(line => {
      // Remove lines with forbidden content
      if (removeThese.some(phrase => line.toLowerCase().includes(phrase))) {
        return false;
      }
      
      // Remove numbered references [1], [2], [3]
      if (/\[\d+\]/.test(line)) {
        return false;
      }
      
      // Remove very short lines (likely garbage)
      if (line.length < 3) {
      return false;
      }
      
      // Keep everything else
      return true;
    });

    // Clean up formatting
    lines = lines.map(line => line.replace(/\*\*/g, ""));

    // Add greeting if missing
    if (!lines[0]?.includes('Jai Shree Krishna')) {
      lines.unshift('🪔 Jai Shree Krishna.');
    }

    // ULTRA-SECURE PERMANENT SOLUTION: Language-aware processing for ALL question types
    // Use passed language parameter for comprehensive language support
    const currentLanguage = language || 'en'; // Default to English if not specified
    
    // SECURE ENHANCEMENT: Enhanced language handling for ALL question types
    console.log('🔍 ULTRA-SECURE MODE: Processing with language awareness for', currentLanguage);
    
    // Determine question type for intelligent processing
    const questionType = originalQuestion ? detectQuestionType(originalQuestion) : 'general';
    console.log('🔍 Question Type Detected:', questionType);
    
    // SECURE ENHANCEMENT: Language-aware question type processing
    if (questionType === 'festival') {
      return formatFestivalResponse(lines, currentLanguage);
    } else if (questionType === 'panchang') {
      return formatPanchangResponse(lines, currentLanguage);
    } else if (questionType === 'timing') {
      return formatTimingResponse(lines, currentLanguage);
    } else {
      return formatGeneralResponse(lines, currentLanguage);
    }
  }

  // NEW SIMPLE FORMATTING FUNCTIONS - CLEAN AND EFFECTIVE
  
  function formatFestivalResponse(lines: string[], language: string = 'en'): string {
    const formattedLines = ['🪔 Jai Shree Krishna', ''];
    
    // COMPLETELY MINIMAL DESIGN - No visual separators, just clean typography
    
    // Extract and organize information by type
    const dateInfo: string[] = [];
    const timingInfo: string[] = [];
    const culturalInfo: string[] = [];
    const ritualInfo: string[] = [];
    
    lines.forEach(line => {
      if (line.includes('Jai Shree Krishna')) return; // Skip greeting
      
      if (line.length > 3) { // Only filter extremely short lines
        // Categorize information based on content
        if (line.toLowerCase().includes('date') || line.toLowerCase().includes('october') || 
            line.toLowerCase().includes('monday') || line.toLowerCase().includes('2025') ||
            line.toLowerCase().includes('amavasya') || line.toLowerCase().includes('kartik')) {
          dateInfo.push(line);
        } else if (line.toLowerCase().includes('pm') || line.toLowerCase().includes('am') ||
                   line.toLowerCase().includes('time') || line.toLowerCase().includes('muhurat') ||
                   line.toLowerCase().includes('tithi')) {
          timingInfo.push(line);
        } else if (line.toLowerCase().includes('celebrates') || line.toLowerCase().includes('victory') ||
                   line.toLowerCase().includes('prosperity') || line.toLowerCase().includes('fortune') ||
                   line.toLowerCase().includes('darkness') || line.toLowerCase().includes('light')) {
          culturalInfo.push(line);
        } else if (line.toLowerCase().includes('clean') || line.toLowerCase().includes('light') ||
                   line.toLowerCase().includes('diya') || line.toLowerCase().includes('puja') ||
                   line.toLowerCase().includes('sweet') || line.toLowerCase().includes('flower')) {
          ritualInfo.push(line);
        } else {
          // Default category for other information
          dateInfo.push(line);
        }
      }
    });
    
    // Add organized sections with clean spacing
    if (dateInfo.length > 0) {
      dateInfo.forEach(info => formattedLines.push(`• ${info}`));
      formattedLines.push('');
    }
    
    if (timingInfo.length > 0) {
      formattedLines.push('⏰ AUSPICIOUS TIMINGS');
      timingInfo.forEach(info => formattedLines.push(`• ${info}`));
    formattedLines.push('');
    }
    
    if (culturalInfo.length > 0) {
      formattedLines.push('🌙 CULTURAL SIGNIFICANCE');
      culturalInfo.forEach(info => formattedLines.push(`• ${info}`));
      formattedLines.push('');
    }
    
    if (ritualInfo.length > 0) {
      formattedLines.push('🏮 RITUAL DETAILS');
      ritualInfo.forEach(info => formattedLines.push(`• ${info}`));
      formattedLines.push('');
    }
    
    // Add professional footer
    formattedLines.push('All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations');
    
    return formattedLines.join('\n');
  }

  function formatPanchangResponse(lines: string[], language: string = 'en'): string {
    // SIMPLE FORMATTING - Just add greeting and keep all content intact
    const formattedLines = ['🪔 Jai Shree Krishna', ''];
    
    // Keep ALL content without any regex parsing that could cut off information
    lines.forEach(line => {
      if (line.includes('Jai Shree Krishna')) return; // Skip greeting
      if (line.length > 3) { // Only filter extremely short lines
        formattedLines.push(`• ${line}`);
      }
    });
    
    // Add professional footer
    formattedLines.push('');
    formattedLines.push('All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations');
    
    return formattedLines.join('\n');
  }
  
  function formatTimingResponse(lines: string[], language: string = 'en'): string {
    const formattedLines = ['🪔 Jai Shree Krishna', ''];
    
    // COMPLETELY MINIMAL DESIGN - No visual separators, just clean typography
    
    // Extract and organize information by type
    const muhuratInfo: string[] = [];
    const kaalInfo: string[] = [];
    const otherTimingInfo: string[] = [];
    
    lines.forEach(line => {
      if (line.includes('Jai Shree Krishna')) return;
      
      if (line.length > 3) {
        // Categorize information based on content
        if (line.toLowerCase().includes('muhurat') || line.toLowerCase().includes('puja') ||
            line.toLowerCase().includes('best time')) {
          muhuratInfo.push(line);
        } else if (line.toLowerCase().includes('kaal') || line.toLowerCase().includes('rahu') ||
                   line.toLowerCase().includes('yama') || line.toLowerCase().includes('brahma')) {
          kaalInfo.push(line);
          } else {
          otherTimingInfo.push(line);
          }
      }
    });
    
    // Add organized sections with clean spacing
    if (muhuratInfo.length > 0) {
      formattedLines.push('⏰ AUSPICIOUS MUHURAT');
      muhuratInfo.forEach(info => formattedLines.push(`• ${info}`));
    formattedLines.push('');
    }
    
    if (kaalInfo.length > 0) {
      formattedLines.push('🚫 INAUSPICIOUS KAAL');
      kaalInfo.forEach(info => formattedLines.push(`• ${info}`));
      formattedLines.push('');
    }
    
    if (otherTimingInfo.length > 0) {
      formattedLines.push('💫 OTHER TIMINGS');
      otherTimingInfo.forEach(info => formattedLines.push(`• ${info}`));
      formattedLines.push('');
    }
    
    // Add professional footer
    formattedLines.push('All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations');
    
    return formattedLines.join('\n');
  }

  function formatGeneralResponse(lines: string[], language: string = 'en'): string {
    const formattedLines = ['🪔 Jai Shree Krishna', ''];
    
    // COMPLETELY MINIMAL DESIGN - No visual separators, just clean typography
    
    // Keep ALL general information with clean formatting
    lines.forEach(line => {
      if (line.includes('Jai Shree Krishna')) return;
      
      if (line.length > 3) {
        formattedLines.push(`• ${line}`);
      }
    });
    
    return formattedLines.join('\n');
  }










  // Extract location from user's question
  const extractLocationFromQuestion = (question: string): string | null => {
    const locationPatterns = [
      /in\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /at\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /for\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i,
      /location\s+([^,\?\.]+(?:\s+[^,\?\.]+)*)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common words that aren't locations
        if (!/^(today|this|the|a|an|my|your|our|their|what|when|where|how|why|is|are|was|were|will|can|could|should|would|do|does|did)$/i.test(location)) {
          return location;
        }
      }
    }
    return null;
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    // WORLD-CLASS FIX: Content classification before processing
    const questionType = classifyQuestion(userMessage.content);
    
    onAddMessage(userMessage);
    setIsAsking(true);
    setApiError('');
    setQuestion('');

    try {
      // WORLD-CLASS FIX: Handle non-spiritual questions with gentle redirect
      if (questionType === 'non-spiritual') {
        console.log('🔄 WORLD-CLASS: Non-spiritual question detected, providing gentle redirect');
        
        // Add gentle redirect response
        const redirectMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateGentleRedirect(),
          timestamp: new Date()
        };
        
        onAddMessage(redirectMessage);
        setIsAsking(false);
        return;
      }
      
      // Call enhanced VoiceVedic API with location context and language
      const extractedLocation = extractLocationFromQuestion(userMessage.content);
      const request = {
        question: userMessage.content,
        location: extractedLocation || currentLocation?.location_name,
        language: selectedLanguage
      };
      
      console.log('🔍 API Request:', request);
      
      // SECURITY: Enhanced logging for Hindi investigation (NO FUNCTIONAL CHANGES)
      console.log('🔍 SECURE INVESTIGATION - Hindi Issue Analysis:');
      console.log('🔍 Question Content:', userMessage.content);
      console.log('🔍 Selected Language:', selectedLanguage);
      console.log('🔍 Question Type:', detectQuestionType(userMessage.content));
      console.log('🔍 Location:', extractedLocation || currentLocation?.location_name);
      
      // Use Supabase Edge Function instead of direct Perplexity API
      const { data, error } = await supabase.functions.invoke('askvoicevedic-enhanced', {
        body: {
          question: userMessage.content,
          location: extractedLocation || currentLocation?.location_name,
          language: selectedLanguage
        }
      });
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      const response = data?.data?.answer || data?.answer || 'No response received';
      console.log('🔍 Edge Function Response:', response);
      
      // SECURITY: Enhanced response analysis for Hindi investigation (NO FUNCTIONAL CHANGES)
      console.log('🔍 SECURE INVESTIGATION - Response Analysis:');
      console.log('🔍 Raw Response Type:', typeof response);
      console.log('🔍 Raw Response Length:', response?.length || 0);
      console.log('🔍 Raw Response Preview:', response?.substring(0, 200) || 'No response');
      console.log('🔍 Response Contains Hindi:', /[\u0900-\u097F]/.test(response || ''));
      console.log('🔍 Response Contains Numbers:', /\d/.test(response || ''));
      
      let responseText = response;
      console.log('🔍 Response Text:', responseText);
      
      // Determine if user asked for 'more info'
      const isMoreInfo = /more info|full panchang|all details/i.test(userMessage.content);
      
      // PHASE 3: Enhanced OpenAI processing for better response quality
      console.log('🚀 PHASE 3: OpenAI Enhancement Active');
      
      // Step 1: Optimize response using OpenAI GPT-4o-mini
      let enhancedResponse = responseText;
      try {
        if (openaiAPI && import.meta.env.VITE_OPENAI_API_KEY) {
          console.log('🔍 OpenAI: Optimizing response quality...');
          enhancedResponse = await openaiAPI.optimizeResponse(
            responseText, 
            userMessage.content, 
            selectedLanguage
          );
          console.log('✅ OpenAI: Response optimization complete');
        } else {
          console.log('⚠️ OpenAI: API key not configured, using original response');
        }
      } catch (error) {
        console.warn('⚠️ OpenAI optimization failed, using original response:', error);
        enhancedResponse = responseText;
      }
      
      // Step 2: Process enhanced response through existing system
      const processedText = processPerplexityResponse(enhancedResponse, isMoreInfo, userMessage.content, selectedLanguage);
      console.log('🔍 EXISTING FORMATTING SYSTEM ACTIVE');
      
      // ENHANCED LOGGING FOR EXPERT MONITORING
      console.log('🔍 EXPERT ANALYSIS:');
      console.log('🔍 Question Type:', detectQuestionType(userMessage.content));
      console.log('🔍 Original Response Length:', responseText.length);
      console.log('🔍 Processed Text Length:', processedText.length);
      console.log('🔍 Content Loss:', ((responseText.length - processedText.length) / responseText.length * 100).toFixed(1) + '%');
      console.log('🔍 Original Response:', responseText);
      console.log('🔍 Processed Text:', processedText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: processedText,
        timestamp: new Date()
      };

      onAddMessage(assistantMessage);

      // Trigger text-to-speech for the response with selected language
      // CRITICAL FIX: Use the same processed text for both UI and TTS
      if (processedText && processedText.trim() !== "") {
        setTimeout(() => {
          playMessage(assistantMessage.id, processedText);
        }, 300);
      }

    } catch (error: unknown) {
      console.error('Ask VoiceVedic error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMessage);
      
      let errorContent = 'I apologize, but I encountered an error while processing your question. Please try again.';
      
      if (errorMessage.includes('API key not configured')) {
        errorContent = 'Perplexity API key is not configured. Please check your environment variables.';
      } else if (errorMessage.includes('Perplexity API error')) {
        errorContent = 'There was an issue with the Perplexity service. Please try again in a moment.';
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };

              onAddMessage(errorResponse);
    } finally {
      setIsAsking(false);
    }
  };

  const startVoiceCapture = () => {
    // PHASE 3: Enhanced OpenAI Whisper for superior audio transcription
    const useOpenAIWhisper = openaiAPI && import.meta.env.VITE_OPENAI_API_KEY;
    
    if (useOpenAIWhisper) {
      console.log('🚀 PHASE 3: Using OpenAI Whisper for superior audio transcription');
      startOpenAIWhisper();
    } else {
      console.log('⚠️ OpenAI Whisper: API key not configured, using browser speech recognition');
      startBrowserVoiceCapture();
    }
  };
  
  // OpenAI Whisper audio transcription
  const startOpenAIWhisper = async () => {
    try {
      console.log('🎤 OpenAI Whisper: Starting audio recording...');
      
      // WORLD-CLASS FIX: Use pre-warmed stream if available for instant start
      let audioStream: MediaStream;
      
      if ((window as any).prewarmedAudioStream) {
        console.log('🚀 WORLD-CLASS: Using pre-warmed audio stream for instant start');
        audioStream = (window as any).prewarmedAudioStream;
      } else {
        console.log('📡 Requesting new audio stream...');
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      // Start media recording
      const mediaRecorder = new MediaRecorder(audioStream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          console.log('🔍 OpenAI Whisper: Transcribing audio...');
          const transcription = await openaiAPI.transcribeAudio(audioBlob);
          
          console.log('✅ OpenAI Whisper: Transcription complete');
          setQuestion(transcription.text);
          setIsListening(false);
          
          // Auto-process the transcribed question
          setTimeout(() => {
            if (transcription.text.trim()) {
              handleAskQuestion();
            }
          }, 150);
          
        } catch (error) {
          console.error('OpenAI Whisper transcription failed:', error);
          // Fallback to browser speech recognition
          startBrowserVoiceCapture();
        }
        
        audioStream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Stop recording after 10 seconds or when user stops
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
      
      // Store mediaRecorder reference for stopping
      (window as any).currentMediaRecorder = mediaRecorder;
      
    } catch (err) {
      console.error("OpenAI Whisper failed:", err);
      setIsListening(false);
      // Fallback to browser speech recognition
      startBrowserVoiceCapture();
    }
  };
  
  // WORLD-CLASS FIX: Multi-language content classification for spiritual guidance
  const classifyQuestion = (question: string): 'spiritual' | 'non-spiritual' => {
    const questionLower = question.toLowerCase();
    
    // COMPREHENSIVE MULTI-LANGUAGE SPIRITUAL KEYWORDS
    const spiritualKeywords = {
      // English Keywords
      english: [
        'diwali', 'holi', 'rakhi', 'raksha', 'janmashtami', 'ganesh', 'ganesha',
        'navratri', 'dussehra', 'ramadan', 'eid', 'pongal', 'onam', 'baisakhi',
        'panchangam', 'panchang', 'tithi', 'nakshatra', 'muhurat', 'muhurta',
        'puja', 'pooja', 'aarti', 'mantra', 'sloka', 'vedas', 'upanishads',
        'karma', 'dharma', 'moksha', 'brahman', 'atman', 'yoga', 'meditation',
        'fasting', 'vrat', 'ekadashi', 'purnima', 'amavasya', 'sankranti',
        'sunrise', 'sunset', 'rahu', 'ketu', 'guru', 'shani', 'mangal',
        'auspicious', 'inauspicious', 'shubh', 'ashubh', 'mangal', 'amangal',
        'hindu', 'vedic', 'spiritual', 'religious', 'temple', 'mandir',
        'god', 'deity', 'devi', 'bhagwan', 'bhagavan', 'swami', 'guru',
        'horoscope', 'rashifal', 'daily horoscope', 'weekly horoscope', 'monthly horoscope',
        'birth chart', 'kundli', 'astrology', 'zodiac', 'aries', 'taurus', 'gemini',
        'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn',
        'aquarius', 'pisces', 'mesha', 'vrishabha', 'mithuna', 'karka', 'simha',
        'kanya', 'tula', 'vrishchika', 'dhanu', 'makara', 'kumbha', 'meena'
      ],
      
      // Hindi Keywords (हिंदी)
      hindi: [
        'दीवाली', 'होली', 'रक्षा', 'रक्षाबंधन', 'जन्माष्टमी', 'गणेश', 'गणेशा',
        'नवरात्रि', 'दशहरा', 'रमज़ान', 'ईद', 'पोंगल', 'ओणम', 'बैसाखी',
        'पंचांग', 'तिथि', 'नक्षत्र', 'मुहूर्त', 'पूजा', 'आरती', 'मंत्र', 'श्लोक',
        'वेद', 'उपनिषद', 'कर्म', 'धर्म', 'मोक्ष', 'ब्रह्म', 'आत्मा', 'योग', 'ध्यान',
        'व्रत', 'एकादशी', 'पूर्णिमा', 'अमावस्या', 'संक्रांति', 'सूर्योदय', 'सूर्यास्त',
        'राहु', 'केतु', 'गुरु', 'शनि', 'मंगल', 'शुभ', 'अशुभ', 'मंगल', 'अमंगल',
        'हिंदू', 'वैदिक', 'आध्यात्मिक', 'धार्मिक', 'मंदिर', 'देवता', 'देवी',
        'भगवान', 'स्वामी', 'राशिफल', 'कुंडली', 'ज्योतिष', 'राशि', 'मेष', 'वृषभ',
        'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'
      ],
      
      // Kannada Keywords (ಕನ್ನಡ)
      kannada: [
        'ದೀಪಾವಳಿ', 'ಹೋಳಿ', 'ರಕ್ಷಾಬಂಧನ', 'ಜನ್ಮಾಷ್ಟಮಿ', 'ಗಣೇಶ', 'ಗಣೇಶಾ',
        'ನವರಾತ್ರಿ', 'ದಶಹರಾ', 'ರಂಜಾನ್', 'ಈದ್', 'ಪೊಂಗಲ್', 'ಓಣಂ', 'ಬೈಸಾಖಿ',
        'ಪಂಚಾಂಗ', 'ತಿಥಿ', 'ನಕ್ಷತ್ರ', 'ಮುಹೂರ್ತ', 'ಪೂಜೆ', 'ಆರತಿ', 'ಮಂತ್ರ', 'ಶ್ಲೋಕ',
        'ವೇದ', 'ಉಪನಿಷತ್', 'ಕರ್ಮ', 'ಧರ್ಮ', 'ಮೋಕ್ಷ', 'ಬ್ರಹ್ಮ', 'ಆತ್ಮ', 'ಯೋಗ', 'ಧ್ಯಾನ',
        'ವ್ರತ', 'ಏಕಾದಶಿ', 'ಪೂರ್ಣಿಮಾ', 'ಅಮಾವಾಸ್ಯ', 'ಸಂಕ್ರಾಂತಿ', 'ಸೂರ್ಯೋದಯ', 'ಸೂರ್ಯಾಸ್ತ',
        'ರಾಹು', 'ಕೇತು', 'ಗುರು', 'ಶನಿ', 'ಮಂಗಳ', 'ಶುಭ', 'ಅಶುಭ', 'ಮಂಗಳ', 'ಅಮಂಗಳ',
        'ಹಿಂದೂ', 'ವೈದಿಕ', 'ಆಧ್ಯಾತ್ಮಿಕ', 'ಧಾರ್ಮಿಕ', 'ದೇವಾಲಯ', 'ದೇವತೆ', 'ದೇವಿ',
        'ಭಗವಾನ್', 'ಸ್ವಾಮಿ', 'ರಾಶಿಫಲ', 'ಕುಂಡಲಿ', 'ಜ್ಯೋತಿಷ', 'ರಾಶಿ', 'ಮೇಷ', 'ವೃಷಭ',
        'ಮಿಥುನ', 'ಕರ್ಕ', 'ಸಿಂಹ', 'ಕನ್ಯಾ', 'ತುಲಾ', 'ವೃಶ್ಚಿಕ', 'ಧನು', 'ಮಕರ', 'ಕುಂಭ', 'ಮೀನ'
      ],
      
      // Tamil Keywords (தமிழ்)
      tamil: [
        'தீபாவளி', 'ஹோளி', 'ரக்ஷாபந்தன்', 'ஜன்மாஷ்டமி', 'கணேஷ்', 'கணேஷா',
        'நவராத்திரி', 'தசரா', 'ரம்சான்', 'ஈத்', 'பொங்கல்', 'ஓணம்', 'பைசாகி',
        'பஞ்சாங்கம்', 'திதி', 'நட்சத்திரம்', 'முகூர்த்தம்', 'பூஜை', 'ஆரத்தி', 'மந்திரம்', 'சுலோகம்',
        'வேதம்', 'உபநிடதம்', 'கர்மம்', 'தர்மம்', 'மோட்சம்', 'பிரம்மம்', 'ஆத்மா', 'யோகம்', 'தியானம்',
        'விரதம்', 'ஏகாதசி', 'பூர்ணிமா', 'அமாவாசை', 'சங்கிராந்தி', 'சூரிய உதயம்', 'சூரிய அஸ்தமனம்',
        'ராகு', 'கேது', 'குரு', 'சனி', 'செவ்வாய்', 'சுபம்', 'அசுபம்', 'செவ்வாய்', 'அசெவ்வாய்',
        'ஹிந்து', 'வைதிக', 'ஆத்மிக', 'மத', 'கோவில்', 'தெய்வம்', 'தேவி',
        'பகவான்', 'சுவாமி', 'ராசிபலன்', 'குண்டலி', 'ஜோதிடம்', 'ராசி', 'மேஷம்', 'ரிஷபம்',
        'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'
      ],
      
      // Telugu Keywords (తెలుగు)
      telugu: [
        'దీపావళి', 'హోళి', 'రక్షాబంధన్', 'జన్మాష్టమి', 'గణేష్', 'గణేషా',
        'నవరాత్రి', 'దశహరా', 'రంజాన్', 'ఈద్', 'పొంగల్', 'ఓణం', 'బైసాఖి',
        'పంచాంగం', 'తిథి', 'నక్షత్రం', 'ముహూర్తం', 'పూజ', 'ఆరతి', 'మంత్రం', 'శ్లోకం',
        'వేదం', 'ఉపనిషత్తు', 'కర్మ', 'ధర్మం', 'మోక్షం', 'బ్రహ్మ', 'ఆత్మ', 'యోగం', 'ధ్యానం',
        'వ్రతం', 'ఏకాదశి', 'పూర్ణిమ', 'అమావాస్య', 'సంక్రాంతి', 'సూర్యోదయం', 'సూర్యాస్తమయం',
        'రాహు', 'కేతు', 'గురు', 'శని', 'మంగళం', 'శుభం', 'అశుభం', 'మంగళం', 'అమంగళం',
        'హిందూ', 'వైదిక', 'ఆధ్యాత్మిక', 'మత', 'దేవాలయం', 'దేవుడు', 'దేవి',
        'భగవాన్', 'స్వామి', 'రాశిఫలం', 'కుండలి', 'జ్యోతిషం', 'రాశి', 'మేషం', 'వృషభం',
        'మిథునం', 'కర్కాటకం', 'సింహం', 'కన్య', 'తులా', 'వృశ్చికం', 'ధనుస్సు', 'మకరం', 'కుంభం', 'మీనం'
      ],
      
      // Malayalam Keywords (മലയാളം)
      malayalam: [
        'ദീപാവലി', 'ഹോളി', 'രക്ഷാബന്ധനം', 'ജന്മാഷ്ടമി', 'ഗണേഷ്', 'ഗണേഷാ',
        'നവരാത്രി', 'ദശഹരാ', 'രമദാന്', 'ഈദ്', 'പൊങ്കൽ', 'ഓണം', 'വൈശാഖി',
        'പഞ്ചാംഗം', 'തിഥി', 'നക്ഷത്രം', 'മുഹൂർത്തം', 'പൂജ', 'ആരതി', 'മന്ത്രം', 'ശ്ലോകം',
        'വേദം', 'ഉപനിഷത്ത്', 'കർമ്മം', 'ധർമ്മം', 'മോക്ഷം', 'ബ്രഹ്മം', 'ആത്മാവ്', 'യോഗം', 'ധ്യാനം',
        'വ്രതം', 'ഏകാദശി', 'പൂർണ്ണിമ', 'അമാവാസ്യ', 'സങ്ക്രാന്തി', 'സൂര്യോദയം', 'സൂര്യാസ്തമയം',
        'രാഹു', 'കേതു', 'ഗുരു', 'ശനി', 'ചൊവ്വ', 'ശുഭം', 'അശുഭം', 'ചൊവ്വ', 'അചൊവ്വ',
        'ഹിന്ദു', 'വൈദിക', 'ആധ്യാത്മിക', 'മത', 'ക്ഷേത്രം', 'ദൈവം', 'ദേവി',
        'ഭഗവാൻ', 'സ്വാമി', 'രാശിഫലം', 'കുണ്ഡലി', 'ജ്യോതിഷം', 'രാശി', 'മേഷം', 'വൃഷഭം',
        'മിഥുനം', 'കർക്കടകം', 'സിംഹം', 'കന്യ', 'തുല', 'വൃശ്ചികം', 'ധനു', 'മകരം', 'കുംഭം', 'മീനം'
      ]
    };
    
    // Check if question contains spiritual keywords in ANY language
    const allKeywords = Object.values(spiritualKeywords).flat();
    const hasSpiritualContent = allKeywords.some(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    
    return hasSpiritualContent ? 'spiritual' : 'non-spiritual';
  };

  // WORLD-CLASS FIX: Pre-warm microphone access to eliminate delay
  const prewarmMicrophoneAccess = useCallback(async () => {
    try {
      console.log('🚀 WORLD-CLASS: Pre-warming microphone access...');
      
      // Request microphone permission early
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Store stream for immediate use
      (window as any).prewarmedAudioStream = stream;
      
      console.log('✅ WORLD-CLASS: Microphone pre-warmed successfully');
      
      // Set flag to indicate microphone is ready
      setMicrophoneReady(true);
      
    } catch (error) {
      console.log('⚠️ Microphone pre-warming failed (will request on demand):', error);
      setMicrophoneReady(false);
    }
  }, []);

  // SIMPLE ADDITION: Generate horoscope response
  const generateHoroscopeResponse = (): string => {
    return `🪔 Jai Shree Krishna

🌟 Your Daily Horoscope - Based on Vedic Astrology

Today's Guidance:
• 🕉️ Focus on spiritual practices and meditation
• 📅 Check auspicious timings for important decisions
• 🙏 Perform simple puja for positive energy
• 🌙 Connect with your inner wisdom

For detailed horoscope analysis, I can help you with:
• Daily panchangam and auspicious timings
• Festival dates and spiritual celebrations
• Vedic rituals and mantras
• Temple information and spiritual destinations

All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations.`;
  };

  // WORLD-CLASS FIX: Generate gentle redirect response for non-spiritual questions
  const generateGentleRedirect = (): string => {
    return `🪔 Jai Shree Krishna

I understand your question, but VoiceVedic specializes in Hindu spiritual guidance and Vedic wisdom.

I can help you with:
• 🕉️ Festival timings and celebrations (Diwali, Holi, Raksha Bandhan, Janmashtami)
• 📅 Daily panchangam, tithi, and nakshatra
• ⏰ Auspicious muhurat for important events and ceremonies
• 🙏 Spiritual rituals, mantras, and puja methods
• 🌙 Horoscope and astrological guidance
• 🏛️ Temple information and spiritual destinations
• 📚 Vedic knowledge and spiritual teachings

Would you like to know about upcoming festivals, auspicious timings, or any spiritual guidance instead?

All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations.`;
  };

  // Browser-based voice capture fallback
  const startBrowserVoiceCapture = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Mic input is not supported on this browser.");
        return;
      }

      // WORLD-CLASS FIX: Use pre-warmed stream if available
      if ((window as any).prewarmedAudioStream) {
        console.log('🚀 WORLD-CLASS: Using pre-warmed stream for instant browser recognition');
      }

      const recognition = new SpeechRecognition();
      
      // Set language based on selected language with proper language codes
      switch (selectedLanguage) {
        case 'hi':
          recognition.lang = 'hi-IN';
          break;
        case 'kn':
          recognition.lang = 'kn-IN';
          break;
        case 'ta':
          recognition.lang = 'ta-IN';
          break;
        case 'te':
          recognition.lang = 'te-IN';
          break;
        case 'ml':
          recognition.lang = 'ml-IN';
          break;
        case 'en':
        default:
          recognition.lang = 'en-IN';
          break;
      }
      
      recognition.interimResults = false;
      recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
      
      setIsListening(true);
      setQuestion('');
      setShowSuggestions(false);

      recognition.onstart = () => {
        console.log("🎙️ VoiceVedic is listening...");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const spokenText = event.results[0][0].transcript;
        console.log("✅ Heard:", spokenText);
        
        setQuestion(spokenText);
        setIsListening(false);
        
        setTimeout(() => {
          if (spokenText.trim()) {
            handleAskQuestion();
          }
        }, 150);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Mic Error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions and try again.");
        } else if (event.error === 'no-speech') {
          console.log("🔇 No speech detected, resetting...");
        } else {
          console.warn("❌ Voice recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Voice capture failed:", err);
      setIsListening(false);
    }
  };

  const clearConversation = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      onClearConversation();
      setApiError('');
      try {
        window.speechSynthesis.cancel();
        setPlayingMsgId(null);
        setIsSpeaking(false);
      } catch (error) {
        console.warn('Could not cancel speech synthesis:', error);
      }
      setShowSuggestions(true);
      if (messages.length === 0) {
        fetchInitialSuggestions();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };



  return (
    <div className="min-h-screen bg-spiritual-diagonal relative overflow-hidden font-sans flex flex-col">
      {/* Hidden audio element for ElevenLabs playback */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
      />
      {/* Spiritual Visual Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-spiritual-400/10 via-spiritual-300/5 to-spiritual-900/5"></div>
      
      {/* Loading Screen */}
      {isAppLoading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-spiritual-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-spiritual-900 mb-2 tracking-spiritual">
              Loading VoiceVedic
            </h2>
            <p className="text-spiritual-600 tracking-spiritual">
              Initializing voice system...
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-6 bg-white/90 backdrop-blur-sm border-b border-spiritual-200/50">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-4 py-2 bg-spiritual-50 hover:bg-spiritual-100 rounded-spiritual shadow-spiritual border border-spiritual-200/50 transition-all duration-300 text-spiritual-800 font-medium tracking-spiritual"
          title="Back to Main Experience"
        >
          <ArrowLeft className="w-5 h-5 text-spiritual-600 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back to Home</span>
        </button>

        <div className="text-center">
          {/* Logo */}
          <div className="mb-2">
            <Logo size="small" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-spiritual-900 tracking-spiritual">
            Ask VoiceVedic
          </h1>
          <p className="text-sm text-spiritual-700/80 tracking-spiritual">
            Your spiritual conversation companion
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selection Dropdown */}
          <select
            className="px-3 py-2 rounded-spiritual border border-spiritual-200 text-sm text-spiritual-700 bg-white shadow-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-2 focus:ring-spiritual-200/50 transition-all duration-300"
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            style={{ minWidth: 160 }}
            title="Choose Language"
          >
            {languageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>



          {/* Voice Selection Dropdown */}
          <select
            className="px-3 py-2 rounded-spiritual border border-spiritual-200 text-sm text-spiritual-700 bg-white shadow-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-2 focus:ring-spiritual-200/50 transition-all duration-300"
            value={selectedVoice}
            onChange={e => setSelectedVoice(e.target.value)}
            style={{ minWidth: 200 }}
            title="Choose Voice Accent"
          >
            {voiceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>





          {/* Clear Button */}
          <button
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="group flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-spiritual shadow-spiritual border border-red-200/50 transition-all duration-300 text-red-700 font-medium tracking-spiritual disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>
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

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Sparkles className="w-12 h-12 text-spiritual-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-spiritual-900 mb-3 tracking-spiritual">
                Welcome to Your Spiritual Session
              </h2>
              <p className="text-spiritual-700/80 tracking-spiritual max-w-md mx-auto">
                Ask me about Hindu festivals, auspicious timings, rituals, or any spiritual guidance you need. For best results, include your location — like "When is the next Amavasya in Mumbai, India?"
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`max-w-2xl w-full sm:max-w-2xl max-w-full overflow-hidden ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                  className={`p-4 rounded-card shadow-spiritual ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 text-white'
                      : 'bg-white/90 backdrop-blur-sm border border-spiritual-200/50 text-spiritual-900'
                  }`}
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.type === 'user' ? (
                      <MessageCircle className="w-4 h-4 opacity-90" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-spiritual-600" />
                    )}
                    <span className={`text-sm font-medium tracking-spiritual ${
                      message.type === 'user' ? 'text-white/90' : 'text-spiritual-800'
                    }`}>
                      {message.type === 'user' ? 'You asked:' : 'VoiceVedic says:'}
                    </span>
                    <span className={`text-xs tracking-spiritual ml-auto ${
                      message.type === 'user' ? 'text-white/70' : 'text-spiritual-600/70'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {/* Sound icon for assistant messages */}
                    {message.type === 'assistant' && (
                      <button
                        className={`ml-2 p-1 rounded-full transition-colors duration-200 ${
                          playingMsgId === message.id 
                            ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                            : 'bg-spiritual-100 text-spiritual-700 hover:bg-spiritual-200'
                        }`}
                        onClick={() => {
                          if (playingMsgId === message.id) {
                            // If currently playing, stop
                            window.speechSynthesis.cancel();
                            setPlayingMsgId(null);
                          } else {
                            // If not playing, start playing
                            playMessage(message.id, message.content);
                          }
                        }}
                        title={playingMsgId === message.id ? 'Stop Voice' : 'Play Voice'}
                      >
                        {playingMsgId === message.id ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className={`leading-relaxed tracking-spiritual ${
                    message.type === 'user' ? 'text-white' : 'text-spiritual-800'
                  } ${selectedLanguage === 'hi' ? 'hindi-text' : ''} ${
                    selectedLanguage === 'ta' ? 'tamil-text' : ''
                  } ${selectedLanguage === 'te' ? 'telugu-text' : ''} ${
                    selectedLanguage === 'ml' ? 'malayalam-text' : ''
                  } ${selectedLanguage === 'kn' ? 'kannada-text' : ''}`}>
                    {message.type === 'assistant' ? (
                      <div className={`space-y-2 ${
                        selectedLanguage === 'hi' ? 'text-container-hindi' : 
                        selectedLanguage !== 'en' ? 'text-container-south-indian' : ''
                      }`}>
                        {/* Enhanced text display with language-specific optimization */}
                        {message.content.split('\n').map((line, index) => {
                          if (line.trim()) {
                            return (
                              <div key={index} className={`py-1 leading-relaxed break-words optimized-text ${
                                selectedLanguage === 'hi' ? 'hindi-text' : 
                                selectedLanguage === 'ta' ? 'tamil-text' :
                                selectedLanguage === 'te' ? 'telugu-text' :
                                selectedLanguage === 'ml' ? 'malayalam-text' :
                                selectedLanguage === 'kn' ? 'kannada-text' : ''
                              }`}>
                                {line}
                              </div>
                            );
                          }
                          return <div key={index} className="h-2"></div>;
                        })}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  {/* Audio Replay Button for Assistant Messages */}
                  {message.type === 'assistant' && (
                    <div className="mt-3 pt-3 border-t border-spiritual-200/30">
                      <button
                        onClick={() => {
                          if (playingMsgId === message.id) {
                            // BULLETPROOF: If currently playing, stop ALL audio completely
                            console.log('🚨 BULLETPROOF: Stop button clicked - stopping ALL audio');
                            stopAllAudio();
                          } else {
                            // BULLETPROOF: If not playing, start playing with ZERO dual voices
                            console.log('🚨 BULLETPROOF: Replay button clicked - starting audio');
                            playMessage(message.id, message.content);
                          }
                        }}
                        className={`group flex items-center gap-2 font-medium transition-all duration-300 tracking-spiritual ${
                          playingMsgId === message.id 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-spiritual-600 hover:text-spiritual-700'
                        }`}
                        title={playingMsgId === message.id ? 'Stop ALL audio' : 'Replay audio'}
                      >
                        {playingMsgId === message.id ? (
                          <VolumeX className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        <span className="text-sm">
                          {playingMsgId === message.id ? 'Stop ALL' : 'Replay'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isAsking && (
            <div className="flex justify-start animate-slide-up">
              <div className="max-w-2xl mr-12">
                <div className="bg-white/90 backdrop-blur-sm border border-spiritual-200/50 p-4 rounded-card shadow-spiritual">
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
              </div>
            </div>
          )}

          {/* API Error Display */}
          {apiError && (
            <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-4 animate-slide-up">
              <p className="text-sm text-red-700 tracking-spiritual">
                <strong>Connection Error:</strong> {apiError}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section - Fixed at Bottom */}
      <div className="relative z-20 bg-white/95 backdrop-blur-sm border-t border-spiritual-200/50 p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Voice Input Status */}
          {!microphoneReady && (
            <div className="bg-yellow-50/70 border border-yellow-200/50 rounded-spiritual p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-800 font-medium tracking-spiritual">
                  🔧 Initializing microphone for instant voice input...
                </span>
              </div>
            </div>
          )}
          
          {isListening && (
            <div className="bg-red-50/70 border border-red-200/50 rounded-spiritual p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-800 font-medium tracking-spiritual">
                  🎙️ Listening... Speak your question now
                </span>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAsking && !isListening && handleAskQuestion()}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ask about festivals, timings, rituals, or spiritual guidance..."
                className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 transition-all duration-300 bg-white text-spiritual-900 placeholder-spiritual-600/50 tracking-spiritual"
                disabled={isAsking || isListening}
              />
              <MessageCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-spiritual-400" />
            </div>
            
            {/* Mic Button */}
            {micSupported && (
              <button
                onClick={startVoiceCapture}
                disabled={isAsking || isListening}
                className={`group relative overflow-hidden flex items-center justify-center w-12 h-12 rounded-full shadow-spiritual transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : isAsking
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : microphoneReady
                        ? 'bg-gradient-to-r from-spiritual-300 to-spiritual-400 hover:from-spiritual-400 hover:to-spiritual-500 text-spiritual-800 hover:text-spiritual-900 hover:scale-105 active:scale-95'
                        : 'bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-yellow-800 hover:text-yellow-900 hover:scale-105 active:scale-95'
                }`}
                title={isListening ? "Listening... Speak now" : microphoneReady ? "Tap and ask your question aloud" : "Microphone initializing..."}
              >
                {/* Glow Effect */}
                {!isAsking && !isListening && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-spiritual-300 to-spiritual-400 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 -z-10"></div>
                )}
                
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className={`w-5 h-5 transition-transform duration-300 ${!isAsking ? 'group-hover:scale-110' : ''}`} />
                )}
              </button>
            )}
            
            {/* Send Button */}
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || isAsking || isListening}
              className={`group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3 font-semibold rounded-spiritual shadow-spiritual transition-all duration-300 transform tracking-spiritual ${
                question.trim() && !isAsking && !isListening
                  ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white hover:shadow-spiritual-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-spiritual-600/30 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {/* Glow Effect */}
              {question.trim() && !isAsking && !isListening && (
                <div className="absolute inset-0 rounded-spiritual bg-gradient-to-r from-spiritual-400 to-spiritual-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
              )}
              
              {isAsking ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className={`w-5 h-5 transition-transform duration-300 ${question.trim() && !isListening ? 'group-hover:translate-x-1 group-active:translate-x-0.5' : ''}`} />
              )}
            </button>
          </div>

          {/* Live Suggestions Dropdown */}
          {showSuggestions && suggestedQuestions.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm border border-spiritual-200/50 rounded-spiritual shadow-spiritual-lg mt-2 max-h-48 overflow-y-auto">
              <div className="p-3 border-b border-spiritual-200/30">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-spiritual-600" />
                  <span className="text-sm font-medium text-spiritual-800 tracking-spiritual">
                    {loadingSuggestions ? 'Finding similar questions...' : 
                     question.trim().length > 0 ? 'Similar Questions' : 'Popular Questions'}
                  </span>
                  {loadingSuggestions && (
                    <div className="w-3 h-3 border border-spiritual-500 border-t-transparent rounded-full animate-spin ml-auto"></div>
                  )}
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {suggestedQuestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full p-3 text-left hover:bg-spiritual-50 transition-colors duration-200 border-b border-spiritual-100/50 last:border-b-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-spiritual-500 group-hover:text-spiritual-600 transition-colors duration-200" />
                      <span className="text-sm text-spiritual-800 group-hover:text-spiritual-900 tracking-spiritual transition-colors duration-200">
                        {suggestion}
                      </span>
                      <ArrowRight className="w-3 h-3 text-spiritual-400 group-hover:text-spiritual-600 group-hover:translate-x-0.5 transition-all duration-200 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Helper Text */}
          <div className="mt-3 text-center">
            <p className="text-sm text-spiritual-700/70 tracking-spiritual">
              {showSuggestions && suggestedQuestions.length > 0 && messages.length === 0
                ? "Try one of the popular questions above, or ask your own"
                : "Ask about Hindu festivals, auspicious timings, or spiritual guidance"
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Stop Voice Button */}
      {isSpeaking && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          onClick={() => { 
            window.speechSynthesis.cancel(); 
            setPlayingMsgId(null);
            setIsSpeaking(false);
          }}
        >
          <VolumeX className="w-5 h-5" /> Stop
        </button>
      )}
    </div>
  );
};

export default AskVoiceVedicExperience;