import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip, useTheme, Avatar, Menu, MenuItem, Chip, Button, Box, Popover } from '@mui/material';
import { Menu as MenuIcon, LightMode, DarkMode, AccessTime, Login as LoginIcon, Close, Info } from '@mui/icons-material';
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
  const { settings, setThemeMode, setDismissedUpdateVersion } = useSettingsStore();
  const { user, signOut } = useAuthStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasApkUpdate, setHasApkUpdate] = useState(false);
  const [latestApkVersion, setLatestApkVersion] = useState<string | null>(null);
  const [versionAnchorEl, setVersionAnchorEl] = useState<null | HTMLElement>(null);
  const [isApk] = useState(() => !!(window as any).Capacitor);

  // Check for new APK version on mount (runs for all users)
  // The banner shows for APK users with older bundled versions; browser users see it when GitHub has a newer release
  useEffect(() => {
    const checkVersion = async () => {
      const latestVersion = await getLatestApkVersion();
      if (latestVersion) {
        setLatestApkVersion(latestVersion);
        const isNewer = isNewerVersion(__APP_VERSION__, latestVersion);
        setHasApkUpdate(isNewer);
      }
    };

    checkVersion();
  }, []);

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
  };

  const handleDismissUpdate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDismissedUpdateVersion(latestApkVersion ?? undefined);
    setHasApkUpdate(false);
  };

  const handleVersionClick = (event: React.MouseEvent<HTMLElement>) => {
    setVersionAnchorEl(event.currentTarget);
  };

  const handleVersionClose = () => {
    setVersionAnchorEl(null);
  };

  const versionOpen = Boolean(versionAnchorEl);

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
        {hasApkUpdate &&
          latestApkVersion &&
          settings.showUpdateNotifications !== false &&
          latestApkVersion !== settings.dismissedUpdateVersion && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
            <Chip
              label={`${t('about.newApkAvailable')}: ${latestApkVersion}`}
              color="warning"
              size="small"
              onClick={handleNavigateToAbout}
            />
            <IconButton
              size="small"
              color="inherit"
              onClick={handleDismissUpdate}
              sx={{ p: 0.25 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Current Version Display */}
        <Tooltip title={`Click to see version details`}>
          <IconButton
            color="inherit"
            size="small"
            onClick={handleVersionClick}
            sx={{ mr: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
              <Info fontSize="small" />
              <Typography variant="caption">v{__APP_VERSION__}</Typography>
            </Box>
          </IconButton>
        </Tooltip>

        {/* Version Popover */}
        <Popover
          open={versionOpen}
          anchorEl={versionAnchorEl}
          onClose={handleVersionClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, maxWidth: 280 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              📱 {t('about.currentVersion')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip label={`v${__APP_VERSION__}`} size="small" color="primary" />
              <Typography variant="caption" color="text.secondary">
                {isApk ? 'APK' : 'Web'}
              </Typography>
            </Box>

            {latestApkVersion && latestApkVersion !== __APP_VERSION__ && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  ⬇️ {t('about.apkAvailableVersion')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={`v${latestApkVersion}`} size="small" variant="outlined" />
                </Box>
              </>
            )}

            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => { handleVersionClose(); navigate('/about'); }}
              sx={{ mt: 2 }}
            >
              View Details
            </Button>
          </Box>
        </Popover>

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
