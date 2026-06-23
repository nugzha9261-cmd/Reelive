# Add date stamp overlay to compilations

Add a small "Jun 23, 2026"-style date stamp to the top-left of every clip in a compiled reel. Default ON, with a toggle on the Compile screen so the user can turn it off per reel.

## UX

- **Compile screen** — new toggle row under existing options labeled **"Show date on each clip"**, default **on**. Sits next to / below the existing music & filter controls.
- **Output** — small white text with a soft dark shadow, top-left corner, ~5% margin from edges. Formatted like `Jun 23, 2026` (using the clip's `capturedAt` date).
- **Day badge** — unchanged. Both can appear together.

## Implementation

### 1. Compile screen state
- `src/pages/Compile.tsx`: add `const [showDate, setShowDate] = useState(true)`.
- Add a `<Switch>` row using the existing shadcn `switch` component, label "Show date on each clip".
- Pass `showDate` through to the compile invocation alongside existing `clipUrls` / `clipDayNumbers`.

### 2. Pass per-clip dates to the edge function
- `useCloudCompilation` (and/or `useVideoCompilation` if used for cloud path) currently sends `clipUrls` and `clipDayNumbers`. Add `clipDates: string[] | null` — array of ISO `capturedAt` values aligned with `clipUrls`, or `null` when the toggle is off.

### 3. Edge function — render date overlays via Shotstack
File: `supabase/functions/compile-video/index.ts`

- Accept new field `clipDates?: (string | null)[]` from request body.
- When present, for each unique date string build a tight SVG (same approach as the existing Day badge):
  - Format date as `MMM d, yyyy` (e.g. `Jun 23, 2026`) server-side using `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.
  - White text (#ffffff), `font-size: 36`, semi-transparent black pill (`#000000` @ 0.45 opacity) with rounded corners, small padding. No "Day X" styling — keep it subtle.
- Upload each unique-date SVG to the `compilations` bucket under `dates/date-<slug>-<userId>-<ts>.svg`, cache public URLs by date string.
- Add a new overlay track of `image` clips, one per video clip with a date:
  ```
  { asset: { type: 'image', src }, start: i*2, length: 2,
    position: 'topLeft', offset: { x: 0.03, y: 0.03 }, fit: 'none', scale: 1 }
  ```
- Track order (top → bottom): day-badge overlay (existing), date overlay (new), video, soundtrack. Date sits above video, below day badge — they don't visually overlap anyway (top-left vs bottom-center).

### 4. Persistence
- Store toggle state in the `compilation_jobs` row (optional, nice for re-renders): add column `show_date boolean default true` via migration. Not strictly required for the feature; can skip if you'd rather keep schema unchanged.

## Out of scope
- Local (in-app preview) date overlay on `SelectableClipThumbnail` — thumbnails already show the date in the bottom strip.
- The legacy client-side `ffmpeg-compiler.ts` path — cloud Shotstack is the production compiler per project memory.
- Changing the existing Day badge styling.

## Files touched
- `src/pages/Compile.tsx` — toggle UI + state
- `src/hooks/useCloudCompilation.ts` — forward `clipDates`
- `supabase/functions/compile-video/index.ts` — SVG generation + overlay track
- (Optional) new migration to add `show_date` column
