import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip, useTheme, Avatar, Menu, MenuItem, Chip, Button } from '@mui/material';
import { Menu as MenuIcon, LightMode, DarkMode, AccessTime, Login as LoginIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getLatestApkVersion, isNewerVersion } from '@/services/apkVersionService';
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

/** Top application bar with menu toggle, theme switcher, language switcher, and user auth */
export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { settings, setThemeMode } = useSettingsStore();
  const { user, signOut } = useAuthStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasApkUpdate, setHasApkUpdate] = useState(false);

  // Check for new APK version on mount (if logged in)
  useEffect(() => {
    if (!user) return;

    const checkVersion = async () => {
      const latestVersion = await getLatestApkVersion();
      if (latestVersion) {
        const isNewer = isNewerVersion(__APP_VERSION__, latestVersion);
        setHasApkUpdate(isNewer);
      }
    };

    checkVersion();
  }, [user]);

  const themeLabels: Record<ThemeMode, string> = {
    light: t('theme.switchToDark'),
    dark: t('theme.switchToTime'),
    time: t('theme.switchToLight'),
  };

  const cycleTheme = () => {
    setThemeMode(THEME_CYCLE[settings.themeMode]);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
  };

  const handleNavigateToAbout = () => {
    navigate('/about');
    setHasApkUpdate(false);
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge={theme.direction === 'rtl' ? 'end' : 'start'}
          onClick={onMenuClick}
          sx={{ [theme.direction === 'rtl' ? 'ml' : 'mr']: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        {/* New APK Available Chip */}
        {hasApkUpdate && (
          <Chip
            label={t('about.newApkAvailable', { version: '' }).replace(/\s+$/, '')}
            color="warning"
            size="small"
            onClick={handleNavigateToAbout}
            sx={{ mr: 1 }}
          />
        )}

        <Tooltip title={themeLabels[settings.themeMode]}>
          <IconButton color="inherit" onClick={cycleTheme}>
            {THEME_ICONS[settings.themeMode]}
          </IconButton>
        </Tooltip>

        <LanguageSwitcher />

        {/* Auth Section */}
        {user ? (
          <>
            <Avatar
              src={user.photoURL}
              sx={{ width: 32, height: 32, cursor: 'pointer', ml: 1 }}
              onClick={handleMenuOpen}
            />
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem disabled>
                <Typography variant="body2">{user.displayName}</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleSignOut}>{t('auth.signOut')}</MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            color="inherit"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{ ml: 1 }}
          >
            {t('auth.login')}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};
