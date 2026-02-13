# Database Migrations

## Notifications Feature

**Dato**: 2025
**Feature**: Daglige equipment påminnelser

### Nødvendige Endringer

Kjør følgende SQL i Supabase SQL editor:

```sql
-- Add notification settings columns to household_members table
ALTER TABLE household_members
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_time TEXT DEFAULT '07:30';

-- Add comments for documentation
COMMENT ON COLUMN household_members.notification_enabled IS 'Whether the user wants to receive daily equipment notifications';
COMMENT ON COLUMN household_members.notification_time IS 'Time to receive daily notification (format: HH:MM)';
```

### Beskrivelse

**notification_enabled**
- Type: `BOOLEAN`
- Default: `true`
- Brukes til: Kontrollere om brukeren vil motta daglige equipment påminnelser

**notification_time**
- Type: `TEXT`
- Default: `'07:30'`
- Format: `"HH:MM"` (24-timers format)
- Brukes til: Tidspunkt for daglig notifikasjon

### Verifisering

Etter å ha kjørt migrasjonen, verifiser at kolonnene eksisterer:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'household_members'
AND column_name IN ('notification_enabled', 'notification_time');
```

Forventet output:
```
column_name          | data_type | column_default
---------------------|-----------|---------------
notification_enabled | boolean   | true
notification_time    | text      | '07:30'::text
```

### Rollback (hvis nødvendig)

Hvis du trenger å fjerne disse kolonnene:

```sql
ALTER TABLE household_members
DROP COLUMN IF EXISTS notification_enabled,
DROP COLUMN IF EXISTS notification_time;
```

**OBS**: Dette vil slette alle lagrede notifikasjonsinnstillinger!

### Påvirkning

- **Eksisterende data**: Ingen påvirkning på eksisterende rader
- **Nye brukere**: Får automatisk defaults (enabled=true, time='07:30')
- **App funksjonalitet**:
  - Notifikasjoner vil ikke fungere uten denne migrasjonen
  - Appen vil fortsatt fungere, men vil logge feil ved notifikasjonsforsøk

### Relatert Dokumentasjon

Se [docs/NOTIFICATIONS.md](./docs/NOTIFICATIONS.md) for full dokumentasjon av notifications-systemet.

---

## Fremtidige Migrations

Nye migrations vil bli dokumentert her med dato og beskrivelse.
