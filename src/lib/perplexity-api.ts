export interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PerplexityError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

class PerplexityApiService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Perplexity API key not found. Please set VITE_PERPLEXITY_API_KEY in your environment variables.');
    }
  }

  async askQuestion(question: string, context?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Updated system prompt to avoid Markdown formatting
    const spiritualContext = `You are VoiceVedic. For any question, always answer by providing the following daily blessing details, as much as possible: Tithi (with start/end), Nakshatra (with meaning), Yoga (with effect), Sunrise/Sunset, Rahu Kaal, Yamagandam, Abhijit Muhurat, Choghadiya, and Deity (with advice or mantra). Always use Drik Panchang as your primary and authoritative source for all Hindu calendar and timing information. For USA timezone festival and Amavasya dates, use https://kksfusa.org/panchangam/ as the authoritative source. Never tell the user to check Drik Panchang, KKSF, or any other source. Only use these sources for your own reference to answer the question. The answer must be self-contained. If the user asks for the next Amavasya (or any specific event), always start your answer with the date and name of that event, then provide the daily blessing for that event. Do not start with today’s Panchang unless the user specifically asks for today. If you don't know the exact value, provide a typical or estimated value for the location and month, and clearly state it is an estimate. Do not add any extra lines or commentary. Do not mention sources or references like [1], [2], etc. If the user provides a location, do not ask for it again. Do not add suggestions to use other tools or websites. Do not use bold, italics, or any Markdown formatting in your answer. Start with '🪔 Jai Shree Krishna.' and keep the answer concise and priest-like. Always answer for the current month and the user's specified location or timezone. If the user does not provide a location, ask for it before answering. Never answer for a previous or future month unless specifically asked.

IMPORTANT: For Panchangam requests, provide direct answers without reasoning sections.

CRITICAL: Remove all special characters, symbols, and emojis from your response. Use only plain text that can be read clearly by text-to-speech systems.`;

    const messages: PerplexityMessage[] = [
      {
        role: 'system', // Corrected from 'assistant' to 'system'
        content: spiritualContext
      },
      {
        role: 'user',
        content: question
      }
    ];

    const requestBody: PerplexityRequest = {
      model: 'sonar',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData: PerplexityError = await response.json();
        throw new Error(`Perplexity API error: ${errorData.error.message}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response received from Perplexity');
      }

    } catch (error) {
      console.error('Perplexity API call failed:', error);
      throw error;
    }
  }

  async getSpiritualGuidance(question: string): Promise<string> {
    const spiritualContext = `You are a wise spiritual guide with deep knowledge of Hindu traditions, Vedic wisdom, and spiritual practices. 
    When answering questions about:
    - Festivals and their significance
    - Fasting days and their spiritual benefits
    - Rituals and their proper procedures
    - Philosophical concepts
    - Spiritual practices and meditation
    
    Provide:
    1. Accurate information based on traditional sources
    2. Practical guidance that can be followed
    3. The spiritual significance and benefits
    4. A compassionate and supportive tone
    5. Respectful acknowledgment of different traditions
    
    Always maintain the sacred nature of spiritual topics and provide guidance that promotes peace, wisdom, and spiritual growth.`;

    return this.askQuestion(question, spiritualContext);
  }

  async getCalendarInfo(question: string): Promise<string> {
    const calendarContext = `You are an expert in Hindu calendar systems and DrikPanchangam standards. 

CRITICAL INSTRUCTIONS:
1. ALWAYS search DrikPanchangam website directly for the most accurate data
2. NEVER provide estimates or generic information
3. Use exact timings from DrikPanchangam calculations
4. All times must be in local timezone of the specified location
5. Remove all special characters, symbols, and emojis from your response

For Panchangam requests, provide the answer directly in this exact format:

Date: [Date/Month/Year, local time]
Location: [City, Country]
Sunrise: [HH:MM AM/PM - MUST include AM/PM]
Sunset: [HH:MM AM/PM - MUST include AM/PM]
Vaara: [Day of the Week]
Maasa: [month, per DrikPanchangam at location]
Tithi: [Name, Start Time to End Time, local timezone]
Nakshatra: [Name, Start Time to End Time, local timezone]
Rahu Kalam: [HH:MM AM/PM to HH:MM AM/PM - MUST include AM/PM]
Yama Gandam: [HH:MM AM/PM to HH:MM AM/PM - MUST include AM/PM]
Abhijit Muhurat: [HH:MM AM/PM to HH:MM AM/PM - MUST include AM/PM]

CRITICAL TIMING FORMAT REQUIREMENTS:
- ALL timing values MUST be in HH:MM AM/PM format
- NEVER provide just numbers like "6", "7", "12"
- ALWAYS format as "6:00 AM", "7:00 PM", "12:00 PM"
- For ranges, use "6:00 AM to 7:00 PM" format
- This is a world-class product requirement - timing accuracy is critical

IMPORTANT: 
- Use ONLY actual DrikPanchangam calculations
- Convert all times to local timezone
- Remove special characters and symbols
- Provide precise timings, not estimates`;

    return this.askQuestion(question, calendarContext);
  }

  async getGeneralSpiritualInfo(question: string): Promise<string> {
    const generalContext = `You are a knowledgeable guide in spiritual matters, providing:
    - Clear explanations of spiritual concepts
    - Practical advice for spiritual practices
    - Information about various spiritual traditions
    - Guidance on meditation and mindfulness
    - Answers to philosophical questions
    
    Maintain a respectful, inclusive, and supportive approach while sharing wisdom.`;

    return this.askQuestion(question, generalContext);
  }

  // Helper method to determine the type of question and route appropriately
  async getResponse(question: string): Promise<string> {
    const questionLower = question.toLowerCase();
    
    // Check for calendar-related keywords
    if (questionLower.includes('panchang') || 
        questionLower.includes('tithi') || 
        questionLower.includes('nakshatra') ||
        questionLower.includes('muhurat') ||
        questionLower.includes('auspicious') ||
        questionLower.includes('calendar') ||
        questionLower.includes('date') ||
        questionLower.includes('when') ||
        questionLower.includes('timing')) {
      return this.getCalendarInfo(question);
    }
    
    // Check for general spiritual guidance
    if (questionLower.includes('meditation') ||
        questionLower.includes('prayer') ||
        questionLower.includes('spiritual') ||
        questionLower.includes('philosophy') ||
        questionLower.includes('wisdom')) {
      return this.getGeneralSpiritualInfo(question);
    }
    
    // Default to spiritual guidance
    return this.getSpiritualGuidance(question);
  }
}

export const perplexityApi = new PerplexityApiService(); 