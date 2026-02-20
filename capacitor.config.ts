import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitbuddy.app',
  appName: 'FitBuddy',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_fitbuddy',
      iconColor: '#14b8a6',
      sound: 'default',
    },
  },
  server: {
    // Fuer lokale Entwicklung: Vite Dev Server nutzen
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
};

export default config;
