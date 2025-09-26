import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecapRequest {
  vibePct: Array<{ v: string; pct: number }>;
  top3: Array<{ title: string; artist: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vibePct, top3 }: RecapRequest = await req.json();

    console.log('Generating recap for:', { vibePct, top3 });

    const vibeStats = vibePct
      .map(({ v, pct }) => `${v} ${pct}%`)
      .join(' • ');

    const topTracks = top3
      .map((track, i) => `${i+1}. "${track.title}" by ${track.artist}`)
      .join(', ');

    const prompt = `You're a festival recap DJ. The crowd's vibe breakdown: ${vibeStats}. Top tracks: ${topTracks}. 

Generate exactly one lively recap sentence (≤22 words, no emojis) celebrating the diversity/energy and making them feel special.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 60,
        temperature: 0.6,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const recap = data.content[0].text.trim();
    
    console.log('Generated recap:', recap);

    return new Response(JSON.stringify({ recap }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recap function:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      recap: "What a session! The crowd brought incredible energy and made every vote count. This is what music democracy looks like!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});