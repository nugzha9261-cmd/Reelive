import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, Check, X, Sparkles, Infinity as InfinityIcon, Music, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import {
  getPremiumOfferings,
  purchasePlan,
  restorePurchases,
  PlanPackage,
} from '@/lib/revenuecat';

const FEATURES = [
  { icon: InfinityIcon, label: 'Unlimited journeys', desc: 'Track every chapter of your life' },
  { icon: Sparkles, label: 'Unlimited compilations', desc: 'Create as many reels as you want' },
  { icon: Music, label: 'Premium music library', desc: 'Full access to all soundtracks' },
  { icon: Crown, label: 'Priority cloud rendering', desc: 'Faster compilation processing' },
];

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$4.99', period: '/month', badge: null },
  { id: 'yearly', label: 'Yearly', price: '$39.99', period: '/year', badge: 'Save 33%' },
  { id: 'lifetime', label: 'Lifetime', price: '$79.99', period: 'one-time', badge: 'Best value' },
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

  React.useEffect(() => {
    if (isPremium) {
      toast.success('You already have Premium!');
      navigate('/profile');
    }
  }, [isPremium, navigate]);

  React.useEffect(() => {
    let cancelled = false;

    getPremiumOfferings().then((result) => {
      if (cancelled) return;
      setOfferings(result);
      setOfferingsLoaded(true);
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
    if (!selectedPlan || !selectedPackage) {
      toast.error('This plan is not available right now.');
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
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
          aria-label="Close paywall"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

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
            const available = offeringsLoaded
              ? offerings.some((o) => o.id === plan.id)
              : true;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                disabled={!available}
                className={cn(
                  'w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all',
                  selected === plan.id && available
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card',
                  !available && 'opacity-50 cursor-not-allowed',
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
                  <p className="text-sm text-muted-foreground">{plan.period}</p>
                </div>
                <p className="text-xl font-bold text-foreground">{plan.price}</p>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-12">
          <button
            onClick={handlePurchase}
            disabled={loading || !selectedPackage}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Continue
          </button>
          {fromSignup && (
            <button
              onClick={handleClose}
              className="w-full mt-3 py-3 text-sm font-medium text-muted-foreground"
            >
              Maybe later — start with the free plan
            </button>
          )}
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full mt-2 py-3 text-sm font-medium text-muted-foreground"
          >
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Cancel anytime. Subscriptions are managed in App Store settings.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Paywall;
