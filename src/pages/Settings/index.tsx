import React from 'react';
import {
  Box, Typography, Card, CardContent, FormControl,
  InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Button, Divider, Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeMode, LogLevel } from '@/types';

/** Settings page — configure theme, logging, and notifications */
const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    settings, setThemeMode, setLogLevel,
    setNotificationsEnabled, setMenuPosition, setMenuPinned, resetSettings,
  } = useSettingsStore();

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{t('settings.title')}</Typography>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('settings.appearance')}</Typography>
            <FormControl fullWidth>
              <InputLabel>{t('settings.themeMode')}</InputLabel>
              <Select
                value={settings.themeMode}
                label={t('settings.themeMode')}
                onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
                inputProps={{ 'aria-label': t('settings.themeMode') }}
              >
                <MenuItem value="light">{t('settings.light')}</MenuItem>
                <MenuItem value="dark">{t('settings.dark')}</MenuItem>
                <MenuItem value="time">{t('settings.timeBased')}</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('settings.logging')}</Typography>
            <FormControl fullWidth>
              <InputLabel>{t('settings.logLevel')}</InputLabel>
              <Select
                value={settings.logLevel}
                label={t('settings.logLevel')}
                onChange={(e) => setLogLevel(e.target.value as LogLevel)}
                inputProps={{ 'aria-label': t('settings.logLevel') }}
              >
                <MenuItem value="none">{t('settings.logNone')}</MenuItem>
                <MenuItem value="error">{t('settings.logError')}</MenuItem>
                <MenuItem value="info">{t('settings.logInfo')}</MenuItem>
                <MenuItem value="verbose">{t('settings.logVerbose')}</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('settings.notifications')}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
              }
              label={t('settings.notificationsLabel')}
            />
            <Box mt={1}>
              <Button variant="outlined" size="small" onClick={requestNotificationPermission}>
                {t('settings.grantPermission')}
              </Button>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('settings.menu')}</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('settings.menuPosition')}</InputLabel>
              <Select
                value={settings.menuPosition ?? 'left'}
                label={t('settings.menuPosition')}
                onChange={(e) => setMenuPosition(e.target.value as 'left' | 'right' | 'top' | 'bottom')}
                inputProps={{ 'aria-label': t('settings.menuPosition') }}
              >
                <MenuItem value="left">{t('settings.menuLeft')}</MenuItem>
                <MenuItem value="right">{t('settings.menuRight')}</MenuItem>
                <MenuItem value="top">{t('settings.menuTop')}</MenuItem>
                <MenuItem value="bottom">{t('settings.menuBottom')}</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.menuPinned ?? true}
                  onChange={(e) => setMenuPinned(e.target.checked)}
                />
              }
              label={t('settings.menuPinned')}
            />
          </CardContent>
        </Card>
        <Divider />
        <Box>
          <Button variant="outlined" color="error" onClick={resetSettings}>
            {t('settings.reset')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingsPage;
