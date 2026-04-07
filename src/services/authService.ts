import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, getRedirectResult, signOut, onAuthStateChanged, type User, type Auth } from 'firebase/auth';
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
  try {
    // Detect if running on native Android — be explicit about detection
    const Capacitor = (window as any).Capacitor;
    const isCapacitorApp = !!Capacitor && typeof Capacitor.isNativePlatform === 'function';
    const isNativePlatform = isCapacitorApp && Capacitor.isNativePlatform();

    console.log('Auth environment detection:', {
      hasCapacitor: !!Capacitor,
      isCapacitorApp,
      isNativePlatform,
      windowProtocol: window.location.protocol,
    });

    if (isNativePlatform) {
      // Native Google Sign-In — no browser redirect needed
      console.log('Using native Capacitor Google Sign-In...');
      try {
        // Diagnostic: Check the runtime Capacitor config seen by the plugin
        const runtimeConfig = (Capacitor as any).config;
        console.log('Capacitor runtime config plugins:', JSON.stringify(runtimeConfig?.plugins));
        if (runtimeConfig?.plugins?.FirebaseAuthentication) {
          console.log('  - FirebaseAuthentication.skipNativeAuth:', runtimeConfig.plugins.FirebaseAuthentication.skipNativeAuth);
          console.log('  - FirebaseAuthentication.providers:', runtimeConfig.plugins.FirebaseAuthentication.providers);
        } else {
          console.warn('FirebaseAuthentication plugin config not found in runtime config!');
        }

        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        console.log('Capacitor FirebaseAuthentication plugin loaded');

        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('Native sign-in result:', {
          hasCredential: !!result.credential,
          hasIdToken: !!result.credential?.idToken,
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
        console.error('Native Google Sign-In failed:', nativeMsg);
        if (nativeErr instanceof Error) {
          console.error('Stack:', nativeErr.stack);
        }
        throw nativeErr;
      }
    }

    // Check if we're in a WebView context where popup won't work
    if (isCapacitorApp) {
      const msg = 'Capacitor app detected but native platform check failed. Cannot use popup auth in WebView due to COOP restrictions. Native Firebase plugin may not be available.';
      console.error(msg);
      throw new Error(msg);
    }

    // Web browser: popup flow is safe
    console.log('Using web popup flow for authentication...');
    const result = await signInWithPopup(auth, provider);
    const user = buildUser(result.user);

    // Save user to Firestore (merge: true = upsert)
    if (db) {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    }
    writeLog('info', `authService: User signed in: ${user.email}`);
    return user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `authService: Sign in failed: ${msg}`);
    throw err;
  }
}

/**
 * Handle OAuth redirect result after page reloads.
 * Call this once on app startup (e.g., in App.tsx useEffect).
 * Returns the signed-in user, or null if no redirect was in progress.
 */
export async function handleRedirectResult(): Promise<AppUser | null> {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user = buildUser(result.user);

    // Save user to Firestore (merge: true = upsert)
    if (db) {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    }
    writeLog('info', `authService: User signed in via redirect: ${user.email}`);
    return user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `authService: Redirect sign-in failed: ${msg}`);
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
