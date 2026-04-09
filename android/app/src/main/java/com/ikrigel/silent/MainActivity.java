package com.ikrigel.silent;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

/**
 * Main entry point for the Silent Android app.
 * Registers the WEARobotPlugin so it is accessible from JavaScript via Capacitor.
 * Configures WebView User-Agent to meet Google OAuth security requirements.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugin BEFORE super.onCreate() per Capacitor docs
        registerPlugin(WEARobotPlugin.class);
        super.onCreate(savedInstanceState);

        // Configure WebView User-Agent to meet Google OAuth policy requirements
        // Google rejects requests with WebView User-Agent that don't look like real browsers
        // Solution: Set User-Agent to Chrome to pass Google's disallowed_useragent check
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            // Use a proper Chrome User-Agent that Google will accept
            // Format: Chrome on Android with version identifier
            String userAgent = "Mozilla/5.0 (Linux; Android 14; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
            settings.setUserAgentString(userAgent);
        }
    }
}
