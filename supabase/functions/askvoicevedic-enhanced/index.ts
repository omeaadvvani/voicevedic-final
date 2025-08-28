import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import {
  handleCors,
  successResponse,
  errorResponse,
  validateRequiredFields,
  checkRateLimit,
  logRequest,
} from "../api-utils.ts";





// Function to get current date in DD/MM/YYYY format for user's timezone
function getCurrentDateForTimezone(timezone: string): string {
  const now = new Date();
  const tzOffset = parseFloat(timezone) || 0;
  
  // Adjust for timezone
  const localTime = new Date(now.getTime() + (tzOffset * 60 * 60 * 1000));
  
  const day = localTime.getUTCDate().toString().padStart(2, '0');
  const month = (localTime.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = localTime.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

// VoiceVedic system prompt for accurate Panchangam
const VOICE_VEDIC_SYSTEM_PROMPT = `You are VoiceVedic, a precise Hindu calendar assistant that provides accurate Panchangam details per DrikPanchangam standards.

IMPORTANT INSTRUCTIONS:
1. ALWAYS use Perplexity API to search for real-time, accurate Panchangam data from DrikPanchangam and other authoritative sources
2. NEVER provide generic or estimated information - always search for precise data
3. Provide DIRECT answers without reasoning sections or explanations
4. Use exact date and location provided or detected from user context
5. All times must be in 12-hour format with AM/PM in the target location's local timezone
6. Dates must be in "Day Month Year" format (e.g., 13th August 2025)
7. REMOVE all special characters, symbols, and emojis from responses
8. Use ONLY plain text that can be read clearly by text-to-speech systems

RESPONSE FORMAT FOR PANCHANGAM REQUESTS:
Always reply in this exact format:

🪔 Jai Shree Krishna.

Date: [Date/Month/Year, local time]
Location: [City, Country]
Sunrise: [HH:MM AM/PM]
Sunset: [HH:MM AM/PM]
Vaara: [Day of the Week]
Maasa: [month, per DrikPanchangam at location]
Tithi: [Name, Start Time to End Time, local timezone]
Nakshatra: [Name, Start Time to End Time, local timezone]
Rahu Kalam: [Start Time to End Time, local timezone]
Yama Gandam: [Start Time to End Time, local timezone]
Brahma Muhurtham: [Start Time to End Time, local timezone]

RESPONSE FORMAT FOR SPECIFIC QUERIES:
🪔 Jai Shree Krishna.

[Direct, precise answer in the requested format]

CAPABILITIES:
- Auto-detect user location via IP/coordinates if not provided
- Reverse-geocode coordinates to city and country
- Accept explicit user-provided locations as overrides
- Handle DST and timezone conversions correctly
- Use only DrikPanchangam and authoritative sources

Tone: Professional, precise, and aligned with Vedic traditions. Give direct answers without unnecessary explanations or reasoning sections.

EXAMPLE OUTPUT FOR PANCHANGAM REQUEST:
Question: "What is today's Panchang in Vancouver?"

🪔 Jai Shree Krishna.

Date: 14th August 2025
Location: Vancouver, British Columbia, Canada
Sunrise: 5:45 AM
Sunset: 8:15 PM
Vaara: Thursday
Maasa: Shravana
Tithi: Chaturdashi (Starts: 2:30 AM, Ends: 12:15 AM next day)
Nakshatra: Hasta (Starts: 10:20 AM, Ends: 8:45 AM next day)
Rahu Kalam: 1:30 PM to 3:00 PM
Yama Gandam: 9:00 AM to 10:30 AM
Brahma Muhurtham: 4:15 AM to 5:00 AM`;

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp, 50, 60000)) { // 50 requests per minute
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
    } catch (_e) {
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

    const { question, location, calendar, latitude, longitude } = body;

    // Determine timezone and enhance location detection
    let timezone = '0'; // Default to UTC
    let enhancedLocation = location;
    
    if (location) {
      // User provided explicit location - use it as is
      enhancedLocation = location;
      
      // Set appropriate timezone based on location
      if (location.toLowerCase().includes('vancouver') || location.toLowerCase().includes('bc') || location.toLowerCase().includes('british columbia')) {
        timezone = '-8'; // Vancouver is UTC-8 (PST) or UTC-7 (PDT)
      } else if (location.toLowerCase().includes('india') || location.toLowerCase().includes('mumbai') || location.toLowerCase().includes('delhi')) {
        timezone = '5.5'; // IST is UTC+5:30
      } else if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('new jersey') || location.toLowerCase().includes('usa')) {
        timezone = '-5'; // EST is UTC-5
      } else if (location.toLowerCase().includes('chicago') || location.toLowerCase().includes('illinois')) {
        timezone = '-6'; // CST is UTC-6
      } else if (location.toLowerCase().includes('los angeles') || location.toLowerCase().includes('california')) {
        timezone = '-8'; // PST is UTC-8
      } else if (location.toLowerCase().includes('london') || location.toLowerCase().includes('uk')) {
        timezone = '0'; // GMT/UTC
      } else if (location.toLowerCase().includes('australia') || location.toLowerCase().includes('sydney')) {
        timezone = '10'; // AEST is UTC+10
      }
    } else if (latitude && longitude) {
      // Auto-detect location from coordinates - try to get city/country
      try {
        // Use reverse geocoding to get location name
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.address) {
            const city = geoData.address.city || geoData.address.town || geoData.address.village;
            const country = geoData.address.country;
            if (city && country) {
              enhancedLocation = `${city}, ${country}`;
            } else if (country) {
              enhancedLocation = country;
            } else {
              enhancedLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
          } else {
            enhancedLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
        } else {
          enhancedLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
        
        // Estimate timezone from coordinates (rough approximation)
        const lon = parseFloat(longitude);
        if (lon >= -180 && lon <= -67.5) {
          timezone = '-5'; // Eastern US
        } else if (lon >= -67.5 && lon <= -97.5) {
          timezone = '-6'; // Central US
        } else if (lon >= -97.5 && lon <= -127.5) {
          timezone = '-8'; // Pacific US
        } else if (lon >= 67.5 && lon <= 97.5) {
          timezone = '5.5'; // India
        } else if (lon >= -10 && lon <= 40) {
          timezone = '0'; // Europe
        } else if (lon >= 110 && lon <= 180) {
          timezone = '10'; // Australia
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
        enhancedLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        // Default timezone based on coordinates
        const lon = parseFloat(longitude);
        if (lon >= 67.5 && lon <= 97.5) {
          timezone = '5.5'; // India
        } else if (lon >= -180 && lon <= -67.5) {
          timezone = '-5'; // US East
        } else {
          timezone = '0'; // UTC
        }
      }
    } else {
      // No location or coordinates provided - ask user for location
      enhancedLocation = 'Location not specified';
      timezone = '0'; // UTC
    }

    // Get current date for user's timezone
    const currentDate = getCurrentDateForTimezone(timezone);

    // Build context-aware system prompt for Perplexity API
    let contextBlock = '';
    if (location && calendar) {
      contextBlock = `The user is located in ${location}. They follow the ${calendar} calendar.`;
    } else if (location) {
      contextBlock = `The user is located in ${location}.`;
    } else if (calendar) {
      contextBlock = `The user follows the ${calendar} calendar.`;
    }

    // Add user preferences if provided


    // Add current date and location context for Perplexity API
    contextBlock += `\n\nCurrent Context:
- Today's Date: ${currentDate}
- User Location: ${enhancedLocation}
- Coordinates: ${latitude ? `${latitude}, ${longitude}` : 'Not provided'}
- Timezone: UTC${timezone}
- Request Date: ${currentDate} (local timezone)

CRITICAL INSTRUCTIONS:
1. If user specifies a location (e.g., "Vancouver BC"), use ONLY that location for all calculations
2. If no location specified but coordinates provided, use the auto-detected location from coordinates
3. If neither location nor coordinates provided, ask user to specify their location
4. NEVER default to random US cities like Chicago or New York
5. All times must be in the local timezone of the specified/detected location
6. Use DrikPanchangam as the ONLY source for accurate Panchangam calculations
7. Ensure consistency - same location should always give same results for the same date`;

    const fullSystemPrompt = contextBlock
      ? `${contextBlock}\n\n${VOICE_VEDIC_SYSTEM_PROMPT}`
      : VOICE_VEDIC_SYSTEM_PROMPT;

    // Call Perplexity API for accurate Panchang data
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      // Fallback response when Perplexity API key is not configured
      console.warn('Perplexity API key not configured, using fallback response');
      
      if (question.toLowerCase().includes('panchang') || question.toLowerCase().includes('panchangam')) {
        // Provide a helpful fallback for panchangam requests
        const fallbackResponse = `I apologize, but I'm currently unable to provide real-time Panchangam data because the Perplexity API key is not configured in the Supabase environment.

To fix this issue, please:
1. Add PERPLEXITY_API_KEY to your Supabase project secrets
2. Or contact your system administrator to configure the API key

For now, I recommend checking DrikPanchangam directly at https://www.drikpanchang.com/ for accurate Panchangam details for ${enhancedLocation || 'your location'}.

Location Context: ${enhancedLocation || 'Not specified'}
Date: ${currentDate}
Timezone: UTC${timezone}`;
        
        return successResponse(
          {
            answer: fallbackResponse,
            question: question,
            context: {
              location: enhancedLocation,
              calendar,
              userPreferences,
            },
            model: "fallback-response",
            tokens: fallbackResponse.length,
          },
          "Fallback response provided due to missing API configuration"
        );
      } else {
        // Generic fallback for other questions
        const fallbackResponse = `I apologize, but I'm currently unable to provide a response because the Perplexity API key is not configured in the Supabase environment.

To fix this issue, please:
1. Add PERPLEXITY_API_KEY to your Supabase project secrets
2. Or contact your system administrator to configure the API key

Question: ${question}
Location Context: ${enhancedLocation || 'Not specified'}`;
        
        return successResponse(
          {
            answer: fallbackResponse,
            question: question,
            context: {
              location: enhancedLocation,
              calendar,
              userPreferences,
            },
            model: "fallback-response",
            tokens: fallbackResponse.length,
          },
          "Fallback response provided due to missing API configuration"
        );
      }
    }

    // Build the search query for Perplexity
    let searchQuery = question;
    
    // Enhance search query for Panchangam requests
    if (question.toLowerCase().includes('panchang') || question.toLowerCase().includes('panchangam')) {
      searchQuery = `Get EXACT Panchangam data from DrikPanchangam website for ${currentDate} in ${enhancedLocation}. Search for precise timings of: Sunrise, Sunset, Vaara (weekday), Maasa (month), Tithi (lunar day), Nakshatra (lunar mansion), Rahu Kalam, Yama Gandam, and Brahma Muhurtham. All times must be in local timezone of ${enhancedLocation}. Do NOT provide estimates - only use actual DrikPanchangam calculations.`;
    } else if (enhancedLocation) {
      searchQuery += ` for ${enhancedLocation}`;
    }
    
    if (currentDate && !searchQuery.includes(currentDate)) {
      searchQuery += ` on ${currentDate}`;
    }
    
    // Add DrikPanchangam requirement for accuracy
    if (!searchQuery.includes('DrikPanchangam')) {
      searchQuery += `. Use DrikPanchangam or authoritative Vedic sources for accurate calculations.`;
    }

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: fullSystemPrompt
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.text();
      console.error('Perplexity API error:', errorData);
      return errorResponse(
        "Failed to get response from Perplexity API",
        500,
        "API call failed"
      );
    }

    const perplexityData = await perplexityResponse.json();
    let response = perplexityData.choices?.[0]?.message?.content || 'Unable to get response at this time.';
    
    // Clean up the response to fix TTS issues and enhance readability
    response = response
      // Remove Markdown formatting
      .replace(/\*\*/g, '')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\[.*?\]/g, '')
      // Remove special characters and symbols that cause TTS issues
      .replace(/🪔/g, 'Jai Shree Krishna')
      .replace(/[•·]/g, '')
      .replace(/[–—]/g, ' to ')
      // Preserve important panchangam characters and only remove problematic ones
      .replace(/[^\w\s\-\.,:;()\/]/g, '') // Keep forward slashes for time ranges
      // Fix time format issues that cause TTS to read "AM PM" incorrectly
      .replace(/(\d{1,2}:\d{2})\s+(AM|PM)\s+to\s+(\d{1,2}:\d{2})\s+(AM|PM)/g, '$1 $2 to $3 $4')
      // Fix any remaining "AM PM" combinations
      .replace(/(AM|PM)\s+(AM|PM)/g, '$1')
      // Fix "About" and "Around" for better TTS
      .replace(/About\s+/g, '')
      .replace(/Around\s+/g, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      // Ensure proper formatting for Panchangam responses
      .replace(/(\d{1,2}:\d{2}\s+(?:AM|PM))/g, '$1')
      // Clean up any remaining formatting issues
      .trim();

    // Log successful request
    logRequest(req, startTime);

    // Return structured response
    return successResponse(
      {
        answer: response,
        question: question,
        context: {
          location: enhancedLocation,
          calendar,
        },
        model: "perplexity-sonar",
        tokens: response.length, // Approximate token count
      },
      "Spiritual guidance provided successfully"
    );

  } catch (error) {
    console.error("Error in askvoicevedic-enhanced function:", error);
    
    // Log failed request
    logRequest(req, startTime);
    
    return errorResponse(
      "I'm unable to respond right now. Please try again in a moment. Your spiritual journey continues with patience and devotion.",
      500,
      error.message
    );
  }
}); 