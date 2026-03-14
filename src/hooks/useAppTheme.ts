import { useState, useEffect } from 'react';
import { Theme } from '@mui/material/styles';
import { lightTheme, darkTheme, getTimeBasedTheme } from '@/theme/themes';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Returns the active MUI theme based on user settings.
 * For time-based mode, updates every 5 seconds.
 */
export function useAppTheme(): Theme {
  const { settings } = useSettingsStore();
  const [timeTheme, setTimeTheme] = useState<Theme>(() => getTimeBasedTheme());

  useEffect(() => {
    if (settings.themeMode !== 'time') return;

    // Update time-based theme every 5 seconds
    const interval = setInterval(() => {
      setTimeTheme(getTimeBasedTheme());
    }, 5000);

    return () => clearInterval(interval);
  }, [settings.themeMode]);

  switch (settings.themeMode) {
    case 'light': return lightTheme;
    case 'dark':  return darkTheme;
    case 'time':  return timeTheme;
    default:      return lightTheme;
  }
}
