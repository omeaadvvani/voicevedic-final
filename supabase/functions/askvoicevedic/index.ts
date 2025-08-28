import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

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
    const { question, location, calendar } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const baseInstruction = `You are a voice-based Hindu calendar assistant named VoiceVedic. Your job is to respond to spiritual and religious timing questions asked by users in simple, calm, spiritual English.

Your response must always follow this 3-line format:

1. Give the exact timing or date.
2. Explain the spiritual or Vedic significance of the event.
3. Suggest what the user should do or observe (e.g., fast, pray, meditate, chant, or rest).

Tone: Peaceful, respectful, and aligned with Indian spiritual traditions. Use clear, non-technical English. Keep responses short and focused.

Do not include greetings, emojis, or unnecessary explanations. Only answer what is asked, in 3 lines maximum.

---

Example Question:  
When is Amavasya this month?

Example Output:  
Amavasya falls on Sunday, June 30.  
It marks the new moon and is ideal for spiritual cleansing and honoring ancestors.  
Observe silence, offer water to your elders, or perform a simple prayer at home.

---
`;

    let contextBlock = '';
    if (location && calendar) {
      contextBlock = `The user is located in ${location}. They follow the ${calendar} calendar.`;
    } else if (location) {
      contextBlock = `The user is located in ${location}.`;
    } else if (calendar) {
      contextBlock = `The user follows the ${calendar} calendar.`;
    }

    const fullSystemPrompt = contextBlock
      ? `${contextBlock}\n\n${baseInstruction}`
      : baseInstruction;

    const payload = {
      model: "gpt-4o",
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      messages: [
        {
          role: "system",
          content: fullSystemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't fetch a spiritual response.";

    return new Response(JSON.stringify({ answer: reply }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("Error in ask-voicevedic function:", error);
    
    return new Response(
      JSON.stringify({ 
        answer: "I'm unable to respond right now. Please try again in a moment. Your spiritual journey continues with patience and devotion.",
        error: error.message 
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