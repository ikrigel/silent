# Android OAuth Setup for Silent App

## Overview (v1.0.60+)

Android OAuth requires proper configuration across three layers:
1. **Google Cloud Console**: OAuth consent screen + Android OAuth clients
2. **google-services.json**: Android OAuth client configuration with SHA-1 fingerprints
3. **capacitor.config.ts**: `FirebaseAuthentication` plugin with `providers: ['google']`

All three must be configured correctly, or Google Sign-In fails.

## Prerequisites: OAuth Consent Screen (v1.0.60)

**IMPORTANT: Configure this first in Google Cloud Console before proceeding:**

1. **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Click **Branding** tab
3. Set:
   - **App domain**: `silent-please.firebaseapp.com`
   - **Application home page**: `https://silent-eight.vercel.app`
   - **Authorized domains**: 
     - `silent-please.firebaseapp.com`
     - `silent-eight.vercel.app`
   - **Developer contact**: Your email
4. Click **Save and Continue**

Without this, Firebase authentication will fail with:
> "Google sign-in provider is not enabled"

See [GOOGLE_AUTH_TROUBLESHOOTING.md](GOOGLE_AUTH_TROUBLESHOOTING.md#problem-1-google-sign-in-provider-is-not-enabled-v10-60) for more details.

## Problem

The `google-services.json` file must include **Android OAuth client** configuration. Firebase requires both:
- **Web OAuth client** (type 3) — for web/Capacitor WebView
- **Android OAuth client** (type 1) — for native Android authentication

Without the Android client, Google Sign-In fails with:
> "Google sign-in provider is not enabled. Make sure to add the provider to the 'providers' list in the Capacitor configuration."

## Solution

### 1. Extract SHA-1 Fingerprints

#### Debug Keystore (for local development)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey | grep SHA1
```
**Expected output:** `SHA1: 71:1F:2F:FC:A9:BE:00:B4:ED:B7:94:66:43:89:17:A6:3E:4F:9E:04`

#### Release Keystore (for production APK)
This is extracted automatically in GitHub Actions CI — check the "Extract release keystore SHA-1 fingerprint" step in the workflow output.

Or manually:
```bash
keytool -list -v -keystore ~/.android/silent-release.keystore -storepass [STORE_PASSWORD] -alias [KEY_ALIAS] | grep SHA1
```

### 2. Configure in Firebase Console

1. Go to **[Firebase Console](https://console.firebase.google.com)** → `silent-please` project
2. **Project Settings** → **Your Apps**
3. Click the Android app (`com.ikrigel.silent`)
4. Under **SHA certificate fingerprints**, add both:
   - Debug: `71:1F:2F:FC:A9:BE:00:B4:ED:B7:94:66:43:89:17:A6:3E:4F:9E:04`
   - Release: `[Extract from CI or keystore]`
5. Save and download the updated **google-services.json**

### 3. Update Repository

```bash
# Replace the file
cp [downloaded-google-services.json] android/app/google-services.json

# Sync Capacitor
npx cap sync android

# Rebuild APK
cd android && ./gradlew clean assembleRelease

# Test locally
# Or commit and push to trigger CI rebuild
git add android/app/google-services.json
git commit -m "fix: add Android OAuth client to google-services.json"
git push origin master
git tag -a v1.0.54 -m "rebuild with Android OAuth configured"
git push origin v1.0.54
```

## Verification

After updating `google-services.json`, the file should contain **both debug and release Android OAuth clients**:
```json
{
  "client": [
    {
      "oauth_client": [
        {
          "client_id": "93806788136-9ph1l2klpsls2ck8losr0u84j7d77nts.apps.googleusercontent.com",
          "client_type": 1,  // ← Release Android client
          "android_info": {
            "package_name": "com.ikrigel.silent",
            "certificate_hash": "97e48dcb3a09c9c97c96903feed3a559b3ce6a5c"  // Release SHA-1 (without colons)
          }
        },
        {
          "client_id": "93806788136-amo4a6n14kn0dt1fnpa7f8ghpemp23uf.apps.googleusercontent.com",
          "client_type": 1,  // ← Debug Android client
          "android_info": {
            "package_name": "com.ikrigel.silent",
            "certificate_hash": "711f2ffca9be00b4edb7946643891717a63e4f9e04"  // Debug SHA-1 (without colons)
          }
        },
        {
          "client_id": "93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com",
          "client_type": 3  // ← Web client
        }
      ]
    }
  ]
}
```

**Verify you have:**
- ✅ Two Android OAuth clients (client_type 1) — one for release, one for debug
- ✅ One Web OAuth client (client_type 3)
- ✅ Correct `certificate_hash` values matching your keystores

## Debug Keystore SHA-1

For reference, the debug keystore SHA-1 in hex format (without colons) is:
```
711f2ffca9be00b4edb7946643891717a63e4f9e04
```

This is needed when adding to Firebase Console — remove the colons from the keytool output.

## Current Status (v1.0.60)

✅ **google-services.json** is correctly configured with:
- Release Android OAuth client with SHA-1: `97e48dcb3a09c9c97c96903feed3a559b3ce6a5c`
- Debug Android OAuth client with SHA-1: `711f2ffca9be00b4edb7946643891717a63e4f9e04`
- Web OAuth client for backend calls

✅ **OAuth consent screen** is configured in Google Cloud Console

✅ **Capacitor config** has `providers: ['google']` and `skipNativeAuth: false`

## CI/CD Integration

The GitHub Actions workflow includes a step to extract and log the release keystore SHA-1. Monitor the build output for:
```
=== RELEASE KEYSTORE SHA-1 (for Firebase Console) ===
[YOUR_RELEASE_SHA1_HERE]
```

If you need to update SHA-1 fingerprints:
1. Extract new SHA-1 from keystore (see Solution section)
2. Add to Firebase Console
3. Download updated `google-services.json`
4. Replace `android/app/google-services.json`
5. Commit and tag new release (v1.0.61+)
