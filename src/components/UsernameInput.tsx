import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import heroImage from '@/assets/momento-hero.jpg';

interface UsernameInputProps {
  onSubmit: (username: string) => void;
}

export const UsernameInput = ({ onSubmit }: UsernameInputProps) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Momento Festival" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      </div>

      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-lg border-border relative z-10 shadow-glow">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-festival bg-clip-text text-transparent animate-neon-flicker">
            Momento
          </h1>
          <p className="text-lg text-muted-foreground font-medium">Let the crowd choose the moment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Enter your name to join the party
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name..."
              className="text-center text-lg bg-input/50 backdrop-blur-sm"
              maxLength={50}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-festival text-black font-bold py-4 text-lg animate-pulse-glow"
            size="lg"
            disabled={!username.trim()}
          >
            Join the Crowd
          </Button>
        </form>
      </Card>
    </div>
  );
};