# Plan: Convert REELIVE to iOS App and Submit to App Store

## Goal
Package the REELIVE web app as a native iOS app using Capacitor, then build, archive, and upload it to the App Store using the existing Apple Developer Program subscription.

## Current State
- Capacitor dependencies (`@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`) are already installed.
- `capacitor.config.ts` still uses the old app name `Reliv` and bundle ID `com.reliv.app`.
- The iOS platform directory (`ios/`) does not exist yet.
- The user has an Apple Developer Team ID: `32X74B6969`.
- Desired bundle ID: `com.nexzonelabs.reelive`.

## Steps

### 1. Update Capacitor configuration
- Edit `capacitor.config.ts`:
  - Set `appName` to `REELIVE`.
  - Set `appId` to `com.nexzonelabs.reelive`.
  - Keep `webDir: 'dist'`.
  - Keep iOS-specific settings for camera access.

### 2. Add the iOS platform
- Run `npx cap add ios` to generate the native Xcode project.

### 3. Build the web assets
- Run `npm run build` to produce the `dist/` folder.

### 4. Sync web assets to the iOS project
- Run `npx cap sync ios` to copy the built assets into the iOS project and install native plugins.
- Repeat this command whenever web code or Capacitor plugins change.

### 5. Open and configure the project in Xcode
- Open the generated `ios/App/App.xcworkspace` in Xcode on a Mac.
- In the project navigator, select the App target and configure:
  - **Bundle Identifier**: `com.nexzonelabs.reelive`.
  - **Team**: Select the Apple Developer team matching Team ID `32X74B6969`.
  - **Signing**: Enable "Automatically manage signing" (or configure manual provisioning profiles if preferred).
  - **Deployment Target**: Set the minimum iOS version (e.g., iOS 14.0 or higher, matching Capacitor 8 requirements).
  - **App Icon**: Replace the placeholder icons in `App/App/Assets.xcassets/AppIcon.appiconset` with the REELIVE logo assets.
  - **Launch Screen**: Update `LaunchScreen.storyboard` if a branded launch screen is needed.
  - **Info.plist**: Add or verify usage descriptions for:
    - Camera (`NSCameraUsageDescription`)
    - Microphone (`NSMicrophoneUsageDescription`)
    - Photo Library if used (`NSPhotoLibraryUsageDescription`)
    - Local Notifications (`UIBackgroundModes` > `remote-notification` / `fetch` if needed)
  - **Capabilities**: Enable any required capabilities such as Push Notifications, Associated Domains (for `lifeshots.app` deep links), or Background Modes if required by the app.

### 6. Test the app on a device or simulator
- Run the app on the iOS Simulator from Xcode, or use `npx cap run ios`.
- For physical device testing, connect an iPhone, trust the developer certificate, and run the app.
- Verify camera capture, local notifications, and video playback work as expected.

### 7. Build and archive for App Store distribution
- Select the App target and choose a "Generic iOS Device" or connected device as the build target.
- Go to **Product > Archive** in Xcode.
- Once the archive is complete, open the **Organizer** window.
- Select the archive and click **Distribute App**.
- Choose **App Store Connect**, then **Upload**.
- Follow the prompts to sign the app and upload the build to App Store Connect.

### 8. Configure App Store Connect and submit for review
- Log in to [App Store Connect](https://appstoreconnect.apple.com).
- Create a new iOS app if it doesn't exist:
  - **Platform**: iOS
  - **App Name**: REELIVE
  - **Bundle ID**: `com.nexzonelabs.reelive`
  - **SKU**: a unique identifier (e.g., `reelive-2026-001`)
- Fill in the app information:
  - App description, keywords, support URL, marketing URL.
  - Screenshots for required iPhone sizes.
  - App Store icon (1024x1024px).
  - Build selection: choose the uploaded build.
  - Pricing and availability.
  - App Review information (contact info, demo account if needed, notes for the reviewer).
- Submit the app for review.

### 9. Post-launch updates
- For future updates: make web changes, run `npm run build`, then `npx cap sync ios`, open Xcode, bump the version/build number, archive, and upload again.

## Technical Notes
- The project uses Capacitor 8, which generally requires a minimum iOS deployment target of 14.0.
- The web app uses native camera, filesystem, local notifications, and share plugins; these require the corresponding iOS usage strings and capabilities.
- The hybrid storage strategy already implemented (`src/lib/reel-cache.ts`) works on-device once compiled; cloud storage remains the source of truth for cross-device restore.
- The custom domains `lifeshots.app` and `www.lifeshots.app` can be configured as Associated Domains later if universal links are needed.

## Deliverables
- Updated `capacitor.config.ts` with correct app name and bundle ID.
- Generated `ios/` Capacitor iOS project.
- Configured Xcode project ready for signing, archiving, and upload.
- Documentation of the App Store Connect submission flow.
