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

  const playMessage = (msgId: string, text: string) => {
    if (playingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingMsgId(null);
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    setPlayingMsgId(msgId);
    setIsSpeaking(true);
    
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
          console.error('Speech synthesis error:', event);
          setPlayingMsgId(null);
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(u);
      };
      speakNext();
      return;
    }
  };

  // Output post-processing for Perplexity responses
  function processPerplexityResponse(response: string, isMoreInfo: boolean = false): string {
    let lines = response.split('\n').map(line => line.trim()).filter(Boolean);

    // Remove only the most problematic reasoning/thinking lines
    const forbiddenPhrases = [
      "let's tackle this",
      "step by step", 
      "i need to check",
      "search results",
      "the instructions say",
      "wait,",
      "reasoning",
      "<think>",
      "<reasoning>",
      "</think>",
      "looking at",
      "the fifth source",
      "the fourth source",
      "the third source",
      "the first result",
      "please consult",
      "consult local panchang",
      "priests for precise timings",
      "please check drik panchang",
      "refer to drik panchang",
      "consult drik panchang",
      "check kksf",
      "refer to kksf",
      "consult kksf",
      "check other sources",
      "refer to other sources",
      "consult other sources"
    ];
    
    // Remove lines containing forbidden phrases and source references
    lines = lines.filter(line =>
      !forbiddenPhrases.some(phrase => line.toLowerCase().includes(phrase)) &&
      !/\[\d+\]/.test(line)
    );

    // Remove all asterisks (**) for Markdown bold
    lines = lines.map(line => line.replace(/\*\*/g, ""));

    // Keep the greeting but preserve all the actual content
    const jaiShreeIndex = lines.findIndex(line => line.includes('🪔 Jai Shree Krishna') || line.includes('Jai Shree Krishna'));
    if (jaiShreeIndex >= 0) {
      // Keep the greeting and everything after it
      lines = lines.slice(jaiShreeIndex);
    }

    // Ensure greeting is present
    if (!lines[0]?.includes('Jai Shree Krishna')) {
      lines.unshift('🪔 Jai Shree Krishna.');
    }

    // CRITICAL FIX: Don't truncate content - show everything that TTS reads
    // Only remove problematic lines, but keep all meaningful content
    lines = lines.filter(line => {
      // Keep all lines that contain actual information
      if (line.includes(':') || line.includes('AM') || line.includes('PM') || 
          line.includes('Tithi') || line.includes('Nakshatra') || 
          line.includes('Rahu') || line.includes('Yama') || 
          line.includes('Sunrise') || line.includes('Sunset') ||
          line.includes('Date') || line.includes('Location') ||
          line.includes('Vaara') || line.includes('Maasa')) {
        return true;
      }
      
      // Keep lines with meaningful content (not just empty or generic text)
      if (line.length > 10 && !line.toLowerCase().includes('please') && !line.toLowerCase().includes('check')) {
        return true;
      }
      
      return false;
    });

    // Apply aesthetic formatting for panchangam questions
    let result = lines.join('\n');
    if (/panchang|tithi|nakshatra|rahu|muhurat/i.test(response)) {
      result = createAestheticFormat(result);
    }

    return result;
  }

  // NEW FUNCTION: Create aesthetic, compact bullet formatting for world-class presentation
  function createAestheticFormat(response: string): string {
    // Split into lines and process
    const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
    const formattedLines: string[] = [];
    
    // Add greeting
    formattedLines.push('🪔 Jai Shree Krishna.');
    formattedLines.push('');
    
    // Add heading
    formattedLines.push('📅 TIMING DETAILS:');
    formattedLines.push('');
    
    // Process each line for aesthetic formatting - PRESERVE ALL CONTENT
    lines.forEach(line => {
      // Skip greeting lines (already added)
      if (line.includes('Jai Shree Krishna')) return;
      
      // Check if this line contains timing information (has colons)
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(part => part.trim());
        if (key && value) {
          // Enhanced timing formatting with better TTS compatibility
          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('location')) {
            formattedLines.push(`• ${key}: ${value}`);
          } else if (key.toLowerCase().includes('sunrise') || key.toLowerCase().includes('sunset')) {
            // Keep exact HH:MM format in UI; don't transform
            formattedLines.push(`• ${key}: ${value}`);
          } else if (key.toLowerCase().includes('vaara') || key.toLowerCase().includes('maasa')) {
            formattedLines.push(`• ${key}: ${value}`);
          } else if (key.toLowerCase().includes('tithi') || key.toLowerCase().includes('nakshatra')) {
            formattedLines.push(`• ${key}: ${value}`);
          } else if (key.toLowerCase().includes('rahu') || key.toLowerCase().includes('yama') || 
                     key.toLowerCase().includes('abhijit') || key.toLowerCase().includes('brahma')) {
            // Keep exact HH:MM range in UI; don't transform
            formattedLines.push(`• ${key}: ${value}`);
          } else {
            // For other timing information - PRESERVE ALL
            formattedLines.push(`• ${key}: ${value}`);
          }
        }
      } else if (line.length > 0) {
        // For non-timing lines, add as is - PRESERVE ALL CONTENT
        formattedLines.push(line);
      }
    });
    
    // Add professional footer
    formattedLines.push('');
    formattedLines.push('All timings are in local time with daylight saving adjustment, as per DrikPanchangam calculations');
    
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

            onAddMessage(userMessage);
    setIsAsking(true);
    setApiError('');
    setQuestion('');

    try {
      // Call enhanced VoiceVedic API with location context and language
      const extractedLocation = extractLocationFromQuestion(userMessage.content);
      const request = {
        question: userMessage.content,
        location: extractedLocation || currentLocation?.location_name,
        language: selectedLanguage
      };
      
      console.log('🔍 API Request:', request);
      const response = await perplexityApi.getResponse(userMessage.content);
      console.log('🔍 API Response:', response);
      
      const responseText = response;
      console.log('🔍 Response Text:', responseText);
      
      // Determine if user asked for 'more info'
      const isMoreInfo = /more info|full panchang|all details/i.test(userMessage.content);
      const processedText = processPerplexityResponse(responseText, isMoreInfo);
      console.log('🔍 Original Response Length:', responseText.length);
      console.log('🔍 Processed Text Length:', processedText.length);
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
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Mic input is not supported on this browser.");
        return;
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
                Ask me about Hindu festivals, auspicious timings, rituals, or any spiritual guidance you need. For best results, include your location — like “When is the next Amavasya in Mumbai, India?”
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`max-w-2xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                  className={`p-4 rounded-card shadow-spiritual ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-spiritual-400 to-spiritual-500 text-white'
                      : 'bg-white/90 backdrop-blur-sm border border-spiritual-200/50 text-spiritual-900'
                  }`}
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
                  
                  <div className={`leading-relaxed tracking-spiritual whitespace-pre-line ${
                    message.type === 'user' ? 'text-white' : 'text-spiritual-800'
                  }`}>
                    {message.type === 'assistant' ? (
                      <div className="space-y-4">
                        {/* Format the content with better structure */}
                        {message.content.split('\n').map((line, index) => {
                          // Check if this is a timing detail line
                          if (line.includes(':')) {
                            // Split only on the FIRST colon so HH:MM (e.g., 06:14) stays intact
                            const firstColon = line.indexOf(':');
                            const key = line.slice(0, firstColon).trim();
                            const value = line.slice(firstColon + 1).trim();
                            if (key && value) {
                              return (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 py-2 border-b border-spiritual-100/30 last:border-b-0">
                                  <span className="font-semibold text-spiritual-700 min-w-[100px] flex-shrink-0">{key}:</span>
                                  {/* Wrap long Hindi lines; never truncate times */}
                                  <span className="text-spiritual-800 break-words whitespace-pre-wrap">{value}</span>
                                </div>
                              );
                            }
                          }
                          // Check if this is a title or heading
                          if (line.includes('🪔') || line.includes('Jai Shree Krishna') || line.includes('TIMING DETAILS')) {
                            return (
                              <div key={index} className="font-bold text-xl text-spiritual-900 mb-4 text-center border-b-2 border-spiritual-200 pb-2">
                                {line}
                              </div>
                            );
                          }
                          // Check if this is a bullet point or list item
                          if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            return (
                              <div key={index} className="flex items-start gap-3 py-1">
                                <span className="text-spiritual-600 mt-1">•</span>
                                <span className="text-spiritual-800 flex-1">{line.replace(/^[•\-*]\s*/, '')}</span>
                              </div>
                            );
                          }
                          // Regular content with proper spacing
                          if (line.trim()) {
                            return (
                              <div key={index} className="text-spiritual-800 py-1 leading-relaxed">
                                {line}
                              </div>
                            );
                          }
                          // Empty lines for spacing
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
                            // If currently playing, stop
                            window.speechSynthesis.cancel();
                            setPlayingMsgId(null);
                          } else {
                            // If not playing, start playing
                            playMessage(message.id, message.content);
                          }
                        }}
                        className={`group flex items-center gap-2 font-medium transition-all duration-300 tracking-spiritual ${
                          playingMsgId === message.id 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-spiritual-600 hover:text-spiritual-700'
                        }`}
                        title={playingMsgId === message.id ? 'Stop audio' : 'Replay audio'}
                      >
                        {playingMsgId === message.id ? (
                          <VolumeX className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        <span className="text-sm">
                          {playingMsgId === message.id ? 'Stop' : 'Replay'}
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
                      : 'bg-gradient-to-r from-spiritual-300 to-spiritual-400 hover:from-spiritual-400 hover:to-spiritual-500 text-spiritual-800 hover:text-spiritual-900 hover:scale-105 active:scale-95'
                }`}
                title={isListening ? "Listening... Speak now" : "Tap and ask your question aloud"}
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