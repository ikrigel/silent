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
import { weaSilenceService } from '@/services/weaSilenceService';

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
    writeLog('info', `Dashboard: Component mounted/rendered`);
    writeLog('ultraverbose', `Dashboard: Component state`, {
      schedulesCount: schedules.length,
      settingsNotificationsEnabled: settings.notificationsEnabled,
    });
    writeLog('ultraverbose', `Dashboard: useEffect (loadSchedules) running`);
    loadSchedules();

    // Initialize prevActiveIds with currently active schedules so we trigger on mount
    const initialActive = getActiveSchedules();
    writeLog('ultraverbose', `Dashboard: Initializing prevActiveIds with active schedules on mount`, {
      initialActiveCount: initialActive.length,
      initialActiveIds: initialActive.map((s) => ({ id: s.id, name: s.name })),
    });
    prevActiveIds.current = new Set(initialActive.map((s) => s.id));
  }, [loadSchedules]);

  useEffect(() => {
    writeLog('info', `Dashboard: useEffect (scheduler tick) mounting - setting up 5s interval`);
    writeLog('ultraverbose', `Dashboard: useEffect dependencies`, {
      schedulesCount: schedules.length,
      settingsNotificationsEnabled: settings.notificationsEnabled,
    });

    const tick = async () => {
      const nowActive = getActiveSchedules();
      setActiveSchedules(nowActive);
      setDarkness(getSmoothDarknessFactor());

      const nowIds = new Set(nowActive.map((s) => s.id));

      writeLog('ultraverbose', `Dashboard: tick() called, checking ${schedules.length} schedules, ${nowActive.length} are currently active`, {
        activeCount: nowActive.length,
        totalCount: schedules.length,
        activeIds: Array.from(nowIds),
      });

      schedules.forEach((s) => {
        const isActive = getActiveSchedules().some((a) => a.id === s.id);
        writeLog('ultraverbose', `Dashboard: Checking schedule "${s.name}"`, {
          id: s.id,
          enabled: s.enabled,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive,
          useAirplaneMode: s.useAirplaneMode,
          silenceWEAOnStart: s.silenceWEAOnStart,
          robotRecordingId: s.robotRecordingId,
          unsilenceWEAOnEnd: s.unsilenceWEAOnEnd,
          restoreOnEnd: s.restoreOnEnd,
        });
      });

      // Schedules that just became active → fire start reminder + optional robot/airplane
      // NOTE: Robot actions fire REGARDLESS of notificationsEnabled (critical fix)
      nowActive.forEach((s) => {
        if (!prevActiveIds.current.has(s.id)) {
          writeLog('info',`Dashboard: ⚡ Schedule "${s.name}" JUST ACTIVATED`);
          writeLog('ultraverbose', `Dashboard: Schedule "${s.name}" transitioning to active state`, {
            id: s.id,
            wasActive: prevActiveIds.current.has(s.id),
          });

          if (settings.notificationsEnabled) {
            writeLog('ultraverbose', `Dashboard: Firing notification for schedule "${s.name}"`);
            fireScheduleReminder(s.name);
          } else {
            writeLog('ultraverbose', `Dashboard: Notifications disabled, skipping reminder for "${s.name}"`);
          }

          writeLog('ultraverbose', `Dashboard: Checking if Android for schedule "${s.name}"`, {
            isAndroid: robotService.isAndroid(),
          });

          const isAndroid = robotService.isAndroid();
          writeLog('info', `Dashboard: ⚙️ ANDROID CHECK: ${isAndroid ? 'YES - Will fire robot actions' : 'NO - Skipping robot actions (browser environment)'}`);
          writeLog('ultraverbose', `Dashboard: isAndroid() returned: ${isAndroid}`, {
            scheduleId: s.id,
            scheduleName: s.name,
            hasRobotActions: !!(s.useAirplaneMode || s.silenceWEAOnStart || s.robotRecordingId),
          });

          if (isAndroid) {
            const runScheduleActions = async () => {
              try {
                writeLog('info', `Dashboard: 🚀 STARTING ROBOT ACTIONS for schedule "${s.name}"`);
                writeLog('ultraverbose', `Dashboard: runScheduleActions started for schedule "${s.name}"`, {
                  scheduleId: s.id,
                  useAirplaneMode: s.useAirplaneMode,
                  silenceWEAOnStart: s.silenceWEAOnStart,
                  robotRecordingId: s.robotRecordingId,
                  actions: {
                    airplane: s.useAirplaneMode ? 'ENABLED' : 'disabled',
                    wea: s.silenceWEAOnStart ? 'ENABLED' : 'disabled',
                    recording: s.robotRecordingId ? 'ENABLED' : 'disabled',
                  },
                });

                if (s.useAirplaneMode) {
                  try {
                    writeLog('info', `Dashboard: 📡 AIRPLANE MODE: Starting enable sequence for "${s.name}"`);
                    const ctx: EnableContext = { scheduleId: s.id, scheduleName: s.name };
                    writeLog('ultraverbose', `Dashboard: Calling airplaneModeService.getState()`, { scheduleId: s.id });
                    const wasActive = await airplaneModeService.getState();
                    writeLog('info', `Dashboard: 📡 AIRPLANE MODE: Current state = ${wasActive ? 'ON' : 'OFF'}`);
                    writeLog('ultraverbose', `Dashboard: airplaneModeService.getState() returned ${wasActive}`, { scheduleId: s.id });
                    captureSnapshot(s.id, wasActive, false);
                    if (!wasActive) {
                      writeLog('ultraverbose', `Dashboard: airplane mode not active, calling enable()`, { scheduleId: s.id });
                      await airplaneModeService.enable(ctx);
                      writeLog('info', `Dashboard: 📡 AIRPLANE MODE: ✅ Enable sequence completed`);
                      writeLog('ultraverbose', `Dashboard: enable() completed successfully`, { scheduleId: s.id });
                    } else {
                      writeLog('info', `Dashboard: 📡 AIRPLANE MODE: Already ON, skipping enable`);
                      writeLog('ultraverbose', `Dashboard: airplane mode already active, skipping enable()`, { scheduleId: s.id });
                    }
                  } catch (err: unknown) {
                    captureSnapshot(s.id, false, false);
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error',`Dashboard: 📡 AIRPLANE MODE: ❌ FAILED - ${msg}`, { scheduleId: s.id, stack });
                    writeLog('ultraverbose', `Dashboard: attempting enable() again after getState() error`, { scheduleId: s.id });
                    await airplaneModeService.enable(ctx).catch((err: unknown) => {
                      const msg2 = err instanceof Error ? err.message : String(err);
                      const stack2 = err instanceof Error ? err.stack : '';
                      writeLog('error',`Dashboard: 📡 AIRPLANE MODE: ❌ RETRY FAILED - ${msg2}`, { scheduleId: s.id, stack: stack2 });
                    });
                  }
                }

                if (s.silenceWEAOnStart) {
                  try {
                    writeLog('info', `Dashboard: 🔇 WEA SILENCE: Starting for "${s.name}"`);
                    writeLog('ultraverbose', `Dashboard: silencing WEA for schedule "${s.name}"`, { scheduleId: s.id });
                    await weaSilenceService.silence();
                    writeLog('info', `Dashboard: 🔇 WEA SILENCE: ✅ SUCCESS`);
                    writeLog('ultraverbose', `Dashboard: WEA silenced successfully`, { scheduleId: s.id });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error',`Dashboard: 🔇 WEA SILENCE: ❌ FAILED - ${msg}`, { scheduleId: s.id, stack });
                  }
                }

                if (s.robotRecordingId) {
                  try {
                    writeLog('info', `Dashboard: 🎬 RECORDING: Starting "${s.robotRecordingId}" for "${s.name}"`);
                    writeLog('ultraverbose', `Dashboard: executing recording "${s.robotRecordingId}"`, { scheduleId: s.id });
                    await robotService.executeRecording(s.robotRecordingId);
                    writeLog('info', `Dashboard: 🎬 RECORDING: ✅ Completed`);
                    writeLog('ultraverbose', `Dashboard: recording executed successfully`, { scheduleId: s.id });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error',`Dashboard: 🎬 RECORDING: ❌ FAILED - ${msg}`, { scheduleId: s.id, stack });
                  }
                }

                writeLog('info', `Dashboard: 🏁 ALL ROBOT ACTIONS COMPLETED for "${s.name}"`);
                writeLog('ultraverbose', `Dashboard: runScheduleActions completed for schedule "${s.name}"`, { scheduleId: s.id });
              } catch (outerErr: unknown) {
                const msg = outerErr instanceof Error ? outerErr.message : String(outerErr);
                const stack = outerErr instanceof Error ? outerErr.stack : '';
                writeLog('error', `Dashboard: 💥 OUTER ERROR in runScheduleActions: ${msg}`, { scheduleId: s.id, stack });
              }
            };
            writeLog('info', `Dashboard: 🚀 CALLING runScheduleActions for "${s.name}"`);
            writeLog('ultraverbose', `Dashboard: firing runScheduleActions for schedule "${s.name}"`, { scheduleId: s.id });

            // Execute with detailed error tracking
            try {
              runScheduleActions().catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                const stack = err instanceof Error ? err.stack : '';
                writeLog('error', `Dashboard: 🚀 runScheduleActions promise rejected: ${msg}`, { scheduleId: s.id, stack });
              });
            } catch (syncErr: unknown) {
              const msg = syncErr instanceof Error ? syncErr.message : String(syncErr);
              const stack = syncErr instanceof Error ? syncErr.stack : '';
              writeLog('error', `Dashboard: 🚀 runScheduleActions threw sync error: ${msg}`, { scheduleId: s.id, stack });
            }
          } else {
            writeLog('info', `Dashboard: ⚠️ ROBOT ACTIONS SKIPPED (not on Android): Schedule "${s.name}"`);
          }
        }
      });

      // Schedules that just ended → restore state + fire end reminder
      // NOTE: Restore logic decoupled from notifications (critical fix)
      writeLog('ultraverbose', `Dashboard: Checking for ended schedules`, {
        previouslyActive: Array.from(prevActiveIds.current),
        nowActive: Array.from(nowIds),
        ended: Array.from(prevActiveIds.current).filter((id) => !nowIds.has(id)),
      });

      prevActiveIds.current.forEach((id) => {
        if (!nowIds.has(id)) {
          const entry = schedules.find((s) => s.id === id);
          if (entry) {
            writeLog('info',`Dashboard: Schedule "${entry.name}" JUST ENDED`);
            writeLog('ultraverbose', `Dashboard: Schedule "${entry.name}" transitioning to inactive state`, {
              id,
              useAirplaneMode: entry.useAirplaneMode,
              unsilenceWEAOnEnd: entry.unsilenceWEAOnEnd,
              restoreOnEnd: entry.restoreOnEnd,
            });

            // Restore device state if requested (default: true)
            const shouldRestore = entry.restoreOnEnd !== false;
            const snapshot = getSnapshot(id);

            writeLog('ultraverbose', `Dashboard: Schedule end restore check`, {
              id,
              shouldRestore,
              hasSnapshot: !!snapshot,
              useAirplaneMode: entry.useAirplaneMode,
              unsilenceWEAOnEnd: entry.unsilenceWEAOnEnd,
              isAndroid: robotService.isAndroid(),
            });

            if (entry.useAirplaneMode && robotService.isAndroid() && shouldRestore) {
              writeLog('ultraverbose', `Dashboard: Restoring airplane mode for schedule "${entry.name}"`, {
                id,
                snapshot: snapshot ? { airplaneModeWasActive: snapshot.airplaneModeWasActive } : null,
              });

              if (!snapshot) {
                writeLog('info', `Dashboard: No snapshot for schedule ${id}, skipping airplane mode restore`);
              } else if (!snapshot.airplaneModeWasActive) {
                // Airplane mode was OFF before schedule started — restore only if it's still ON now
                writeLog('ultraverbose', `Dashboard: Checking current airplane mode state before disabling`);
                airplaneModeService.getState()
                  .then((isCurrentlyOn) => {
                    writeLog('ultraverbose', `Dashboard: Current airplane mode state: ${isCurrentlyOn}`, { id });
                    if (isCurrentlyOn) {
                      writeLog('ultraverbose', `Dashboard: Disabling airplane mode`);
                      airplaneModeService.disable().catch((err: unknown) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        writeLog('error',`Dashboard: Failed to disable airplane mode on end: ${msg}`, { id });
                      });
                    }
                  })
                  .catch(() => {
                    // Can't determine current state → fall back to explicit disable
                    writeLog('ultraverbose', `Dashboard: Could not get airplane mode state, attempting disable anyway`);
                    airplaneModeService.disable().catch((err: unknown) => {
                      const msg = err instanceof Error ? err.message : String(err);
                      writeLog('error',`Dashboard: Failed to disable airplane mode on end (fallback): ${msg}`, { id });
                    });
                  });
              }
              clearSnapshot(id);
            }

            if (entry.unsilenceWEAOnEnd && robotService.isAndroid() && shouldRestore) {
              writeLog('ultraverbose', `Dashboard: Unsilencing WEA for schedule "${entry.name}"`, { id });
              robotService.unsilenceWEA().catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                writeLog('error',`Dashboard: Failed to unsilence WEA on schedule end: ${msg}`, { id });
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
      writeLog('ultraverbose', `Dashboard: tick() completed`, {
        activeSchedulesCount: nowActive.length,
        prevActiveIds: Array.from(prevActiveIds.current),
      });
    };

    writeLog('ultraverbose', `Dashboard: Setting up scheduler tick (5s interval)`);
    tick();
    const interval = setInterval(tick, 5000);
    return () => {
      writeLog('ultraverbose', `Dashboard: Cleaning up scheduler tick interval`);
      clearInterval(interval);
    };
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
