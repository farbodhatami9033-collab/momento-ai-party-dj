import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HypeRequest {
  song: string;
  artist: string;
  percent: number;
  vibe: string;
  bpm: number;
  key: string;
  prevTrack?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { song, artist, percent, vibe, bpm, key, prevTrack }: HypeRequest = await req.json();

    console.log('Generating hype for:', { song, artist, percent, vibe });

    const prompt = `You're an AI party DJ host. The crowd just voted and "${song}" by ${artist} won with ${percent}% of votes in the ${vibe} category. 

Generate 2 things:
1. HYPE: A short, energetic announcement (max 30 words) to pump up the crowd
2. TIP: A quick DJ transition tip (max 25 words) mentioning BPM ${bpm}, key ${key}${prevTrack ? `, coming from "${prevTrack}"` : ''}

Keep it fun, energetic, and festival-appropriate. Use music slang and DJ terminology.

Format:
HYPE: [your hype line]
TIP: [your transition tip]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150,
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
    const content = data.content[0].text;
    
    // Parse the response
    const hypeMatch = content.match(/HYPE:\s*(.+)/i);
    const tipMatch = content.match(/TIP:\s*(.+)/i);
    
    const hype = hypeMatch ? hypeMatch[1].trim() : `"${song}" takes the crown with ${percent}% of the vote! Let's GO!`;
    const tip = tipMatch ? tipMatch[1].trim() : `Smooth transition at ${bpm} BPM in ${key} - keep the energy flowing!`;

    console.log('Generated hype:', hype);
    console.log('Generated tip:', tip);

    return new Response(JSON.stringify({ hype, tip }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in hype function:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      hype: "The crowd has spoken! Let's keep this party going!",
      tip: "Match the energy and keep the beats flowing!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});