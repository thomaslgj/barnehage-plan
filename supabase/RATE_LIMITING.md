# Rate Limiting System

## Oversikt

Rate limiting er nå implementert for å beskytte mot brute force-angrep og misbruk av API-endepunkter.

## Beskyttede Operasjoner

| Operasjon | Grense | Tidsvindu | Beskrivelse |
|-----------|--------|-----------|-------------|
| **Login** | 5 forsøk | 15 minutter | Beskytter mot brute force på passord |
| **Signup** | 3 forsøk | 1 time | Forhindrer spam-registreringer |
| **Password Reset** | 3 forsøk | 1 time | Forhindrer email-bombing |
| **Data Export** | 2 forsøk | 24 timer | Beskytter mot ressurs-misbruk |
| **Account Deletion** | 1 forsøk | 1 time | Forhindrer utilsiktet spam |

## Installasjon

### 1. Kjør SQL i Supabase

```bash
# Logg inn på Supabase Dashboard
# Gå til SQL Editor
# Kjør innholdet i rate_limiting.sql
```

Eller via kommandolinje:
```bash
supabase db push --db-url "your-database-url" < supabase/rate_limiting.sql
```

### 2. Verifiser Installasjon

Sjekk at følgende eksisterer i databasen:
- ✅ Tabell: `public.rate_limit_logs`
- ✅ Funksjon: `check_rate_limit`
- ✅ Funksjon: `log_rate_limit_attempt`
- ✅ Funksjon: `cleanup_rate_limit_logs`

Test en funksjon:
```sql
SELECT check_rate_limit('test@example.com', 'login', 5, 15);
```

## Bruk i Kode

### Sjekke Rate Limit

```typescript
import { isRateLimited, getRateLimitMessage } from '../lib/rateLimit';

// Sjekk før sensitiv operasjon
const limited = await isRateLimited('login', userEmail);

if (limited) {
  Alert.alert('For mange forsøk', getRateLimitMessage('login'));
  return;
}

// Fortsett med operasjonen...
```

### Med Wrapper Function

```typescript
import { withRateLimit } from '../lib/rateLimit';

try {
  await withRateLimit('data_export', async () => {
    // Din kode her
    await exportUserData();
  }, userEmail);
} catch (error) {
  // Håndter rate limit error
  Alert.alert('Feil', error.message);
}
```

## Vedlikehold

### Automatisk Cleanup (Anbefalt)

Hvis du har `pg_cron` extension aktivert i Supabase:

```sql
-- Kjør automatisk cleanup hver dag kl 02:00
SELECT cron.schedule(
  'cleanup-rate-limit-logs',
  '0 2 * * *',
  $$ SELECT cleanup_rate_limit_logs(7); $$
);
```

### Manuell Cleanup

```sql
-- Slett logger eldre enn 7 dager
SELECT cleanup_rate_limit_logs(7);

-- Eller slett alle logger
TRUNCATE TABLE public.rate_limit_logs;
```

## Monitoring

### Se Rate Limit Forsøk

```sql
-- Siste 100 forsøk
SELECT
  identifier,
  action,
  created_at,
  metadata
FROM public.rate_limit_logs
ORDER BY created_at DESC
LIMIT 100;

-- Forsøk per handling (siste 24 timer)
SELECT
  action,
  COUNT(*) as attempt_count,
  COUNT(DISTINCT identifier) as unique_users
FROM public.rate_limit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY attempt_count DESC;

-- Mest aktive IP-adresser
SELECT
  identifier,
  COUNT(*) as total_attempts,
  array_agg(DISTINCT action) as actions
FROM public.rate_limit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY identifier
ORDER BY total_attempts DESC
LIMIT 20;
```

### Blokkerte Brukere

```sql
-- Finn brukere som er rate limited akkurat nå
WITH current_limits AS (
  SELECT DISTINCT identifier, action
  FROM public.rate_limit_logs
  WHERE created_at >= NOW() - INTERVAL '15 minutes'
)
SELECT
  identifier,
  action,
  COUNT(*) as recent_attempts
FROM public.rate_limit_logs
WHERE created_at >= NOW() - INTERVAL '15 minutes'
  AND (identifier, action) IN (SELECT identifier, action FROM current_limits)
GROUP BY identifier, action
HAVING COUNT(*) >= 5
ORDER BY recent_attempts DESC;
```

## Tilpasse Grenser

For å endre rate limit-grenser, rediger verdiene i `/apps/mobile/src/lib/rateLimit.ts`:

```typescript
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMinutes: 15 },      // ← Endre her
  signup: { maxAttempts: 3, windowMinutes: 60 },
  // ...
};
```

## Sikkerhet

### Viktig

- ⚠️ **Aldri** eksponer `log_rate_limit_attempt` til klienten
- ⚠️ Logging skal skje server-side (Edge Functions) med faktisk IP
- ⚠️ Klient-side checks er kun første forsvarslinje
- ⚠️ Implementer også server-side rate limiting i Edge Functions

### Best Practices

1. **Bruk email som identifier** for autentiserte operasjoner
2. **Bruk IP** for anonyme operasjoner (krever Edge Functions)
3. **Logg alle forsøk** for monitoring og deteksjon
4. **Cleanup regelmessig** for å holde tabellen liten
5. **Monitor aktivitet** for å oppdage angrep tidlig

## Fremtidige Forbedringer

- [ ] IP-basert rate limiting via Edge Functions
- [ ] Geografisk blocking for mistenkelig trafikk
- [ ] Adaptive rate limiting (strengere limits ved angrep)
- [ ] Whitelist for trusted IPs
- [ ] Email-varsling ved mistenkelig aktivitet
- [ ] Dashboard for real-time monitoring

## Feilsøking

### "Function check_rate_limit does not exist"

Løsning: Kjør `rate_limiting.sql` i Supabase SQL Editor

### Rate limiting fungerer ikke

1. Sjekk at funksjonen er installert: `SELECT check_rate_limit('test', 'login', 5, 15);`
2. Sjekk permissions: `GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;`
3. Sjekk RLS policies på `rate_limit_logs` tabell

### For strenge limits

Juster verdiene i `rateLimit.ts` eller øk `maxAttempts` midlertidig mens du tester

## Support

Ved spørsmål eller problemer, kontakt team eller opprett en issue i GitHub.
