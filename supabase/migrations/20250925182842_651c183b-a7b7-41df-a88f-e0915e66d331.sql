-- Create votes_vibe table
CREATE TABLE public.votes_vibe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  vibe TEXT NOT NULL CHECK (vibe IN ('Techno', 'Hip-Hop', 'House', 'Pop')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes_track table  
CREATE TABLE public.votes_track (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  song_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_state table
CREATE TABLE public.session_state (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY,
  current_vibe TEXT,
  now_playing TEXT,
  prev_bpm INTEGER,
  prev_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial session state
INSERT INTO public.session_state (id, current_vibe, now_playing, prev_bpm, prev_key) 
VALUES (1, NULL, NULL, NULL, NULL);

-- Enable Row Level Security
ALTER TABLE public.votes_vibe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes_track ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_state ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view vibe votes" 
ON public.votes_vibe 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert vibe votes" 
ON public.votes_vibe 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view track votes" 
ON public.votes_track 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert track votes" 
ON public.votes_track 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view session state" 
ON public.session_state 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update session state" 
ON public.session_state 
FOR UPDATE 
USING (true);

-- Enable realtime for votes tables
ALTER TABLE public.votes_vibe REPLICA IDENTITY FULL;
ALTER TABLE public.votes_track REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes_vibe;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes_track;