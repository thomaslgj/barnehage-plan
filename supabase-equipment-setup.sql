-- Opprett household_equipment_status tabell
CREATE TABLE IF NOT EXISTS public.household_equipment_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id TEXT NOT NULL DEFAULT 'default',
  item_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'missing')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE(household_id, item_key)
);

-- Aktiver Row Level Security
ALTER TABLE public.household_equipment_status ENABLE ROW LEVEL SECURITY;

-- Opprett policy som tillater alle operasjoner
CREATE POLICY "Allow all operations for authenticated and anonymous users"
ON public.household_equipment_status
FOR ALL
USING (true)
WITH CHECK (true);

-- Opprett index for raskere queries
CREATE INDEX IF NOT EXISTS idx_household_equipment_status_household_id 
ON public.household_equipment_status(household_id);

