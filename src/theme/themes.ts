import { createTheme, Theme } from '@mui/material/styles';
import { lerpColor, getSmoothDarknessFactor } from './colorInterpolation';

/** MUI Light theme */
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
});

/** MUI Dark theme */
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#ce93d8' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
});

/**
 * Generate a time-based MUI theme.
 * Colors interpolate between light and dark based on time of day.
 * Lightest at noon, darkest at midnight.
 */
export function getTimeBasedTheme(date = new Date()): Theme {
  const darkness = getSmoothDarknessFactor(date);

  const bgDefault = lerpColor('#f5f5f5', '#121212', darkness);
  const bgPaper   = lerpColor('#ffffff', '#1e1e1e', darkness);
  const primary   = lerpColor('#1976d2', '#90caf9', darkness);
  const secondary = lerpColor('#9c27b0', '#ce93d8', darkness);

  return createTheme({
    palette: {
      mode: darkness > 0.5 ? 'dark' : 'light',
      primary: { main: primary },
      secondary: { main: secondary },
      background: { default: bgDefault, paper: bgPaper },
    },
  });
}
