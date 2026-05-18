import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/authStore';
import { useSchedulerStore } from '@/store/schedulerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRobotStateStore } from '@/store/robotStateStore';
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
import { getActiveSchedules } from '@/services/schedulerService';
import { writeLog } from '@/services/logService';
import { robotService } from '@/services/robotService';
import { airplaneModeService } from '@/services/airplaneModeService';
import { weaSilenceService } from '@/services/weaSilenceService';
import { fireScheduleReminder, fireScheduleEndReminder } from '@/services/notificationService';
import '@/i18n';

/**
 * Root application component.
 * Sets up routing, theming (with RTL support), and the global layout shell.
 */
const App: React.FC = () => {
  const baseTheme = useAppTheme();
  const { i18n } = useTranslation();
  const { subscribeToAuth } = useAuthStore();
  const { schedules, loadSchedules } = useSchedulerStore();
  const { settings } = useSettingsStore();
  const { captureSnapshot, getSnapshot, clearSnapshot } = useRobotStateStore();
  const prevActiveIds = useRef<Set<string>>(new Set());
  const isRTL = i18n.language === 'he';

  // Initialize Firebase auth listener on app mount
  useEffect(() => {
    subscribeToAuth();
  }, [subscribeToAuth]);

  // Initialize scheduler on app mount
  useEffect(() => {
    writeLog('info', `[v${__APP_VERSION__}] ═══ App started on ${robotService.isAndroid() ? 'ANDROID' : 'WEB'} ═══`);
    loadSchedules();
    const initial = getActiveSchedules();
    prevActiveIds.current = new Set(initial.map((s) => s.id));
  }, [loadSchedules]);

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

  // Global scheduler tick — always runs, independent of active page
  useEffect(() => {
    const tick = async () => {
      try {
        const isAndroid = robotService.isAndroid();
        const nowActive = getActiveSchedules();
        const nowIds = new Set(nowActive.map((s) => s.id));

        for (const s of nowActive) {
          if (prevActiveIds.current.has(s.id)) continue;

          writeLog('info', `[v${__APP_VERSION__}] ⚡ SCHEDULE ACTIVATED: "${s.name}"`);
          if (settings.notificationsEnabled) fireScheduleReminder(s.name);

          const hasActions = !!(s.useAirplaneMode || s.silenceWEAOnStart || s.robotRecordingId);
          writeLog('info', `[v${__APP_VERSION__}] Platform: ${isAndroid ? 'ANDROID' : 'WEB'} | hasActions: ${hasActions}`);
          writeLog('info', `[v${__APP_VERSION__}] Actions: airplane=${s.useAirplaneMode} wea=${s.silenceWEAOnStart} rec=${s.robotRecordingId ?? 'none'}`);

          if (!isAndroid) {
            writeLog('info', `[v${__APP_VERSION__}] ⚠ Web platform — robot actions skipped`);
            continue;
          }
          if (!hasActions) {
            writeLog('info', `[v${__APP_VERSION__}] ⚠ No actions configured on schedule "${s.name}" — skipped`);
            continue;
          }

          try {
            if (s.useAirplaneMode) {
              writeLog('info', `[v${__APP_VERSION__}] 📸 Capturing robot state snapshot for "${s.name}"`);
              try {
                const currentState = await robotService.getAirplaneModeState();
                captureSnapshot(s.id, currentState, false);
              } catch (e) {
                writeLog('error', `[v${__APP_VERSION__}] Snapshot error: ${e}`);
              }
              writeLog('info', `[v${__APP_VERSION__}] ✈ Enabling airplane mode...`);
              const ctx = { scheduleId: s.id, scheduleName: s.name };
              const result = await airplaneModeService.enable(ctx);
              writeLog('info', `[v${__APP_VERSION__}] ✈ Airplane result: ${result}`);
            }
            if (s.silenceWEAOnStart) {
              writeLog('info', `[v${__APP_VERSION__}] 🔇 Silencing WEA...`);
              const result = await weaSilenceService.silence();
              writeLog('info', `[v${__APP_VERSION__}] 🔇 WEA result: ${result}`);
            }
            if (s.robotRecordingId) {
              writeLog('info', `[v${__APP_VERSION__}] 🎬 Executing recording: ${s.robotRecordingId}`);
              const result = await robotService.executeRecording(s.robotRecordingId);
              writeLog('info', `[v${__APP_VERSION__}] 🎬 Recording result: ${result}`);
            }
            writeLog('info', `[v${__APP_VERSION__}] ✅ All actions complete for "${s.name}"`);
          } catch (actionErr) {
            writeLog('error', `[v${__APP_VERSION__}] ❌ Action failed for "${s.name}": ${actionErr}`);
          }
        }

        // Deactivation handling
        prevActiveIds.current.forEach((id) => {
          if (nowIds.has(id)) return;
          const entry = schedules.find((schedule) => schedule.id === id);
          if (!entry) return;
          writeLog('info', `[v${__APP_VERSION__}] ⏹ SCHEDULE ENDED: "${entry.name}"`);
          const shouldRestore = entry.restoreOnEnd !== false;
          const snapshot = getSnapshot(id);
          if (entry.useAirplaneMode && isAndroid && shouldRestore) {
            if (snapshot && !snapshot.airplaneModeWasActive) {
              airplaneModeService
                .disable()
                .catch((e) => writeLog('error', `[v${__APP_VERSION__}] Restore airplane error: ${e}`));
            }
            clearSnapshot(id);
          }
          if (entry.unsilenceWEAOnEnd && isAndroid && shouldRestore) {
            robotService.unsilenceWEA().catch((e) => writeLog('error', `[v${__APP_VERSION__}] Unsilence WEA error: ${e}`));
          }
          if (settings.notificationsEnabled) fireScheduleEndReminder(entry.name);
        });

        prevActiveIds.current = nowIds;
      } catch (err) {
        writeLog('error', `[v${__APP_VERSION__}] ❌ Scheduler tick error: ${err}`);
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [schedules, settings.notificationsEnabled, captureSnapshot, getSnapshot, clearSnapshot]);

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
