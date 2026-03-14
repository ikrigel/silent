import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Alert,
  Button, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import { NotificationsOff, Schedule, CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSchedulerStore } from '@/store/schedulerStore';
import { getActiveSchedules } from '@/services/schedulerService';
import { getSmoothDarknessFactor } from '@/theme/colorInterpolation';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from '@/types';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schedules } = useSchedulerStore();
  const [activeSchedules, setActiveSchedules] = useState<ScheduleEntry[]>([]);
  const [darkness, setDarkness] = useState(getSmoothDarknessFactor());

  useEffect(() => {
    const tick = () => {
      setActiveSchedules(getActiveSchedules());
      setDarkness(getSmoothDarknessFactor());
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [schedules]);

  const isSilencing = activeSchedules.length > 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">{t('dashboard.title')}</Typography>
      <Alert
        severity={isSilencing ? 'warning' : 'success'}
        icon={isSilencing ? <NotificationsOff /> : <CheckCircle />}
        sx={{ mb: 3 }}
      >
        {isSilencing
          ? t('dashboard.silencing', { count: activeSchedules.length })
          : t('dashboard.noActive')}
      </Alert>
      <Grid container spacing={3}>
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
        {isSilencing && (
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
                        <Chip label={t('scheduler.active')} color="warning" size="small" />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
