import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, LightMode, DarkMode, AccessTime,
} from '@mui/icons-material';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeMode } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <LightMode />,
  dark:  <DarkMode />,
  time:  <AccessTime />,
};

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Switch to Dark',
  dark:  'Switch to Time-based',
  time:  'Switch to Light',
};

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark:  'time',
  time:  'light',
};

/** Top application bar with menu toggle and theme switcher */
export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { settings, setThemeMode } = useSettingsStore();

  const cycleTheme = () => {
    setThemeMode(THEME_CYCLE[settings.themeMode]);
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Theme toggle cycles: light → dark → time → light */}
        <Tooltip title={THEME_LABELS[settings.themeMode]}>
          <IconButton color="inherit" onClick={cycleTheme}>
            {THEME_ICONS[settings.themeMode]}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
