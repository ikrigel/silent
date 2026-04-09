import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithCustomToken, signOut, onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, type Firestore } from 'firebase/firestore';
import { writeLog } from './logService';

/** Firebase configuration from environment variables */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (with error handling for missing config)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  // Log Firebase config status (safe: no secrets)
  const hasApiKey = !!firebaseConfig.apiKey;
  const hasProjectId = !!firebaseConfig.projectId;
  const hasAuthDomain = !!firebaseConfig.authDomain;
  const hasAppId = !!firebaseConfig.appId;

  console.log('Firebase Config Status:', {
    hasApiKey,
    hasProjectId,
    hasAuthDomain,
    hasAppId,
    projectId: firebaseConfig.projectId || 'MISSING',
  });

  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } else {
    const missing = [];
    if (!firebaseConfig.apiKey) missing.push('apiKey');
    if (!firebaseConfig.projectId) missing.push('projectId');
    if (!firebaseConfig.authDomain) missing.push('authDomain');
    if (!firebaseConfig.appId) missing.push('appId');
    console.error('Firebase config incomplete. Missing:', missing.join(', '));
    console.warn('Auth features will be disabled');
  }
} catch (err) {
  console.error('Firebase initialization failed:', err);
  if (err instanceof Error) {
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
  }
}

export { auth, db };

/** User profile stored in Firestore */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  registeredAt: string;
  lastLoginAt: string;
}

/** Build AppUser from Firebase User object */
function buildUser(firebaseUser: User): AppUser {
  const { uid, email, displayName, photoURL } = firebaseUser;
  if (!email || !displayName) {
    throw new Error('Email or display name missing from Google profile');
  }
  return {
    uid,
    email,
    displayName,
    photoURL: photoURL || '',
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

/**
 * Sign in with Google OAuth.
 * On native (Capacitor), uses native Google Sign-In via @capacitor-firebase/authentication.
 * On web, uses popup flow.
 * Automatically saves user profile to Firestore.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  if (!auth) {
    const msg = 'Firebase auth not initialized. Check console for Firebase config status.';
    console.error(msg);
    console.error('Firebase config:', {
      apiKey: firebaseConfig.apiKey ? '***present***' : 'MISSING',
      authDomain: firebaseConfig.authDomain || 'MISSING',
      projectId: firebaseConfig.projectId || 'MISSING',
      appId: firebaseConfig.appId ? '***present***' : 'MISSING',
    });
    throw new Error(msg);
  }
  const provider = new GoogleAuthProvider();

  // Set Web Client ID for OAuth provider
  // This is required for Firebase redirect auth to work properly
  provider.setCustomParameters({
    'client_id': '93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com'
  });

  try {
    // Try native Firebase auth first (will only succeed on native platforms)
    // If native auth fails or isn't available, fall back to web OAuth
    const Capacitor = (window as any).Capacitor;

    writeLog('ultraverbose', 'Auth environment detection', {
      hasCapacitor: !!Capacitor,
      windowProtocol: window.location.protocol,
    });

    // Attempt native Firebase authentication
    let nativeAuthError: unknown = null;
    if (Capacitor) {
      try {
        // ULTRA VERBOSE LOGGING FOR APK DEBUG
        writeLog('ultraverbose', '=== APK NATIVE AUTH DEBUG START ===');
        writeLog('ultraverbose', 'Step 1: Capacitor object exists', { exists: !!Capacitor });
        writeLog('ultraverbose', 'Step 2: Capacitor.isNativePlatform', {
          isNativePlatform: Capacitor.isNativePlatform?.(),
        });

        // Check runtime config
        const runtimeConfig = (Capacitor as any).config;
        writeLog('ultraverbose', 'Step 3: Capacitor.config exists', { exists: !!runtimeConfig });
        writeLog('ultraverbose', 'Step 4: Full Capacitor config', {
          config: runtimeConfig,
          configStr: JSON.stringify(runtimeConfig),
        });
        writeLog('ultraverbose', 'Step 5: Plugins in config', {
          plugins: runtimeConfig?.plugins,
          pluginsStr: JSON.stringify(runtimeConfig?.plugins),
          pluginKeys: Object.keys(runtimeConfig?.plugins || {}),
        });

        if (runtimeConfig?.plugins?.FirebaseAuthentication) {
          writeLog('ultraverbose', 'Step 6: FirebaseAuthentication config FOUND', {
            skipNativeAuth: runtimeConfig.plugins.FirebaseAuthentication.skipNativeAuth,
            providers: runtimeConfig.plugins.FirebaseAuthentication.providers,
            fullConfig: runtimeConfig.plugins.FirebaseAuthentication,
          });
        } else {
          writeLog('ultraverbose', 'Step 6: FirebaseAuthentication config NOT found', {
            availablePlugins: Object.keys(runtimeConfig?.plugins || {}),
          });
        }

        writeLog('ultraverbose', 'Step 7: Attempting to import @capacitor-firebase/authentication');
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        writeLog('ultraverbose', 'Step 8: FirebaseAuthentication plugin imported successfully', {
          methodNames: Object.getOwnPropertyNames(FirebaseAuthentication),
        });

        writeLog('ultraverbose', 'Step 9: Calling FirebaseAuthentication.signInWithGoogle()');
        const result = await FirebaseAuthentication.signInWithGoogle();
        writeLog('ultraverbose', 'Step 10: Sign-in succeeded!', {
          hasCredential: !!result.credential,
          hasIdToken: !!result.credential?.idToken,
          credential: result.credential,
        });

        if (!result.credential?.idToken) {
          throw new Error('No ID token returned from native Google Sign-In');
        }

        // Exchange native credential for Firebase session in WebView
        const googleCredential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        const user = buildUser(userCredential.user);

        // Save user to Firestore (merge: true = upsert)
        if (db) {
          await setDoc(doc(db, 'users', user.uid), user, { merge: true });
        }
        writeLog('info', `authService: User signed in (native): ${user.email}`);
        return user;
      } catch (nativeErr: unknown) {
        const nativeMsg = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);
        writeLog('ultraverbose', '=== NATIVE AUTH ERROR ===');
        writeLog('ultraverbose', 'Error message', { message: nativeMsg });
        writeLog('ultraverbose', 'Full error object', { error: nativeErr });
        if (nativeErr instanceof Error) {
          writeLog('ultraverbose', 'Error details', {
            name: nativeErr.name,
            stack: nativeErr.stack,
            keys: Object.keys(nativeErr),
            toString: nativeErr.toString(),
          });
        }
        writeLog('ultraverbose', 'Error type', { type: typeof nativeErr });
        writeLog('ultraverbose', '=== FALLING BACK TO WEB OAUTH ===');
        nativeAuthError = nativeErr;
        // Don't re-throw — fall through to web OAuth instead
      }
    }

    // If native auth failed or wasn't available, use web OAuth
    if (nativeAuthError || !Capacitor) {
      console.log('Using web OAuth fallback...');
    }

    // Web/browser: use server-side OAuth callback flow
    // This avoids COOP header blocking and provides better error handling
    writeLog('ultraverbose', 'Using server-side OAuth callback...');

    const googleClientId = '93806788136-c64jqa2sand25r4kteoeivucpgmfl1ol.apps.googleusercontent.com';
    // CRITICAL: Hardcode production domain instead of using window.location.origin
    // On APK WebView, window.location.origin resolves to https://localhost
    const redirectUri = 'https://silent-eight.vercel.app/api/auth/callback';

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    writeLog('ultraverbose', 'Redirecting to Google OAuth', {
      clientId: googleClientId,
      redirectUri,
      windowOrigin: window.location.origin,
      windowProtocol: window.location.protocol,
      paramsObject: {
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
      },
      oauthUrl: oauthUrl.substring(0, 200) + '...',
    });

    // Redirect to Google OAuth — this page will navigate away
    window.location.href = oauthUrl;

    // Return a promise that never resolves (page navigates away)
    return new Promise<AppUser>(() => {});
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('signInWithGoogle catch block:', err);
    writeLog('error', `authService: Sign in failed: ${msg}`);
    throw err;
  }
}

/**
 * Handle custom token from OAuth callback.
 * Call this once on app startup (e.g., in Login.tsx useEffect).
 * Reads ?token= from URL, strips it immediately, and signs in user.
 * Returns the signed-in user, or null if no token was present.
 */
export async function handleCustomToken(): Promise<AppUser | null> {
  if (!auth) {
    console.log('handleCustomToken: auth not initialized, returning null');
    return null;
  }

  try {
    // Read token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const customToken = params.get('token');

    if (!customToken) {
      console.log('handleCustomToken: no token in URL');
      return null;
    }

    writeLog('ultraverbose', 'handleCustomToken: found custom token, stripping from URL...');
    // Strip token from URL immediately for security
    window.history.replaceState({}, document.title, window.location.pathname);

    // Decode custom token to extract claims
    const tokenParts = customToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid custom token format');
    }
    const payload = tokenParts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = decodeURIComponent(atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    interface CustomTokenPayload {
      claims?: {
        email?: string;
        name?: string;
        picture?: string;
      };
      uid?: string;
    }
    const tokenPayload = JSON.parse(decoded) as CustomTokenPayload;
    const claims = tokenPayload.claims || {};

    writeLog('ultraverbose', 'handleCustomToken: decoded token payload', {
      tokenLength: customToken.length,
      payloadKeys: Object.keys(tokenPayload),
      claims: claims,
      uid: tokenPayload.uid,
    });

    writeLog('ultraverbose', 'handleCustomToken: signing in with custom token...');
    const userCredential = await signInWithCustomToken(auth, customToken);

    writeLog('ultraverbose', 'handleCustomToken: signInWithCustomToken response', {
      userUid: userCredential.user.uid,
      userEmail: userCredential.user.email,
      userDisplayName: userCredential.user.displayName,
      providerData: userCredential.user.providerData,
    });
    const firebaseUser = userCredential.user;

    // Build AppUser from claims extracted from custom token
    // (Firebase User object doesn't populate email/displayName from custom token claims)
    const user: AppUser = {
      uid: firebaseUser.uid,
      email: claims.email || firebaseUser.email || '',
      displayName: claims.name || firebaseUser.displayName || '',
      photoURL: claims.picture || firebaseUser.photoURL || '',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    if (!user.email || !user.displayName) {
      throw new Error('Email or display name missing from custom token');
    }

    // Save user to Firestore (merge: true = upsert)
    if (db) {
      console.log('handleCustomToken: saving user to Firestore');
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    }

    console.log('handleCustomToken: user signed in successfully:', user.email);
    writeLog('info', `authService: User signed in via custom token: ${user.email}`);
    return user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('handleCustomToken: error:', err);
    writeLog('error', `authService: Custom token sign-in failed: ${msg}`);
    return null;
  }
}

/**
 * Sign out current user.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  try {
    await signOut(auth);
    writeLog('info', 'authService: User signed out');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `authService: Sign out failed: ${msg}`);
    throw err;
  }
}

/**
 * Subscribe to auth state changes.
 * Callback fires immediately with current user (or null if not signed in).
 */
export function onUserChanged(callback: (user: AppUser | null) => void): () => void {
  if (!auth) {
    // Firebase not initialized, immediately call with null
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      const user: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Get current user's ID token for backend API calls.
 * Used to verify authenticated requests in Vercel functions.
 */
export async function getIdToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `authService: Failed to get ID token: ${msg}`);
    return null;
  }
}
