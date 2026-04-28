import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Alert,
  Button, List, ListItem, ListItemText, Divider, Collapse,
} from '@mui/material';
import { Schedule, CheckCircle, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSchedulerStore } from '@/store/schedulerStore';
import { useRobotStateStore } from '@/store/robotStateStore';
import { getActiveSchedules } from '@/services/schedulerService';
import { getSmoothDarknessFactor } from '@/theme/colorInterpolation';
import { fireScheduleReminder, fireScheduleEndReminder } from '@/services/notificationService';
import { writeLog } from '@/services/logService';
import HowToGuide from '@/components/HowToGuide';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { robotService } from '@/services/robotService';
import { airplaneModeService, type EnableContext } from '@/services/airplaneModeService';

/**
 * Dashboard page.
 *
 * IMPORTANT CLARIFICATION:
 * This app CANNOT silence emergency alerts automatically. WEA messages are
 * delivered at modem/radio level and bypass all software. When a schedule is
 * "active", it means: the app is reminding you to go silence alerts manually
 * in your phone's Settings. The HowToGuide component shows the exact steps.
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schedules, loadSchedules } = useSchedulerStore();
  const { settings } = useSettingsStore();
  const { captureSnapshot, getSnapshot, clearSnapshot } = useRobotStateStore();
  const [activeSchedules, setActiveSchedules] = useState<ScheduleEntry[]>([]);
  const [darkness, setDarkness] = useState(getSmoothDarknessFactor());
  const [guideOpen, setGuideOpen] = useState(false);

  // Track previous active IDs to detect transitions and fire notifications
  const prevActiveIds = useRef<Set<string>>(new Set());

  // Load schedules from localStorage on mount (needed for tests that set localStorage directly)
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    const tick = async () => {
      const nowActive = getActiveSchedules();
      setActiveSchedules(nowActive);
      setDarkness(getSmoothDarknessFactor());

      const nowIds = new Set(nowActive.map((s) => s.id));

      // Schedules that just became active → fire start reminder + optional robot/airplane
      // NOTE: Robot actions fire REGARDLESS of notificationsEnabled (critical fix)
      nowActive.forEach((s) => {
        if (!prevActiveIds.current.has(s.id)) {
          writeLog('info',`Dashboard: Schedule "${s.name}" activated`);
          if (settings.notificationsEnabled) {
            fireScheduleReminder(s.name);
          }
          if (robotService.isAndroid()) {
            const runScheduleActions = async () => {
              if (s.useAirplaneMode) {
                const ctx: EnableContext = { scheduleId: s.id, scheduleName: s.name };
                try {
                  const wasActive = await airplaneModeService.getState();
                  captureSnapshot(s.id, wasActive, false);
                  if (!wasActive) {
                    await airplaneModeService.enable(ctx);
                  }
                } catch (err: unknown) {
                  captureSnapshot(s.id, false, false);
                  const msg = err instanceof Error ? err.message : String(err);
                  writeLog('error',`Dashboard: Failed to enable airplane mode: ${msg}`);
                  await airplaneModeService.enable(ctx).catch((err: unknown) => {
                    const msg2 = err instanceof Error ? err.message : String(err);
                    writeLog('error',`Dashboard: Failed to enable airplane mode on retry: ${msg2}`);
                  });
                }
              }
              if (s.robotRecordingId) {
                try {
                  await robotService.executeRecording(s.robotRecordingId);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err);
                  writeLog('error',`Dashboard: Failed to execute recording ${s.robotRecordingId}: ${msg}`);
                }
              }
            };
            runScheduleActions();
          }
        }
      });

      // Schedules that just ended → restore state + fire end reminder
      // NOTE: Restore logic decoupled from notifications (critical fix)
      prevActiveIds.current.forEach((id) => {
        if (!nowIds.has(id)) {
          const entry = schedules.find((s) => s.id === id);
          if (entry) {
            writeLog('info',`Dashboard: Schedule "${entry.name}" ended`);

            // Restore device state if requested (default: true)
            const shouldRestore = entry.restoreOnEnd !== false;
            const snapshot = getSnapshot(id);

            if (entry.useAirplaneMode && robotService.isAndroid() && shouldRestore) {
              if (!snapshot) {
                writeLog('info', `Dashboard: No snapshot for schedule ${id}, skipping airplane mode restore`);
              } else if (!snapshot.airplaneModeWasActive) {
                // Airplane mode was OFF before schedule started — restore only if it's still ON now
                airplaneModeService.getState()
                  .then((isCurrentlyOn) => {
                    if (isCurrentlyOn) {
                      airplaneModeService.disable().catch((err: unknown) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        writeLog('error',`Dashboard: Failed to disable airplane mode on end: ${msg}`);
                      });
                    }
                  })
                  .catch(() => {
                    // Can't determine current state → fall back to explicit disable
                    airplaneModeService.disable().catch((err: unknown) => {
                      const msg = err instanceof Error ? err.message : String(err);
                      writeLog('error',`Dashboard: Failed to disable airplane mode on end: ${msg}`);
                    });
                  });
              }
              clearSnapshot(id);
            }

            if (entry.unsilenceWEAOnEnd && robotService.isAndroid() && shouldRestore) {
              robotService.unsilenceWEA().catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                writeLog('error',`Dashboard: Failed to unsilence WEA on schedule end: ${msg}`);
              });
            }

            // Notifications still fire regardless
            if (settings.notificationsEnabled) {
              fireScheduleEndReminder(entry.name);
            }
          }
        }
      });

      prevActiveIds.current = nowIds;
    };

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [schedules, settings.notificationsEnabled, captureSnapshot, getSnapshot, clearSnapshot]);

  const isReminderActive = activeSchedules.length > 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">{t('dashboard.title')}</Typography>

      {/* ── Honest status banner ─────────────────────────────────────────────
          Wording is careful: "reminder active" not "silencing active".
          The app cannot silence alerts — it only reminds you to do it.     */}
      <Alert
        severity={isReminderActive ? 'warning' : 'success'}
        icon={isReminderActive ? <Schedule /> : <CheckCircle />}
        sx={{ mb: 2 }}
        action={
          isReminderActive ? (
            <Button size="small" color="inherit" onClick={() => setGuideOpen((p) => !p)}
              endIcon={guideOpen ? <ExpandLess /> : <ExpandMore />}>
              How to silence
            </Button>
          ) : undefined
        }
      >
        {isReminderActive
          ? t('dashboard.reminder', { count: activeSchedules.length })
          : t('dashboard.noActive')}
      </Alert>

      {/* ── Step-by-step guide (shown when reminder is active) ─────────────── */}
      <Collapse in={guideOpen}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <HowToGuide highlightActive={isReminderActive} />
          </CardContent>
        </Card>
      </Collapse>

      <Grid container spacing={3}>
        {/* Schedules summary card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
                {t('dashboard.schedulesCard')}
              </Typography>
              <Typography variant="h3" color="primary">{schedules.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.enabled', { count: schedules.filter((s) => s.enabled).length })}
              </Typography>
              <Button sx={{ mt: 2 }} onClick={() => navigate('/scheduler')} variant="outlined">
                {t('dashboard.manageSchedules')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Theme darkness indicator */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.themeDarkness')}</Typography>
              <Typography variant="h3">{Math.round(darkness * 100)}%</Typography>
              <Typography variant="body2" color="text.secondary">
                {darkness < 0.3 ? t('dashboard.daytime') :
                 darkness < 0.7 ? t('dashboard.transitioning') :
                                  t('dashboard.night')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active reminder schedules list */}
        {isReminderActive && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('dashboard.activeNow')}</Typography>
                <List dense>
                  {activeSchedules.map((s, i) => (
                    <React.Fragment key={s.id}>
                      {i > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={s.name}
                          secondary={`${s.startTime} – ${s.endTime} · ${s.repeatMode}`}
                        />
                        <Chip label="REMINDER" color="warning" size="small" />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Always-visible guide (collapsed by default, for reference) */}
        {!isReminderActive && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center"
                  sx={{ cursor: 'pointer' }} onClick={() => setGuideOpen((p) => !p)}>
                  <Typography variant="h6">📖 How to silence emergency alerts</Typography>
                  {guideOpen ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={guideOpen}>
                  <Box sx={{ mt: 2 }}>
                    <HowToGuide highlightActive={false} />
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
