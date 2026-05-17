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
    writeLog('info', `═══════════════════════════════════════════════════`);
    writeLog('info', `🚀 DASHBOARD MOUNTED - App Version: v${__APP_VERSION__}`);
    writeLog('info', `═══════════════════════════════════════════════════`);
    writeLog('info', `Dashboard: Running on ${robotService.isAndroid() ? 'ANDROID (APK)' : 'WEB BROWSER'}`);
    writeLog('ultraverbose', `Dashboard: Component state`, {
      appVersion: __APP_VERSION__,
      isAndroid: robotService.isAndroid(),
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
    writeLog('info', `Dashboard: ⏱️ SCHEDULER LOOP STARTING - 5 second interval`);
    writeLog('ultraverbose', `Dashboard: useEffect dependencies`, {
      appVersion: __APP_VERSION__,
      isAndroid: robotService.isAndroid(),
      schedulesCount: schedules.length,
      settingsNotificationsEnabled: settings.notificationsEnabled,
    });

    const tick = async () => {
      const nowActive = getActiveSchedules();
      setActiveSchedules(nowActive);
      setDarkness(getSmoothDarknessFactor());

      const nowIds = new Set(nowActive.map((s) => s.id));

      writeLog('info', `📊 SCHEDULER TICK v${__APP_VERSION__} - ${schedules.length} total schedules, ${nowActive.length} active`);
      writeLog('ultraverbose', `Dashboard: ⏱️ TICK - Checking ${schedules.length} schedules, ${nowActive.length} are currently active`, {
        appVersion: __APP_VERSION__,
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
          writeLog('info', `════════════════════════════════════════════════════════`);
          writeLog('info', `⚡ SCHEDULE ACTIVATION DETECTED: "${s.name}"`);
          writeLog('info', `════════════════════════════════════════════════════════`);

          // Log what robot actions are configured for this schedule
          const hasQuickActions = !!(s.useAirplaneMode || s.silenceWEAOnStart);
          const hasRecording = !!s.robotRecordingId;
          writeLog('info', `📋 QUICK ACTIONS CONFIGURED:`);
          writeLog('info', `   ✈️  Enable Airplane Mode: ${s.useAirplaneMode ? '✅ YES' : '❌ NO'}`);
          writeLog('info', `   🔇 Silence WEA: ${s.silenceWEAOnStart ? '✅ YES' : '❌ NO'}`);
          writeLog('info', `   🎬 Recording: ${hasRecording ? `✅ YES (${s.robotRecordingId})` : '❌ NO'}`);

          if (!hasQuickActions && !hasRecording) {
            writeLog('error', `⚠️  NO QUICK ACTIONS CONFIGURED - Schedule will activate but NO robot actions will execute!`);
            writeLog('ultraverbose', `Dashboard: Schedule has NO robot actions configured`, {
              scheduleId: s.id,
              scheduleName: s.name,
              hasAirplaneMode: s.useAirplaneMode,
              hasWEASilence: s.silenceWEAOnStart,
              hasRecording: hasRecording,
              recommendation: 'Edit schedule and enable at least one quick action: Airplane Mode or WEA Silence',
            });
          }

          writeLog('ultraverbose', `Dashboard: Schedule "${s.name}" TRANSITION from INACTIVE → ACTIVE`, {
            id: s.id,
            scheduleConfig: {
              useAirplaneMode: s.useAirplaneMode,
              silenceWEAOnStart: s.silenceWEAOnStart,
              robotRecordingId: s.robotRecordingId,
              restoreOnEnd: s.restoreOnEnd,
              unsilenceWEAOnEnd: s.unsilenceWEAOnEnd,
            },
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
          const hasAnyActions = !!(s.useAirplaneMode || s.silenceWEAOnStart || s.robotRecordingId);

          writeLog('info', `⚙️ PLATFORM CHECK: ${isAndroid ? '✅ ANDROID' : '❌ WEB BROWSER'}`);
          writeLog('info', `📦 ACTIONS EXIST: ${hasAnyActions ? '✅ YES - Will execute' : '❌ NO - Skipping'}`);

          writeLog('ultraverbose', `Dashboard: isAndroid() returned: ${isAndroid}, hasActions: ${hasAnyActions}`, {
            scheduleId: s.id,
            scheduleName: s.name,
            isAndroid,
            hasRobotActions: hasAnyActions,
          });

          if (isAndroid && hasAnyActions) {
            writeLog('info', `✅ ROBOT ACTIONS ENABLED - Executing for "${s.name}"`);
            const runScheduleActions = async () => {
              try {
                writeLog('info', `┌─────────────────────────────────────────────────────`);
                writeLog('info', `│ 🚀 ROBOT ACTIONS EXECUTION START`);
                writeLog('info', `│ Schedule: "${s.name}"`);
                writeLog('info', `│ Airplane Mode: ${s.useAirplaneMode ? '✅ YES' : '❌ NO'}`);
                writeLog('info', `│ WEA Silence: ${s.silenceWEAOnStart ? '✅ YES' : '❌ NO'}`);
                writeLog('info', `│ Recording: ${s.robotRecordingId ? `✅ ${s.robotRecordingId}` : '❌ NO'}`);
                writeLog('info', `└─────────────────────────────────────────────────────`);
                writeLog('ultraverbose', `Dashboard: runScheduleActions() function called`, {
                  appVersion: __APP_VERSION__,
                  scheduleId: s.id,
                  scheduleName: s.name,
                  timestamp: new Date().toISOString(),
                  configSnapshot: {
                    useAirplaneMode: s.useAirplaneMode,
                    silenceWEAOnStart: s.silenceWEAOnStart,
                    robotRecordingId: s.robotRecordingId,
                    restoreOnEnd: s.restoreOnEnd,
                    unsilenceWEAOnEnd: s.unsilenceWEAOnEnd,
                  },
                });

                if (s.useAirplaneMode) {
                  const ctx: EnableContext = { scheduleId: s.id, scheduleName: s.name };
                  try {
                    writeLog('info', `  ├─ 📡 AIRPLANE MODE ACTION STARTED`);
                    writeLog('ultraverbose', `Dashboard: Calling airplaneModeService.getState()`, {
                      scheduleId: s.id,
                      timestamp: new Date().toISOString(),
                      method: 'airplaneModeService.getState()',
                    });
                    const wasActive = await airplaneModeService.getState();
                    writeLog('info', `  │  └─ 📡 Current state: ${wasActive ? '✅ ON' : '❌ OFF'}`);
                    writeLog('ultraverbose', `Dashboard: airplaneModeService.getState() returned ${wasActive}`, {
                      scheduleId: s.id,
                      stateResult: wasActive,
                      timestamp: new Date().toISOString(),
                    });
                    captureSnapshot(s.id, wasActive, false);
                    if (!wasActive) {
                      writeLog('info', `  │  └─ State is OFF, calling airplaneModeService.enable()`);
                      writeLog('ultraverbose', `Dashboard: Calling airplaneModeService.enable()`, {
                        scheduleId: s.id,
                        context: ctx,
                        timestamp: new Date().toISOString(),
                        method: 'airplaneModeService.enable()',
                      });
                      const enableResult = await airplaneModeService.enable(ctx);
                      writeLog('info', `  │  └─ 📡 AIRPLANE MODE: ✅ Enable completed - result: ${enableResult}`);
                      writeLog('ultraverbose', `Dashboard: airplaneModeService.enable() completed successfully`, {
                        scheduleId: s.id,
                        enableResult,
                        timestamp: new Date().toISOString(),
                      });
                    } else {
                      writeLog('info', `  │  └─ 📡 AIRPLANE MODE: Already ON, skipping enable`);
                      writeLog('ultraverbose', `Dashboard: airplane mode already active, skipping enable()`, {
                        scheduleId: s.id,
                        timestamp: new Date().toISOString(),
                      });
                    }
                  } catch (err: unknown) {
                    captureSnapshot(s.id, false, false);
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error', `  │  └─ 📡 AIRPLANE MODE: ❌ ERROR - ${msg}`, {
                      scheduleId: s.id,
                      error: msg,
                      stack,
                      timestamp: new Date().toISOString(),
                    });
                    writeLog('ultraverbose', `Dashboard: Attempting airplaneModeService.enable() fallback after error`, {
                      scheduleId: s.id,
                      originalError: msg,
                      timestamp: new Date().toISOString(),
                    });
                    await airplaneModeService.enable(ctx).catch((err: unknown) => {
                      const msg2 = err instanceof Error ? err.message : String(err);
                      const stack2 = err instanceof Error ? err.stack : '';
                      writeLog('error', `  │  └─ 📡 AIRPLANE MODE: ❌ FALLBACK FAILED - ${msg2}`, {
                        scheduleId: s.id,
                        fallbackError: msg2,
                        stack: stack2,
                        timestamp: new Date().toISOString(),
                      });
                    });
                  }
                }

                if (s.silenceWEAOnStart) {
                  try {
                    writeLog('info', `  ├─ 🔇 WEA SILENCE ACTION STARTED`);
                    writeLog('ultraverbose', `Dashboard: Calling weaSilenceService.silence()`, {
                      scheduleId: s.id,
                      timestamp: new Date().toISOString(),
                      method: 'weaSilenceService.silence()',
                    });
                    const silenceResult = await weaSilenceService.silence();
                    writeLog('info', `  │  └─ 🔇 WEA SILENCE: ✅ Success - result: ${silenceResult}`);
                    writeLog('ultraverbose', `Dashboard: weaSilenceService.silence() completed successfully`, {
                      scheduleId: s.id,
                      silenceResult,
                      timestamp: new Date().toISOString(),
                    });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error', `  │  └─ 🔇 WEA SILENCE: ❌ ERROR - ${msg}`, {
                      scheduleId: s.id,
                      error: msg,
                      stack,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                if (s.robotRecordingId) {
                  try {
                    writeLog('info', `  ├─ 🎬 RECORDING ACTION STARTED`);
                    writeLog('ultraverbose', `Dashboard: Calling robotService.executeRecording()`, {
                      scheduleId: s.id,
                      recordingId: s.robotRecordingId,
                      timestamp: new Date().toISOString(),
                      method: 'robotService.executeRecording()',
                    });
                    const recordingResult = await robotService.executeRecording(s.robotRecordingId);
                    writeLog('info', `  │  └─ 🎬 RECORDING: ✅ Completed - recordingId: ${s.robotRecordingId}`);
                    writeLog('ultraverbose', `Dashboard: robotService.executeRecording() completed successfully`, {
                      scheduleId: s.id,
                      recordingId: s.robotRecordingId,
                      recordingResult,
                      timestamp: new Date().toISOString(),
                    });
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    const stack = err instanceof Error ? err.stack : '';
                    writeLog('error', `  │  └─ 🎬 RECORDING: ❌ ERROR - ${msg}`, {
                      scheduleId: s.id,
                      recordingId: s.robotRecordingId,
                      error: msg,
                      stack,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                writeLog('info', `└─ 🏁 ROBOT ACTIONS EXECUTION COMPLETE`);
                writeLog('ultraverbose', `Dashboard: runScheduleActions() completed for schedule "${s.name}"`, {
                  appVersion: __APP_VERSION__,
                  scheduleId: s.id,
                  timestamp: new Date().toISOString(),
                  actionsExecuted: {
                    airplaneMode: s.useAirplaneMode,
                    weaSilence: s.silenceWEAOnStart,
                    recording: !!s.robotRecordingId,
                  },
                });
              } catch (outerErr: unknown) {
                const msg = outerErr instanceof Error ? outerErr.message : String(outerErr);
                const stack = outerErr instanceof Error ? outerErr.stack : '';
                writeLog('error', `💥 OUTER ERROR in runScheduleActions: ${msg}`, {
                  scheduleId: s.id,
                  stack,
                  timestamp: new Date().toISOString(),
                });
              }
            };
            writeLog('info', `🚀 EXECUTING ROBOT ACTION HANDLER for "${s.name}"`);
            writeLog('ultraverbose', `Dashboard: Initiating runScheduleActions() async function`, {
              scheduleId: s.id,
              scheduleName: s.name,
              timestamp: new Date().toISOString(),
            });

            // Execute with detailed error tracking
            try {
              writeLog('info', `→ FIRING async runScheduleActions() function now`);
              writeLog('ultraverbose', `Dashboard: About to invoke runScheduleActions() - async start`, {
                scheduleId: s.id,
                timestamp: new Date().toISOString(),
              });
              runScheduleActions()
                .then(() => {
                  writeLog('info', `✅ Async runScheduleActions() promise resolved successfully`);
                  writeLog('ultraverbose', `Dashboard: runScheduleActions() promise resolved`, {
                    scheduleId: s.id,
                    timestamp: new Date().toISOString(),
                  });
                })
                .catch((err: unknown) => {
                  const msg = err instanceof Error ? err.message : String(err);
                  const stack = err instanceof Error ? err.stack : '';
                  writeLog('error', `❌ Async runScheduleActions() promise REJECTED: ${msg}`, {
                    scheduleId: s.id,
                    error: msg,
                    stack,
                    timestamp: new Date().toISOString(),
                  });
                });
            } catch (syncErr: unknown) {
              const msg = syncErr instanceof Error ? syncErr.message : String(syncErr);
              const stack = syncErr instanceof Error ? syncErr.stack : '';
              writeLog('error', `❌ Sync error invoking runScheduleActions(): ${msg}`, {
                scheduleId: s.id,
                error: msg,
                stack,
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            if (!isAndroid) {
              writeLog('info', `⚠️ ROBOT ACTIONS SKIPPED: Not on Android (WEB BROWSER only) - Schedule "${s.name}"`);
            } else {
              writeLog('error', `❌ ROBOT ACTIONS SKIPPED: NO QUICK ACTIONS CONFIGURED - Schedule "${s.name}"`);
              writeLog('error', `   ➜ Edit this schedule and enable: ✈️ Enable Airplane Mode OR 🔇 Silence WEA`);
            }
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
      writeLog('info', `📊 SCHEDULER TICK COMPLETE - Tracking active schedules: ${Array.from(nowIds).join(', ') || 'NONE'}`);
      writeLog('ultraverbose', `Dashboard: tick() completed and state updated`, {
        completedAt: new Date().toISOString(),
        activeSchedulesCount: nowActive.length,
        activeScheduleIds: Array.from(nowIds),
        totalSchedules: schedules.length,
        prevActiveIdsSnapshot: Array.from(prevActiveIds.current),
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
