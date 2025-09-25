import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { UsernameInput } from '@/components/UsernameInput';
import { VibeVoting } from '@/components/VibeVoting';
import { TrackVoting } from '@/components/TrackVoting';
import { ResultScreen } from '@/components/ResultScreen';
import { SessionRecap } from '@/components/SessionRecap';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type GamePhase = 'username' | 'vibe-vote' | 'track-vote' | 'result' | 'recap';

interface Track {
  id: string;
  vibe: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  youtubeUrl: string;
}

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>('username');
  const [username, setUsername] = useState('');
  const [currentVibe, setCurrentVibe] = useState('');
  const [winningTrack, setWinningTrack] = useState<Track | null>(null);
  const [winningPercentage, setWinningPercentage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setPhase('vibe-vote');
  };

  const handleVibeComplete = (vibe: string) => {
    setCurrentVibe(vibe);
    setPhase('track-vote');
  };

  const handleTrackComplete = (track: Track, percentage: number) => {
    setWinningTrack(track);
    setWinningPercentage(percentage);
    setPhase('result');
  };

  const handleNewRound = () => {
    setPhase('vibe-vote');
  };

  const handleEndSession = () => {
    setPhase('recap');
  };

  const handleNewSession = () => {
    setPhase('username');
    setUsername('');
    setCurrentVibe('');
    setWinningTrack(null);
    setWinningPercentage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Toaster />
      
      {/* Header with Demo Mode Toggle */}
      {phase !== 'username' && (
        <div className="fixed top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border">
            <span className="text-sm font-medium">Demo Mode</span>
            <Switch 
              checked={demoMode} 
              onCheckedChange={setDemoMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          {currentVibe && (
            <div className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/30">
              Current Vibe: {currentVibe}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {phase === 'username' && (
            <UsernameInput onSubmit={handleUsernameSubmit} />
          )}

          {phase === 'vibe-vote' && (
            <div className="mt-16">
              <VibeVoting 
                username={username}
                onComplete={handleVibeComplete}
                demoMode={demoMode}
              />
            </div>
          )}

          {phase === 'track-vote' && (
            <div className="mt-16">
              <TrackVoting 
                username={username}
                vibe={currentVibe}
                onComplete={handleTrackComplete}
                demoMode={demoMode}
              />
            </div>
          )}

          {phase === 'result' && winningTrack && (
            <div className="mt-16">
              <ResultScreen 
                winningTrack={winningTrack}
                percentage={winningPercentage}
                vibe={currentVibe}
                onNewRound={handleNewRound}
                onEndSession={handleEndSession}
              />
            </div>
          )}

          {phase === 'recap' && (
            <div className="mt-16">
              <SessionRecap onNewSession={handleNewSession} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-4 right-4 text-center">
        <p className="text-xs text-muted-foreground/60">
          Momento • Let the crowd choose the moment
        </p>
      </div>
    </div>
  );
};

export default Index;
