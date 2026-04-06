import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Silent Android app.
 * Wraps the React SPA (dist/) into a native Android WebView.
 */
const config: CapacitorConfig = {
  appId: 'com.ikrigel.silent',
  appName: 'Silent',
  webDir: 'dist',
  server: {
    androidScheme: 'https',  // Allow Firebase OAuth redirects to return to the WebView
    allowNavigation: [
      'accounts.google.com',
      '*.googleapis.com',
      '*.firebaseapp.com',
    ],  // Allow WebView to navigate through OAuth flow instead of opening Chrome Custom Tab
  },
  android: {
    buildOptions: {
      keystorePath: undefined,   // set for release signing
      keystoreAlias: undefined,
    },
  },
  plugins: {
    // Firebase Authentication plugin configuration
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google'],  // Enable Google OAuth provider
    },
  },
};

export default config;
