-- Secure the session_state table by removing public update access
-- Drop the insecure policy that allows anyone to update session state
DROP POLICY IF EXISTS "Anyone can update session state" ON public.session_state;

-- Create a secure policy that only allows service role (edge functions) to update
CREATE POLICY "Only service role can update session state" 
ON public.session_state 
FOR UPDATE 
USING (false); -- No one can update through direct client calls

-- Keep public read access for displaying current session info
-- The existing "Anyone can view session state" policy remains for SELECT operations