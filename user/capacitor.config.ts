import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastgluco.app',
  appName: 'Mito_Reboot',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
