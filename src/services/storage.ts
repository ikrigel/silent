import type { LocalStorageSchema, LocalStorageKey } from '@/types';

/**
 * Type-safe localStorage wrapper.
 * All values are JSON-serialized. Returns null on missing or parse error.
 */
export const storage = {
  get<K extends LocalStorageKey>(key: K): LocalStorageSchema[K] | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as LocalStorageSchema[K];
    } catch {
      return null;
    }
  },

  set<K extends LocalStorageKey>(key: K, value: LocalStorageSchema[K]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove<K extends LocalStorageKey>(key: K): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};
