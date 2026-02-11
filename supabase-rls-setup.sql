-- Aktiver Row Level Security på schedule-tabellen
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- Opprett en policy som tillater alle operasjoner for alle brukere
-- Dette er trygt siden autentiseringen allerede håndteres av Next.js middleware
CREATE POLICY "Allow all operations for authenticated and anonymous users"
ON public.schedule
FOR ALL
USING (true)
WITH CHECK (true);

