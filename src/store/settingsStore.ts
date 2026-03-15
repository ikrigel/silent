import { create } from 'zustand';
import type { AppSettings, ThemeMode, LogLevel } from '@/types';
import { storage } from '@/services/storage';

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'time',
  logLevel: 'info',
  notificationsEnabled: true,
  menuPosition: 'left',
  menuPinned: true,
};

interface SettingsState {
  settings: AppSettings;
  setThemeMode: (mode: ThemeMode) => void;
  setLogLevel: (level: LogLevel) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setMenuPosition: (pos: 'left' | 'right' | 'top' | 'bottom') => void;
  setMenuPinned: (pinned: boolean) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const stored = storage.get('settings');
  const initial = stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;

  const persist = (settings: AppSettings) => { storage.set('settings', settings); };

  return {
    settings: initial,
    setThemeMode: (mode) => { const s = { ...get().settings, themeMode: mode }; persist(s); set({ settings: s }); },
    setLogLevel: (level) => { const s = { ...get().settings, logLevel: level }; persist(s); set({ settings: s }); },
    setNotificationsEnabled: (enabled) => { const s = { ...get().settings, notificationsEnabled: enabled }; persist(s); set({ settings: s }); },
    setMenuPosition: (pos) => { const s = { ...get().settings, menuPosition: pos }; persist(s); set({ settings: s }); },
    setMenuPinned: (pinned) => { const s = { ...get().settings, menuPinned: pinned }; persist(s); set({ settings: s }); },
    resetSettings: () => { storage.remove('settings'); set({ settings: DEFAULT_SETTINGS }); },
  };
});
