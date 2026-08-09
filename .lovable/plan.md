# Plan: Handle App Store Connect France Export Compliance

## Background

After selecting the standard encryption option in App Store Connect, Apple is now asking whether REELIVE is available in France. France requires a separate cryptographic import declaration (the French encryption declaration) for apps that use encryption. This is independent of Apple's U.S. export compliance.

## Two available paths

### Path A: Exclude France at launch (recommended)

- In App Store Connect, set France to **Not Available** for this build/app.
- This bypasses the French declaration requirement and the build can proceed immediately.
- France can be added as a territory later, once the required documentation is ready.
- No code changes are needed in the Xcode project.

### Path B: Include France and submit the declaration

- In App Store Connect, confirm France is **Available**.
- Apple will require you to upload a French encryption declaration for the app.
- After submission, wait for Apple/France to review and approve the documentation.
- Once approved, Apple provides a key value that must be added to `Info.plist` in Xcode.
- The build cannot be released in France until the declaration is approved.

## Recommendation

Use **Path A** for the initial TestFlight and launch. REELIVE uses only standard HTTPS/TLS encryption (Supabase APIs), so it qualifies for simplified U.S. export compliance, but the French declaration still adds paperwork and delays. Excluding France at launch gets the app live faster; France can be added in a later update.

## Deliverables

- If Path A is chosen: a short checklist of App Store Connect territory settings.
- If Path B is chosen: a step-by-step guide to completing the French encryption declaration, including the `Info.plist` key to add after Apple provides it.
