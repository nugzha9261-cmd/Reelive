# Hybrid Reel Storage Plan

Goal: reels are watchable anytime, anywhere, even offline — without runaway cloud cost.

## How it works

1. **Server rehost (permanent cloud copy)** — when Shotstack finishes, the `compile-status` edge function downloads the rendered mp4 and uploads it to the `compilations` storage bucket. The DB stores the permanent Cloud URL, not the expiring Shotstack URL.
2. **Device cache (instant + offline)** — the first time a reel plays on a device, the app downloads the mp4 to the device's app storage via `@capacitor/filesystem`. Future plays load from disk instantly with zero egress cost.
3. **Fallback** — if the local file is missing (new device, reinstall, cleared cache), the app streams from the Cloud URL and re-caches it.

## Changes

### Backend
- **`supabase/functions/compile-status/index.ts`**: when Shotstack reports `done`, fetch the mp4, upload to `compilations/{user_id}/{jobId}.mp4` with service role, set `result_url` to the permanent public URL. Keep Shotstack URL as fallback only if rehost fails.

### Client
- **`src/hooks/useCompilations.ts`**: remove the client-side rehost added last turn (server handles it now). `saveCompilationFromUrl` just stores the URL it receives.
- **New `src/lib/reel-cache.ts`**: small helper around `@capacitor/filesystem`:
  - `getLocalReelUri(compilationId, remoteUrl)` — returns local file URI if cached, otherwise downloads, saves to `Directory.Data/reels/{id}.mp4`, returns the new local URI. On web, returns `remoteUrl` unchanged.
  - `deleteLocalReel(compilationId)` — called on reel delete.
  - `getCacheSize()` / `clearCache()` — for a future Profile setting.
- **`src/components/reels/ReelCard.tsx`**: resolve `compilation.videoUrl` through `getLocalReelUri()` before passing to `<video src>`. Keep current error overlay for legacy broken reels.
- **`src/pages/Reels.tsx`** (and any other place reels play): same resolver.

### Existing broken reels
Legacy reels saved before the rehost fix still point at expired Shotstack URLs and cannot be recovered (source mp4 is gone). They keep showing the "no longer available — re-compile" message already in `ReelCard.tsx`.

## Cost impact
- Each reel: one upload + one download per device, ever. ~5–15 MB per reel.
- 1,000 reels stored ≈ $0.02/month storage. Egress charged once per device per reel instead of every play.

## Out of scope
- No cache size cap UI yet (can add later in Profile).
- No background pre-download of other users' reels (only the playing one is cached).
- No migration for already-broken reels.
