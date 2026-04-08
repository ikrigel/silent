# Server-Side OAuth Implementation — Summary

## What Changed

### 1. New Vercel Function: `/api/auth/callback.ts`

**Purpose:** Exchange Google authorization code for Firebase custom token

**Flow:**
1. Receives `GET /api/auth/callback?code=...` from Google OAuth
2. Exchanges code for Google ID token via `POST oauth2.googleapis.com/token`
3. Decodes ID token to extract user info (no external JWT library)
4. Creates Firebase custom token via Admin SDK
5. Redirects to `/login?token=<customToken>` on success
6. Redirects to `/login?error=<reason>` on failure

**Handled Errors:**
- User denies consent → `?error=denied`
- Missing authorization code → `?error=missing_code`
- Missing environment variables → `?error=server_misconfigured`
- Google token exchange fails → `?error=token_exchange_failed`
- Malformed ID token → `?error=malformed_token`
- Firebase createCustomToken fails → `?error=internal_error`

**Environment Variables Required:**
- `GOOGLE_CLIENT_ID` — Web OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Web OAuth client secret
- `FIREBASE_PROJECT_ID` — Firebase project ID
- `FIREBASE_CLIENT_EMAIL` — Firebase service account email
- `FIREBASE_PRIVATE_KEY` — Firebase private key (with `\n` preserved)

### 2. Updated: `/src/services/authService.ts`

**Imports Changed:**
- Removed: `signInWithRedirect`, `getRedirectResult`
- Added: `signInWithCustomToken`

**Function: `signInWithGoogle()`**
- Web branch now constructs Google Authorization URL directly
- Uses server-side OAuth callback endpoint
- Returns promise that never resolves (page navigates away to Google)
- URL parameters:
  - `client_id` = `93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com`
  - `redirect_uri` = `https://silent-eight.vercel.app/api/auth/callback`
  - `response_type` = `code`
  - `scope` = `openid email profile`
  - `prompt` = `select_account`

**Replaced Function: `handleRedirectResult()` → `handleCustomToken()`**
- New behavior:
  - Reads `?token=` from URL
  - Strips token from URL immediately via `window.history.replaceState()`
  - Calls `signInWithCustomToken(auth, token)`
  - Saves user to Firestore
  - Returns `AppUser | null`

**Native Path Unchanged:**
- Android native auth still uses `@capacitor-firebase/authentication`
- `isNativePlatform` check runs first and returns before web code
- No changes to native signing logic

### 3. Updated: `/src/pages/Login/index.tsx`

**Imports Changed:**
- `handleRedirectResult` → `handleCustomToken`

**New: OAuth Error Handling**
- Second `useEffect` reads `?error=` parameter
- Strips error from URL immediately
- Maps error codes to i18n messages
- Shows Alert with localized message

**Error Mappings:**
- `denied` / `access_denied` → `auth.oauthDenied`
- `missing_code` → `auth.oauthError` with reason
- `server_misconfigured` → `auth.oauthError` with reason
- `token_exchange_failed` → `auth.oauthError` with reason
- `malformed_token` → `auth.oauthError` with reason
- `internal_error` → `auth.oauthError` with reason

### 4. Updated: `/src/App.tsx`

**Imports Changed:**
- Removed import of `handleRedirectResult`

**Simplified: useEffect**
- Removed OAuth callback handling from app startup
- Now only calls `subscribeToAuth()` for Firebase listener
- OAuth callback is handled in Login page instead

### 5. Updated: `/src/i18n/en.json`

**Added to `auth` object:**
```json
"oauthError": "Sign-in failed ({{reason}}). Please try again.",
"oauthDenied": "Sign-in cancelled."
```

### 6. Updated: `/src/i18n/he.json`

**Added to `auth` object:**
```json
"oauthError": "ההתחברות נכשלה ({{reason}}). אנא נסה שוב.",
"oauthDenied": "ההתחברות בוטלה."
```

---

## Why These Changes

### Problem
Firebase's `signInWithRedirect()` stores OAuth state on `silent-please.firebaseapp.com`, but the app lives on `silent-eight.vercel.app`. Cross-origin state transfer fails silently — `getRedirectResult()` always returns null.

### Solution
Implement a proper **server-side OAuth flow** where:
1. Backend exchanges authorization code for tokens
2. Backend mints Firebase custom tokens
3. Frontend signs in with custom token

This provides:
- ✅ Explicit error handling
- ✅ Avoids COOP header blocking
- ✅ Standard OAuth flow
- ✅ Better security (secret never leaves server)

---

## Next Steps (Required Before Deploying)

1. **Update Google Cloud Console:**
   - Add redirect URI: `https://silent-eight.vercel.app/api/auth/callback`

2. **Get Firebase Service Account:**
   - Download from Firebase Console → Project Settings → Service Accounts

3. **Add Environment Variables to Vercel:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

4. **Commit and Deploy:**
   ```bash
   git add .
   git commit -m "feat: implement server-side OAuth callback flow"
   git push origin master
   ```

See [SERVER_OAUTH_SETUP.md](SERVER_OAUTH_SETUP.md) for detailed setup instructions.

---

## Testing Checklist

- [ ] Web OAuth flow (sign-in → Google → callback → /login?token=... → /)
- [ ] Web OAuth error handling (deny consent → /login?error=... with alert)
- [ ] Token stripped from URL immediately
- [ ] User saved to Firestore
- [ ] Firebase user authenticated
- [ ] Android APK unchanged (native auth still works)
- [ ] Playwright tests pass
- [ ] Error logs visible in Vercel Functions

---

## Files Modified

```
api/auth/callback.ts          ✨ NEW
src/services/authService.ts   📝 Updated
src/pages/Login/index.tsx     📝 Updated
src/App.tsx                   📝 Updated
src/i18n/en.json             📝 Updated
src/i18n/he.json             📝 Updated
SERVER_OAUTH_SETUP.md         📋 NEW (setup guide)
```

**No changes to:**
- `vercel.json` (API routes auto-detected)
- `android/**` (native auth unchanged)
- `package.json` (no new dependencies)
- Tests (no test changes needed)
