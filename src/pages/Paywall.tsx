import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Crown, Check, X, Sparkles, Infinity as InfinityIcon, Music, Loader2, AlertCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getPremiumOfferings,
  isNativePurchasesPlatform,
  purchasePlan,
  restorePurchases,
  PlanPackage,
  PlanType,
} from '@/lib/revenuecat';

const FEATURES = [
  { icon: InfinityIcon, label: 'Unlimited journeys', desc: 'Track every chapter of your life' },
  { icon: Sparkles, label: 'Unlimited compilations', desc: 'Create as many reels as you want' },
  { icon: Music, label: 'Premium music library', desc: 'Full access to all soundtracks' },
  { icon: Crown, label: 'Priority cloud rendering', desc: 'Faster compilation processing' },
];

const PLANS: {
  id: PlanType;
  label: string;
  /** Human description of the billing term, shown when StoreKit has no period. */
  termLabel: string;
  recurring: boolean;
  badge: string | null;
}[] = [
  {
    id: 'monthly',
    label: 'REELIVE Premium Monthly',
    termLabel: '1 month · auto-renewing subscription',
    recurring: true,
    badge: null,
  },
  {
    id: 'yearly',
    label: 'REELIVE Premium Yearly',
    termLabel: '12 months · auto-renewing subscription',
    recurring: true,
    badge: 'Best value',
  },
  {
    id: 'lifetime',
    label: 'REELIVE Premium Lifetime',
    termLabel: 'One-time purchase · does not renew',
    recurring: false,
    badge: 'One-time',
  },
];

/** Turns an ISO-8601 StoreKit period (P1M, P1Y, P1W) into readable text. */
function formatPeriod(period?: string | null): string | null {
  if (!period) return null;
  const match = /^P(\d+)([DWMY])$/.exec(period.trim().toUpperCase());
  if (!match) return null;
  const count = Number(match[1]);
  const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[match[2]] as string;
  return count === 1 ? `every ${unit}` : `every ${count} ${unit}s`;
}

const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignup = (location.state as { fromSignup?: boolean } | null)?.fromSignup === true;
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [selected, setSelected] = React.useState<PlanType>('yearly');
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [offerings, setOfferings] = React.useState<PlanPackage[]>([]);
  const [offeringsLoaded, setOfferingsLoaded] = React.useState(false);
  const [offeringsError, setOfferingsError] = React.useState(false);
  const purchaseWatchdog = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNative = isNativePurchasesPlatform();

  React.useEffect(() => () => {
    if (purchaseWatchdog.current) clearTimeout(purchaseWatchdog.current);
  }, []);

  React.useEffect(() => {
    if (isPremium) {
      toast.success('You already have Premium!');
      navigate('/profile');
    }
  }, [isPremium, navigate]);

  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setOfferingsLoaded(false);
    setOfferingsError(false);

    // Hard watchdog: never let the paywall spin forever, whatever the SDK does.
    const watchdog = setTimeout(() => {
      if (cancelled) return;
      setOfferingsError(true);
      setOfferingsLoaded(true);
    }, 10000);

    getPremiumOfferings()
      .then((result) => {
        if (cancelled) return;
        clearTimeout(watchdog);
        setOfferings(result);
        setOfferingsError(result.length === 0);
      })
      .catch((error) => {
        console.warn('Could not load RevenueCat offerings', error);
        clearTimeout(watchdog);
        if (!cancelled) setOfferingsError(true);
      })
      .finally(() => {
        if (!cancelled) setOfferingsLoaded(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
    };
  }, [reloadKey]);


  const handleClose = () => {
    if (fromSignup) {
      navigate('/home', { replace: true });
    } else {
      navigate(-1);
    }
  };

  const selectedPlan = PLANS.find((p) => p.id === selected);
  const selectedPackage = offerings.find((o) => o.id === selected)?.package;
  const pricesUnavailable = isNative && offeringsLoaded && offerings.length === 0;
  const canPurchase = isNative && !!selectedPackage;

  const handlePurchase = async () => {
    if (!isNative) {
      toast.info('Subscriptions can be purchased in the REELIVE iPhone app.');
      return;
    }

    if (!selectedPlan || !selectedPackage) {
      toast.error('Prices are still loading from the App Store. Please try again in a moment.');
      return;
    }

    setLoading(true);
    purchaseWatchdog.current = setTimeout(() => {
      purchaseWatchdog.current = null;
      setLoading(false);
      toast.error('The App Store did not respond. Close and reopen REELIVE, then try again or restore purchases.');
    }, 32000);
    try {
      const snapshot = await purchasePlan(selectedPackage);
      console.log('[Paywall] purchase result', snapshot);
      await refreshPremium();
      toast.success('Welcome to Premium!');
      navigate('/profile');
    } catch (err) {
      const error = err as { userCancelled?: boolean; message?: string };
      if (error.userCancelled) {
        toast.info('Purchase cancelled.');
      } else {
        toast.error(error.message || 'Purchase failed. Please try again.');
      }
    } finally {
      if (purchaseWatchdog.current) {
        clearTimeout(purchaseWatchdog.current);
        purchaseWatchdog.current = null;
      }
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      await refreshPremium();
      if (restored) {
        toast.success('Premium restored!');
        navigate('/profile');
      } else {
        toast.info('No previous purchases found.');
      }
    } catch (err) {
      toast.error('Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <MobileLayout noPadding>
      <div className="relative min-h-screen bg-background">
        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
          aria-label="Close paywall"
        >
          <X className="w-5 h-5 text-foreground" />
        </Button>

        {/* Hero */}
        <div className="pt-20 pb-8 px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Go Premium</h1>

          <p className="text-muted-foreground">Unlock the full REELIVE experience</p>
        </div>

        {/* Features */}
        <div className="px-6 mb-8 space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-2xl bg-card/60">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Check className="w-5 h-5 text-primary mt-2" />
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="px-6 mb-6 space-y-3">
          {!offeringsLoaded && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading App Store prices…
            </div>
          )}

          {offeringsLoaded && (pricesUnavailable || offeringsError) && (
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Pricing is temporarily unavailable from the App Store. Check your connection and
                  try again in a moment.
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </Button>
            </div>
          )}

          {offeringsLoaded &&
            PLANS.map((plan) => {
              const found = offerings.find((o) => o.id === plan.id);
              if (isNative && !found) return null;

              const price = found?.package.product.priceString ?? null;
              const period =
                formatPeriod(found?.package.product.subscriptionPeriod) ??
                (plan.recurring ? null : 'one-time');

              return (
                <Button
                  variant="outline"
                  key={plan.id}
                  onClick={() => setSelected(plan.id)}
                  className={cn(
                    'w-full h-auto p-4 rounded-2xl border-2 flex items-center justify-between transition-colors',
                    'bg-card hover:bg-card active:bg-card focus:bg-card focus-visible:bg-card touch-manipulation [-webkit-tap-highlight-color:transparent]',
                    selected === plan.id
                      ? 'border-primary hover:border-primary'
                      : 'border-border hover:border-primary/40',
                  )}

                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground whitespace-normal">{plan.label}</p>
                      {plan.badge && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-normal">
                      {plan.termLabel}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3">
                    {price ? (
                      <>
                        <p className="text-xl font-bold text-foreground">{price}</p>
                        {period && <p className="text-xs text-muted-foreground">{period}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground whitespace-normal max-w-[7rem]">
                        Price shown in the iPhone app
                      </p>
                    )}
                  </div>
                </Button>
              );
            })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-12">
          <Button
            onClick={handlePurchase}
            disabled={loading || !offeringsLoaded || (isNative && !canPurchase)}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Continue
          </Button>
          {fromSignup && (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full mt-3 py-3 text-sm font-medium text-muted-foreground"
            >
              Maybe later — start with the free plan
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleRestore}
            disabled={restoring || !isNative}
            className="w-full mt-2 py-3 text-sm font-medium text-muted-foreground"
          >
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Button>

          {/* Required subscription disclosures (App Store Guideline 3.1.2) */}
          <div className="mt-5 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              REELIVE Premium Monthly and Yearly are auto-renewing subscriptions. Payment is
              charged to your Apple ID at confirmation of purchase. Your subscription renews
              automatically for the same period and price unless it is cancelled at least 24 hours
              before the end of the current period. Your account is charged for renewal within 24
              hours prior to the end of the current period. You can manage or cancel your
              subscription in your Apple ID Account Settings. REELIVE Premium Lifetime is a
              one-time purchase and does not renew.
            </p>
            <p className="text-xs text-center text-muted-foreground">
              <Link to="/terms" className="underline text-primary">
                Terms of Use (EULA)
              </Link>
              <span className="mx-2">·</span>
              <Link to="/privacy" className="underline text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Paywall;
