import React from 'react';
import {
  Box, Typography, Card, CardContent, FormControl,
  InputLabel, Select, MenuItem, TextField, Switch,
  FormControlLabel, Button, Divider, Stack, Alert,
} from '@mui/material';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeMode, LogLevel } from '@/types';

/** Settings page — configure theme, logging, EmailJS, and notifications */
const SettingsPage: React.FC = () => {
  const {
    settings, setThemeMode, setLogLevel,
    setEmailjsPublicKey, setNotificationsEnabled, resetSettings,
  } = useSettingsStore();

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Settings</Typography>

      <Stack spacing={3}>
        {/* Appearance */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Appearance</Typography>
            <FormControl fullWidth>
              <InputLabel>Theme Mode</InputLabel>
              <Select
                value={settings.themeMode}
                label="Theme Mode"
                onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="time">Time-based (Auto)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Logging */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Logging</Typography>
            <FormControl fullWidth>
              <InputLabel>Log Level</InputLabel>
              <Select
                value={settings.logLevel}
                label="Log Level"
                onChange={(e) => setLogLevel(e.target.value as LogLevel)}
              >
                <MenuItem value="none">None (disabled)</MenuItem>
                <MenuItem value="error">Error only</MenuItem>
                <MenuItem value="info">Info + Error</MenuItem>
                <MenuItem value="verbose">Verbose (all)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* EmailJS */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>EmailJS</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Get your Public Key from emailjs.com dashboard → Account → API Keys
            </Alert>
            <TextField
              label="EmailJS Public Key"
              value={settings.emailjsPublicKey}
              onChange={(e) => setEmailjsPublicKey(e.target.value)}
              fullWidth
              type="password"
              helperText="Stored locally, never sent to any server"
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Browser Notifications</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
              }
              label="Enable schedule change notifications"
            />
            <Box mt={1}>
              <Button variant="outlined" size="small" onClick={requestNotificationPermission}>
                Grant Notification Permission
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Reset */}
        <Divider />
        <Box>
          <Button variant="outlined" color="error" onClick={resetSettings}>
            Reset All Settings to Default
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingsPage;
