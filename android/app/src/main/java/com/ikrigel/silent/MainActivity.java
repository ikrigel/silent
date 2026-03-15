package com.ikrigel.silent;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * Main entry point for the Silent Android app.
 * Registers the WEARobotPlugin so it is accessible from JavaScript via Capacitor.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugin BEFORE super.onCreate() per Capacitor docs
        registerPlugin(WEARobotPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
