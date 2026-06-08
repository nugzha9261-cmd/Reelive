## Problem

When the user holds the phone upside down (or in landscape) and records, the saved clip stays in the raw sensor orientation. Native camera apps rotate the frame using the device's accelerometer so the final video always appears upright. Our recorder captures pixels directly from `MediaRecorder` → re-encodes through a canvas in `speedUpBlob`, and we never apply any rotation, so upside-down clips stay upside down.

## Fix

Capture the device orientation at the moment recording **starts** (this is how iOS/Android camera apps decide final video orientation — locked at capture, not at playback), then bake that rotation into the canvas pass that already runs in `speedUpBlob`. No extra encoding pass, no native plugin needed.

### Changes in `src/hooks/useVideoRecording.ts`

1. **Track orientation**
   - Add `captureOrientationRef = useRef<0 | 90 | 180 | -90>(0)`.
   - Helper `getDeviceOrientation()` reads `window.screen.orientation?.angle` (modern) with fallback to `window.orientation` (older iOS). Normalize to one of `0 | 90 | 180 | -90`.

2. **Lock orientation at `startRecording`**
   - Set `captureOrientationRef.current = getDeviceOrientation()` right before `mediaRecorder.start(...)`. This matches native camera behavior (orientation frozen when the user taps record).

3. **Apply rotation in `speedUpBlob`**
   - After `await video.onloadedmetadata`, read `vw = video.videoWidth`, `vh = video.videoHeight`, and `angle = captureOrientationRef.current`.
   - Size the canvas: for `±90°` swap width/height (`canvas.width = vh; canvas.height = vw`); for `0°` and `180°` use `vw × vh`.
   - In the `drawFrame` loop, wrap the draw with:
     ```ts
     ctx.save();
     ctx.translate(canvas.width / 2, canvas.height / 2);
     ctx.rotate((angle * Math.PI) / 180);
     ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh);
     ctx.restore();
     ```
   - Keep `ctx.filter` exactly as today (set once before the loop is fine, but since we now `save/restore` per frame, set `ctx.filter` inside the save block or just before — preserves current filter-baking behavior).

4. **Pass-through for `rebakeWithFilter`**
   - No change needed — it calls `speedUpBlob`, which now reads `captureOrientationRef`. The orientation captured at record time stays valid through retakes/filter rebakes (we don't reset it on retake; next `startRecording` overwrites it).

### Notes / edge cases

- **Front camera mirroring** is unrelated and not changed here — that's a horizontal flip preference, not orientation.
- **Live preview** (`<video>` showing the camera feed) is not rotated — the browser/OS already orients the preview correctly via CSS/viewport. Only the *encoded* output needs rotation.
- **Capacitor WebView on iOS**: `screen.orientation.angle` is supported; `window.orientation` is the fallback for older iOS WebViews. Both are read at capture time so we don't depend on listeners.
- No DB, types, or UI changes. Single file touched: `src/hooks/useVideoRecording.ts`.

## Out of scope

- Mid-recording rotation (native apps also lock at start).
- Writing rotation metadata into the container — we physically rotate pixels, which is simpler and works everywhere including Shotstack downstream.
