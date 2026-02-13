# Notifications System

## Oversikt

Appen har et intelligent notifikasjonssystem som minner brukere på å sjekke utstyr til barnehagen hver morgen.

## Funksjonalitet

### Daglige Påminnelser

- **Tidspunkt**: Konfigurerbart av brukeren (standard 07:30)
- **Innhold**: Dynamisk basert på utstyrsstatus
  - Hvis kritisk utstyr mangler: "Du mangler viktig utstyr! Sjekk hva som må tas med."
  - Hvis alt er OK: "Husk å sjekke at du har alt utstyr til barnehagen."
- **Plattform**: iOS og Android (med plattform-spesifikk implementasjon)

### Automatisk Re-scheduling

Systemet re-scheduler automatisk notifikasjoner når:
1. Appen startes (initialisering)
2. Brukeren endrer notifikasjonsinnstillinger
3. **Brukeren endrer equipment status** (spesielt nyttig for Android)

Dette sikrer at:
- Android alltid har en aktiv notifikasjon planlagt
- Notifikasjons-meldingen er oppdatert basert på faktisk status
- Brukeren får relevant informasjon uten manuell konfigurasjon

## Arkitektur

### Fil-struktur

```
src/
├── services/
│   └── notifications.ts          # Hovedlogikk for notifications
├── screens/
│   └── NotificationsSettingsScreen.tsx  # Innstillinger UI
└── lib/
    └── equipment.ts              # Integrert med auto-rescheduling
```

### Nøkkelfunksjoner

#### `notifications.ts`

**`requestNotificationPermissions()`**
- Ber om notifikasjonstillatelser fra brukeren
- Returnerer `true` hvis godkjent

**`setupNotificationChannel()`**
- Setter opp notifikasjonskanal for Android
- Definerer viktighet, lyd, navn

**`scheduleEquipmentNotification(householdId, time)`**
- Planlegger daglig notifikasjon på gitt tidspunkt
- **iOS**: Bruker `CALENDAR` trigger med `repeats: true`
- **Android**: Bruker `TIME_INTERVAL` trigger
- Sjekker automatisk om kritisk utstyr mangler
- Returnerer notifikasjon ID

**`cancelAllEquipmentNotifications()`**
- Kansellerer alle eksisterende equipment-notifikasjoner
- Kalles før re-scheduling for å unngå duplikater

**`hasMissingCriticalEquipment(householdId)`**
- Sjekker om noen kritiske equipment items mangler
- Brukes for å bestemme notifikasjons-melding
- Returnerer `boolean`

**`getNotificationSettings(memberId)`**
- Henter brukerens notifikasjonsinnstillinger fra database
- Returnerer `{ enabled: boolean, time: string }`

**`saveNotificationSettings(memberId, settings)`**
- Lagrer notifikasjonsinnstillinger til database
- Oppdaterer `notification_enabled` og `notification_time` kolonner

**`rescheduleNotificationIfNeeded(householdId, memberId)`**
- ✨ **Automatisk re-scheduling etter equipment endring**
- Kalles når equipment status oppdateres
- For Android: re-scheduler alltid for å sikre korrekt timing
- For iOS: re-scheduler for å oppdatere melding
- Fire-and-forget pattern for bedre performance

### Plattform-spesifikke Forskjeller

#### iOS
- **Trigger Type**: `CALENDAR`
- **Repeats**: `true` (native support for daglige repetisjoner)
- **Fordeler**: Automatisk repetisjon på system-nivå
- **Ulemper**: Ingen (full støtte)

#### Android
- **Trigger Type**: `TIME_INTERVAL`
- **Repeats**: `false` (må manuelt re-schedule)
- **Fordeler**: Fungerer pålitelig
- **Ulemper**: Krever re-scheduling logikk
- **Løsning**: Auto-reschedule ved:
  1. App oppstart
  2. Innstillingsendringer
  3. Equipment status endringer

#### Web
- **Support**: Ingen (notifications ikke tilgjengelig)
- **Fallback**: Funksjoner returnerer tidlig uten feil

## Database Schema

### Nødvendige Kolonner

**Tabell: `household_members`**
```sql
ALTER TABLE household_members
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_time TEXT DEFAULT '07:30';
```

- `notification_enabled`: Om brukeren vil motta notifikasjoner
- `notification_time`: Tidspunkt for daglig notifikasjon (format: "HH:MM")

**Tabell: `household_equipment_status`**
```sql
-- Må eksistere med følgende struktur:
CREATE TABLE household_equipment_status (
  household_id UUID NOT NULL,
  item_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'missing')),
  updated_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, item_key)
);
```

## Brukerflyt

### Første Gang Setup

1. Bruker går til **Profil → Varslinger**
2. Ser toggle for å aktivere notifikasjoner (standard: av)
3. Klikker på toggle → ber om tillatelse
4. Godkjenner tillatelse i system-dialog
5. Velger tidspunkt (standard: 07:30)
6. Notifikasjoner er nå aktivert

### Daglig Bruk

```
07:30 → 🔔 Notifikasjon: "Du mangler viktig utstyr!"
        ↓
08:00 → 📱 Åpner appen
        ↓
        ✅ Setter "Regntøy" til OK
        ↓
        🔄 Auto-reschedule kjører
        ↓
Neste dag 07:30 → 🔔 Notifikasjon: (oppdatert status)
```

### Endring av Innstillinger

1. Bruker går til **Profil → Varslinger**
2. Kan:
   - Skru av/på notifikasjoner
   - Endre tidspunkt
3. Endringer lagres automatisk
4. Notifikasjoner re-schedules med nye innstillinger

## Testing

### Manuell Testing

**Test notifikasjoner fungerer:**
1. Aktiver notifikasjoner i appen
2. Sett tidspunkt til 1 minutt frem i tid
3. Vent og sjekk at notifikasjon kommer

**Test auto-rescheduling:**
1. Aktiver notifikasjoner
2. Sett kritisk equipment til "Mangler"
3. Sjekk console: "Notification rescheduled after equipment status change"
4. Verifiser at ny notifikasjon er planlagt

**Test plattform-spesifikk oppførsel:**
- iOS: Notifikasjon skal repetere daglig automatisk
- Android: Sjekk at re-scheduling skjer ved status endringer

### Debug Logging

Systemet logger viktige hendelser:
```javascript
console.log('Notification scheduled for ${time} daily, ID: ${notificationId}');
console.log('Notification rescheduled after equipment status change');
console.error('Error scheduling notification:', error);
```

## Feilsøking

### "Trigger object is invalid"
- **Årsak**: Feil trigger-type for plattform
- **Løsning**: Sjekk at iOS bruker CALENDAR og Android bruker TIME_INTERVAL

### "Permission denied"
- **Årsak**: Bruker har ikke godkjent notifikasjoner
- **Løsning**: Be bruker gå til system-innstillinger og aktivere

### "Column does not exist"
- **Årsak**: Database migration ikke kjørt
- **Løsning**: Kjør SQL fra MIGRATION_NEEDED.md

### Notifikasjoner kommer ikke på Android
- **Årsak**: Notification ikke re-scheduled etter første firing
- **Løsning**: Auto-reschedule er nå implementert ved equipment endringer

## Fremtidige Forbedringer

### Potensielle Features
- [ ] Notification listener for automatisk Android re-scheduling
- [ ] Mulighet for flere notifikasjoner per dag
- [ ] Ukedag-spesifikke innstillinger (kun hverdager)
- [ ] Snooze-funksjonalitet
- [ ] Rich notifications med action buttons
- [ ] Notifikasjonshistorikk

### Optimaliseringer
- [ ] Batch-scheduling for bedre ytelse
- [ ] Caching av equipment status
- [ ] Background task for status-sjekk (i stedet for ved scheduling)
- [ ] Lokalisering av notifikasjonsmeldinger

## Avhengigheter

```json
{
  "expo-notifications": "~0.28.0",
  "@react-native-community/datetimepicker": "8.2.0"
}
```

## Relaterte Filer

- `src/services/notifications.ts` - Notification service
- `src/screens/NotificationsSettingsScreen.tsx` - Settings UI
- `src/lib/equipment.ts` - Equipment status med auto-reschedule
- `App.tsx` - Initialisering av notifications
- `MIGRATION_NEEDED.md` - Database migrations

## Lisens og Credits

Del av Barnehage-Plan appen.
Notification system implementert med expo-notifications.
