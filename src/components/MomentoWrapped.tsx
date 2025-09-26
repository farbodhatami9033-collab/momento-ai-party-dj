import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrackData {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

interface VibeData {
  vibe: string;
  count: number;
  percentage: number;
}

interface MomentoWrappedProps {
  onBack: () => void;
}

export const MomentoWrapped = ({ onBack }: MomentoWrappedProps) => {
  const [vibeData, setVibeData] = useState<VibeData[]>([]);
  const [topTracks, setTopTracks] = useState<TrackData[]>([]);
  const [recap, setRecap] = useState<string>('');
  const [isLoadingRecap, setIsLoadingRecap] = useState(false);
  const [hasGeneratedRecap, setHasGeneratedRecap] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      // Fetch vibe votes
      const { data: vibeVotes, error: vibeError } = await supabase
        .from('votes_vibe')
        .select('vibe');

      if (vibeError) throw vibeError;

      // Fetch track votes  
      const { data: trackVotes, error: trackError } = await supabase
        .from('votes_track')
        .select('song_id');

      if (trackError) throw trackError;

      // Process vibe data
      const vibeCounts = vibeVotes.reduce((acc, vote) => {
        acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalVibeVotes = vibeVotes.length;
      const processedVibeData = Object.entries(vibeCounts).map(([vibe, count]) => ({
        vibe,
        count,
        percentage: Math.round((count / totalVibeVotes) * 100)
      })).sort((a, b) => b.count - a.count);

      setVibeData(processedVibeData);

      // Process track data
      const trackCounts = trackVotes.reduce((acc, vote) => {
        acc[vote.song_id] = (acc[vote.song_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Fetch track details from tracks.json
      const tracksResponse = await fetch('/tracks.json');
      const { tracks: allTracks } = await tracksResponse.json();
      
      const trackDetails = Object.entries(trackCounts)
        .map(([songId, votes]) => {
          const track = allTracks.find((t: any) => t.id === songId);
          return track ? {
            id: songId,
            title: track.title,
            artist: track.artist,
            votes: votes as number
          } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (b?.votes || 0) - (a?.votes || 0))
        .slice(0, 3) as TrackData[];

      setTopTracks(trackDetails);

    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: "Failed to load session data",
        description: "Try refreshing to see your Momento Wrapped",
        variant: "destructive"
      });
    }
  };

  const generateRecap = async () => {
    if (vibeData.length === 0 || topTracks.length === 0) {
      toast({
        title: "Not enough data",
        description: "Complete more rounds to generate a recap",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingRecap(true);
    
    try {
      const vibePct = vibeData.map(({ vibe, percentage }) => ({ v: vibe, pct: percentage }));
      const top3 = topTracks.map(({ title, artist }) => ({ title, artist }));

      const response = await fetch(`https://dxazqtgnqtsbmfknltmn.supabase.co/functions/v1/recap`, {
        method: 'POST',  
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vibePct, top3 })
      });

      if (!response.ok) {
        throw new Error('Failed to generate recap');
      }

      const { recap: generatedRecap } = await response.json();
      setRecap(generatedRecap);
      setHasGeneratedRecap(true);

      toast({
        title: "Recap generated!",
        description: "Your Momento Wrapped is ready!",
      });

    } catch (error) {
      console.error('Error generating recap:', error);
      setRecap("What a session! The crowd brought incredible energy and made every vote count. This is what music democracy looks like!");
      setHasGeneratedRecap(true);
      
      toast({
        title: "Using fallback recap",
        description: "AI generation failed, but here's your wrap-up!",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecap(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-festival bg-clip-text text-transparent">
          Momento Wrapped
        </h2>
        <p className="text-muted-foreground">Your session's vibe breakdown</p>
      </div>

      {/* Crowd Mix */}
      <Card className="p-6 bg-gradient-rave border-secondary shadow-neon">
        <h3 className="text-xl font-bold mb-4 text-center text-primary">Crowd Mix</h3>
        <div className="space-y-3">
          {vibeData.map(({ vibe, percentage }) => (
            <div key={vibe} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{vibe}</span>
                <span className="text-muted-foreground">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Top Tracks */}
      <Card className="p-6 bg-gradient-glow border-accent">
        <h3 className="text-xl font-bold mb-4 text-center text-accent">Top 3 Tracks</h3>
        <div className="space-y-3">
          {topTracks.map(({ title, artist, votes }, index) => (
            <div key={title} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{artist}</p>
              </div>
              <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
                {votes} votes
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Recap */}
      {recap && (
        <Card className="p-6 bg-gradient-festival border-primary">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-3 text-black">AI Recap</h3>
            <p className="text-xl font-medium text-black italic">"{recap}"</p>
          </div>
        </Card>
      )}

      {/* Generate Recap Button */}
      {!hasGeneratedRecap && (
        <Button
          onClick={generateRecap}
          disabled={isLoadingRecap || vibeData.length === 0}
          className="w-full bg-gradient-festival text-black font-bold py-4 text-lg"
          size="lg"
        >
          {isLoadingRecap ? "Generating Recap..." : "🎉 Generate Recap"}
        </Button>
      )}

      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="outline"
        className="w-full"
      >
        Back to Session
      </Button>
    </div>
  );
};