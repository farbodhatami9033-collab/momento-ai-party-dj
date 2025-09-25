import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VibeVote {
  vibe: string;
  count: number;
}

interface TrackVote {
  song_id: string;
  count: number;
}

export const useRealtimeVotes = () => {
  const [vibeVotes, setVibeVotes] = useState<VibeVote[]>([]);
  const [trackVotes, setTrackVotes] = useState<TrackVote[]>([]);

  // Fetch initial vibe votes
  const fetchVibeVotes = async () => {
    const { data, error } = await supabase
      .from('votes_vibe')
      .select('vibe')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vibe votes:', error);
      return;
    }

    // Count votes by vibe
    const voteCounts = data.reduce((acc: Record<string, number>, vote) => {
      acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
      return acc;
    }, {});

    const voteArray = Object.entries(voteCounts).map(([vibe, count]) => ({
      vibe,
      count: count as number
    }));

    setVibeVotes(voteArray);
  };

  // Fetch initial track votes
  const fetchTrackVotes = async () => {
    const { data, error } = await supabase
      .from('votes_track')
      .select('song_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching track votes:', error);
      return;
    }

    // Count votes by song_id
    const voteCounts = data.reduce((acc: Record<string, number>, vote) => {
      acc[vote.song_id] = (acc[vote.song_id] || 0) + 1;
      return acc;
    }, {});

    const voteArray = Object.entries(voteCounts).map(([song_id, count]) => ({
      song_id,
      count: count as number
    }));

    setTrackVotes(voteArray);
  };

  useEffect(() => {
    // Fetch initial data
    fetchVibeVotes();
    fetchTrackVotes();

    // Set up realtime subscription for vibe votes
    const vibeChannel = supabase
      .channel('vibe-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes_vibe'
        },
        () => {
          fetchVibeVotes();
        }
      )
      .subscribe();

    // Set up realtime subscription for track votes
    const trackChannel = supabase
      .channel('track-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes_track'
        },
        () => {
          fetchTrackVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vibeChannel);
      supabase.removeChannel(trackChannel);
    };
  }, []);

  return {
    vibeVotes,
    trackVotes,
    refreshVibeVotes: fetchVibeVotes,
    refreshTrackVotes: fetchTrackVotes
  };
};