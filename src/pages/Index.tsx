import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { UsernameInput } from '@/components/UsernameInput';
import { VibeVoting } from '@/components/VibeVoting';
import { TrackVoting } from '@/components/TrackVoting';
import { ResultScreen } from '@/components/ResultScreen';
import { SessionRecap } from '@/components/SessionRecap';
import { MomentoWrapped } from '@/components/MomentoWrapped';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type GamePhase = 'username' | 'vibe-vote' | 'track-vote' | 'result' | 'wrapped' | 'recap';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<GamePhase>('username');
  const [username, setUsername] = useState('');
  const [currentVibe, setCurrentVibe] = useState('');
  const [winningTrack, setWinningTrack] = useState<Track | null>(null);
  const [winningPercentage, setWinningPercentage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user && !demoMode) {
        // Redirect to auth if not authenticated and not in demo mode
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user && !demoMode) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, demoMode]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

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

  const handleNewRound = async () => {
    // Clear all votes before starting new round
    try {
      const { error } = await supabase.functions.invoke('clear-votes', { body: {} });
      if (error) {
        console.error('Error clearing votes:', error);
      }
    } catch (error) {
      console.error('Error clearing votes:', error);
    }
    
    setPhase('vibe-vote');
  };

  const handleShowWrapped = () => {
    setPhase('wrapped');
  };

  const handleBackFromWrapped = () => {
    setPhase('result');
  };

  const handleEndSession = () => {
    setPhase('recap');
  };

  const handleNewSession = async () => {
    // Clear all votes before starting new session
    try {
      const { error } = await supabase.functions.invoke('clear-votes', { body: {} });
      if (error) {
        console.error('Error clearing votes:', error);
      }
    } catch (error) {
      console.error('Error clearing votes:', error);
    }
    
    setPhase('username');
    setUsername('');
    setCurrentVibe('');
    setWinningTrack(null);
    setWinningPercentage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Toaster />
      
      {/* Header with Auth Status and Demo Mode Toggle */}
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

          {/* Auth Status */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Authenticated</span>
                <Button 
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs hover:bg-green-500/10"
                >
                  Sign Out
                </Button>
              </div>
            ) : demoMode ? (
              <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                Demo Mode (No Auth)
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Sign In
              </Button>
            )}
          </div>
          
          {currentVibe && (
            <div className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/30">
              Current Vibe: {currentVibe}
            </div>
          )}

          {(phase === 'result' || phase === 'wrapped') && (
            <Button
              onClick={handleShowWrapped}
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-4 py-2 text-sm"
            >
              🎉 Wrapped
            </Button>
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
                user={user}
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
                user={user}
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
                onShowWrapped={handleShowWrapped}
              />
            </div>
          )}

          {phase === 'wrapped' && (
            <div className="mt-16">
              <MomentoWrapped onBack={handleBackFromWrapped} />
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
