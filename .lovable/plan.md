## Add Delete Journey Feature

Add a delete option inside the Journey detail page that removes the journey along with all its clips and storage files, with a clear warning so users save their compiled reels first.

### UI changes (Journey detail page)

- Add a "Delete Journey" option in the header menu (three-dot/overflow menu next to existing actions). Red/destructive styling.
- Tapping it opens a confirmation dialog (AlertDialog) with:
  - Title: "Delete this journey?"
  - Warning body: "This will permanently delete the journey and all its video clips. This cannot be undone. Make sure you've saved any compiled reels to your Reels section or downloaded them to your device before continuing."
  - Buttons: "Cancel" and "Delete Journey" (destructive).
- Show a loading state while deletion runs; on success, toast "Journey deleted" and navigate back to Home.

### Deletion logic (extend `useJourneys` hook)

Add `deleteJourney(journeyId)` that:
1. Fetches all `video_clips` for the journey (to get `video_url` + `thumbnail_url` storage paths).
2. Removes those files from the `videos` storage bucket in batch.
3. Deletes rows from `video_clips` (will also decrement counts via existing trigger).
4. Deletes related `compilation_jobs` rows for this journey (clean up pending jobs).
5. Deletes the `journeys` row.
6. Invalidates journey/clip queries.

Note: existing `compilations` (saved reels) remain untouched so users keep their saved videos — this is why the warning tells them to save the compile first.

### Files to modify

- `src/hooks/useJourneys.ts` — add `deleteJourney` mutation.
- `src/pages/Journey.tsx` (or the journey detail page component) — add menu item + AlertDialog + handler.

No database migration needed (RLS DELETE policies already exist for journeys, video_clips, compilation_jobs, and storage bucket).
