import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Alert,
  Button, List, ListItem, ListItemText, Divider, Collapse,
} from '@mui/material';
import { Schedule, CheckCircle, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSchedulerStore } from '@/store/schedulerStore';
import { getActiveSchedules } from '@/services/schedulerService';
import { getSmoothDarknessFactor } from '@/theme/colorInterpolation';
import { fireScheduleReminder, fireScheduleEndReminder } from '@/services/notificationService';
import HowToGuide from '@/components/HowToGuide';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';

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
  const { schedules } = useSchedulerStore();
  const { settings } = useSettingsStore();
  const [activeSchedules, setActiveSchedules] = useState<ScheduleEntry[]>([]);
  const [darkness, setDarkness] = useState(getSmoothDarknessFactor());
  const [guideOpen, setGuideOpen] = useState(false);

  // Track previous active IDs to detect transitions and fire notifications
  const prevActiveIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const nowActive = getActiveSchedules();
      setActiveSchedules(nowActive);
      setDarkness(getSmoothDarknessFactor());

      if (!settings.notificationsEnabled) return;

      const nowIds = new Set(nowActive.map((s) => s.id));

      // Schedules that just became active → fire start reminder
      nowActive.forEach((s) => {
        if (!prevActiveIds.current.has(s.id)) {
          fireScheduleReminder(s.name);
        }
      });

      // Schedules that just ended → fire end reminder
      prevActiveIds.current.forEach((id) => {
        if (!nowIds.has(id)) {
          const entry = schedules.find((s) => s.id === id);
          if (entry) fireScheduleEndReminder(entry.name);
        }
      });

      prevActiveIds.current = nowIds;
    };

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [schedules, settings.notificationsEnabled]);

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
          ? `Reminder active — go to your phone Settings now to silence alerts manually`
          : 'No active reminder schedules'}
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
