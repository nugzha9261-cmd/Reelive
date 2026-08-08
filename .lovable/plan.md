# App Store Name Conflict Resolution

## Problem
Apple rejected the app name "REELIVE" in App Store Connect because that exact App Name is already registered by another developer. The App Name field (under the iOS home screen icon) must be unique globally.

## Decision
Use the differentiated App Name **"REELIVE: Daily Clips"** to preserve the brand while satisfying Apple's uniqueness requirement. This is under 30 characters and clearly describes the app's purpose.

## Changes to make

1. Update the display name in the Capacitor config so the bundled iOS app reflects the new name:
   - `capacitor.config.ts` → `appName: 'REELIVE: Daily Clips'`

2. Update web metadata to match the new App Store name:
   - `index.html` → `<title>` and `description`

3. Update the iOS native display name:
   - `ios/App/App/Info.plist` → `CFBundleDisplayName`

4. Update the in-app premium screen copy to stay consistent:
   - `src/pages/Paywall.tsx` → "Unlock the full REELIVE: Daily Clips experience"

## What stays the same

- Bundle ID: `com.nexzonelabs.reelive`
- URL scheme: `reelive`
- App logo and icon assets
- All other references to "REELIVE" as the brand name

## After code changes

Run the standard native sync so the updated iOS app name is written into the Xcode project:

```text
npm install
npm run build
npx cap sync ios
```

Then re-open Xcode and submit the new App Name in App Store Connect.
