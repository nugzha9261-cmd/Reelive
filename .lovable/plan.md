# Restyle Day badge

Change the "Day X" badge overlay on compiled reels from the current orange pill to a handwritten white text with a soft shadow behind it — no background pill.

## Change

File: `supabase/functions/compile-video/index.ts` → `buildBadgeSvg()`

- Remove the orange `<rect>` background entirely.
- Text color: white (`#ffffff`).
- Font: handwritten style — use `"Caveat", "Comic Sans MS", cursive` (matches the app's Caveat aesthetic). Since Shotstack renders SVGs server-side without loading web fonts, embed the Caveat font via `<style>` + `@font-face` pointing to the Google Fonts TTF URL so the SVG renders with the real handwritten face.
- Add a soft drop shadow behind the text using an SVG `<filter>` with `feGaussianBlur` + `feOffset` (black at ~55% opacity, blur ~4, offset 2/3) so the text stays legible over any background.
- Keep size roughly the same (`font-size: 96` — slightly larger since there's no pill), same position (bottom, `offset.y: 0.2`), same per-day upload/caching flow.

## Out of scope

- Date stamp overlay styling.
- Badge position/timing.
- Any client-side thumbnail styling.

## Files touched

- `supabase/functions/compile-video/index.ts`
