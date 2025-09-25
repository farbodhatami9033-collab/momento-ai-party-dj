import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecapRequest {
  vibePct: Record<string, number>;
  top3: Array<{ title: string; artist: string; votes: number }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vibePct, top3 }: RecapRequest = await req.json();

    console.log('Generating recap for:', { vibePct, top3 });

    const vibeStats = Object.entries(vibePct)
      .map(([vibe, pct]) => `${vibe}: ${pct}%`)
      .join(', ');

    const topTracks = top3
      .map((track, i) => `${i+1}. "${track.title}" by ${track.artist} (${track.votes} votes)`)
      .join('\n');

    const prompt = `You're an AI party DJ creating a "Momento Wrapped" session recap. 

The crowd's vibe breakdown was: ${vibeStats}

Top tracks:
${topTracks}

Create a fun, personalized recap message (max 50 words) that:
- Celebrates the diversity/dominance of genres
- Highlights the crowd's energy 
- Makes them feel like they were part of something special
- Uses festival/party language

Keep it energetic and memorable!`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 100,
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
      recap: "What a session! The crowd brought incredible energy and made every vote count. This is what music democracy looks like! 🎉"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});