# Create In-App Support Page

## Goal
Add a real support page to the app with the contact email `admin@nexonelabs.com`, and wire it from the Profile screen's "Help & support" row.

## What to build

1. **New page component** `src/pages/Support.tsx`
   - Page title: "Help & Support" or "Support"
   - Contact email: `admin@nexonelabs.com`
   - A tappable/clickable mailto link so users can email directly
   - Short explanation (e.g., "Questions, feedback, or bug reports? Reach us anytime.")
   - Use the existing `MobileLayout` wrapper for consistent safe-area padding and header

2. **Add route** in `src/App.tsx`
   - Path: `/support`
   - Protected route (only accessible when signed in, like Profile)

3. **Wire the Profile link** in `src/pages/Profile.tsx`
   - Add `onClick` to the "Help & support" row to navigate to `/support`

## URLs

- In-app route: `/support`
- Public web URL (published site): `https://lifeinreel.lovable.app/support` or `https://lifeshots.app/support` (if custom domain is live)
- This is the URL you can paste into App Store Connect as the **Support URL** if Apple asks for one

## Out of scope

- No backend or form submission; support is email-only for now
- No privacy policy or terms page changes unless you ask for them
