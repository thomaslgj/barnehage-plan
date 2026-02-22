# Barnehage Plan - Mobile App (React Native/Expo)

A mobile companion app for the Barnehage Plan web application. Built with Expo and React Native, it replicates core functionality including authentication, onboarding, schedule management, equipment tracking, and notifications.

## 📚 Documentation

**For comprehensive documentation, see the [docs/](./docs/) folder:**

- **[README.md](./docs/README.md)** - Full app overview and feature documentation
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and data flow
- **[SCHEDULE.md](./docs/SCHEDULE.md)** - Schedule system documentation
- **[EQUIPMENT.md](./docs/EQUIPMENT.md)** - Equipment tracking documentation
- **[NOTIFICATIONS.md](./docs/NOTIFICATIONS.md)** - Notification system documentation
- **[ONBOARDING.md](./docs/ONBOARDING.md)** - Onboarding flow documentation

## Features

- **Authentication**: Email/password sign-in with Supabase
- **Onboarding**: Create new household or join existing via invite code
- **Schedule Management**: View and edit weekly drop-off/pickup assignments with templates
- **Equipment Tracking**: Track critical equipment with status (OK/Missing)
- **Notifications**: Daily reminders for missing critical equipment
- **Profile Management**: Personal info, settings, equipment management
- **Today Card**: Quick view of today's or tomorrow's schedule
- **Secure Session Storage**: Uses SecureStore (iOS/Android) and AsyncStorage (web)

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (installed globally or via npx)
- iOS Simulator (macOS) or Android Emulator
- Supabase instance with the required database schema

## Installation

1. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

   **Note**: The `--legacy-peer-deps` flag is required due to React 19 peer dependency conflicts.

## Styling with NativeWind

This app uses **NativeWind** (Tailwind CSS for React Native) for styling, matching the web app's design system.

### Setup
- NativeWind v2 is configured with Tailwind CSS v3
- Custom theme tokens mirror the web app colors
- All components use `className` instead of `StyleSheet`

### Theme Configuration
See `tailwind.config.js` for the color palette and design tokens that match the web app:
- Primary colors (green): `primary`, `primary-light`, `primary-dark`
- Secondary colors (amber): `secondary`, `secondary-light`, `secondary-dark`
- Text colors: `text`, `text-muted`, `text-light`
- Background colors: `background`, `card`
- Border colors: `border`, `border-light`

### Build Caveats
- **Clear cache** after config changes: `npx expo start --clear`
- NativeWind requires Babel plugin (configured in `babel.config.js`)
- TypeScript types enabled via `nativewind-env.d.ts`

3. Create a `.env` file in the root of `apps/mobile`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://iyaeviwtklvspfvpizdw.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Note**: These values should match your web app's Supabase configuration.

## Running the App

### iOS Simulator (macOS only)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Web (for testing - optional)
```bash
npm run web
```

> **Note**: Web support is provided by Expo but is not the primary target. For best experience, use iOS Simulator or Android Emulator.

### Development Server
```bash
npm start
```
Then press `i` for iOS, `a` for Android, or `w` for web.

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── TodayCard.tsx    # Hero card showing today/tomorrow
│   │   ├── ScheduleSlot.tsx # Individual schedule slot button
│   │   └── AssignmentModal.tsx # Modal for selecting responsible person
│   ├── contexts/
│   │   └── HouseholdProvider.tsx # Global household/user state
│   ├── lib/
│   │   └── supabase.ts      # Supabase client configuration
│   ├── screens/
│   │   ├── AuthScreen.tsx   # Sign in/up screen
│   │   ├── OnboardingScreen.tsx # Household creation/join flow
│   │   └── MainScreen.tsx   # Main schedule view
│   └── types/
│       └── db.ts            # TypeScript types for database tables
├── App.tsx                  # Root component with navigation
├── .env                     # Environment variables (not committed)
└── package.json             # Dependencies and scripts
```

## Testing Onboarding Flow

### Option 1: Create New Household

1. Sign up with a new email/password
2. Choose "Create New Household"
3. Enter:
   - Household name (optional): e.g., "Test Family"
   - Your name: e.g., "Parent 1"
   - Partner name (optional): e.g., "Parent 2"
4. Tap "Create Household"
5. You'll be redirected to the main schedule view

### Option 2: Join Existing Household

1. Get an invite code from the web app (not implemented in mobile yet)
2. Sign up with a new email/password
3. Choose "Join Existing Household"
4. Enter the invite code and optionally your display name
5. Tap "Join Household"
6. You'll be redirected to the main schedule view

## Key Implementation Details

### Authentication & Session Management

- Uses `@supabase/supabase-js` for auth
- Session storage is platform-specific:
  - **iOS/Android**: `expo-secure-store` (encrypted keychain/keystore)
  - **Web**: `@react-native-async-storage/async-storage` (localStorage)
- Auto-refresh tokens enabled
- Auth state changes trigger context updates

### Household Context

The `HouseholdProvider` manages:
- Current authenticated user
- Active household ID (first household found)
- Active child ID (first child in household)
- List of household members with display names
- Onboarding state (needs setup or not)

### Schedule Data Flow

1. **Fetch**: Queries `schedule_assignments` table for 2-week range
2. **Display**: Shows Mon-Fri with drop-off/pickup slots
3. **Edit**: Tap slot → opens modal → select person → upserts to DB
4. **Refresh**: Pull-to-refresh or automatic on data changes

### Database Operations

**Onboarding RPC calls:**
- `bootstrap_household(p_name, p_my_display_name, p_partner_display_name)`
  - Creates household, members, and default child
- `accept_household_invite(invite_code, display_name)`
  - Joins existing household via invite code

**Schedule operations:**
- **Read**: `SELECT * FROM schedule_assignments WHERE child_id = ? AND date BETWEEN ? AND ?`
- **Upsert**: `UPSERT INTO schedule_assignments (...) ON CONFLICT (child_id, date, slot)`
- **Delete**: `DELETE FROM schedule_assignments WHERE child_id = ? AND date = ? AND slot = ?`

## Feature Parity with Web App

### ✅ Fully Implemented
- **Authentication** - Email/password sign-in/sign-up
- **Onboarding** - Create/join household with full setup flow
- **Schedule Management** - Weekly view with templates
- **Equipment Tracking** - Status tracking with critical flags
- **Notifications** - Daily reminders (local scheduled)
- **Profile Management** - Personal info, settings, equipment CRUD
- **Today/Tomorrow Card** - Quick overview with equipment status
- **Warm Design System** - Consistent colors and typography

### Platform-Specific Adaptations
- **Local Notifications**: Uses expo-notifications (no remote push)
- **Mobile-First UI**: Optimized for touch interactions
- **Platform-Specific Components**: DateTimePicker, Alert.prompt (iOS)
- **Navigation**: Native stack navigator instead of web routing

### Simplified vs Web
- Week navigation only (no month view)
- Single household support (no switching UI)
- Single child support (first child auto-selected)

## Known Issues & Caveats

### React Native + Supabase Auth

1. **Session Persistence**: Uses `expo-secure-store` which is more secure than AsyncStorage but requires additional permission on Android.

2. **URL Polyfill**: The app includes `react-native-url-polyfill/auto` for Supabase compatibility.

3. **Auth Flow**: Unlike web (which can use magic links easily), mobile relies on email/password. Magic link support would require deep linking configuration.

### Data Sync

- No real-time subscriptions implemented (to keep scope minimal)
- Pull-to-refresh required to see changes made on web
- Could be enhanced with Supabase Realtime subscriptions

### Timezone

- Uses dayjs with 'nb' (Norwegian) locale
- Assumes Europe/Oslo timezone
- No timezone selection in UI

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npx expo start --clear
```

### Supabase connection issues
- Verify `.env` file exists and contains correct values
- Check that Supabase URL and anon key match web app
- Ensure device/emulator has internet connection

### Auth state not persisting
- Check that `expo-secure-store` is installed
- On Android, ensure app has necessary permissions
- Try signing out and back in

### Schedule not loading
- Verify user has joined/created a household
- Check that household has at least one child
- Look for console errors in Metro bundler

## Dependencies

### Core
- `expo` ~54.0.33
- `react` 19.1.0
- `react-native` 0.81.5

### Supabase & Auth
- `@supabase/supabase-js` ^2.95.3
- `expo-secure-store` ^15.0.8 (iOS/Android)
- `@react-native-async-storage/async-storage` (web fallback)
- `react-native-url-polyfill`

### Navigation
- `@react-navigation/native` ^7.1.28
- `@react-navigation/native-stack` ^7.12.0
- `react-native-screens` ^4.23.0
- `react-native-safe-area-context` ^5.6.2

### Utilities
- `dayjs` ^1.11.19 (date formatting and manipulation)

## Future Enhancements

Potential improvements (see individual docs for detailed feature roadmaps):

1. **Real-time sync** via Supabase Realtime subscriptions
2. **Remote push notifications** (currently local only)
3. **Offline support** with local database and sync
4. **Multi-child/household UI** for switching between multiple
5. **Calendar integration** (export to native calendar)
6. **Biometric auth** (Face ID/Touch ID)
7. **Drag-to-reorder** for equipment and schedule templates
8. **Weather integration** for automatic equipment reminders
9. **History tracking** for schedule and equipment changes
10. **A/B testing** for onboarding flow optimization

See individual documentation files for detailed feature roadmaps:
- [SCHEDULE.md](./docs/SCHEDULE.md#fremtidige-forbedringer) - Schedule enhancements
- [EQUIPMENT.md](./docs/EQUIPMENT.md#fremtidige-forbedringer) - Equipment features
- [NOTIFICATIONS.md](./docs/NOTIFICATIONS.md#fremtidige-forbedringer) - Notification improvements

## Support

For issues specific to the mobile app, check:
1. Console logs in Metro bundler
2. Supabase dashboard for RLS policy issues
3. Network tab for API errors

## License

Same as parent project.
