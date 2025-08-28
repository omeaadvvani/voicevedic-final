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

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("🔍 Fetching FAQs with missing embeddings...");

    // 1. Get all questions with NULL embeddings
    const { data: faqs, error: fetchError } = await supabase
      .from('vedic_faqs')
      .select('id, question')
      .is('embedding', null);

    if (fetchError) {
      console.error("Error fetching FAQs:", fetchError);
      throw new Error(`Failed to fetch FAQs: ${fetchError.message}`);
    }

    if (!faqs || faqs.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No FAQs found with missing embeddings. All embeddings are up to date!",
          updated: 0,
          total_faqs: 0
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`📝 Found ${faqs.length} FAQs needing embeddings`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // 2. Process each FAQ to generate embeddings
    for (const faq of faqs) {
      try {
        console.log(`🤖 Generating embedding for: "${faq.question}"`);

        // Generate embedding using OpenAI
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: faq.question.trim(),
          }),
        });

        if (!embeddingResponse.ok) {
          throw new Error(`OpenAI API error: ${embeddingResponse.status} ${embeddingResponse.statusText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data?.[0]?.embedding;

        if (!embedding || !Array.isArray(embedding)) {
          throw new Error("Invalid embedding response from OpenAI");
        }

        console.log(`✅ Generated embedding (${embedding.length} dimensions)`);

        // 3. Update the FAQ with the generated embedding
        const { error: updateError } = await supabase
          .from("vedic_faqs")
          .update({ embedding })
          .eq("id", faq.id);

        if (updateError) {
          throw new Error(`Failed to update FAQ: ${updateError.message}`);
        }

        console.log(`💾 Saved embedding for FAQ ID: ${faq.id}`);
        updated++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to process FAQ "${faq.question}":`, error);
        failed++;
        errors.push(`FAQ "${faq.question}": ${error.message}`);
      }
    }

    // 4. Return summary
    const summary = {
      message: `Embedding generation complete! ${updated} embeddings generated and saved.`,
      updated,
      failed,
      total_processed: faqs.length,
      errors: failed > 0 ? errors : undefined
    };

    console.log("📊 Final Summary:", summary);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("💥 Function error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate embeddings",
        message: error.message,
        updated: 0
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