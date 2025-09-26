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
  prevTrack?: {
    song: string;
    bpm: number;
    key: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { song, artist, percent, vibe, bpm, key, prevTrack }: HypeRequest = await req.json();

    console.log('Generating hype for:', { song, artist, percent, vibe });

    const prevTrackText = prevTrack ? `previous: "${prevTrack.song}" (${prevTrack.bpm} BPM, ${prevTrack.key})` : 'first track of session';
    
    const prompt = `You're an expert club host & DJ. The crowd voted and "${song}" by ${artist} won with ${percent}% in ${vibe}. ${prevTrackText}.

Generate exactly 3 things:
1. HYPE: One concise hype line (≤16 words)
2. TIP: One DJ transition tip (≤18 words) referencing BPM/key continuity if previous track exists
3. HOST: One fun host commentary (≤18 words) about vote % and vibe continuity

Format exactly:
HYPE: [line]
TIP: [line] 
HOST: [line]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 80,
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
    const content = data.content[0].text;
    
    // Parse the response
    const hypeMatch = content.match(/HYPE:\s*(.+)/i);
    const tipMatch = content.match(/TIP:\s*(.+)/i);
    const hostMatch = content.match(/HOST:\s*(.+)/i);
    
    const hype = hypeMatch ? hypeMatch[1].trim() : `"${song}" takes the crown with ${percent}% of the vote! Let's GO!`;
    const tip = tipMatch ? tipMatch[1].trim() : `Smooth transition at ${bpm} BPM in ${key} - keep the energy flowing!`;
    const host = hostMatch ? hostMatch[1].trim() : `${vibe} dominates with ${percent}% - the crowd has spoken!`;

    console.log('Generated response:', { hype, tip, host });

    return new Response(JSON.stringify({ hype, tip, host }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in hype function:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      hype: "Make some noise for the winner!",
      tip: "Match the energy and keep the beats flowing!",
      host: "The crowd has chosen - let's keep this party rolling!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});