import { useState, useEffect } from 'react';
import { TrackCard } from './TrackCard';
import { ProgressBar } from './ProgressBar';
import { useVotingTimer } from '@/hooks/useVotingTimer';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { User } from '@supabase/supabase-js';

type LocalUser = { name: string; id: string };

interface Track {
  id: string;
  vibe: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  youtubeUrl: string;
}

interface TrackVotingProps {
  username: string;
  vibe: string;
  onComplete: (winningTrack: Track, percentage: number) => void;
  demoMode: boolean;
  user: User | LocalUser | null;
}

const VOTING_TIME = 20;

export const TrackVoting = ({ username, vibe, onComplete, demoMode, user }: TrackVotingProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { trackVotes } = useRealtimeVotes();

  const timer = useVotingTimer(VOTING_TIME, () => {
    handleTimerComplete();
  });

  // Load tracks for the winning vibe
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await fetch('/tracks.json');
        const data = await response.json();
        const vibeTracks = data.tracks.filter((track: Track) => track.vibe === vibe);
        setTracks(vibeTracks);
      } catch (error) {
        console.error('Error loading tracks:', error);
        toast({
          title: "Error loading tracks",
          description: "Please refresh the page",
          variant: "destructive"
        });
      }
    };

    loadTracks();
  }, [vibe]);

  // Auto-start when tracks are loaded
  useEffect(() => {
    if (tracks.length > 0 && !isStarted) {
      setIsStarted(true);
      timer.start();
    }
  }, [tracks, isStarted]);

  // Demo mode simulation
  useEffect(() => {
    if (demoMode && isStarted && timer.isActive && tracks.length > 0) {
      const interval = setInterval(() => {
        // Simulate 3-5 random votes per second
        const numVotes = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numVotes; i++) {
          const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
          const randomUsername = `demo_user_${Math.floor(Math.random() * 1000)}`;
          simulateVote(randomTrack.id, randomUsername);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [demoMode, isStarted, timer.isActive, tracks]);

  const simulateVote = async (songId: string, demoUsername: string) => {
    try {
      await supabase.from('votes_track').insert({
        username: demoUsername,
        song_id: songId
      });
    } catch (error) {
      console.error('Demo vote error:', error);
    }
  };

  const calculateStats = () => {
    const totalVotes = trackVotes.reduce((sum, vote) => sum + vote.count, 0) || 1;
    return tracks.map(track => {
      const voteData = trackVotes.find(v => v.song_id === track.id);
      const count = voteData?.count || 0;
      const percentage = Math.round((count / totalVotes) * 100);
      return { track, count, percentage };
    });
  };

  const handleVote = async (trackId: string) => {
    if (hasVoted || !isStarted) return;

    // Check authentication unless in demo mode
    if (!demoMode && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive"
      });
      return;
    }

    try {
      const voteData = demoMode 
        ? { username, song_id: trackId }
        : { username, song_id: trackId, user_id: user?.id };

      const { error } = await supabase.from('votes_track').insert(voteData);

      if (error) {
        if (error.message.includes('duplicate key')) {
          toast({
            title: "Already voted",
            description: "You can only vote once per session",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      setSelectedTrack(trackId);
      setHasVoted(true);
      
      const track = tracks.find(t => t.id === trackId);
      toast({
        title: "Vote recorded!",
        description: `You voted for "${track?.title}"`,
      });
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Vote failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleTimerComplete = () => {
    const stats = calculateStats();
    const winner = stats.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    
    onComplete(winner.track, winner.percentage);
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading {vibe} tracks...</p>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-2">
          Current Vibe: {vibe}
        </div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Track</h2>
        <p className="text-muted-foreground">Which {vibe} track should play next?</p>
      </div>

      <ProgressBar timeLeft={timer.timeLeft} totalTime={VOTING_TIME} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map(({ track, count, percentage }) => (
          <TrackCard
            key={track.id}
            track={track}
            votes={count}
            percentage={percentage}
            isSelected={selectedTrack === track.id}
            onClick={() => handleVote(track.id)}
          />
        ))}
      </div>

      {hasVoted && (
        <div className="text-center text-secondary font-medium animate-pulse">
          Vote recorded! Waiting for results...
        </div>
      )}
    </div>
  );
};