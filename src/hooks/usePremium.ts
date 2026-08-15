import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  addEntitlementListener,
  getEntitlementSnapshot,
  isNativePurchasesPlatform,
  EntitlementSnapshot,
} from '@/lib/revenuecat';

export interface PremiumStatus {
  isPremium: boolean;
  lifetime: boolean;
  expiresAt: string | null;
  productId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Premium source of truth:
 *   1. Live StoreKit/RevenueCat entitlement (authoritative on device)
 *   2. Backend profile row (webhook-synced, used across devices/web)
 * Either one being active grants premium, so a delayed sandbox webhook can
 * never leave a paying user on the free tier.
 */
export function usePremium(): PremiumStatus {
  const { user } = useAuth();
  const [dbState, setDbState] = useState({
    isPremium: false,
    lifetime: false,
    expiresAt: null as string | null,
    productId: null as string | null,
  });
  const [storeState, setStoreState] = useState<EntitlementSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelled = useRef(false);

  const loadDb = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('is_premium, lifetime_purchase, premium_expires_at, active_product_id')
      .eq('id', user.id)
      .maybeSingle();

    if (cancelled.current) return;

    const expired = data?.premium_expires_at
      ? new Date(data.premium_expires_at).getTime() < Date.now()
      : false;

    setDbState({
      isPremium: !!data?.is_premium && (!expired || !!data?.lifetime_purchase),
      lifetime: !!data?.lifetime_purchase,
      expiresAt: data?.premium_expires_at ?? null,
      productId: data?.active_product_id ?? null,
    });
  }, [user]);

  /** Persist the device entitlement to the profile so web/other devices agree. */
  const cacheToProfile = useCallback(
    async (snap: EntitlementSnapshot) => {
      if (!user || !snap.isPremium) return;
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          lifetime_purchase: snap.lifetime,
          premium_expires_at: snap.expiresAt,
          active_product_id: snap.productId,
          revenuecat_customer_id: snap.appUserId,
          premium_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) console.warn('[Premium] could not cache entitlement to profile', error.message);
    },
    [user],
  );

  const loadStore = useCallback(
    async (force = false) => {
      if (!isNativePurchasesPlatform()) return;
      const snap = await getEntitlementSnapshot(force);
      if (cancelled.current) return;
      setStoreState(snap);
      if (snap.isPremium) await cacheToProfile(snap);
    },
    [cacheToProfile],
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadDb(), loadStore(true)]);
  }, [loadDb, loadStore]);

  useEffect(() => {
    cancelled.current = false;

    if (!user) {
      setDbState({ isPremium: false, lifetime: false, expiresAt: null, productId: null });
      setStoreState(null);
      setLoading(false);
      return () => {
        cancelled.current = true;
      };
    }

    setLoading(true);
    Promise.all([loadDb(), loadStore(false)]).finally(() => {
      if (!cancelled.current) setLoading(false);
    });

    // Realtime profile updates (webhook-driven)
    const channel = supabase
      .channel(`profile-premium-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => loadDb(),
      )
      .subscribe();

    // StoreKit "Transaction.updates" equivalent
    let removeListener: (() => void) | null = null;
    addEntitlementListener((snap) => {
      if (cancelled.current) return;
      setStoreState(snap);
      if (snap.isPremium) void cacheToProfile(snap);
    }).then((off) => {
      if (cancelled.current) off();
      else removeListener = off;
    });

    return () => {
      cancelled.current = true;
      removeListener?.();
      supabase.removeChannel(channel);
    };
  }, [user, loadDb, loadStore, cacheToProfile]);

  const isPremium = dbState.isPremium || !!storeState?.isPremium;

  useEffect(() => {
    console.log('[Premium] resolved state', {
      dbPremium: dbState.isPremium,
      storePremium: !!storeState?.isPremium,
      storeEnvironment: storeState?.environment ?? 'n/a',
      productId: storeState?.productId ?? dbState.productId,
      isPremium,
      loading,
    });
  }, [dbState, storeState, isPremium, loading]);

  return {
    isPremium,
    lifetime: dbState.lifetime || !!storeState?.lifetime,
    expiresAt: storeState?.expiresAt ?? dbState.expiresAt,
    productId: storeState?.productId ?? dbState.productId,
    loading,
    refresh,
  };
}
