import { Purchases, PurchasesPackage, PurchasesOffering, LOG_LEVEL, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
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

export async function purchasePlan(planPackage: PurchasesPackage): Promise<boolean> {
  if (!(await ready())) {
    throw new Error('Purchases are not connected in this app build. Please install the latest build and try again.');
  }

  await Purchases.purchasePackage({ aPackage: planPackage });
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  if (!(await ready())) return false;

  const { customerInfo } = await Purchases.restorePurchases();
  const premium = customerInfo.entitlements.active['premium'];
  return !!premium;
}

export async function getCustomerInfo(): Promise<{ isPremium: boolean; productId: string | null }> {
  if (!(await ready())) {
    return { isPremium: false, productId: null };
  }

  const { customerInfo } = await Purchases.getCustomerInfo();
  const premium = customerInfo.entitlements.active['premium'];
  return {
    isPremium: !!premium,
    productId: premium?.productIdentifier ?? null,
  };
}
