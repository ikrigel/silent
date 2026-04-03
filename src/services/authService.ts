import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, type User, type Auth } from 'firebase/auth';
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
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn('Firebase config incomplete, auth features will be disabled');
  }
} catch (err) {
  console.error('Firebase initialization failed:', err);
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
 * On native (Capacitor), uses redirect flow; on web, uses popup flow.
 * Automatically saves user profile to Firestore.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  const provider = new GoogleAuthProvider();
  try {
    // Capacitor WebView cannot complete popup-based OAuth — use redirect flow instead
    const isCapacitor = typeof (window as any).Capacitor !== 'undefined'
      && (window as any).Capacitor.isNativePlatform?.();

    if (isCapacitor) {
      await signInWithRedirect(auth, provider);
      // Page reloads after user logs in; result is picked up by handleRedirectResult()
      return new Promise(() => {}); // never resolves — caller waits for page reload
    }

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
