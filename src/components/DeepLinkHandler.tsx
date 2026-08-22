import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Handles custom-scheme deep links (reelive://...) opened from emails.
 * On iOS, tapping "Open REELIVE" in the confirmation page lands here.
 */
export const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;

    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        if (!url) return;
        if (url.includes('email-confirmed')) {
          navigate('/login?confirmed=1');
        } else if (url.includes('reset-password')) {
          navigate('/reset-password');
        }
      });
      remove = () => handle.remove();
    })();

    return () => remove?.();
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;
