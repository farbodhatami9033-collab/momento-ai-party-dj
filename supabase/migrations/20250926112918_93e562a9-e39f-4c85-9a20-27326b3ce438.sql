-- First, check current policies and drop them properly
DO $$
BEGIN
  -- Drop existing policies for votes_vibe
  DROP POLICY IF EXISTS "Authenticated users can insert one vibe vote per session" ON public.votes_vibe;
  DROP POLICY IF EXISTS "Anyone can insert vibe votes with valid data" ON public.votes_vibe;
  
  -- Drop existing policies for votes_track  
  DROP POLICY IF EXISTS "Authenticated users can insert one track vote per session" ON public.votes_track;
  DROP POLICY IF EXISTS "Anyone can insert track votes with valid data" ON public.votes_track;
END $$;

-- Create new public INSERT policies that allow anyone to vote
CREATE POLICY "Public can insert vibe votes" 
ON public.votes_vibe 
FOR INSERT 
WITH CHECK (
  username IS NOT NULL 
  AND trim(username) != '' 
  AND length(trim(username)) >= 2 
  AND length(trim(username)) <= 50
  AND vibe IS NOT NULL 
  AND vibe IN ('Techno', 'Hip-Hop', 'House', 'Pop')
);

CREATE POLICY "Public can insert track votes" 
ON public.votes_track 
FOR INSERT 
WITH CHECK (
  username IS NOT NULL 
  AND trim(username) != '' 
  AND length(trim(username)) >= 2 
  AND length(trim(username)) <= 50
  AND song_id IS NOT NULL 
  AND trim(song_id) != ''
);