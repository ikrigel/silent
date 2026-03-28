import { create } from 'zustand';
import { onUserChanged, signInWithGoogle, signOutUser, type AppUser } from '@/services/authService';
import { writeLog } from '@/services/logService';

/** Auth state managed by Zustand */
interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  subscribeToAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async () => {
    set({ loading: true, error: null });
    try {
      const user = await signInWithGoogle();
      set({ user, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, loading: false });
      writeLog('error', `authStore: Sign in error: ${msg}`);
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await signOutUser();
      set({ user: null, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, loading: false });
      writeLog('error', `authStore: Sign out error: ${msg}`);
    }
  },

  subscribeToAuth: () => {
    set({ loading: true });
    const unsubscribe = onUserChanged((user) => {
      set({ user, loading: false });
    });
    // Note: unsubscribe is returned but not stored — call it manually to clean up if needed
    return unsubscribe;
  },

  clearError: () => set({ error: null }),
}));
