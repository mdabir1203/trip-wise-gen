import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.71f4659a677748e7acd0fa45a45639a0',
  appName: 'trip-wise-gen',
  webDir: 'dist',
  server: {
    url: 'https://71f4659a-6777-48e7-acd0-fa45a45639a0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
