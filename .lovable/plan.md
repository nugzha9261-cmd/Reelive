## Rebrand: Reliv → REELIVE

The user wants to rebrand the app to **REELIVE** using the new logo they uploaded. Colors and Capacitor bundle ID stay as-is.

### Changes

1. **Register new logo as Lovable Asset**
   - Use the uploaded `ChatGPT_Image_Jun_20_2026_at_08_04_16_AM.png`.
   - Run `lovable-assets create` to generate a CDN-hosted `.asset.json` pointer (e.g., `src/assets/reelive-logo.png.asset.json`).

2. **Replace logo in Onboarding screen**
   - `src/pages/Onboarding.tsx`: swap the `reliv-logo.png.asset.json` import for the new logo asset.
   - Update `alt="Reliv"` → `alt="REELIVE"`.

3. **Update `index.html` metadata**
   - `<title>`: "Reliv — Relive your everyday moments" → "REELIVE — Relive your everyday moments"
   - `<meta name="description">`, `<meta name="author">`: Reliv → REELIVE
   - Open Graph `og:title` and `og:description`: Reliv → REELIVE

4. **Update in-app brand name references**
   - `src/pages/Paywall.tsx`: "Unlock the full Reliv experience" → "Unlock the full REELIVE experience"
   - `src/hooks/useLocalNotifications.ts`: "relive your month" copy stays (it’s a verb), but verify no other stray "Reliv" references.
   - `src/index.css`: update the comment "Reliv — Warm Sunset Palette" → "REELIVE — Warm Sunset Palette"

5. **Clean up old logo asset**
   - Delete `src/assets/reliv-logo.png.asset.json` via the assets tool so the old pointer is removed from the codebase.

### Out of scope (per clarifying answers)
- Color palette: staying warm sunset.
- Capacitor `appId` / `appName`: staying as `com.reliv.app` / `Reliv`.

### Result
All visible brand surfaces in the app and web metadata reflect **REELIVE** with the new logo, while underlying technical identifiers remain unchanged.