import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexzonelabs.reelive',
  appName: 'REELIVE',
  webDir: 'dist',
  ios: {
    // iOS-specific settings for camera access
    contentInset: 'automatic',
    allowsLinkPreview: false,
    // Use bundled mode for App Store distribution — no hot-reload server
    scheme: 'reelive'
  }
};

export default config;
