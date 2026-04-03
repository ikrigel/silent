import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/authStore';
import { handleRedirectResult } from '@/services/authService';
import { AppLayout } from '@/components/Layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import SchedulerPage from '@/pages/Scheduler';
import LogsPage from '@/pages/Logs';
import SettingsPage from '@/pages/Settings';
import AboutPage from '@/pages/About';
import HelpPage from '@/pages/Help';
import RobotPage from '@/pages/Robot';
import DonatePage from '@/pages/Donate';
import LoginPage from '@/pages/Login';
import '@/i18n';

/**
 * Root application component.
 * Sets up routing, theming (with RTL support), and the global layout shell.
 */
const App: React.FC = () => {
  const baseTheme = useAppTheme();
  const { i18n } = useTranslation();
  const { subscribeToAuth } = useAuthStore();
  const isRTL = i18n.language === 'he';

  // Initialize Firebase auth listener and handle OAuth redirects on app mount
  useEffect(() => {
    handleRedirectResult().then(user => {
      if (user) {
        // Use the store's internal setState (from Zustand) to update the user
        useAuthStore.setState({ user });
      }
    });
    subscribeToAuth();
  }, [subscribeToAuth]);

  // Rebuild theme with correct direction whenever language changes
  const theme = React.useMemo(
    () => createTheme({ ...baseTheme, direction: isRTL ? 'rtl' : 'ltr' }),
    [baseTheme, isRTL]
  );

  // Sync document direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Login page (no layout wrapper) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main app with layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="robot" element={<RobotPage />} />
            <Route path="donate" element={<DonatePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
