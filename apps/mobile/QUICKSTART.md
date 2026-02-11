# Quick Start Guide - Barnehage Plan Mobile

## Prerequisites
- macOS (for iOS) or Windows/Linux (for Android)
- Node.js 18+
- Xcode (iOS) or Android Studio (Android)

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd apps/mobile
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is required due to React 19 peer dependency conflicts with react-dom.

### 2. Configure Environment
The `.env` file is already created with the correct Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://iyaeviwtklvspfvpizdw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### 3. Start the App

**For iOS (macOS only):**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

**For Development Server:**
```bash
npm start
```
Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for Web (testing only)

## First Time Setup

### Option A: Create New Household
1. Sign up with email/password
2. Tap "Create New Household"
3. Enter your name (required)
4. Optionally add household name and partner name
5. Tap "Create Household"

### Option B: Join Existing Household
1. Get an invite code from the web app
2. Sign up with email/password
3. Tap "Join Existing Household"
4. Enter the invite code
5. Optionally enter your display name
6. Tap "Join Household"

## Using the App

### Main Screen
- **Week Navigation**: Use ← → buttons to navigate weeks
- **Today Card**: Shows today's or tomorrow's schedule (when viewing current week)
- **Schedule List**: Displays 2 weeks (Mon-Fri only)

### Editing Schedule
1. Tap any drop-off or pickup slot
2. Select who is responsible from the list
3. Tap to confirm
4. Changes save automatically

### Refresh Data
Pull down on the schedule list to refresh and see latest changes.

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

### iOS Simulator Issues
```bash
# Reset iOS Simulator
npx expo run:ios --device
```

### Android Emulator Issues
```bash
# Check if emulator is running
adb devices

# Start Android emulator from Android Studio first
# Then run: npm run android
```

### Auth Issues
- Make sure `.env` file exists with correct Supabase credentials
- Check internet connection on emulator/device
- Try signing out and back in

## Common Commands

```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npx tsc --noEmit

# Clear cache
npx expo start --clear

# View logs
npx expo start --dev-client
```

## Testing Accounts

You can use the same accounts as the web app, or create new ones.

## Next Steps

After successful setup:
1. Create or join a household
2. Add schedule assignments for the week
3. Test week navigation
4. Try pull-to-refresh
5. Test on both iOS and Android (if possible)

## Need Help?

See `README.md` for detailed documentation and architecture details.
