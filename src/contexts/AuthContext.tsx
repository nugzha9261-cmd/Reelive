import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { configurePurchases, loginRevenueCat, logoutRevenueCat } from '@/lib/revenuecat';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// Emails must point at a real https URL: on native the origin is capacitor://localhost
const AUTH_REDIRECT_BASE = window.location.origin.startsWith('http')
  ? window.location.origin
  : 'https://lifeshots.app';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let active = true;

    (async () => {
      // Configure RevenueCat BEFORE any login/logout call to avoid
      // "SDK not configured" errors on native.
      await configurePurchases(null);
      if (!active) return;

      // Set up auth state listener FIRST
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        const user = session?.user ?? null;
        setUser(user);
        setLoading(false);

        if (user) {
          void loginRevenueCat(user.id);
        } else {
          void logoutRevenueCat();
        }
      });
      subscription = data.subscription;

      // THEN check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setSession(session);
      const existingUser = session?.user ?? null;
      setUser(existingUser);
      setLoading(false);

      if (existingUser) {
        void loginRevenueCat(existingUser.id);
      }
    })();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);


  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${AUTH_REDIRECT_BASE}/auth/confirmed`,
        data: {
          display_name: displayName || email,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await logoutRevenueCat();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
