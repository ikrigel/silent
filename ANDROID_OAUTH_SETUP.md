# Android OAuth Setup for Silent App

## Problem

The `google-services.json` file is missing the **Android OAuth client** configuration. Firebase requires both:
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

After updating `google-services.json`, the file should contain:
```json
{
  "client": [
    {
      "oauth_client": [
        {
          "client_id": "93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com",
          "client_type": 3  // Web client
        },
        {
          "client_id": "93806788136-XXXXXXXXXXXXXXXX.apps.googleusercontent.com",
          "client_type": 1,  // ← Android client
          "android_info": {
            "package_name": "com.ikrigel.silent",
            "certificate_hash": "711f2ffca9be00b4edb7946643891717a63e4f9e04"  // SHA-1 without colons
          }
        }
      ]
    }
  ]
}
```

## Debug Keystore SHA-1

For reference, the debug keystore SHA-1 in hex format (without colons) is:
```
711f2ffca9be00b4edb7946643891717a63e4f9e04
```

This is needed when adding to Firebase Console — remove the colons from the keytool output.

## CI/CD Integration

The GitHub Actions workflow now includes a step to extract and log the release keystore SHA-1. Monitor the build output for:
```
=== RELEASE KEYSTORE SHA-1 (for Firebase Console) ===
[YOUR_RELEASE_SHA1_HERE]
```

Use this to update Firebase Console and regenerate `google-services.json`.
