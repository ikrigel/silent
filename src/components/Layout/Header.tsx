import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip } from '@mui/material';
import { Menu as MenuIcon, LightMode, DarkMode, AccessTime } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { ThemeMode } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <LightMode />,
  dark: <DarkMode />,
  time: <AccessTime />,
};

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'time',
  time: 'light',
};

/** Top application bar with menu toggle, theme switcher, and language switcher */
export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { settings, setThemeMode } = useSettingsStore();
  const { t } = useTranslation();

  const themeLabels: Record<ThemeMode, string> = {
    light: t('theme.switchToDark'),
    dark: t('theme.switchToTime'),
    time: t('theme.switchToLight'),
  };

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

        <Tooltip title={themeLabels[settings.themeMode]}>
          <IconButton color="inherit" onClick={cycleTheme}>
            {THEME_ICONS[settings.themeMode]}
          </IconButton>
        </Tooltip>

        <LanguageSwitcher />
      </Toolbar>
    </AppBar>
  );
};
