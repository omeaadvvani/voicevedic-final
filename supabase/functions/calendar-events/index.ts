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
} from "../api-utils.ts";

// Calendar events system prompt
const CALENDAR_SYSTEM_PROMPT = `You are a Hindu calendar expert assistant. You help users find important spiritual dates, festivals, and auspicious timings.

When asked about dates or events, provide:
1. The exact date(s) and time if applicable
2. Brief explanation of the spiritual significance
3. Any specific rituals or practices recommended

Keep responses concise and accurate. If you need to calculate dates, use current year unless specified otherwise.

Format dates as: "Day, Month Date, Year" (e.g., "Sunday, January 15, 2024")
Format times as: "HH:MM AM/PM" (e.g., "6:30 AM")`;

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp, 30, 60000)) { // 30 requests per minute
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
    const missingFields = validateRequiredFields(body, ["query"]);
    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(", ")}`,
        400,
        "Bad Request"
      );
    }

    const { query, location, calendar, year, includeDetails } = body;

    // Build context-aware system prompt
    let contextBlock = '';
    if (location && calendar) {
      contextBlock = `The user is located in ${location}. They follow the ${calendar} calendar.`;
    } else if (location) {
      contextBlock = `The user is located in ${location}.`;
    } else if (calendar) {
      contextBlock = `The user follows the ${calendar} calendar.`;
    }

    if (year) {
      contextBlock += `\nPlease provide information for the year ${year}.`;
    }

    const fullSystemPrompt = contextBlock
      ? `${contextBlock}\n\n${CALENDAR_SYSTEM_PROMPT}`
      : CALENDAR_SYSTEM_PROMPT;

    // Call OpenAI for calendar information
    const response = await callOpenAI(
      [
        {
          role: "system",
          content: fullSystemPrompt,
        },
        {
          role: "user",
          content: query,
        },
      ],
      {
        temperature: 0.3, // Lower temperature for more factual responses
        maxTokens: 300,
        model: "gpt-4o-mini",
      }
    );

    // Store query in database for analytics (optional)
    try {
      const supabase = createSupabaseClient();
      await supabase.from("calendar_queries").insert({
        query: query,
        location: location,
        calendar: calendar,
        year: year,
        response_length: response.length,
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      console.warn("Failed to log calendar query:", dbError);
      // Don't fail the request if logging fails
    }

    // Log successful request
    logRequest(req, startTime);

    // Return structured response
    return successResponse(
      {
        answer: response,
        query: query,
        context: {
          location,
          calendar,
          year: year || new Date().getFullYear(),
        },
        model: "gpt-4o-mini",
        includeDetails: includeDetails || false,
      },
      "Calendar information provided successfully"
    );

  } catch (error) {
    console.error("Error in calendar-events function:", error);
    
    // Log failed request
    logRequest(req, startTime);
    
    return errorResponse(
      "Unable to retrieve calendar information at this time. Please try again.",
      500,
      error.message
    );
  }
}); 