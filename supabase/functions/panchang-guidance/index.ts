import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PanchangData {
  slon: number;
  mlon: number;
  tithinum: number;
  tithi: string;
  paksha: string;
  tithiStart: string;
  tithiTill: string;
  nakshatra_number: number;
  nakshatra: string;
  nakshatraStart: string;
  nakshatraTill: string;
  yoga: string;
  yogTill: string;
  karana: string;
  karanTill: string;
  rashi: string;
  sunrise: string;
  sunset: string;
  maasa: string;
  requestsremaining: number;
  requeststotal: number;
  plan: string;
  status: string;
  reqdate: string;
  reqtime: string;
  reqtz: string;
  reqlat: string;
  reqlon: string;
}

function getFormattedLocalDate(dateString: string, timezoneOffset: number) {
  // dateString: "19/07/2025" or "9/7/2025"
  const [day, month, year] = dateString.split('/');
  // Pad day and month to 2 digits
  const dayPadded = day.padStart(2, '0');
  const monthPadded = month.padStart(2, '0');
  const dateObj = new Date(`${year}-${monthPadded}-${dayPadded}T00:00:00.000Z`);
  // Adjust for timezone offset in hours
  const localTime = new Date(dateObj.getTime() + timezoneOffset * 60 * 60 * 1000);
  return localTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function buildTodayMessage(panchang: PanchangData, timezone: string) {
  const tz = parseFloat(timezone) || 5.5;
  const normalDate = getFormattedLocalDate(panchang.reqdate, tz);
  const sunrise = panchang.sunrise?.slice(0,5) || '';
  const tithiEnd = panchang.tithiTill?.slice(11,16) || '';
  return `🪔 Jai Shree Krishna.\nToday is ${normalDate} – ${panchang.tithi}, ${panchang.paksha} Paksha, ${panchang.maasa} Maasa.\nSunrise at ${sunrise}. You may pray peacefully till ${tithiEnd}.`;
}

const globalInstruction = `
Respond only in 3 lines, use respectful Hindu tone, and never start with date/time — always begin with a greeting (e.g., Jai Shree Krishna).
`;

function buildTodayPrompt(panchang: PanchangData, timezone: string) {
  const tz = parseFloat(timezone) || 5.5;
  const normalDate = getFormattedLocalDate(panchang.reqdate, tz);
  const sunrise = panchang.sunrise?.slice(0,5) || '';
  const tithiEnd = panchang.tithiTill?.slice(11,16) || '';
  return `You're VoiceVedic, a peaceful Hindu calendar assistant.\n\nWhen a user asks \"What day is today\", your answer must be:\n1. A warm spiritual greeting (e.g., Jai Shree Krishna)\n2. The weekday and Gregorian date in full\n3. Panchang elements: Tithi, Paksha, Maasa\n4. Tithi end time (if available)\n5. A closing suggestion only if relevant (e.g., fast, rest, or pray)\n\nAvoid giving extra spiritual context unless the day is a known event or festival. Use only 3 calm and clear lines in your response.\n\n🪔 Jai Shree Krishna.\nToday is ${normalDate} – ${panchang.tithi}, ${panchang.paksha} Paksha, ${panchang.maasa} Maasa.\nTithi ends at ${tithiEnd || 'unknown'}.`;
}

function buildEventPrompt(eventName: string, eventDate: string, tithiStart: string, tithiEnd: string) {
  return `You are VoiceVedic, a spiritual calendar assistant.\n\nWhen a user asks about the next festival or event (like Amavasya, Ekadashi, Poornima), respond with:\n1. The name of the event\n2. The full date (weekday + date)\n3. The start and end time of the tithi\n4. Ask if they’d like to know what to do on that day\n\nDo not give spiritual meaning unless the user asks. Be calm and clear.\n\n🪔 Jai Shree Krishna.\nThe next ${eventName} falls on ${eventDate}.\nIt begins at ${tithiStart} and ends at ${tithiEnd}. Would you like to know what to do on this day?`;
}

async function findNextEvent(event: string, startDate: string, timezone: string, lat?: string, lon?: string): Promise<{date: string, panchang: PanchangData} | null> {
  // Map event names to Tithi and Paksha
  const eventMap: Record<string, { tithi: string, paksha?: string }> = {
    amavasya: { tithi: 'Amavasya' },
    poornima: { tithi: 'Purnima' },
    purnima: { tithi: 'Purnima' },
    ekadashi: { tithi: 'Ekadashi' },
    pradosh: { tithi: 'Trayodashi' },
    sankashti: { tithi: 'Chaturthi', paksha: 'Krishna' },
    chaturthi: { tithi: 'Chaturthi' },
    ashtami: { tithi: 'Ashtami' },
    dwadashi: { tithi: 'Dwadashi' },
    trayodashi: { tithi: 'Trayodashi' },
    navami: { tithi: 'Navami' },
    dashami: { tithi: 'Dashami' },
    saptami: { tithi: 'Saptami' },
    shashti: { tithi: 'Shashthi' },
    panchami: { tithi: 'Panchami' },
    tithi: { tithi: 'Tithi' },
  };
  const eventKey = event.toLowerCase();
  const eventCriteria = eventMap[eventKey];
  if (!eventCriteria) return null;

  // Parse start date
  const [day, month, year] = startDate.split('/');
  let dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
  const tz = parseFloat(timezone) || 5.5;

  for (let i = 0; i < 60; i++) {
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    const timeStr = '06:00:00';
    const panchang = await fetchPanchangData(dateStr, timeStr, timezone, lat, lon);
    if (panchang) {
      // Check if tithi matches at 6:00 AM
      const tithiMatch = panchang.tithi && panchang.tithi.toLowerCase() === eventCriteria.tithi.toLowerCase();
      const pakshaMatch = !eventCriteria.paksha || (panchang.paksha && panchang.paksha.toLowerCase() === eventCriteria.paksha.toLowerCase());
      // Check if tithiStart or tithiTill for this tithi falls within this day
      let tithiStartMatch = false;
      let tithiTillMatch = false;
      if (panchang.tithiStart) {
        const [startDay, startMonth, startYearAndTime] = panchang.tithiStart.split('-');
        const [startYear] = startYearAndTime.split(' ');
        if (parseInt(startDay) === dateObj.getDate() && parseInt(startMonth) === (dateObj.getMonth() + 1) && parseInt(startYear) === dateObj.getFullYear()) {
          tithiStartMatch = true;
        }
      }
      if (panchang.tithiTill) {
        const [tillDay, tillMonth, tillYearAndTime] = panchang.tithiTill.split('-');
        const [tillYear] = tillYearAndTime.split(' ');
        if (parseInt(tillDay) === dateObj.getDate() && parseInt(tillMonth) === (dateObj.getMonth() + 1) && parseInt(tillYear) === dateObj.getFullYear()) {
          tithiTillMatch = true;
        }
      }
      if ((tithiMatch && pakshaMatch) || tithiStartMatch || tithiTillMatch) {
        // If any match, return this date
        return { date: dateStr, panchang };
      }
    }
    // Next day
    dateObj.setDate(dateObj.getDate() + 1);
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, date, time, timezone, latitude, longitude } = await req.json()

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Panchang data
    const panchangData = await fetchPanchangData(date, time, timezone, latitude, longitude)
    
    if (!panchangData) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Panchang data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Detect 'What day is today?' and similar queries
    const todayPatterns = [
      /what day is it/i,
      /what day is today/i,
      /today'?s? date/i,
      /which day is today/i,
      /aaj ka din/i,
      /today'?s? panchang/i,
      /today'?s? tithi/i,
      /today'?s? maasa/i,
      /today'?s? sunrise/i,
      /today'?s? details/i
    ];
    const isTodayQuery = todayPatterns.some((pat) => pat.test(question));

    // Detect event queries (e.g., next Amavasya, Ekadashi, Poornima)
    const eventPatterns = [
      /next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i,
      /when is the next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i,
      /kab hai next\s+(amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi)/i
    ];
    const isEventQuery = eventPatterns.some((pat) => pat.test(question));

    if (isEventQuery) {
      // Extract event name
      const eventName = (question.match(/amavasya|ekadashi|poornima|purnima|pradosh|sankashti|chaturthi|ashtami|dwadashi|trayodashi|navami|dashami|saptami|shashti|panchami|tithi/i) || ["Event"])[0];
      // Find next event using Panchang API only
      const nextEvent = await findNextEvent(eventName, date, timezone, latitude, longitude);
      if (!nextEvent) {
        return new Response(
          JSON.stringify({ error: `Could not find the next ${eventName}` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      const tz = parseFloat(timezone) || 5.5;
      const eventDate = getFormattedLocalDate(nextEvent.date, tz);
      const tithiStart = nextEvent.panchang.tithiStart || '';
      const tithiEnd = nextEvent.panchang.tithiTill || '';
      // Always return only the greeting and event info, no long spiritual message
      const guidance = `🪔 Jai Shree Krishna. The next ${eventName} falls on ${eventDate}.\nIt begins at ${tithiStart} and ends at ${tithiEnd}. Would you like to know what to do on this day?`;
      return new Response(
        JSON.stringify({
          event: eventName,
          date: eventDate,
          tithiStart,
          tithiEnd,
          panchang: nextEvent.panchang,
          guidance,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use GPT for both cases, but with different system prompts
    let systemPrompt = globalInstruction;
    let userPrompt = question;
    if (isTodayQuery) {
      systemPrompt = globalInstruction + '\n' +
        `You're VoiceVedic, a peaceful Hindu calendar assistant.\n\nWhen a user asks \"What day is today\", your answer must be:\n1. A warm spiritual greeting (e.g., Jai Shree Krishna)\n2. The weekday and Gregorian date in full\n3. Panchang elements: Tithi, Paksha, Maasa\n4. Tithi end time (if available)\n5. A closing suggestion only if relevant (e.g., fast, rest, or pray)\n\nAvoid giving extra spiritual context unless the day is a known event or festival. Use only 3 calm and clear lines in your response.`;
      userPrompt = `Today is ${getFormattedLocalDate(panchangData.reqdate, parseFloat(timezone) || 5.5)} – ${panchangData.tithi}, ${panchangData.paksha} Paksha, ${panchangData.maasa} Maasa. Tithi ends at ${panchangData.tithiTill?.slice(11,16) || 'unknown'}.`;
    } else {
      // Default: use the old prompt logic
      userPrompt = createGuidancePrompt(question, panchangData);
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate spiritual guidance' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiData = await openaiResponse.json()
    const guidance = openaiData.choices[0]?.message?.content || 'Unable to generate guidance at this time.'

    return new Response(
      JSON.stringify({
        guidance,
        panchang: panchangData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in panchang-guidance function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchPanchangData(
  date: string,
  time: string,
  timezone: string,
  latitude?: string,
  longitude?: string
): Promise<PanchangData | null> {
  try {
    const panchangUserId = Deno.env.get('PANCHANG_USER_ID')
    const panchangAuthCode = Deno.env.get('PANCHANG_AUTH_CODE')

    if (!panchangUserId || !panchangAuthCode) {
      console.error('Panchang API credentials not configured')
      return null
    }

    const params = new URLSearchParams({
      userid: panchangUserId,
      authcode: panchangAuthCode,
      date,
      time,
      tz: timezone
    })

    if (latitude && longitude) {
      params.append('lat', latitude)
      params.append('lon', longitude)
    }

    const response = await fetch(`https://api.panchang.click/v0.4/panchangapip1?${params.toString()}`)
    
    if (!response.ok) {
      console.error('Panchang API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.status !== 'ok') {
      console.error('Panchang API returned error status:', data.status)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching Panchang data:', error)
    return null
  }
}

function createGuidancePrompt(question: string, panchangData: PanchangData): string {
  return `Based on today's Panchang (Hindu calendar) data, please provide spiritual guidance for this question: "${question}"

Today's Panchang Information:
- Tithi (Lunar Day): ${panchangData.tithi} (${panchangData.paksha})
- Nakshatra (Lunar Mansion): ${panchangData.nakshatra}
- Yoga (Solar-Lunar Combination): ${panchangData.yoga}
- Karana (Half Tithi): ${panchangData.karana}
- Rashi (Zodiac Sign): ${panchangData.rashi}
- Maasa (Lunar Month): ${panchangData.maasa}
- Sunrise: ${panchangData.sunrise}
- Sunset: ${panchangData.sunset}

Please provide guidance that:
1. Acknowledges the current astrological influences
2. Offers practical spiritual advice
3. Suggests auspicious activities or practices for this time
4. Maintains a warm, supportive tone
5. Is respectful of all spiritual paths

Keep your response concise (2-3 paragraphs) and focus on practical wisdom that can help the person in their daily life.`
} 