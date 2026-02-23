# Flyt - Barnehageplan App

En komplett løsning for familier til å koordinere barnehage-henting og levering, med mobil app og web landing page.

## Prosjektstruktur

```
barnehage-plan/
├── app/                    # Next.js landing page
│   ├── page.tsx           # Hovedside
│   └── admin/             # Admin dashboard (localhost-only)
├── apps/
│   └── mobile/            # React Native/Expo mobil app
├── lib/                   # Delte utilities
└── components/            # Web komponenter
```

## Komponenter

### 📱 Mobil App (React Native + Expo)
- Ukesplan for levering/henting
- Notater per dag
- Utstyrsstatus tracking
- Varslinger
- Biometrisk innlogging
- Multi-household support

### 🌐 Landing Page (Next.js)
- Produktinformasjon
- Offentlig tilgjengelig på Vercel

### 🔧 Admin Dashboard (Localhost-only)
- Brukeradministrasjon
- Statistikk og oversikt
- Premium-status
- **Kun tilgjengelig lokalt** (blokkert i produksjon)

## Kom i gang

### Forutsetninger
- Node.js 18+
- npm eller yarn
- Expo CLI (for mobil app)
- Supabase account

### Installasjon

```bash
# Installer dependencies for web
npm install

# Installer dependencies for mobil app
cd apps/mobile
npm install
```

### Environment Variables

Opprett `.env.local` i root:

```env
# Supabase (offentlig - brukes i web og mobil)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Admin dashboard (KUN for localhost, IKKE commit til Git)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Viktig**: Service role key skal ALDRI committes eller legges i Vercel. Den gir full database-tilgang.

### Kjøre lokalt

**Web (landing page + admin):**
```bash
npm run dev
# Åpne http://localhost:3000
# Admin dashboard: http://localhost:3000/admin
```

**Mobil app:**
```bash
cd apps/mobile
npx expo start

# Eller kjør direkte på Android:
npx expo run:android
```

## Admin Dashboard

Localhost-only admin panel for brukeradministrasjon.

### Funksjoner
- 📊 Statistikk (totalt brukere, hushold, barn)
- 👥 Brukeroversikt med status
  - Konto-status (Opprettet/Venter)
  - Onboarding-status (Fullført/Ikke fullført)
  - Antall barn per hushold
- 🗑️ Slett brukere og hushold
- 📧 Send invitasjoner (TODO: implementere e-post)
- 💎 Premium-status (fremtidig funksjonalitet)

### Tilgang
```bash
# Kun tilgjengelig lokalt
http://localhost:3000/admin

# Blokkert i produksjon (redirecter til /)
```

### Sikkerhet
- Krever `SUPABASE_SERVICE_ROLE_KEY` (bypasser RLS)
- Automatisk blokkert i produksjon via layout
- Server-side rendering med admin privileges

## Database (Supabase)

### Tabeller
- `households` - Hushold
- `household_members` - Medlemmer i hushold
- `children` - Barn
- `schedule_assignments` - Ukesplan for levering/henting
- `day_notes` - Notater per dag
- `equipment_status` - Utstyrsstatus
- `equipment_items` - Utstyrsliste

### Row Level Security (RLS)
Alle tabeller bruker RLS for multi-tenancy med helper-funksjon `get_my_household_ids()`.

### Invite-kode System

**Hvordan det fungerer:**
- Hver household får en unik 2-ords invite-kode (f.eks. "eple-hund")
- Koder genereres fra en liste med 95 norske ord
- `generate_invite_code()` sjekker automatisk for duplikater
- `invite_code` kolonnen har UNIQUE constraint → umulig å få duplikater

**Skalerbarhet:**
- **Mulige kombinasjoner:** 95 × 95 = 9,025 unike koder
- **Kapasitet:**
  - 1,000 households = 11% belegg ✅
  - 5,000 households = 55% belegg ⚠️
  - 9,000+ households = Kritisk belegg ❌

**Når må du utvide?**
Systemet håndterer enkelt tusenvis av households. Ved behov for mer kapasitet:

1. **Legg til flere ord** (enklest):
   ```sql
   INSERT INTO invite_words (word) VALUES
     ('nye'), ('ord'), ('her'), ...;
   ```
   200 ord → 40,000 kombinasjoner

2. **Gå til 3-ords format** (best):
   Endre `generate_invite_code()` til word1-word2-word3
   - 95³ = 857,375 kombinasjoner
   - Støtter millioner av households

3. **Legg til tall**: word-1234 format
   - 95 × 10,000 = 950,000 kombinasjoner

**Performance:**
- Ordliste-størrelse påvirker nesten IKKE performance
- Performance avhenger av antall BRUKTE koder
- Ved høy belegg (>50%) øker antall forsøk på ny kode

## Deployment

### Landing Page (Vercel)
```bash
# Deploy fra root directory
vercel

# Environment variables i Vercel:
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# IKKE legg til SUPABASE_SERVICE_ROLE_KEY!
```

### Mobil App
```bash
cd apps/mobile

# Build APK (Android)
npx expo export --platform android
cd android
./gradlew assembleRelease

# Build for iOS (krever Mac + Xcode)
npx expo run:ios --configuration Release
```

## Teknologi

**Web:**
- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase (auth + database)

**Mobil:**
- React Native
- Expo
- TypeScript
- Supabase
- TailwindRN (twrnc)
- Expo Haptics
- Expo Local Authentication (biometri)

## Scripts

```bash
# Web development
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server

# Mobil development
cd apps/mobile
npx expo start                    # Start Expo dev server
npx expo run:android              # Run on Android
npx expo run:ios                  # Run on iOS
npx expo export --platform android # Export for Android build
```

## Bidrag

Dette er et privat prosjekt for barnehageplanlegging.

## Lisens

Private - All rights reserved
