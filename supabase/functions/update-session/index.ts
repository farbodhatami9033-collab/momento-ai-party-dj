import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://dxazqtgnqtsbmfknltmn.supabase.co';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const adminClient = createClient(supabaseUrl, serviceKey || '');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Session update request:', body);

    // Validate the update type
    const { type, data } = body;
    
    if (!type || !data) {
      throw new Error('Missing type or data in request');
    }

    let updateData = {};

    switch (type) {
      case 'vibe_complete':
        // Update current vibe when vibe voting completes
        if (!data.current_vibe || typeof data.current_vibe !== 'string') {
          throw new Error('Invalid current_vibe data');
        }
        // Validate vibe is one of the allowed values
        const allowedVibes = ['Techno', 'Hip-Hop', 'House', 'Pop'];
        if (!allowedVibes.includes(data.current_vibe)) {
          throw new Error('Invalid vibe value');
        }
        updateData = { current_vibe: data.current_vibe };
        break;
        
      case 'track_announce':
        // Update now playing track info when announcing results
        if (!data.now_playing || typeof data.now_playing !== 'string') {
          throw new Error('Invalid now_playing data');
        }
        updateData = {
          now_playing: data.now_playing,
          prev_bpm: typeof data.prev_bpm === 'number' ? data.prev_bpm : null,
          prev_key: typeof data.prev_key === 'string' ? data.prev_key : null
        };
        break;
        
      default:
        throw new Error(`Unknown update type: ${type}`);
    }

    // Update session state using service role (bypasses RLS)
    const { error } = await adminClient
      .from('session_state')
      .update(updateData)
      .eq('id', 1);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Session state updated successfully:', updateData);

    return new Response(JSON.stringify({ 
      status: 'success',
      updated: updateData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});