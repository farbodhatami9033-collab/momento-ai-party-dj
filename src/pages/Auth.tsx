import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';
import QRCode from 'qrcode';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100, { message: "Password must be less than 100 characters" }),
  displayName: z.string().trim().min(2, { message: "Display name must be at least 2 characters" }).max(50, { message: "Display name must be less than 50 characters" }).optional()
});

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const signIn = async () => {
    try {
      const validated = authSchema.omit({ displayName: true }).parse({
        email: formData.email,
        password: formData.password
      });

      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
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
          title: "Login failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      const validated = authSchema.parse({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined
      });

      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: validated.displayName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
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
          title: "Signup failed",
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
            Authenticate to cast your vote and prevent fake votes
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

        <Card className="p-6 bg-card/80 backdrop-blur-sm border border-border/50">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button 
                onClick={signIn}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Display Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                />
              </div>
              <Button 
                onClick={signUp}
                disabled={loading}
                className="w-full bg-gradient-festival text-black font-semibold hover:opacity-90"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure authentication prevents fake votes</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;