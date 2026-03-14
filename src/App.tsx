import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AppLayout } from '@/components/Layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import SchedulerPage from '@/pages/Scheduler';
import LogsPage from '@/pages/Logs';
import SettingsPage from '@/pages/Settings';
import AboutPage from '@/pages/About';
import HelpPage from '@/pages/Help';

/**
 * Root application component.
 * Sets up routing, theming, and the global layout shell.
 */
const App: React.FC = () => {
  const theme = useAppTheme(); // Dynamic theme (light/dark/time-based)

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline normalizes browser default styles */}
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
