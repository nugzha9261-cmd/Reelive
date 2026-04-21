import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from './usePremium';

export const FREE_JOURNEY_LIMIT = 1;
export const FREE_COMPILATION_LIMIT = 1;

export interface FreeTierUsage {
  journeyCount: number;
  compilationCount: number;
  canCreateJourney: boolean;
  canCreateCompilation: boolean;
  isPremium: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Free-tier gating. Premium users always pass.
 * - Free: 1 journey total, 1 compilation total (lifetime)
 */
export function useFreeTierLimits(): FreeTierUsage {
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [journeyCount, setJourneyCount] = useState(0);
  const [compilationCount, setCompilationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setJourneyCount(0);
      setCompilationCount(0);
      setLoading(false);
      return;
    }

    const [{ count: jCount }, { count: cCount }] = await Promise.all([
      supabase
        .from('journeys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('compilations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_draft', false),
    ]);

    setJourneyCount(jCount ?? 0);
    setCompilationCount(cCount ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    journeyCount,
    compilationCount,
    canCreateJourney: isPremium || journeyCount < FREE_JOURNEY_LIMIT,
    canCreateCompilation: isPremium || compilationCount < FREE_COMPILATION_LIMIT,
    isPremium,
    loading: loading || premiumLoading,
    refresh: load,
  };
}
