import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import {
  handleCors,
  successResponse,
  errorResponse,
  callOpenAI,
  validateRequiredFields,
  checkRateLimit,
  logRequest,
  createSupabaseClient,
  generateEmbedding,
} from "../api-utils.ts";

// Spiritual guidance system prompt
const SPIRITUAL_GUIDANCE_PROMPT = `You are a wise spiritual guide with deep knowledge of Hindu philosophy, Vedic wisdom, and practical spirituality. You provide gentle, personalized guidance to help users on their spiritual journey.

When responding:
1. Be compassionate and understanding
2. Provide practical, actionable advice
3. Respect individual beliefs and practices
4. Keep responses concise but meaningful
5. Focus on inner growth and peace

Always maintain a calm, supportive tone that encourages spiritual development.`;

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp, 20, 60000)) { // 20 requests per minute
      return errorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        "Too many requests"
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse(
        "Invalid JSON in request body",
        400,
        "Bad Request"
      );
    }

    // Validate required fields
    const missingFields = validateRequiredFields(body, ["question"]);
    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(", ")}`,
        400,
        "Bad Request"
      );
    }

    const { 
      question, 
      userProfile, 
      spiritualLevel, 
      preferredPractices, 
      currentChallenges,
      includeRelatedWisdom 
    } = body;

    // Build personalized context
    let contextBlock = '';
    if (userProfile) {
      contextBlock += `User Profile: ${JSON.stringify(userProfile)}\n`;
    }
    if (spiritualLevel) {
      contextBlock += `Spiritual Level: ${spiritualLevel}\n`;
    }
    if (preferredPractices) {
      contextBlock += `Preferred Practices: ${preferredPractices}\n`;
    }
    if (currentChallenges) {
      contextBlock += `Current Challenges: ${currentChallenges}\n`;
    }

    const fullSystemPrompt = contextBlock
      ? `${contextBlock}\n\n${SPIRITUAL_GUIDANCE_PROMPT}`
      : SPIRITUAL_GUIDANCE_PROMPT;

    // Call OpenAI for spiritual guidance
    const response = await callOpenAI(
      [
        {
          role: "system",
          content: fullSystemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      {
        temperature: 0.7, // Balanced creativity and consistency
        maxTokens: 400,
        model: "gpt-4o-mini",
      }
    );

    // Generate embedding for the question for future similarity search
    let questionEmbedding = null;
    try {
      questionEmbedding = await generateEmbedding(question);
    } catch (embeddingError) {
      console.warn("Failed to generate embedding:", embeddingError);
    }

    // Store guidance session in database
    try {
      const supabase = createSupabaseClient();
      await supabase.from("spiritual_guidance_sessions").insert({
        question: question,
        answer: response,
        user_profile: userProfile,
        spiritual_level: spiritualLevel,
        preferred_practices: preferredPractices,
        current_challenges: currentChallenges,
        question_embedding: questionEmbedding,
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      console.warn("Failed to log spiritual guidance session:", dbError);
    }

    // Get related wisdom if requested
    let relatedWisdom = null;
    if (includeRelatedWisdom && questionEmbedding) {
      try {
        const supabase = createSupabaseClient();
        const { data: wisdomData } = await supabase.rpc("match_spiritual_wisdom", {
          query_embedding: questionEmbedding,
          match_count: 3,
          similarity_threshold: 0.7,
        });
        
        if (wisdomData && wisdomData.length > 0) {
          relatedWisdom = wisdomData.map((item: any) => ({
            wisdom: item.wisdom,
            source: item.source,
            relevance: item.similarity,
          }));
        }
      } catch (wisdomError) {
        console.warn("Failed to fetch related wisdom:", wisdomError);
      }
    }

    // Log successful request
    logRequest(req, startTime);

    // Return structured response
    return successResponse(
      {
        guidance: response,
        question: question,
        context: {
          userProfile,
          spiritualLevel,
          preferredPractices,
          currentChallenges,
        },
        relatedWisdom,
        model: "gpt-4o-mini",
        sessionId: crypto.randomUUID(),
      },
      "Spiritual guidance provided with compassion and wisdom"
    );

  } catch (error) {
    console.error("Error in spiritual-guidance function:", error);
    
    // Log failed request
    logRequest(req, startTime);
    
    return errorResponse(
      "I'm unable to provide guidance at this moment. Please try again with patience and faith.",
      500,
      error.message
    );
  }
}); 