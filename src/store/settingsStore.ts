import { create } from 'zustand';
import type { AppSettings, ThemeMode, LogLevel } from '@/types';
import { storage } from '@/services/storage';

/** Default application settings */
const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'time',
  logLevel: 'info',
  emailjsPublicKey: '4aMkGokEYDP1_lL5-',
  notificationsEnabled: true,
};

interface SettingsState {
  settings: AppSettings;
  setThemeMode: (mode: ThemeMode) => void;
  setLogLevel: (level: LogLevel) => void;
  setEmailjsPublicKey: (key: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

/** Zustand store for application settings with localStorage persistence */
export const useSettingsStore = create<SettingsState>((set, get) => {
  // Load initial settings from localStorage
  const stored = storage.get('settings');
  const initial = stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;

  const persist = (settings: AppSettings) => {
    storage.set('settings', settings);
  };

  return {
    settings: initial,

    setThemeMode: (mode) => {
      const settings = { ...get().settings, themeMode: mode };
      persist(settings);
      set({ settings });
    },

    setLogLevel: (level) => {
      const settings = { ...get().settings, logLevel: level };
      persist(settings);
      set({ settings });
    },

    setEmailjsPublicKey: (key) => {
      const settings = { ...get().settings, emailjsPublicKey: key };
      persist(settings);
      set({ settings });
    },

    setNotificationsEnabled: (enabled) => {
      const settings = { ...get().settings, notificationsEnabled: enabled };
      persist(settings);
      set({ settings });
    },

    resetSettings: () => {
      storage.remove('settings');
      set({ settings: DEFAULT_SETTINGS });
    },
  };
});
