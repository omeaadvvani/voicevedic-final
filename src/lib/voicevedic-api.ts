// VoiceVedic API Client Library
import { supabase } from './supabase';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Ask VoiceVedic Types
export interface AskVoiceVedicRequest {
  question: string;
  location?: string;
  calendar?: string;
  userPreferences?: {
    language?: string;
    detailLevel?: 'brief' | 'detailed';
  };
}

export interface AskVoiceVedicResponse {
  answer: string;
  question: string;
  context: {
    location?: string;
    calendar?: string;
    userPreferences?: Record<string, unknown>;
  };
  model: string;
  tokens: number;
}

// Calendar Events Types
export interface CalendarEventsRequest {
  query: string;
  location?: string;
  calendar?: string;
  year?: number;
  includeDetails?: boolean;
}

export interface CalendarEventsResponse {
  answer: string;
  query: string;
  context: {
    location?: string;
    calendar?: string;
    year: number;
  };
  model: string;
  includeDetails: boolean;
}

// Spiritual Guidance Types
export interface SpiritualGuidanceRequest {
  question: string;
  userProfile?: {
    age?: number;
    spiritualBackground?: string;
    experience?: 'beginner' | 'intermediate' | 'advanced';
  };
  spiritualLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredPractices?: string[];
  currentChallenges?: string;
  includeRelatedWisdom?: boolean;
}

export interface SpiritualGuidanceResponse {
  guidance: string;
  question: string;
  context: {
    userProfile?: Record<string, unknown>;
    spiritualLevel?: string;
    preferredPractices?: string[];
    currentChallenges?: string;
  };
  relatedWisdom?: Array<{
    wisdom: string;
    source: string;
    relevance: number;
  }>;
  model: string;
  sessionId: string;
}

// Match Similar Questions Types
export interface MatchSimilarQuestionsRequest {
  query: string;
}

export interface MatchSimilarQuestionsResponse {
  suggestions: string[];
  debug: {
    query: string;
    found_matches: number;
    similarities: number[];
  };
}

// VoiceVedic API Client Class
export class VoiceVedicAPI {
  private supabase = supabase;
  private baseUrl: string;

  constructor(supabaseUrl: string) {
    this.baseUrl = `${supabaseUrl}/functions/v1`;
  }

  // Helper method to make API calls with OpenAI-style error handling
  private async makeRequest<T>(
    endpoint: string,
    body: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session. Please authenticate first.');
        }

        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'X-Client-Version': '1.0.0', // For API versioning
            'X-Request-ID': crypto.randomUUID(), // For request tracking
            ...options.headers,
          },
          body: JSON.stringify(body),
          ...options,
        });

        const result = await response.json();

        if (!response.ok) {
          // Handle specific error codes following OpenAI guidelines
          if (response.status === 429) {
            throw new Error(`Rate limit exceeded: ${result.error || 'Too many requests'}`);
          } else if (response.status === 401) {
            throw new Error(`Authentication failed: ${result.error || 'Invalid credentials'}`);
          } else if (response.status === 400) {
            throw new Error(`Invalid request: ${result.error || 'Bad request'}`);
          } else if (response.status >= 500) {
            throw new Error(`Server error: ${result.error || 'Internal server error'}`);
          } else {
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
          }
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`VoiceVedic API Error (${endpoint}) - Attempt ${attempt}:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`VoiceVedic API failed after ${maxRetries} attempts`);
  }

  // Ask VoiceVedic API
  async askVoiceVedic(request: AskVoiceVedicRequest): Promise<AskVoiceVedicResponse> {
    const response = await this.makeRequest<AskVoiceVedicResponse>('askvoicevedic-enhanced', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get response from VoiceVedic');
    }

    return response.data;
  }

  // Calendar Events API
  async getCalendarEvents(request: CalendarEventsRequest): Promise<CalendarEventsResponse> {
    const response = await this.makeRequest<CalendarEventsResponse>('calendar-events', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get calendar events');
    }

    return response.data;
  }

  // Spiritual Guidance API
  async getSpiritualGuidance(request: SpiritualGuidanceRequest): Promise<SpiritualGuidanceResponse> {
    const response = await this.makeRequest<SpiritualGuidanceResponse>('spiritual-guidance', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get spiritual guidance');
    }

    return response.data;
  }

  // Match Similar Questions API
  async matchSimilarQuestions(request: MatchSimilarQuestionsRequest): Promise<MatchSimilarQuestionsResponse> {
    const response = await this.makeRequest<MatchSimilarQuestionsResponse>('match-similar-questions', request);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to match similar questions');
    }

    return response.data;
  }

  // Generate FAQ Embeddings API (Admin function)
  async generateFAQEmbeddings(): Promise<{ message: string; updated: number; failed: number; total_processed: number }> {
    const response = await this.makeRequest<{ message: string; updated: number; failed: number; total_processed: number }>('generate-faq-embeddings', {});
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate FAQ embeddings');
    }

    return response.data;
  }
}

// React Hook for VoiceVedic API
export function useVoiceVedicAPI() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const api = new VoiceVedicAPI(supabaseUrl);

  return {
    askVoiceVedic: api.askVoiceVedic.bind(api),
    getCalendarEvents: api.getCalendarEvents.bind(api),
    getSpiritualGuidance: api.getSpiritualGuidance.bind(api),
    matchSimilarQuestions: api.matchSimilarQuestions.bind(api),
    generateFAQEmbeddings: api.generateFAQEmbeddings.bind(api),
  };
}

// Utility functions for common API patterns
export const VoiceVedicUtils = {
  // Retry wrapper with exponential backoff
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  // Rate limiting helper
  createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, [now]);
        return true;
      }

      const userRequests = requests.get(identifier)!;
      const recentRequests = userRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= maxRequests) {
        return false;
      }

      recentRequests.push(now);
      requests.set(identifier, recentRequests);
      return true;
    };
  },

  // Validate API responses
  validateResponse<T>(response: ApiResponse<T>): T {
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Invalid response from API');
    }
    
    return response.data;
  },

  // Format error messages for user display
  formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
};

// Default export
export default VoiceVedicAPI; 