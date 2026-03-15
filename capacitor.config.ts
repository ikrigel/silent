import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Silent Android app.
 * Wraps the React SPA (dist/) into a native Android WebView.
 */
const config: CapacitorConfig = {
  appId: 'com.ikrigel.silent',
  appName: 'Silent',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,   // set for release signing
      keystoreAlias: undefined,
    },
  },
  plugins: {
    // No core plugins needed — robot uses a custom local plugin
  },
};

export default config;
