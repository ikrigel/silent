# Server-Side OAuth Setup for Silent Web App

## Overview

The web app now uses a **server-side OAuth callback flow** instead of Firebase's built-in `signInWithRedirect`. This approach:
- Avoids COOP header blocking on Vercel
- Provides better error handling
- Mints Firebase custom tokens on the server

## Prerequisites

Before deploying, you need:

1. **Google OAuth credentials** (Web client from Google Cloud Console)
   - `GOOGLE_CLIENT_ID` = `93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = (retrieve from Google Cloud)

2. **Firebase service account credentials**
   - Used to mint custom tokens via Admin SDK
   - Download from Firebase Console

3. **Update Google Cloud Console redirect URI**
   - Add `https://silent-eight.vercel.app/api/auth/callback`

---

## Step 1: Update Google Cloud Console

### Add Redirect URI

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Find the **Web client** (`93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com`)
3. Click it to open details
4. Under **Authorized redirect URIs**, click **Add URI**
5. Enter: `https://silent-eight.vercel.app/api/auth/callback`
6. Click **Save**

### Get GOOGLE_CLIENT_SECRET

1. Same Web client details page
2. Look for **Client secret** section
3. Click **Show secret** (or **Add secret** if none exists)
4. Copy the full secret value (treat as password!)
5. You'll add this to Vercel in Step 2

---

## Step 2: Get Firebase Service Account Credentials

1. Go to **[Firebase Console](https://console.firebase.google.com)** → `silent-please` project
2. **Project Settings** (gear icon, top-left)
3. Go to **Service Accounts** tab
4. Click **Generate New Private Key**
5. A JSON file downloads — open it and note these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (includes newlines)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

**Important:** The `private_key` field contains literal `\n` characters. When adding to Vercel, keep them as-is (Vercel's UI handles the escape).

---

## Step 3: Add Environment Variables to Vercel

### Access Vercel Dashboard

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select the `silent` project
3. Go to **Settings** → **Environment Variables**

### Add Production Variables

Add these variables as **Production** + **Preview** (for both):

| Variable | Value | Source |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com` | Google Cloud |
| `GOOGLE_CLIENT_SECRET` | (from Step 1, Show secret) | Google Cloud |
| `FIREBASE_PROJECT_ID` | (from service account JSON) | Firebase Console |
| `FIREBASE_CLIENT_EMAIL` | (from service account JSON) | Firebase Console |
| `FIREBASE_PRIVATE_KEY` | (from service account JSON, keep `\n` as-is) | Firebase Console |

**Example for FIREBASE_PRIVATE_KEY:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQE...[long base64]...\n-----END PRIVATE KEY-----\n
```

---

## Step 4: Deploy

```bash
git add .
git commit -m "feat: implement server-side OAuth callback flow"
git push origin master
```

Vercel will automatically redeploy with the new environment variables.

---

## Testing

### Test Sign-In Flow

1. Visit **https://silent-eight.vercel.app/login**
2. Click **Sign in with Google**
3. Verify redirect to `accounts.google.com` with `redirect_uri=.../api/auth/callback`
4. Complete sign-in
5. Verify redirect back to `/login?token=...` (URL cleaned immediately)
6. Verify redirect to `/` after authentication
7. Check **Firebase Console** → **Authentication** → **Users** for new user

### Test Error Handling

1. Visit `/login?error=access_denied`
2. Verify error alert appears (message in local language)
3. Alert dismisses after user clicks close

### Verify Logs

Check Vercel Function logs for OAuth flow:

1. **Vercel Dashboard** → `silent` project → **Deployments**
2. Click latest deployment
3. Go to **Functions** tab
4. Click `/api/auth/callback`
5. View logs for:
   - `Exchanging authorization code for ID token...`
   - `Decoding Google ID token...`
   - `Creating Firebase custom token...`
   - `Custom token created successfully`

---

## Troubleshooting

### Error: "Missing Google OAuth credentials"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel
- Check spelling (case-sensitive)

### Error: "Google token exchange failed"
- Verify Google Cloud Console has the correct redirect URI
- Check that `GOOGLE_CLIENT_SECRET` is current (not expired)
- Verify network connectivity in function logs

### Error: "Firebase Admin initialization failed"
- Verify all three Firebase variables are set:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (with literal `\n` characters)
- Check that private key is not truncated in Vercel UI

### Token shows in URL bar
- This is temporary — the Login page immediately strips it via `window.history.replaceState()`
- Check browser DevTools for console errors if it persists

### User redirects to `/login?error=...` instead of signing in
- Check Vercel function logs for the specific error
- Verify Firebase service account has permission to create custom tokens
- Check that the user is not already signed into a different Firebase project

---

## Rollback

If something goes wrong, the old Firebase redirect-based flow is still in `authService.ts` (commented out).

To quickly rollback:
1. Revert the git commits
2. Or temporarily disable the Vercel Function by removing `/api/auth/callback.ts`

---

## Android Unaffected

The Android APK's native authentication flow is **completely unchanged**:
- Still uses `@capacitor-firebase/authentication`
- Still uses native Firebase auth (no server-side callback)
- Still uses `google-services.json` configuration

Only the web app uses the server-side callback.
