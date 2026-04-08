# Google Sign-In Troubleshooting Guide

## Quick Checklist

Before troubleshooting, verify:
- ✅ **OAuth consent screen configured** in Google Cloud Console (Branding tab)
- ✅ **App domain** set to `silent-please.firebaseapp.com`
- ✅ **Authorized domains** include both `silent-please.firebaseapp.com` and `silent-eight.vercel.app`
- ✅ **Firebase API key** not expired (check Google Cloud Credentials)
- ✅ **google-services.json** includes Android OAuth clients with correct SHA-1 fingerprints
- ✅ **Capacitor config** has `providers: ['google']` and `skipNativeAuth: false`

If any are missing, authentication will fail.

---

## Problem 1: "Google sign-in provider is not enabled" (v1.0.60)

### What It Means

Firebase initialization fails because:
1. OAuth consent screen not configured in Google Cloud
2. Google-services.json missing Android OAuth clients
3. SHA-1 fingerprint mismatch in google-services.json

### Where It Happens

- **Android APK:** Native Firebase auth fails
- **Web (if using test mode):** OAuth redirect fails

### Solution: v1.0.60+

**Step 1: Configure OAuth Consent Screen**
1. Go to **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Click **Branding** tab
3. Fill in:
   - **App domain**: `silent-please.firebaseapp.com`
   - **Application home page**: `https://silent-eight.vercel.app`
   - **Authorized domains**: 
     - `silent-please.firebaseapp.com`
     - `silent-eight.vercel.app`
4. Add **Developer contact info** with your email
5. Click **Save and Continue**

**Step 2: Verify google-services.json**
```json
{
  "client": [
    {
      "oauth_client": [
        {
          "client_type": 1,  // ✅ Android OAuth client (not web)
          "android_info": {
            "package_name": "com.ikrigel.silent",
            "certificate_hash": "97e48dcb3a09c9c97c96903feed3a559b3ce6a5c"  // ✅ Your release SHA-1
          }
        },
        {
          "client_type": 1,  // ✅ Debug keystore
          "android_info": {
            "certificate_hash": "711f2ffca9be00b4edb79466438917a63e4f9e04"  // ✅ Debug SHA-1
          }
        }
      ]
    }
  ]
}
```

**Step 3: Verify SHA-1 Fingerprints**
```bash
cd android
./gradlew signingReport
```

The SHA-1 must match one of the `certificate_hash` values in `google-services.json`. If it doesn't:
1. Download fresh `google-services.json` from Firebase Console
2. Make sure it includes both release and debug Android OAuth clients

**Step 4: Rebuild**
```bash
npx cap sync android
cd android && ./gradlew clean assembleRelease
```

---

## Problem 2: "Cross-Origin-Opener-Policy policy would block the window.closed call"

### What It Means

COOP (Cross-Origin-Opener-Policy) security headers block Firebase's popup-based authentication because popups rely on `window.closed` polling, which COOP prevents.

### Where It Happens

- **Capacitor WebView (APK):** COOP headers prevent `window.closed` checks
- **Vercel (Web):** COOP headers also prevent `window.closed` checks
- **Regular browsers:** Usually allow popup monitoring

### Solution: v1.0.59+

v1.0.59 switches to **redirect-based OAuth** which doesn't rely on `window.closed`:

#### For Web (Vercel)
```typescript
// OLD (blocked by COOP):
const result = await signInWithPopup(auth, provider);

// NEW (works with COOP):
await signInWithRedirect(auth, provider);
// After redirect back, handleRedirectResult() is called in App.tsx
```

**Redirect flow:**
1. User clicks "Sign in with Google"
2. App redirects to Google OAuth page
3. User signs in
4. Google redirects back to app
5. `handleRedirectResult()` retrieves the signed-in user
6. Auth succeeds ✓

#### For Android APK
```typescript
// Uses native Firebase auth (doesn't use popups)
const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
const result = await FirebaseAuthentication.signInWithGoogle();
```

**Native flow:**
1. User clicks "Sign in with Google"
2. Native Android OAuth dialog opens
3. User signs in via native Google Accounts
4. Plugin returns credential directly
5. Auth succeeds ✓

---

## Debugging Steps

### Step 1: Check Browser Console
Open DevTools (F12 → Console) and look for:

```
Auth environment detection: {
  hasCapacitor: true,
  isCapacitorApp: true,
  isNativePlatform: ???
}
```

### If `isNativePlatform: false`

**Problem:** Capacitor detected but native platform check failed

**Causes:**
1. Firebase Capacitor plugin not properly installed
2. `@capacitor-firebase/authentication` version mismatch
3. Plugin not initialized correctly

**Check:**
```
Capacitor runtime config plugins: {"FirebaseAuthentication":{"skipNativeAuth":false,"providers":["google"]}}
```

If `FirebaseAuthentication` is **missing** → plugin not loaded correctly

If `skipNativeAuth: true` → native auth is explicitly disabled (wrong config)

If `providers` is **missing** → capacitor.config.ts changes didn't sync

**Fix:**
```bash
npm install
npx cap sync android
cd android && ./gradlew clean assembleRelease
```

### If `isNativePlatform: true` but auth still fails

**Problem:** Native auth loaded but Firebase plugin call failed

**Console output should show:**
```
Native Google Sign-In failed: [error message]
```

**Common errors:**
- `"No ID token returned"` → Google auth UI dismissed without completing sign-in
- `"provider is not enabled"` → `google` not in `providers` list in capacitor.config.ts
- Network/timeout error → Firebase/Google servers unreachable

**Fix:** Try again, or check the specific error message below

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| **Cross-Origin-Opener-Policy would block window.closed** | Popup auth in WebView | Update to v1.0.57+, or use native auth only |
| **Google sign-in provider is not enabled** | `providers: ['google']` missing in capacitor.config.ts | Verify capacitor.config.ts, run `npx cap sync android` |
| **FirebaseAuthentication plugin config not found** | Plugin didn't load | Check `@capacitor-firebase/authentication` is installed |
| **Capacitor app detected but native platform check failed** | `isNativePlatform()` returned false | Check Android plugin installation, rebuild APK |
| **No ID token returned** | User dismissed Google login UI | User cancelled OAuth flow — try again |

---

## What to Share When Reporting Issues

When reporting a sign-in issue, provide:

1. **APK version** — Check About page, or `Package version x.x.x` in App Info
2. **Android version** — Settings → About phone → Android version
3. **Device model** — Settings → About phone → Device name
4. **Console output** — Open DevTools (F12), try to sign in, copy the entire Console tab

Example report format:
```
APK v1.0.57
Android 13, Samsung Galaxy Note 20
---
[Console output here]
```

---

## Technical Details

### Why COOP Blocks Popup Auth

```javascript
// Firebase popup auth does this internally:
const popup = window.open(oauthUrl);
while (!popup.closed) {
  await sleep(500); // Poll every 500ms
}
// COOP blocks checking popup.closed ↑
```

The `window.closed` check throws an error because COOP prevents cross-origin window property access.

### Why Native Auth Works

Native authentication doesn't rely on window monitoring:
1. App calls `FirebaseAuthentication.signInWithGoogle()`
2. Plugin opens native Android OAuth UI
3. User signs in via native Google Accounts
4. Plugin returns `idToken` directly to the app
5. App exchanges `idToken` for Firebase session

No `window.closed` checks needed.

---

## Related Files

- `src/services/authService.ts` — Auth logic with Capacitor detection
- `capacitor.config.ts` — Capacitor configuration (must include `providers: ['google']`)
- `src/store/authStore.ts` — Zustand auth state management
- `ROBOT_ACCESSIBILITY_SETUP.md` — Robot accessibility requirements (different issue)
