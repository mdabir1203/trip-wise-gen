import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, startDate, endDate, ageGroup, travelStyle, tripCategory, gender } = await req.json();

    console.log('Generating packing list for:', {
      destination,
      startDate,
      endDate,
      ageGroup,
      travelStyle,
      tripCategory,
      gender,
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate trip duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const weatherSummary = await fetchWeatherSummary(destination, startDate, endDate);

    // Build comprehensive prompt
    const systemPrompt = `You are an expert travel advisor with deep knowledge of worldwide destinations, climates, cultural norms, and packing best practices. Your task is to create a comprehensive, personalized packing checklist.`;

    const userPrompt = `Create a detailed packing checklist for a trip to ${destination}.

Trip Details:
- Destination: ${destination}
- Travel dates: ${startDate} to ${endDate} (${days} days)
- Age group: ${ageGroup}
- Travel style: ${travelStyle}
- Trip category: ${tripCategory}
- Traveler gender expression: ${gender}
- Weather forecast summary: ${weatherSummary ?? 'Real-time forecast unavailable; rely on trusted seasonal guidance.'}

Instructions:
1. Research the destination's climate during these specific dates
2. Consider cultural norms and dress codes for ${destination}
3. Tailor recommendations to ${ageGroup} travelers and ${travelStyle} travel style
4. Include weather context (temperature ranges, precipitation, seasonal considerations) grounded in the forecast summary above
5. Add cultural tips relevant to packing choices
6. If the trip category is wedding, prioritize ceremony and reception attire, accessories for gifting, and contingency plans for formal events for the specified gender expression.
7. Align garment recommendations with the specified gender expression while offering inclusive alternatives.

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):
{
  "weatherContext": "Brief summary of expected weather during travel dates with temperature ranges",
  "culturalTips": "1-2 key cultural considerations that affect packing choices",
  "categories": [
    {
      "name": "Category Name",
      "items": ["Item 1", "Item 2", "Item 3"]
    }
  ]
}

Categories should include: Clothing, Footwear, Toiletries, Electronics, Documents, Health & Safety, and any destination-specific categories.
Make items specific and actionable. For clothing, specify quantities (e.g., "3 t-shirts" not just "t-shirts").`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    console.log('Raw AI response:', content);

    // Clean up markdown artifacts
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(content);

    const enrichedResult = {
      ...result,
      weatherContext: weatherSummary
        ? `${weatherSummary} ${result.weatherContext}`.trim()
        : result.weatherContext,
      weatherSummary: weatherSummary ?? null,
      tripCategory,
      gender,
      travelStyle,
      ageGroup,
      tripDuration: days,
    };

    return new Response(
      JSON.stringify(enrichedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-packing-list function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchWeatherSummary(destination: string, startDate: string, endDate: string) {
  try {
    if (!destination || !startDate || !endDate) {
      return null;
    }

    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      console.error('Geocoding API error:', geoResponse.status, await geoResponse.text());
      return null;
    }

    const geoData = await geoResponse.json();
    if (!geoData?.results?.length) {
      return null;
    }

    const { latitude, longitude, timezone } = geoData.results[0];

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', String(latitude));
    weatherUrl.searchParams.set('longitude', String(longitude));
    weatherUrl.searchParams.set('start_date', startDate);
    weatherUrl.searchParams.set('end_date', endDate);
    weatherUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum');
    weatherUrl.searchParams.set('timezone', timezone ?? 'auto');

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      console.error('Weather API error:', weatherResponse.status, await weatherResponse.text());
      return null;
    }

    const weatherData = await weatherResponse.json();
    const daily = weatherData?.daily;
    if (!daily?.time?.length) {
      return null;
    }

    const maxTemps: number[] = daily.temperature_2m_max ?? [];
    const minTemps: number[] = daily.temperature_2m_min ?? [];
    const precipitation: number[] = daily.precipitation_sum ?? [];

    if (!maxTemps.length || !minTemps.length) {
      return null;
    }

    const highest = Math.max(...maxTemps);
    const lowest = Math.min(...minTemps);
    const totalPrecip = precipitation.reduce((sum, value) => sum + (value ?? 0), 0);

    const highestF = Math.round((highest * 9) / 5 + 32);
    const lowestF = Math.round((lowest * 9) / 5 + 32);

    const rangeSummary = `Forecast between ${startDate} and ${endDate}: highs up to ${highest.toFixed(1)}°C (${highestF}°F) and lows near ${lowest.toFixed(1)}°C (${lowestF}°F).`;
    const precipSummary = `Total expected precipitation: ${totalPrecip.toFixed(1)} mm.`;

    return `${rangeSummary} ${precipSummary}`;
  } catch (error) {
    console.error('Unable to fetch weather summary', error);
    return null;
  }
}
