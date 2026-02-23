# Skaleringsguide for Flyt

Dette dokumentet beskriver hvordan systemet skal skaleres når brukerbase vokser.

## Invite-kode System

### Nåværende Status
- **Ordliste:** 95 norske ord
- **Format:** 2 ord (word1-word2)
- **Kapasitet:** 9,025 unike kombinasjoner
- **Implementasjon:** `generate_invite_code()` i `apps/mobile/supabase/migrations/add_invite_code.sql`

### Overvåkning
Sjekk belegg med denne spørringen:

```sql
SELECT
  COUNT(*) as active_codes,
  9025 as max_capacity,
  ROUND((COUNT(*) * 100.0 / 9025), 1) as percent_used
FROM households
WHERE invite_code IS NOT NULL;
```

### Skaleringsterskler

| Antall Households | Belegg | Status | Anbefaling |
|------------------|--------|--------|------------|
| 0 - 1,000 | 0-11% | ✅ God | Ingen handling nødvendig |
| 1,000 - 3,000 | 11-33% | ✅ OK | Overvåk vekst |
| 3,000 - 5,000 | 33-55% | ⚠️ Moderat | Planlegg utvidelse |
| 5,000 - 7,000 | 55-77% | ⚠️ Høy | Utfør utvidelse snart |
| 7,000+ | 77%+ | ❌ Kritisk | Utvid ASAP |

### Utvidelsesalternativer

#### Alternativ 1: Utvid ordlisten (enklest, 5 min)
**Bruk når:** 3,000-5,000 households

Legg til flere ord i `invite_words` tabellen:

```sql
INSERT INTO invite_words (word) VALUES
  -- Dyr
  ('mus'), ('rotte'), ('fugl'), ('ørn'), ('måke'),
  ('ugle'), ('and'), ('svane'), ('delfin'), ('sel'),
  -- Mat
  ('brød'), ('ost'), ('melk'), ('juice'), ('te'),
  ('kaffe'), ('kake'), ('is'), ('pizza'), ('pasta'),
  -- Natur
  ('stein'), ('sand'), ('gress'), ('mark'), ('eng'),
  ('bekk'), ('innsjø'), ('ås'), ('dal'), ('skog'),
  -- Ting
  ('klokke'), ('kopp'), ('glass'), ('tallerken'), ('skje'),
  ('gaffel'), ('kniv'), ('flaske'), ('kurv'), ('sekk'),
  -- Farger/Adjektiv
  ('lyse'), ('mørk'), ('varm'), ('kald'), ('våt'),
  ('tørr'), ('høy'), ('lav'), ('bred'), ('smal'),
  -- Diverse
  ('lek'), ('sang'), ('dans'), ('hopp'), ('løp'),
  ('latter'), ('smil'), ('klem'), ('kyss'), ('venn')
ON CONFLICT (word) DO NOTHING;
```

**Resultat:** 200 ord → 40,000 kombinasjoner (4.4x økning)

#### Alternativ 2: 3-ords format (best, 30 min)
**Bruk når:** 5,000+ households eller planlegger rask vekst

Oppdater `generate_invite_code()` funksjonen:

```sql
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  word1 TEXT;
  word2 TEXT;
  word3 TEXT;
  code TEXT;
  max_attempts INT := 100;
  attempt INT := 0;
BEGIN
  LOOP
    -- Velg tre tilfeldige ord
    SELECT word INTO word1 FROM invite_words ORDER BY RANDOM() LIMIT 1;
    SELECT word INTO word2 FROM invite_words ORDER BY RANDOM() LIMIT 1;
    SELECT word INTO word3 FROM invite_words ORDER BY RANDOM() LIMIT 1;

    -- Kombiner med bindestreker
    code := word1 || '-' || word2 || '-' || word3;

    -- Sjekk om koden eksisterer
    IF NOT EXISTS (SELECT 1 FROM households WHERE invite_code = code) THEN
      RETURN code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;
```

**Resultat:** 95³ = 857,375 kombinasjoner (95x økning)
**Ekstra bonus:** Fortsatt lett å huske og skrive

#### Alternativ 3: Ord + tall (mellomløsning, 20 min)
**Bruk når:** Rask fix nødvendig, ikke tid til å teste 3-ords

```sql
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  word TEXT;
  num INT;
  code TEXT;
  max_attempts INT := 100;
  attempt INT := 0;
BEGIN
  LOOP
    -- Velg ett tilfeldig ord og tall (1000-9999)
    SELECT word INTO word FROM invite_words ORDER BY RANDOM() LIMIT 1;
    num := 1000 + floor(random() * 9000)::int;

    code := word || '-' || num::text;

    IF NOT EXISTS (SELECT 1 FROM households WHERE invite_code = code) THEN
      RETURN code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;
```

**Resultat:** 95 × 9,000 = 855,000 kombinasjoner
**Ulempe:** Mindre brukervennlig (tall er vanskeligere å huske)

### Testing etter utvidelse

```sql
-- Test at funksjonen fungerer
SELECT generate_invite_code();

-- Generer 10 koder og sjekk for duplikater
WITH test_codes AS (
  SELECT generate_invite_code() as code
  FROM generate_series(1, 10)
)
SELECT code, COUNT(*) as count
FROM test_codes
GROUP BY code
HAVING COUNT(*) > 1;
-- Skal returnere 0 rader
```

## Database Indexes

Viktige indexes for performance ved stor skala:

```sql
-- Sjekk eksisterende indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Viktige indexes (bør allerede eksistere)
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_children_household_id ON children(household_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_household_child ON schedule_assignments(household_id, child_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status_child_id ON equipment_status(child_id);
```

## Supabase Limits (Free Tier)

Vær oppmerksom på disse grensene:

| Ressurs | Free Tier Limit | Handling ved nærming |
|---------|----------------|---------------------|
| Database størrelse | 500 MB | Overvåk med dashboard |
| API requests | 50,000 per måned | Oppgrader til Pro ($25/mnd) |
| Auth users | Ubegrenset | Ingen bekymring |
| Realtime connections | 200 | Begrens concurrent brukere |
| Edge Functions | 500,000 per månd | Overvåk bruk |

## Overvåkningsplan

1. **Månedlig (0-1000 households):**
   - Sjekk invite-kode belegg
   - Gjennomgå Supabase dashboard for database størrelse

2. **Ukentlig (1000-3000 households):**
   - Overvåk belegg og kollisjonshastighet
   - Sjekk query performance (slow query log)

3. **Daglig (3000+ households):**
   - Automatisert overvåkning av belegg
   - Alert ved >60% belegg
   - Planlegg utvidelse

## Oppgradering til Pro

Vurder Supabase Pro når:
- 50,000+ API requests per måned
- Database over 400 MB
- Trenger daglige backups
- Ønsker prioritert support

**Kostnad:** $25/måned
**Fordeler:** 8GB database, 500,000 requests, prioritert support, daglige backups

## Kontakt og Support

Ved spørsmål om skalering:
1. Sjekk dette dokumentet først
2. Les Supabase docs: https://supabase.com/docs
3. Kontakt utvikler for custom løsninger
