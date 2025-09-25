import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SessionRecapProps {
  onNewSession: () => void;
}

interface TrackData {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

export const SessionRecap = ({ onNewSession }: SessionRecapProps) => {
  const [vibePct, setVibePct] = useState<Record<string, number>>({});
  const [top3Tracks, setTop3Tracks] = useState<TrackData[]>([]);
  const [recap, setRecap] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateRecap();
  }, []);

  const generateRecap = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all votes and compute stats
      const [vibeVotes, trackVotes] = await Promise.all([
        supabase.from('votes_vibe').select('vibe'),
        supabase.from('votes_track').select('song_id')
      ]);

      if (vibeVotes.error || trackVotes.error) {
        throw new Error('Failed to fetch vote data');
      }

      // Calculate vibe percentages
      const totalVibeVotes = vibeVotes.data.length || 1;
      const vibeCount = vibeVotes.data.reduce((acc: Record<string, number>, vote) => {
        acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
        return acc;
      }, {});

      const vibePercentages = Object.entries(vibeCount).reduce((acc: Record<string, number>, [vibe, count]) => {
        acc[vibe] = Math.round(((count as number) / totalVibeVotes) * 100);
        return acc;
      }, {});

      setVibePct(vibePercentages);

      // Calculate top 3 tracks
      const trackCount = trackVotes.data.reduce((acc: Record<string, number>, vote) => {
        acc[vote.song_id] = (acc[vote.song_id] || 0) + 1;
        return acc;
      }, {});

      // Load track data
      const tracksResponse = await fetch('/tracks.json');
      const tracksData = await tracksResponse.json();
      
      const topTracks = Object.entries(trackCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([songId, votes]) => {
          const track = tracksData.tracks.find((t: any) => t.id === songId);
          return {
            id: songId,
            title: track?.title || 'Unknown Track',
            artist: track?.artist || 'Unknown Artist',
            votes: votes as number
          };
        });

      setTop3Tracks(topTracks);

      // Generate AI recap
      const recapResponse = await fetch(`https://dxazqtgnqtsbmfknltmn.supabase.co/functions/v1/recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vibePct: vibePercentages,
          top3: topTracks
        })
      });

      if (!recapResponse.ok) {
        throw new Error('Failed to generate recap');
      }

      const { recap: generatedRecap } = await recapResponse.json();
      setRecap(generatedRecap);

    } catch (error) {
      console.error('Error generating recap:', error);
      toast({
        title: "Recap generation failed",
        description: "But what a session it was!",
        variant: "destructive"
      });
      
      setRecap("What an incredible session! The crowd brought amazing energy and every vote made this moment special. Thank you for being part of the music democracy! 🎉");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Generating your Momento Wrapped...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-festival bg-clip-text text-transparent">
          Momento Wrapped
        </h2>
        <p className="text-muted-foreground">Your session in review</p>
      </div>

      <Card className="p-6 bg-gradient-rave border-secondary shadow-neon">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-4">AI Recap</h3>
          <p className="text-lg leading-relaxed animate-pulse">{recap}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crowd Mix */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <h3 className="text-lg font-bold mb-4 text-accent">Crowd Mix</h3>
          <div className="space-y-3">
            {Object.entries(vibePct).map(([vibe, percentage]) => (
              <div key={vibe} className="flex justify-between items-center">
                <span className="font-medium">{vibe}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-festival transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-primary">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 3 Tracks */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <h3 className="text-lg font-bold mb-4 text-secondary">Top 3 Tracks</h3>
          <div className="space-y-3">
            {top3Tracks.map((track, index) => (
              <div key={track.id} className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${index === 0 ? 'bg-neon-yellow text-black' : 
                    index === 1 ? 'bg-primary text-primary-foreground' : 
                    'bg-accent text-accent-foreground'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{track.title}</p>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <span className="text-sm font-mono text-primary">{track.votes}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Button
          onClick={onNewSession}
          className="bg-gradient-festival text-black font-bold px-8 py-4 text-lg animate-pulse-glow"
          size="lg"
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
};