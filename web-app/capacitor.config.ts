import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.tendonmonitor',
  appName: 'Tendon Monitor',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scheme: 'TendonMonitor',
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    iosScheme: 'tendonmonitor',
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
