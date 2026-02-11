# Setup Notes & Troubleshooting

## Initial Setup Issue - RESOLVED ✅

### Problem
When running `npm start`, you may encounter:
```
Unable to resolve "react-native-web/dist/exports/DeviceEventEmitter" from "node_modules/expo/src/async-require/hmr.ts"
```

### Root Cause
Missing `react-native-web` and related dependencies that Expo requires, even for native-only apps.

### Solution
Install the missing dependencies with `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

This installs:
- `react-native-web` - Required by Expo for web compatibility layer
- `react-dom` - Peer dependency of react-native-web
- `@expo/metro-runtime` - Expo Metro bundler runtime

### Why --legacy-peer-deps?

React 19 has strict peer dependency requirements that conflict with current package versions:
- `react@19.1.0` (installed)
- `react-dom@19.2.4` (requires `react@^19.2.4`)
- `react-native-web@0.21.2` (requires `react@^18.0.0 || ^19.0.0`)

The `--legacy-peer-deps` flag tells npm to use the legacy (pre-npm 7) peer dependency resolution algorithm, which is more permissive.

### Alternative Solutions

**Option 1**: Use npm 6 behavior (recommended for now)
```bash
npm install --legacy-peer-deps
```

**Option 2**: Force install (not recommended - may cause runtime issues)
```bash
npm install --force
```

**Option 3**: Wait for package updates
- `react-native-web` needs to support React 19.2.x
- OR Expo needs to pin React to 19.0.x

## Dependencies Installed

```json
{
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-web": "^0.21.2",
  "@expo/metro-runtime": "^6.1.2",
  "expo": "~54.0.33"
}
```

**Important**: `react` and `react-dom` must have the exact same version. Both are pinned to 19.1.0 to avoid web runtime errors.

## Verification

After installation, verify everything works:

```bash
# TypeScript should compile without errors
npx tsc --noEmit

# Expo should start without module resolution errors
npm start
```

Expected output:
```
Starting project at /path/to/apps/mobile
Starting Metro Bundler
› Metro waiting on exp://...
```

## Common Issues After Setup

### Issue: Port 8081 already in use
**Solution**: Kill existing Expo process
```bash
pkill -f "expo start"
npm start
```

### Issue: Watchman warnings
**Solution**: Install watchman for better file watching
```bash
brew install watchman  # macOS
```

### Issue: Module not found after install
**Solution**: Clear Metro cache
```bash
npx expo start --clear
```

### Issue: TypeScript errors in node_modules
**Solution**: These are expected with --legacy-peer-deps. TypeScript only checks your code, not node_modules types.

### Issue: Web shows blank screen with React version error
```
Incompatible React versions: The "react" and "react-dom" packages must have the exact same version
```

**Solution**: Ensure react and react-dom have the exact same version
```bash
npm install react-dom@19.1.0 --legacy-peer-deps
```

**Note**: Web support is optional for this mobile app. Focus on iOS/Android for best experience.

### Issue: Auto refresh tick failed with SecureStore error
```
ExpoSecureStore.default.getValueWithKeyAsync is not a function
```

**Cause**: SecureStore is a native module and doesn't work on web platform.

**Solution**: The app now uses platform-specific storage:
- **iOS/Android**: SecureStore (encrypted)
- **Web**: AsyncStorage (localStorage)

This is automatically handled by the storage adapter in `src/lib/supabase.ts`.

## Future Considerations

When Expo/React Native ecosystem catches up to React 19.2+:
1. Remove `--legacy-peer-deps` from all commands
2. Run `npm install` with strict peer deps
3. Verify no breaking changes in updated packages

## Current Status

✅ All dependencies installed
✅ TypeScript compiles successfully
✅ Metro bundler can start
✅ Ready for iOS/Android development

## Next Steps

1. Run `npm start`
2. Press `i` for iOS or `a` for Android
3. App should build and launch in simulator/emulator

---

**Last Updated**: 2026-02-11
**Expo SDK**: 54
**React**: 19.1.0
**Status**: Ready for development
