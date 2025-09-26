import { useState, useEffect } from 'react';
import { VoteButton } from './VoteButton';
import { ProgressBar } from './ProgressBar';
import { useVotingTimer } from '@/hooks/useVotingTimer';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';

import { User } from '@supabase/supabase-js';

interface VibeVotingProps {
  username: string;
  onComplete: (winningVibe: string) => void;
  demoMode: boolean;
  user: User | null;
}

const VIBES = ['Techno', 'Hip-Hop', 'House', 'Pop'];
const VOTING_TIME = 15;

export const VibeVoting = ({ username, onComplete, demoMode, user }: VibeVotingProps) => {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { vibeVotes } = useRealtimeVotes();

  const timer = useVotingTimer(VOTING_TIME, () => {
    handleTimerComplete();
  });

  // Demo mode simulation
  useEffect(() => {
    if (demoMode && isStarted && timer.isActive) {
      const interval = setInterval(() => {
        // Simulate 3-5 random votes per second
        const numVotes = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numVotes; i++) {
          const randomVibe = VIBES[Math.floor(Math.random() * VIBES.length)];
          const randomUsername = `demo_user_${Math.floor(Math.random() * 1000)}`;
          simulateVote(randomVibe, randomUsername);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [demoMode, isStarted, timer.isActive]);

  const simulateVote = async (vibe: string, demoUsername: string) => {
    try {
      await supabase.from('votes_vibe').insert({
        username: demoUsername,
        vibe: vibe
      });
    } catch (error) {
      console.error('Demo vote error:', error);
    }
  };

  const calculateStats = () => {
    const totalVotes = vibeVotes.reduce((sum, vote) => sum + vote.count, 0) || 1;
    return VIBES.map(vibe => {
      const voteData = vibeVotes.find(v => v.vibe === vibe);
      const count = voteData?.count || 0;
      const percentage = Math.round((count / totalVotes) * 100);
      return { vibe, count, percentage };
    });
  };

  const handleVote = async (vibe: string) => {
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
        ? { username, vibe }
        : { username, vibe, user_id: user?.id };

      const { error } = await supabase.from('votes_vibe').insert(voteData);

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

      setSelectedVibe(vibe);
      setHasVoted(true);
      toast({
        title: "Vote recorded!",
        description: `You voted for ${vibe}`,
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
    const winningVibe = stats.reduce((max, current) => 
      current.count > max.count ? current : max
    ).vibe;
    
    // Update session state
    supabase.from('session_state').update({ 
      current_vibe: winningVibe 
    }).eq('id', 1);

    onComplete(winningVibe);
  };

  const startVoting = () => {
    setIsStarted(true);
    timer.start();
  };

  if (!isStarted) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-festival bg-clip-text text-transparent">
          Ready to Choose the Vibe?
        </h2>
        <p className="text-muted-foreground mb-8">
          The crowd will vote for the genre that defines this moment
        </p>
        <Button 
          onClick={startVoting}
          className="bg-gradient-festival text-black font-bold px-8 py-4 text-lg animate-pulse-glow"
          size="lg"
        >
          Start Vibe Vote
        </Button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Vibe</h2>
        <p className="text-muted-foreground">What genre should dominate this moment?</p>
      </div>

      <ProgressBar timeLeft={timer.timeLeft} totalTime={VOTING_TIME} />

      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ vibe, count, percentage }) => (
          <VoteButton
            key={vibe}
            label={vibe}
            count={count}
            percentage={percentage}
            isSelected={selectedVibe === vibe}
            onClick={() => handleVote(vibe)}
            className={hasVoted && selectedVibe !== vibe ? "opacity-50" : ""}
          />
        ))}
      </div>

      {hasVoted && (
        <div className="text-center text-primary font-medium animate-pulse">
          Vote recorded! Waiting for results...
        </div>
      )}
    </div>
  );
};