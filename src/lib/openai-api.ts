// VoiceVedic OpenAI API Service - Phase 3 Implementation
// Comprehensive integration for enhanced language processing and voice capabilities

export interface OpenAIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  detectedText: string;
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
}

export class OpenAI40MiniAudio {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Enhanced Language Detection using GPT-4o-mini
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a language detection expert. Analyze the given text and respond with ONLY a JSON object containing:
              {
                "language": "language_code (en, hi, kn, ta, te, ml)",
                "confidence": "confidence_score (0-1)",
                "detectedText": "cleaned_text"
              }
              
              Language codes: en=English, hi=Hindi, kn=Kannada, ta=Tamil, te=Telugu, ml=Malayalam
              If text contains multiple languages, return the primary language.
              If text is unclear, return "en" with confidence 0.5.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 150,
          temperature: 0.1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      return {
        language: result.language || 'en',
        confidence: result.confidence || 0.5,
        detectedText: result.detectedText || text
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'en',
        confidence: 0.5,
        detectedText: text
      };
    }
  }

  // Enhanced Response Optimization using GPT-4o-mini
  async optimizeResponse(
    originalResponse: string, 
    question: string, 
    targetLanguage: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are VoiceVedic, a Hindu spiritual assistant. Optimize the given response for better quality, clarity, and Hindu spiritual accuracy.

IMPORTANT RULES:
1. Preserve ALL factual information about Panchangam, festivals, timings
2. Maintain Hindu spiritual terminology and accuracy
3. Improve readability and structure
4. Keep responses professional and helpful
5. Do NOT add new information - only enhance existing content
6. Maintain the same language style and tone
7. Ensure proper formatting for text-to-speech

Target Language: ${targetLanguage}
Original Question: ${question}

Return ONLY the optimized response text, no explanations or additional content.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Original Response: ${originalResponse}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const optimizedResponse = data.choices[0]?.message?.content;
      
      return optimizedResponse || originalResponse;
    } catch (error) {
      console.error('Response optimization error:', error);
      return originalResponse; // Fallback to original response
    }
  }

  // OpenAI TTS Integration for Natural Voice Synthesis
  async generateSpeech(
    text: string, 
    language: string, 
    voice: string = 'alloy'
  ): Promise<TTSResult> {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
          response_format: 'mp3',
          speed: 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        audioUrl,
        duration: audioBlob.size / 16000, // Approximate duration calculation
        text
      };
    } catch (error) {
      console.error('TTS generation error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // OpenAI Whisper Integration for Audio Transcription
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'auto');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenAI Whisper error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.text || '',
        language: data.language || 'en',
        confidence: data.confidence || 0.8
      };
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Enhanced Question Processing for Better Response Quality
  async enhanceQuestion(
    question: string, 
    language: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are VoiceVedic, a Hindu spiritual assistant. Enhance the given question for better clarity and accuracy in spiritual guidance.

IMPORTANT RULES:
1. Maintain the original meaning and intent
2. Add context if needed for Hindu spiritual topics
3. Ensure proper terminology for Panchangam, festivals, rituals
4. Keep the same language and style
5. Do NOT change the core question
6. Only enhance for clarity and completeness

Language: ${language}
Original Question: ${question}

Return ONLY the enhanced question, no explanations.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 200,
          temperature: 0.2,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const enhancedQuestion = data.choices[0]?.message?.content;
      
      return enhancedQuestion || question;
    } catch (error) {
      console.error('Question enhancement error:', error);
      return question; // Fallback to original question
    }
  }

  // Utility function to get available voices
  getAvailableVoices(): string[] {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  // Utility function to get language-appropriate voice
  getLanguageVoice(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'alloy',
      'hi': 'nova',
      'kn': 'echo',
      'ta': 'fable',
      'te': 'onyx',
      'ml': 'shimmer'
    };
    
    return voiceMap[language] || 'alloy';
  }
}

// Export singleton instance
export const openaiAPI = new OpenAI40MiniAudio(
  import.meta.env.VITE_OPENAI_API_KEY || ''
);

// Export individual functions for easy use
export const {
  detectLanguage,
  optimizeResponse,
  generateSpeech,
  transcribeAudio,
  enhanceQuestion,
  getAvailableVoices,
  getLanguageVoice
} = openaiAPI;
