import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mannadaily.app',
  appName: 'MannaDaily',
  webDir: 'out',
  server: {
    url: 'https://mannadaily.vercel.app', // Mettez ici l'URL de production de votre site (Vercel ou autre)
    cleartext: true
  }
};

export default config;
