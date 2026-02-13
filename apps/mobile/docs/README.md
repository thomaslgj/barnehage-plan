# Barnehage-Plan App - Dokumentasjon

## Oversikt

Barnehage-Plan er en familie-app som hjelper foreldre med å organisere hverdagen rundt barnehage. Appen fokuserer på tidsplanlegging og utstyrshåndtering.

## Innhold

- [Notifications System](./NOTIFICATIONS.md) - Daglige påminnelser om utstyr
- [Arkitektur](#arkitektur)
- [Funksjonaliteter](#funksjonaliteter)
- [Database Schema](#database-schema)
- [Utviklings-guide](#utviklings-guide)

## Arkitektur

### Teknologi Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation 7
- **Styling**: twrnc (Tailwind for React Native)
- **Backend**: Supabase
- **State Management**: React Context (HouseholdProvider)
- **Fonts**: Manrope (300, 400, 500)
- **Notifications**: expo-notifications

### Prosjektstruktur

```
apps/mobile/
├── src/
│   ├── components/        # Gjenbrukbare UI-komponenter
│   │   ├── TodayCard.tsx
│   │   ├── ScheduleSlot.tsx
│   │   ├── EquipmentStatusBadge.tsx
│   │   ├── EquipmentList.tsx
│   │   └── ...
│   ├── contexts/          # React Context providers
│   │   └── HouseholdProvider.tsx
│   ├── lib/               # Utility functions og helpers
│   │   ├── equipment.ts   # Equipment-logikk
│   │   ├── supabase.ts    # Supabase client
│   │   └── tw.ts          # Tailwind config
│   ├── screens/           # Skjerm-komponenter
│   │   ├── MainScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── PersonalInfoScreen.tsx
│   │   ├── NotificationsSettingsScreen.tsx
│   │   ├── EquipmentManagementScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   └── AuthScreen.tsx
│   ├── services/          # Business logic services
│   │   └── notifications.ts
│   └── types/             # TypeScript types
│       └── db.ts
├── docs/                  # Dokumentasjon
├── App.tsx                # Root component
└── tailwind.config.js     # Tailwind tema
```

## Funksjonaliteter

### 1. 📅 Tidsplanlegging

**Ukesvisning av levering/henting**
- Viser mandag-fredag
- Enkel cycling mellom familiemedlemmer (tap for å endre)
- Optimistisk UI-oppdatering (ingen ventetid)
- Template-system for standard-uker
- Automatisk fylle inn fra template

**Hovedfunksjoner:**
- Swipe for å endre uker (høyre = forrige, venstre = neste)
- Pull-to-refresh for å oppdatere data
- I DAG / I MORGEN card på hovedskjermen
- Ukenummer og år-visning
- "Gå til nåværende uke" knapp

**Tekniske detaljer:**
- Optimistiske oppdateringer (`MainScreen.tsx`)
- Haptic feedback på alle interaksjoner
- Smooth animasjoner ved lasting

### 2. 🎒 Utstyrshåndtering

**Equipment Status**
- Markere utstyr som OK eller Mangler
- Kritikalitetsnivå (Nødvendig / Valgfritt)
- Visuell status-badge med farger:
  - 🟢 Grønn: Alt klart
  - 🟡 Gul: Noe mangler (ikke-kritisk)
  - 🔴 Rød: Kritisk utstyr mangler

**Equipment Management**
- Legg til nye utstyr
- Rediger navn på eksisterende
- Slett utstyr
- Toggle kritikalitet
- Sortert etter rekkefølge

**Auto-modal**
- Vises automatisk kl 16:00 når du ser på "I MORGEN"
- Én gang per dag
- Quick-access til å oppdatere status

### 3. 🔔 Notifications (Se [NOTIFICATIONS.md](./NOTIFICATIONS.md))

**Daglige Påminnelser**
- Konfigurerbart tidspunkt (standard 07:30)
- Intelligent melding basert på status
- Auto-rescheduling ved status-endringer
- Plattform-spesifikk implementering (iOS/Android)

### 4. 👤 Profil & Innstillinger

**Ny navigasjonsbasert profil:**
- Personlige opplysninger
- Varslinger
- Utstyrsliste
- Kjør onboarding på nytt
- Logg ut

**Personlige opplysninger:**
- Rediger visningsnavn
- (Fremtidige: profilbilde, e-post, etc.)

### 5. 🚀 Onboarding

**Steg-for-steg setup:**
1. Velg om du skal opprette eller bli med i husstand
2. Oppgi navn og informasjon
3. Konfigurer standard-uke
4. Sett opp utstyrsliste
5. Invitasjonskode (hvis oppretter)

**Funksjoner:**
- Re-kjørbar fra innstillinger
- Smooth animasjoner mellom steg
- Validering av input
- Automatisk oppsett av database-strukturer

### 6. 🎨 Micro Interactions

**Button Press Effects:**
- Scale-down på viktige knapper
- Haptic feedback
- activeOpacity for visuell tilbakemelding

**Equipment Status:**
- Smooth color transitions ved status-endring
- Scale animation på toggle

**Pull to Refresh:**
- Native RefreshControl på MainScreen

**Swipe Gestures:**
- Pan gestures for uke-navigasjon
- Haptic feedback på swipe

**Loading States:**
- Shimmer effect på schedule slots
- Smooth fade-in animasjoner
- Staggered animations ved innlasting

## Database Schema

### Hovedtabeller

**`households`**
```sql
- id (UUID, PK)
- name (TEXT)
- invite_code (TEXT, UNIQUE)
- created_at (TIMESTAMPTZ)
```

**`household_members`**
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- user_id (UUID, FK) -- kan være NULL for placeholder
- display_name (TEXT)
- notification_enabled (BOOLEAN) -- Default: true
- notification_time (TEXT)        -- Default: '07:30'
- created_at (TIMESTAMPTZ)
```

**`children`**
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- name (TEXT)
- created_at (TIMESTAMPTZ)
```

**`schedule_assignments`**
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- child_id (UUID, FK)
- date (DATE)
- slot (TEXT) -- 'dropoff' | 'pickup'
- assigned_member_id (UUID, FK)
- assigned_user_id (UUID, FK)
- updated_by (UUID, FK)
- created_at (TIMESTAMPTZ)
UNIQUE (child_id, date, slot)
```

**`schedule_templates`**
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- child_id (UUID, FK)
- weekday (INT) -- 1-7 (Monday-Sunday)
- slot (TEXT)
- assigned_member_id (UUID, FK)
- assigned_user_id (UUID, FK)
UNIQUE (household_id, child_id, weekday, slot)
```

**`equipment_items`**
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- key (TEXT)
- label (TEXT)
- is_critical (BOOLEAN)
- sort_order (INT)
- active (BOOLEAN)
- updated_by (UUID, FK)
- created_at (TIMESTAMPTZ)
UNIQUE (household_id, key)
```

**`household_equipment_status`**
```sql
- household_id (UUID, PK)
- item_key (TEXT, PK)
- status (TEXT) -- 'ok' | 'missing'
- updated_by (UUID, FK)
- updated_at (TIMESTAMPTZ)
PRIMARY KEY (household_id, item_key)
```

## Utviklings-guide

### Setup

```bash
# Installer dependencies
npm install

# Start dev server
npm start

# Run på iOS simulator
npm run ios

# Run på Android emulator
npm run android

# Run på web
npm run web
```

### Environment Variables

Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Database Migrations

Se `MIGRATION_NEEDED.md` for nødvendige database-endringer.

### Kode-stil

- **Språk**: TypeScript
- **Formatting**: Følg existing patterns
- **Naming**:
  - Components: PascalCase
  - Functions: camelCase
  - Files: PascalCase for components, camelCase for utils
- **Imports**: Grouped (React → External → Internal → Styles)

### Testing

**Manuell testing sjekkliste:**
- [ ] Login/logout flow
- [ ] Onboarding (create + join household)
- [ ] Schedule assignment (all days, both slots)
- [ ] Template apply/update
- [ ] Equipment toggle (all items)
- [ ] Equipment management (add/edit/delete)
- [ ] Notifications (enable/disable/change time)
- [ ] Pull to refresh
- [ ] Week navigation (arrows + swipe)
- [ ] Profile navigation

## Design System

### Farger

```javascript
// Hovedfarger
background: '#2d2520'    // Varm mørk brun
text: '#f5f1ed'          // Varm krem/hvit

// Primær (Person 1) - Sage grønn
primary: '#6b8e6f'
primary-light: '#7fa884'

// Sekundær (Person 2) - Gylden gul
secondary: '#e8c96f'
secondary-light: '#f0d689'

// Status
success: '#7ba872'       // Varm grønn
warning: '#e8b855'       // Gylden gul
error: '#d17166'         // Varm rød/korall
info: '#c17b5c'          // Terracotta
```

### Typography

- **Font**: Manrope
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium)
- **Sizes**:
  - Heading: 3xl (24px+)
  - Subheading: xl-2xl
  - Body: base (16px)
  - Small: sm (14px)
  - Tiny: xs (12px)

### Spacing

- Standard padding: `p-4` (16px)
- Card padding: `p-5` (20px)
- Gap between elements: `gap-2` (8px) eller `gap-3` (12px)

### Animasjoner

- **Duration**: 300-600ms
- **Easing**: Spring for user interactions, Linear for loaders
- **Native Driver**: Bruk når mulig (transform, opacity)

## Feilsøking

### Common Issues

**"Network request failed"**
- Sjekk at Supabase URL og keys er korrekte
- Verifiser internett-tilkobling

**"Session expired"**
- Brukeren må logge inn på nytt
- Auth token har utløpt

**Notifications fungerer ikke**
- Sjekk permissions
- Verifiser database migrations
- Se [NOTIFICATIONS.md](./NOTIFICATIONS.md) for detaljer

**Console warnings i Expo Go**
```
ERROR expo-notifications: Android Push notifications...
WARN `expo-notifications` functionality is not fully supported...
```
- Disse warningene kommer fra expo-notifications ved oppstart
- Kan **trygt ignoreres** - local scheduled notifications fungerer perfekt
- Kun remote push (fra server) fungerer ikke i Expo Go
- Se [NOTIFICATIONS.md](./NOTIFICATIONS.md#console-warnings-i-expo-go-kan-ignoreres) for mer info

## Bidrag

### Før du committer

1. Test lokalt på både iOS og Android (hvis mulig)
2. Sjekk at ingen console errors
3. Verifiser at animasjoner fungerer smooth
4. Oppdater dokumentasjon hvis nødvendig

### Commit Messages

Format: `type: description`

Types:
- `feat`: Ny funksjonalitet
- `fix`: Bug fix
- `docs`: Dokumentasjon
- `style`: Styling/UI endringer
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Testing
- `chore`: Maintenance

Eksempler:
```
feat: add daily equipment notifications
fix: equipment status not updating on Android
docs: add notifications system documentation
```

## Lisens

Proprietary - Barnehage-Plan App

## Support

For spørsmål eller problemer, kontakt utviklingsteamet.

---

Sist oppdatert: 2025
