import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User, type Auth } from 'firebase/auth';
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

/**
 * Sign in with Google OAuth.
 * Automatically saves user profile to Firestore.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const { uid, email, displayName, photoURL } = result.user;

    if (!email || !displayName) {
      throw new Error('Email or display name missing from Google profile');
    }

    const user: AppUser = {
      uid,
      email,
      displayName,
      photoURL: photoURL || '',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Save user to Firestore (merge: true = upsert)
    if (db) {
      await setDoc(doc(db, 'users', uid), user, { merge: true });
    }
    writeLog('info', `authService: User signed in: ${email}`);
    return user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    writeLog('error', `authService: Sign in failed: ${msg}`);
    throw err;
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
