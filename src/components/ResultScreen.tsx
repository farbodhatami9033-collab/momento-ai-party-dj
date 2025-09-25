import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '@/hooks/use-toast';

interface Track {
  id: string;
  vibe: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  spotifyUrl: string;
}

interface ResultScreenProps {
  winningTrack: Track;
  percentage: number;
  vibe: string;
  onNewRound: () => void;
  onEndSession: () => void;
}

export const ResultScreen = ({ 
  winningTrack, 
  percentage, 
  vibe, 
  onNewRound, 
  onEndSession 
}: ResultScreenProps) => {
  const [hype, setHype] = useState<string>('');
  const [tip, setTip] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleAnnounce = async () => {
    setIsGenerating(true);
    
    try {
      // Generate hype and tip
      const hypeResponse = await fetch(`https://dxazqtgnqtsbmfknltmn.supabase.co/functions/v1/hype`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song: winningTrack.title,
          artist: winningTrack.artist,
          percent: percentage,
          vibe: vibe,
          bpm: winningTrack.bpm,
          key: winningTrack.key
        })
      });

      if (!hypeResponse.ok) {
        throw new Error('Failed to generate hype');
      }

      const { hype: generatedHype, tip: generatedTip } = await hypeResponse.json();
      setHype(generatedHype);
      setTip(generatedTip);

      // Generate TTS audio
      const ttsResponse = await fetch(`https://dxazqtgnqtsbmfknltmn.supabase.co/functions/v1/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: generatedHype
        })
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      // Play the audio
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Audio playback failed",
          description: "Check your browser's audio settings",
          variant: "destructive"
        });
      });

      toast({
        title: "Hype generated!",
        description: "The crowd goes wild!",
      });

    } catch (error) {
      console.error('Error generating announcement:', error);
      toast({
        title: "Announcement failed",
        description: "But the crowd still loves the winner!",
        variant: "destructive"
      });
      
      // Fallback hype
      setHype(`"${winningTrack.title}" takes the crown with ${percentage}% of the vote! Let's GO!`);
      setTip(`Smooth transition at ${winningTrack.bpm} BPM in ${winningTrack.key}!`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlaySong = () => {
    window.open(winningTrack.spotifyUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-festival bg-clip-text text-transparent">
          We Have a Winner!
        </h2>
      </div>

      <Card className="p-6 bg-gradient-rave border-secondary shadow-neon">
        <div className="text-center">
          <div className="mb-4">
            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
              {vibe} Winner
            </span>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{winningTrack.title}</h3>
          <p className="text-lg text-muted-foreground mb-4">{winningTrack.artist}</p>
          
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded">
              {winningTrack.bpm} BPM
            </span>
            <span className="px-3 py-1 bg-accent/20 text-accent rounded">
              {winningTrack.key}
            </span>
          </div>
          
          <div className="text-3xl font-bold text-secondary mb-4">
            {percentage}% of votes
          </div>
        </div>
      </Card>

      {hype && (
        <Card className="p-6 bg-gradient-glow border-primary">
          <div className="text-center">
            <h4 className="text-lg font-bold mb-2 text-primary">AI Hype:</h4>
            <p className="text-xl font-medium mb-4 animate-pulse">{hype}</p>
            
            {tip && (
              <div>
                <h4 className="text-sm font-bold mb-1 text-accent">DJ Tip:</h4>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={handleAnnounce}
          disabled={isGenerating}
          className="bg-gradient-festival text-black font-bold py-4 text-lg animate-pulse-glow"
          size="lg"
        >
          {isGenerating ? "Generating Hype..." : "🎤 Announce"}
        </Button>
        
        <Button
          onClick={handlePlaySong}
          variant="outline"
          className="border-accent text-accent hover:bg-accent hover:text-accent-foreground py-4 text-lg"
          size="lg"
        >
          🎵 Play Song
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={onNewRound}
          variant="secondary"
          className="flex-1"
        >
          New Round
        </Button>
        
        <Button
          onClick={onEndSession}
          variant="outline"
          className="flex-1"
        >
          End Session
        </Button>
      </div>
    </div>
  );
};