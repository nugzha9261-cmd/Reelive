import { Purchases, PurchasesPackage, PurchasesOffering, CustomerInfo, LOG_LEVEL, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined;

export type PlanType = 'monthly' | 'yearly' | 'lifetime';

export interface PlanPackage {
  id: PlanType;
  package: PurchasesPackage;
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

let configurePromise: Promise<boolean> | null = null;
let configured = false;

export function isPurchasesReady(): boolean {
  return configured;
}

export function isNativePurchasesPlatform(): boolean {
  return isNative();
}

/**
 * Configures the RevenueCat SDK exactly once. Every other call in this module
 * awaits this promise so we never hit "singleton instance not configured".
 */
export async function configurePurchases(userId: string | null): Promise<boolean> {
  if (!isNative()) return false;

  if (!configurePromise) {
    configurePromise = (async () => {
      if (!REVENUECAT_PUBLIC_KEY) {
        console.warn('VITE_REVENUECAT_PUBLIC_KEY is not set. RevenueCat purchases will be disabled.');
        return false;
      }

      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        const nativeState = await Purchases.isConfigured();
        if (!nativeState.isConfigured) {
          await Purchases.configure({
            apiKey: REVENUECAT_PUBLIC_KEY,
            appUserID: userId ?? undefined,
          });
        }

        const verifiedState = await Purchases.isConfigured();
        if (!verifiedState.isConfigured) {
          throw new Error('RevenueCat native SDK did not finish configuring.');
        }

        configured = true;
        return true;
      } catch (err) {
        console.warn('RevenueCat configure failed', err);
        configurePromise = null;
        return false;
      }
    })();
  }

  return configurePromise;
}

async function ready(): Promise<boolean> {
  if (!isNative()) return false;
  return configurePurchases(null);
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (!(await ready())) return;

  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.warn('RevenueCat login failed', err);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!(await ready())) return;

  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('RevenueCat logout failed', err);
  }
}

export async function getPremiumOfferings(): Promise<PlanPackage[]> {
  if (!(await ready())) return [];

  const offerings = await Purchases.getOfferings();
  const current = offerings.current as PurchasesOffering | null;

  if (!current?.availablePackages?.length) {
    return [];
  }

  const result: PlanPackage[] = [];

  for (const pkg of current.availablePackages) {
    if (pkg.packageType === PACKAGE_TYPE.MONTHLY) result.push({ id: 'monthly', package: pkg });
    else if (pkg.packageType === PACKAGE_TYPE.ANNUAL) result.push({ id: 'yearly', package: pkg });
    else if (pkg.packageType === PACKAGE_TYPE.LIFETIME) result.push({ id: 'lifetime', package: pkg });
    else {
      // Keep custom RevenueCat package identifiers compatible when they use
      // descriptive names instead of the predefined $rc_* package types.
      const id = `${pkg.identifier} ${pkg.product?.identifier ?? ''}`.toLowerCase();
      if (id.includes('monthly') || id.includes('month')) result.push({ id: 'monthly', package: pkg });
      else if (id.includes('yearly') || id.includes('annual') || id.includes('year')) result.push({ id: 'yearly', package: pkg });
      else if (id.includes('lifetime')) result.push({ id: 'lifetime', package: pkg });
    }
  }

  return result;
}

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export interface EntitlementSnapshot {
  isPremium: boolean;
  productId: string | null;
  expiresAt: string | null;
  lifetime: boolean;
  environment: 'SANDBOX' | 'PRODUCTION' | 'UNKNOWN';
  originalTransactionId: string | null;
  verification: string | null;
  appUserId: string | null;
  activeEntitlements: string[];
  allProductIds: string[];
}

const EMPTY_SNAPSHOT: EntitlementSnapshot = {
  isPremium: false,
  productId: null,
  expiresAt: null,
  lifetime: false,
  environment: 'UNKNOWN',
  originalTransactionId: null,
  verification: null,
  appUserId: null,
  activeEntitlements: [],
  allProductIds: [],
};

/** Maps a RevenueCat CustomerInfo into our entitlement snapshot + logs everything. */
export function snapshotFromCustomerInfo(customerInfo: CustomerInfo, source: string): EntitlementSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyInfo = customerInfo as any;
  const premium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  const allActive = Object.keys(customerInfo.entitlements.active ?? {});
  // Fall back to ANY active entitlement so a mis-named entitlement in the
  // RevenueCat dashboard does not silently leave a paying user on the free tier.
  const effective = premium ?? (allActive.length ? customerInfo.entitlements.active[allActive[0]] : undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ent = effective as any;
  const isSandbox = ent?.isSandbox ?? anyInfo?.originalPurchaseDate === null;

  const snapshot: EntitlementSnapshot = {
    isPremium: !!effective,
    productId: effective?.productIdentifier ?? null,
    expiresAt: effective?.expirationDate ?? null,
    lifetime: !!effective && !effective?.expirationDate,
    environment: isSandbox ? 'SANDBOX' : effective ? 'PRODUCTION' : 'UNKNOWN',
    originalTransactionId: ent?.originalPurchaseDate ?? null,
    verification: ent?.verification ?? ent?.store ?? null,
    appUserId: customerInfo.originalAppUserId ?? null,
    activeEntitlements: allActive,
    allProductIds: customerInfo.allPurchasedProductIdentifiers ?? [],
  };

  console.log('[RC] entitlement snapshot', {
    source,
    appUserId: snapshot.appUserId,
    activeEntitlements: snapshot.activeEntitlements,
    expectedEntitlementId: PREMIUM_ENTITLEMENT_ID,
    entitlementMatched: !!premium,
    productId: snapshot.productId,
    allPurchasedProductIds: snapshot.allProductIds,
    environment: snapshot.environment,
    verification: snapshot.verification,
    expiresAt: snapshot.expiresAt,
    isPremium: snapshot.isPremium,
  });

  return snapshot;
}

export async function purchasePlan(planPackage: PurchasesPackage): Promise<EntitlementSnapshot> {
  if (!(await ready())) {
    throw new Error('Purchases are not connected in this app build. Please install the latest build and try again.');
  }

  console.log('[RC] purchasing package', {
    packageIdentifier: planPackage.identifier,
    packageType: planPackage.packageType,
    productId: planPackage.product?.identifier,
    price: planPackage.product?.priceString,
  });

  const result = await Purchases.purchasePackage({ aPackage: planPackage });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyResult = result as any;
  console.log('[RC] purchase completed', {
    transactionProductId: anyResult?.productIdentifier ?? anyResult?.transaction?.productIdentifier ?? null,
    transactionId: anyResult?.transaction?.transactionIdentifier ?? null,
  });

  const snapshot = snapshotFromCustomerInfo(result.customerInfo, 'purchasePackage');

  if (!snapshot.isPremium) {
    // The StoreKit transaction finished, but RevenueCat granted no entitlement.
    // Re-fetch once (sandbox receipts can lag) before declaring failure.
    const refreshed = await getEntitlementSnapshot(true);
    if (refreshed.isPremium) return refreshed;
    throw new Error(
      'Purchase completed but no "premium" entitlement was granted. Check that the product is attached to the "premium" entitlement in RevenueCat.',
    );
  }

  return snapshot;
}

export async function restorePurchases(): Promise<boolean> {
  if (!(await ready())) return false;

  const { customerInfo } = await Purchases.restorePurchases();
  return snapshotFromCustomerInfo(customerInfo, 'restorePurchases').isPremium;
}

export async function getEntitlementSnapshot(forceRefresh = false): Promise<EntitlementSnapshot> {
  if (!(await ready())) return EMPTY_SNAPSHOT;

  try {
    if (forceRefresh) {
      try {
        await Purchases.syncPurchases();
      } catch (err) {
        console.warn('[RC] syncPurchases failed', err);
      }
    }
    const { customerInfo } = await Purchases.getCustomerInfo();
    return snapshotFromCustomerInfo(customerInfo, forceRefresh ? 'getCustomerInfo(refresh)' : 'getCustomerInfo');
  } catch (err) {
    console.warn('[RC] getCustomerInfo failed', err);
    return EMPTY_SNAPSHOT;
  }
}

/** Equivalent of observing StoreKit Transaction.updates. */
export async function addEntitlementListener(
  cb: (snapshot: EntitlementSnapshot) => void,
): Promise<() => void> {
  if (!(await ready())) return () => {};

  const handler = (customerInfo: CustomerInfo) => {
    cb(snapshotFromCustomerInfo(customerInfo, 'customerInfoUpdateListener'));
  };

  try {
    await Purchases.addCustomerInfoUpdateListener(handler);
  } catch (err) {
    console.warn('[RC] addCustomerInfoUpdateListener failed', err);
    return () => {};
  }

  return () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Purchases as any).removeCustomerInfoUpdateListener?.(handler);
    } catch {
      /* noop */
    }
  };
}

export async function getCustomerInfo(): Promise<{ isPremium: boolean; productId: string | null }> {
  const snapshot = await getEntitlementSnapshot();
  return { isPremium: snapshot.isPremium, productId: snapshot.productId };
}
