import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, Check, X, Sparkles, Infinity as InfinityIcon, Music, Loader2 } from 'lucide-react';
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
  fallbackPrice: string;
  fallbackPeriod: string;
  badge: string | null;
}[] = [
  { id: 'monthly', label: 'Monthly', fallbackPrice: '$4.99', fallbackPeriod: '/month', badge: null },
  { id: 'yearly', label: 'Yearly', fallbackPrice: '$39.99', fallbackPeriod: '/year', badge: 'Save 33%' },
  { id: 'lifetime', label: 'Lifetime', fallbackPrice: '$79.99', fallbackPeriod: 'one-time', badge: 'Best value' },
];

const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignup = (location.state as { fromSignup?: boolean } | null)?.fromSignup === true;
  const { isPremium } = usePremium();
  const [selected, setSelected] = React.useState<string>('yearly');
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [offerings, setOfferings] = React.useState<PlanPackage[]>([]);
  const [offeringsLoaded, setOfferingsLoaded] = React.useState(false);
  const [offeringsError, setOfferingsError] = React.useState(false);
  const isNative = isNativePurchasesPlatform();

  React.useEffect(() => {
    if (isPremium) {
      toast.success('You already have Premium!');
      navigate('/profile');
    }
  }, [isPremium, navigate]);

  React.useEffect(() => {
    let cancelled = false;

    getPremiumOfferings()
      .then((result) => {
        if (cancelled) return;
        setOfferings(result);
        setOfferingsError(false);
      })
      .catch((error) => {
        console.warn('Could not load RevenueCat offerings', error);
        if (!cancelled) setOfferingsError(true);
      })
      .finally(() => {
        if (!cancelled) setOfferingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    if (fromSignup) {
      navigate('/home', { replace: true });
    } else {
      navigate(-1);
    }
  };

  const selectedPlan = PLANS.find((p) => p.id === selected);
  const selectedPackage = offerings.find((o) => o.id === selected)?.package;

  const handlePurchase = async () => {
    if (!isNative) {
      toast.info('Subscriptions can be purchased in the REELIVE iPhone app.');
      return;
    }

    if (!selectedPlan || !selectedPackage) {
      const message = offeringsError
        ? 'Could not reach the App Store. Check your connection and try again.'
        : 'No matching package was found. Check the current RevenueCat offering and its Apple product links.';
      toast.error(message);
      return;
    }

    setLoading(true);
    try {
      await purchasePlan(selectedPackage);
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
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
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
          {PLANS.map((plan) => {
            const found = offerings.find((o) => o.id === plan.id);
            const price = found?.package.product.priceString ?? plan.fallbackPrice;
            const period = found?.package.product.subscriptionPeriod
              ? found.package.product.subscriptionPeriod
              : plan.fallbackPeriod;
            return (
              <Button
                variant="outline"
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={cn(
                  'w-full h-auto p-4 rounded-2xl border-2 flex items-center justify-between transition-all',
                  selected === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                )}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{plan.label}</p>
                    {plan.badge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{period}</p>
                </div>
                <p className="text-xl font-bold text-foreground">{price}</p>
              </Button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-12">
          <Button
            onClick={handlePurchase}
            disabled={loading || !offeringsLoaded}
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
          <p className="text-xs text-center text-muted-foreground mt-3">
            Cancel anytime. Subscriptions are managed in App Store settings.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Paywall;
