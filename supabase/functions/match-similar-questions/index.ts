import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid query parameter' }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Get environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Create Supabase client with service role key for RPC access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate embedding using OpenAI
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query.trim(),
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Failed to generate embedding from OpenAI");
    }

    // Search for similar questions using the RPC function
    const { data: matchData, error: matchError } = await supabase.rpc("match_vedic_faqs", {
      query_embedding: embedding,
      match_count: 5,
    });

    if (matchError) {
      console.error("Vector search error:", matchError);
      throw new Error("Vector similarity search failed");
    }

    // Extract suggestions and filter by similarity threshold
    const suggestions = (matchData || [])
      .filter((row: unknown) => {
        const typedRow = row as { similarity: number };
        return typedRow.similarity > 0.7;
      }) // Only return highly similar questions
      .map((row: unknown) => {
        const typedRow = row as { question: string; similarity: number };
        return {
          question: typedRow.question,
          similarity: typedRow.similarity
        };
      });

    return new Response(
      JSON.stringify({ 
        suggestions: suggestions.map(s => s.question),
        debug: {
          query: query.trim(),
          found_matches: suggestions.length,
          similarities: suggestions.map(s => s.similarity)
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("Error in match-similar-questions function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to find similar questions",
        message: error.message,
        suggestions: [] // Return empty array as fallback
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});