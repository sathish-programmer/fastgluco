import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mitoreboot.app',
  appName: 'Mito_Reboot',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      '*.razorpay.com',
      'api.razorpay.com',
      'checkout.razorpay.com',
      'checkout-static-next.razorpay.com',
      '*.npci.org.in',
      '*.billdesk.com',
      '*.payu.in',
      '*.hdfcbank.com',
      '*.icicibank.com',
      '*.sbi.co.in',
      '*.axisbank.com',
      '*.idbibank.co.in',
      '*.canarabank.com'
    ]
  }
};

export default config;
