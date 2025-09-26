-- Update RLS policies to allow public voting while preventing abuse

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Authenticated users can insert one vibe vote per session" ON public.votes_vibe;
DROP POLICY IF EXISTS "Authenticated users can insert one track vote per session" ON public.votes_track;

-- Create new public INSERT policies with basic constraints
CREATE POLICY "Anyone can insert vibe votes with valid data" 
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

CREATE POLICY "Anyone can insert track votes with valid data" 
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

-- Add unique constraints to prevent duplicate votes per user per session
-- We'll use a combination of username and a session identifier
ALTER TABLE public.votes_vibe ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.votes_track ADD COLUMN IF NOT EXISTS session_id text;

-- Create unique indexes to prevent duplicate votes within a session
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_vibe_unique_per_session 
ON public.votes_vibe (username, session_id) 
WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_track_unique_per_session 
ON public.votes_track (username, session_id) 
WHERE session_id IS NOT NULL;