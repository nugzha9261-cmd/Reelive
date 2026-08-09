# REELIVE App Store Pricing & RevenueCat Plan

## Goal
Wire up real in-app purchases for the App Store launch using RevenueCat, and configure the App Store Connect subscription products so users can buy Premium when the app goes live.

## Current state
- The paywall (`src/pages/Paywall.tsx`) shows three plans: Monthly $4.99, Yearly $39.99, Lifetime $79.99, but the **purchase button only shows a placeholder toast**.
- The `usePremium` hook already reads premium status from the `profiles` table and listens for realtime updates.
- A `revenuecat-webhook` edge function already exists to sync RevenueCat events into the `profiles` table.
- RevenueCat secrets (`REVENUECAT_PUBLIC_KEY`, `REVENUECAT_WEBHOOK_AUTH_HEADER`) are already registered, but their values may need updating.
- RevenueCat SDK packages (`purchases-capacitor`, `purchases-typescript-internal`) are **not installed yet**.
- The app bundle ID is `com.nexzonelabs.reelive`.

## Plan

### 1. Install RevenueCat SDK
- Add `purchases-capacitor` to the project.
- Run `npx cap sync` so the iOS native layer picks up the plugin.

### 2. Configure RevenueCat dashboard
- Create a new RevenueCat project for the App Store app.
- Add the iOS app using bundle ID `com.nexzonelabs.reelive`.
- Create three products that match the App Store product IDs we will create:
  - Monthly subscription
  - Yearly subscription
  - Lifetime (non-renewing or consumable, as appropriate)
- Create an entitlement called `premium` and attach all three products to it.
- Copy the public SDK key into `REVENUECAT_PUBLIC_KEY`.
- In RevenueCat dashboard, add the Supabase edge function webhook URL as the RevenueCat webhook URL and set the shared auth header in `REVENUECAT_WEBHOOK_AUTH_HEADER`.

### 3. Configure App Store Connect products
- Open App Store Connect → REELIVE app → Subscriptions.
- Create the subscription group (e.g., "Premium").
- Create three subscription products with the exact product IDs used in RevenueCat:
  - Monthly subscription (auto-renewable)
  - Yearly subscription (auto-renewable)
  - Lifetime (non-renewing subscription or one-time in-app purchase, depending on Apple's options)
- Fill in display name, description, and pricing for each territory.
- Submit the products for review. They must be in "Approved" or "Ready to Submit" status before the app can reference them in production.

### 4. Wire up the app purchase flow
- Create a new hook or service file (`src/lib/revenuecat.ts`) that:
  - Initializes RevenueCat on app start with the public key and the Supabase `user.id` as the app user ID.
  - Fetches available offerings/products.
  - Provides a `purchase(package)` function.
  - Provides a `restorePurchases()` function.
- Update `src/pages/Paywall.tsx`:
  - Replace the placeholder `handlePurchase` with a real purchase call through RevenueCat.
  - Show loading state while purchasing.
  - Show success/failure messages via toast.
  - Add a "Restore Purchases" button.
- Ensure the purchase is gated to the selected plan (monthly/yearly/lifetime).

### 5. Verify webhook integration
- Confirm the RevenueCat webhook URL points to the deployed `revenuecat-webhook` edge function.
- Confirm the `REVENUECAT_WEBHOOK_AUTH_HEADER` secret matches the header RevenueCat sends.
- Confirm the `profiles` table columns are sufficient: `is_premium`, `lifetime_purchase`, `premium_expires_at`, `active_product_id`, `revenuecat_customer_id`, `premium_updated_at` are all present.

### 6. Add iOS-specific configuration
- Verify the bundle ID is `com.nexzonelabs.reelive` in `capacitor.config.ts` and the iOS project.
- Verify the "In-App Purchase" capability is enabled in the Xcode target's Signing & Capabilities tab.
- Add a sandbox tester account in App Store Connect for testing purchases without real money.

### 7. Test before submission
- Build and run on a physical device (purchases cannot be tested in the iOS Simulator).
- Test each plan:
  - Purchase monthly
  - Purchase yearly
  - Purchase lifetime
  - Restore purchases
  - Verify premium status updates in the app and in the Supabase `profiles` table.
- Confirm RevenueCat dashboard shows the test events and the Supabase webhook updated the profile.
- Ensure the app handles billing errors, cancellation, and expired subscriptions gracefully.

### 8. App Store submission metadata
- In App Store Connect, confirm the app is listed as **Free** (the download price is free; money is made through in-app purchases).
- In the "In-App Purchases" section of the App Store page, ensure the three products are attached to the app version so they appear on the App Store listing.
- Update the App Store screenshot/copy if needed to mention premium features.

## Out of scope
- Changing the actual prices shown on the paywall. The plan keeps $4.99/month, $39.99/year, and $79.99/lifetime.
- Adding new premium features or redesigning the paywall UI.
- Submitting the app to Apple (this is done by the user after the code is ready).

## Dependencies
- Access to the RevenueCat dashboard to create the project and copy the SDK key.
- Access to App Store Connect to create the products and attach them to the app version.
- A physical iOS device for testing purchases.

## Open questions
- Should the Lifetime option be a non-renewing subscription or a one-time in-app purchase in App Store Connect? (Apple recommends non-renewing subscription for a one-time unlock that lasts forever; one-time in-app purchase is also valid.)
- Do you want a free trial or introductory offer for yearly/monthly subscriptions? This can be configured in App Store Connect but needs to be reflected in the paywall copy if added.
