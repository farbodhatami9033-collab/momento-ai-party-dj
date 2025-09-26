-- Create profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update votes tables to require authentication
ALTER TABLE public.votes_vibe ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.votes_track ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for votes to require authentication
DROP POLICY IF EXISTS "Anyone can insert vibe votes" ON public.votes_vibe;
DROP POLICY IF EXISTS "Anyone can insert track votes" ON public.votes_track;

CREATE POLICY "Authenticated users can insert one vibe vote per session" 
ON public.votes_vibe 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert one track vote per session" 
ON public.votes_track 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Add unique constraints to prevent multiple votes from same user
CREATE UNIQUE INDEX idx_votes_vibe_user_session ON public.votes_vibe (user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_votes_track_user_session ON public.votes_track (user_id) 
WHERE user_id IS NOT NULL;