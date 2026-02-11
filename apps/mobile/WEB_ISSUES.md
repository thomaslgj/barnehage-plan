# Web Platform Issues with NativeWind

## Current Issue

When running on web (`npm run web`), you may encounter:
```
MIME type ('application/json') is not executable
```

## Root Cause

NativeWind v2 (with Tailwind CSS v3) has **limited web support** in Expo. The babel plugin transforms `className` to React Native styles, but on web this transformation can cause build issues.

## Recommended Solutions

### Option 1: Use Native Platforms (Recommended)
The mobile app is primarily designed for iOS and Android. Test on these platforms:

```bash
# iOS (macOS only)
npm run ios

# Android
npm run android
```

**These work perfectly with NativeWind!** ✅

### Option 2: Temporarily Disable Web
If web testing is not required, skip it and focus on native platforms.

### Option 3: Add Web-Specific Fallbacks (Advanced)
You could conditionally use StyleSheet on web and className on native:

```typescript
import { Platform, StyleSheet } from 'react-native';

// Use this approach if you need web support
<View
  {...(Platform.OS === 'web'
    ? { style: styles.container }
    : { className: "bg-card p-4" }
  )}
/>
```

But this defeats the purpose of NativeWind and adds complexity.

### Option 4: Upgrade to NativeWind v4 (Future)
NativeWind v4 has better web support, but requires:
- Tailwind CSS v4 (currently in beta)
- Different configuration approach
- Migration effort

## Why This Happens

1. **Babel Transform**: NativeWind's babel plugin transforms `className` to StyleSheet
2. **Web Platform**: Expo web expects different handling of styles
3. **Build Error**: Metro bundler catches an error and returns JSON instead of JS bundle
4. **MIME Type**: Browser refuses to execute JSON as JavaScript

## Current Status

- ✅ **iOS**: Works perfectly
- ✅ **Android**: Works perfectly
- ❌ **Web**: Has issues with NativeWind v2

## Testing Strategy

**For development**: Use iOS Simulator or Android Emulator
**For production**: Deploy as native apps (iOS/Android)
**For web version**: Keep using the Next.js web app (already works great!)

## Long-term Solution

Consider keeping web and mobile as separate codebases:
- **Web**: Next.js with Tailwind CSS v4 (already working)
- **Mobile**: Expo with NativeWind v2 (works on native)

This is actually the **recommended approach** - optimizing each platform for its strengths rather than forcing full cross-platform compatibility.

## Workaround for Now

If you absolutely need web support for testing:

1. **Test core functionality on native first**
2. **Use web app for web testing** (the Next.js app works great!)
3. **Accept that styling might differ on web** during mobile development

## Summary

**Bottom line**: NativeWind works great on iOS and Android. For web, use the existing Next.js web app. This gives you the best of both worlds! 🎉
