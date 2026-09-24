import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mannadaily.app',
  appName: 'MannaDaily',
  webDir: 'out',
  server: {
    url: 'https://mannadaily.vercel.app',
    cleartext: true
  }
};

export default config;
