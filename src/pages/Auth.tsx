import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';
import QRCode from 'qrcode';

const nameSchema = z.string()
  .trim()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(50, { message: "Name must be less than 50 characters" });

const Auth = () => {
  // Force rebuild to clear cache
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        navigate('/');
      } else {
        setUser(null);
      }
    });

    // Generate QR code for current page
    const currentUrl = window.location.origin + '/auth';
    QRCode.toDataURL(currentUrl, { 
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      }
    })
    .then(url => setQrCodeUrl(url))
    .catch(err => console.error('Error generating QR code:', err));

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleJoin = async () => {
    try {
      const validatedName = nameSchema.parse(name);
      setLoading(true);

      // Create anonymous user with display name
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: validatedName
          }
        }
      });

      if (error) {
        toast({
          title: "Join failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome to Momento!",
          description: `Hey ${validatedName}, you're ready to vote!`,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Join failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-festival bg-clip-text text-transparent">
            Join Momento
          </h1>
          <p className="text-muted-foreground mt-2">
            Scan the QR code, enter your name, and start voting!
          </p>
        </div>

        {/* QR Code for Mobile Access */}
        <Card className="p-6 bg-gradient-glow border-primary/20">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-primary">Mobile Access</h3>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your phone to easily access the voting page
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code for mobile access" 
                  className="rounded-lg border border-border"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Or visit: {window.location.origin}
            </p>
          </div>
        </Card>

        {/* Simple Name Input */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border/50">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">What's your name?</h3>
              <p className="text-sm text-muted-foreground">
                Just your first name or nickname is fine!
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="text-center"
                required
              />
            </div>
            <Button 
              onClick={handleJoin}
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-festival text-black font-semibold hover:opacity-90"
            >
              {loading ? "Joining..." : "Join the Vote!"}
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Anonymous authentication prevents fake votes</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;