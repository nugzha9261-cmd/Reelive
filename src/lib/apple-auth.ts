import { Capacitor } from '@capacitor/core';
import { SignInWithApple, type SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

/**
 * Apple sign-in.
 * - Native (iOS app): uses the real "Sign in with Apple" sheet and exchanges
 *   the identity token with the backend. The web OAuth broker cannot be used
 *   inside the Capacitor webview (its origin is not an http(s) origin, so the
 *   broker URL resolves to a 404).
 * - Web: uses the hosted OAuth redirect flow.
 */
export async function signInWithApple(): Promise<{ error: Error | null }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result: SignInWithAppleResponse = await SignInWithApple.authorize({
        clientId: 'com.nexzonelabs.reelive',
        redirectURI: '',
        scopes: 'email name',
      });

      const idToken = result.response?.identityToken;
      if (!idToken) {
        return { error: new Error('Apple did not return an identity token.') };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });
      if (error) return { error };

      // Apple only sends the name on the very first authorization.
      const givenName = result.response?.givenName;
      const familyName = result.response?.familyName;
      const fullName = [givenName, familyName].filter(Boolean).join(' ').trim();
      if (fullName) {
        await supabase.auth.updateUser({ data: { display_name: fullName } });
      }

      return { error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/cancel/i.test(message) || /1001/.test(message)) {
        return { error: null };
      }
      return { error: new Error(message) };
    }
  }

  const result = await lovable.auth.signInWithOAuth('apple', {
    redirect_uri: window.location.origin,
  });
  return { error: result.error ?? null };
}
