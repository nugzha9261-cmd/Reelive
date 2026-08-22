import React, { useEffect, useState } from 'react';
import { IOSButton } from '@/components/ui/ios-button';
import { CheckCircle2, Loader2, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const APP_SCHEME_URL = 'reelive://email-confirmed';

const EmailConfirmed: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'error'>('checking');

  useEffect(() => {
    let cancelled = false;

    const finish = (ok: boolean) => {
      if (cancelled) return;
      setStatus(ok ? 'confirmed' : 'error');
      if (ok) {
        // Try to hand off to the installed iOS app automatically.
        window.location.href = APP_SCHEME_URL;
      }
    };

    // Supabase parses the token from the URL hash and creates a session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
      else setTimeout(() => {
        supabase.auth.getSession().then(({ data: d }) => finish(!!d.session));
      }, 1500);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        {status === 'checking' ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : status === 'confirmed' ? (
          <CheckCircle2 className="w-8 h-8 text-primary" />
        ) : (
          <Film className="w-8 h-8 text-primary" />
        )}
      </div>

      {status === 'checking' && (
        <h1 className="text-2xl font-bold text-foreground">Confirming your email…</h1>
      )}

      {status === 'confirmed' && (
        <>
          <h1 className="text-2xl font-bold text-foreground">Email confirmed</h1>
          <p className="text-muted-foreground mt-3">
            You're all set. Open REELIVE on your phone and sign in to start capturing your journey.
          </p>
          <div className="w-full mt-8">
            <IOSButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                window.location.href = APP_SCHEME_URL;
              }}
            >
              Open REELIVE
            </IOSButton>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            If nothing happens, just open the REELIVE app from your home screen.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-foreground">Link expired</h1>
          <p className="text-muted-foreground mt-3">
            This confirmation link is no longer valid. Open the REELIVE app and sign up again to get
            a fresh link.
          </p>
        </>
      )}
    </div>
  );
};

export default EmailConfirmed;
