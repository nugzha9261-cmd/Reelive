import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reliv.app',
  appName: 'Reliv',
  webDir: 'dist',
  ios: {
    // iOS-specific settings for camera access
    contentInset: 'automatic',
    allowsLinkPreview: false
  }
};

export default config;
