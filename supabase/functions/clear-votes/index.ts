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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Delete all vibe votes
    const { error: vibeErr } = await adminClient
      .from('votes_vibe')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (vibeErr) throw vibeErr;

    // Delete all track votes
    const { error: trackErr } = await adminClient
      .from('votes_track')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (trackErr) throw trackErr;

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error clearing votes:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
