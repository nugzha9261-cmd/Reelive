import { Purchases, PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-capacitor';

const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY as string | undefined;

export type PlanType = 'monthly' | 'yearly' | 'lifetime';

export interface PlanPackage {
  id: PlanType;
  package: PurchasesPackage;
}

function isNative(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined
  );
}

export async function configurePurchases(userId: string | null): Promise<void> {
  if (!isNative()) {
    return;
  }

  if (!REVENUECAT_PUBLIC_KEY) {
    console.warn('VITE_REVENUECAT_PUBLIC_KEY is not set. RevenueCat purchases will be disabled.');
    return;
  }

  await Purchases.configure({
    apiKey: REVENUECAT_PUBLIC_KEY,
    appUserID: userId ?? undefined,
  });

  await Purchases.setLogLevel({ level: 'DEBUG' });
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (!isNative()) return;

  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.warn('RevenueCat login failed', err);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!isNative()) return;

  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('RevenueCat logout failed', err);
  }
}

export async function getPremiumOfferings(): Promise<PlanPackage[]> {
  if (!isNative()) {
    return [];
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.current as PurchasesOffering | null;

  if (!current?.availablePackages?.length) {
    return [];
  }

  const result: PlanPackage[] = [];

  for (const pkg of current.availablePackages) {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('monthly')) result.push({ id: 'monthly', package: pkg });
    else if (id.includes('yearly') || id.includes('annual')) result.push({ id: 'yearly', package: pkg });
    else if (id.includes('lifetime')) result.push({ id: 'lifetime', package: pkg });
  }

  return result;
}

export async function purchasePlan(planPackage: PurchasesPackage): Promise<boolean> {
  if (!isNative()) {
    return false;
  }

  const result = await Purchases.purchasePackage({ aPackage: planPackage });
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }

  const { customerInfo } = await Purchases.restorePurchases();
  const premium = customerInfo.entitlements.active['premium'];
  return !!premium;
}

export async function getCustomerInfo(): Promise<{ isPremium: boolean; productId: string | null }> {
  if (!isNative()) {
    return { isPremium: false, productId: null };
  }

  const { customerInfo } = await Purchases.getCustomerInfo();
  const premium = customerInfo.entitlements.active['premium'];
  return {
    isPremium: !!premium,
    productId: premium?.productIdentifier ?? null,
  };
}
