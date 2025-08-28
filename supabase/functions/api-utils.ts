// Shared utilities for Supabase Edge Functions
// import { serve } from "https://deno.land/std@0.192.0/http/server.ts"; // Remove unused import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for all APIs
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Version, X-Request-Id, x-request-id, x-client-version",
};

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// OpenAI API configuration
export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// Default OpenAI configuration
export const defaultOpenAIConfig: OpenAIConfig = {
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Environment variables validation
export function validateEnvironment(): {
  openaiApiKey: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
} {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  }

  return { openaiApiKey, supabaseUrl, supabaseServiceKey };
}

// Create Supabase client
export function createSupabaseClient() {
  const { supabaseUrl, supabaseServiceKey } = validateEnvironment();
  return createClient(supabaseUrl, supabaseServiceKey);
}

// OpenAI API wrapper with retry logic following OpenAI guidelines
export async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  config: Partial<OpenAIConfig> = {}
): Promise<string> {
  const { openaiApiKey } = validateEnvironment();
  const finalConfig = { ...defaultOpenAIConfig, ...config };

  // Validate messages following OpenAI guidelines
  if (!messages || messages.length === 0) {
    throw new Error("Messages array cannot be empty");
  }

  // Ensure messages have required fields
  for (const message of messages) {
    if (!message.role || !message.content) {
      throw new Error("Each message must have 'role' and 'content' fields");
    }
    if (!['system', 'user', 'assistant'].includes(message.role)) {
      throw new Error(`Invalid role: ${message.role}. Must be 'system', 'user', or 'assistant'`);
    }
  }

  const payload = {
    model: finalConfig.model,
    temperature: Math.max(0, Math.min(2, finalConfig.temperature)), // Clamp between 0-2
    max_tokens: Math.max(1, Math.min(4096, finalConfig.maxTokens)), // Clamp between 1-4096
    top_p: Math.max(0, Math.min(1, finalConfig.topP)), // Clamp between 0-1
    frequency_penalty: Math.max(-2, Math.min(2, finalConfig.frequencyPenalty)), // Clamp between -2 to 2
    presence_penalty: Math.max(-2, Math.min(2, finalConfig.presencePenalty)), // Clamp between -2 to 2
    messages,
    stream: false, // Ensure non-streaming for consistent responses
  };

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "assistants=v1", // Enable latest features
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Handle specific OpenAI error codes
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${errorMessage}`);
        } else if (response.status === 401) {
          throw new Error(`Authentication failed: ${errorMessage}`);
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorMessage}`);
        } else if (response.status >= 500) {
          throw new Error(`OpenAI server error: ${errorMessage}`);
        } else {
          throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
        }
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Log usage for monitoring
      const usage = data.usage;
      if (usage) {
        console.log(`OpenAI API usage - Tokens: ${usage.total_tokens}, Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}`);
      }

      return content;

    } catch (error) {
      lastError = error as Error;
      console.error(`OpenAI API attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("OpenAI API failed after all retries");
}

// Generate embeddings with retry logic
export async function generateEmbedding(text: string): Promise<number[]> {
  const { openaiApiKey } = validateEnvironment();
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI Embeddings API error (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding response from OpenAI");
      }

      return embedding;

    } catch (error) {
      lastError = error as Error;
      console.error(`Embedding generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Embedding generation failed after all retries");
}

// Standard success response
export function successResponse<T>(data: T, message?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Standard error response
export function errorResponse(
  error: string,
  status: number = 500,
  message?: string
): Response {
  const response: ApiResponse = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Input validation helper
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): string[] {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

// Rate limiting helper (simple in-memory for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Request logging middleware
export function logRequest(req: Request, startTime: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${duration}ms`);
}

// Ensure every function responds to OPTIONS preflight
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
} 