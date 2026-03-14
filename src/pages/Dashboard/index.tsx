import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Alert,
  Button, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import { NotificationsOff, Schedule, CheckCircle } from '@mui/icons-material';
import { useSchedulerStore } from '@/store/schedulerStore';
import { getActiveSchedules } from '@/services/schedulerService';
import { getSmoothDarknessFactor } from '@/theme/colorInterpolation';
import { useNavigate } from 'react-router-dom';
import type { ScheduleEntry } from '@/types';

/** Dashboard page — shows status overview and active schedules */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { schedules } = useSchedulerStore();
  const [activeSchedules, setActiveSchedules] = useState<ScheduleEntry[]>([]);
  const [darkness, setDarkness] = useState(getSmoothDarknessFactor());

  // Refresh active schedules and darkness every 5 seconds
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>

      {/* Status banner */}
      <Alert
        severity={isSilencing ? 'warning' : 'success'}
        icon={isSilencing ? <NotificationsOff /> : <CheckCircle />}
        sx={{ mb: 3 }}
      >
        {isSilencing
          ? `Silencing active — ${activeSchedules.length} schedule(s) running`
          : 'No active silencing schedules'}
      </Alert>

      <Grid container spacing={3}>
        {/* Schedules summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
                Schedules
              </Typography>
              <Typography variant="h3" color="primary">{schedules.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {schedules.filter((s) => s.enabled).length} enabled
              </Typography>
              <Button sx={{ mt: 2 }} onClick={() => navigate('/scheduler')} variant="outlined">
                Manage Schedules
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Time darkness indicator */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Theme Darkness</Typography>
              <Typography variant="h3">{Math.round(darkness * 100)}%</Typography>
              <Typography variant="body2" color="text.secondary">
                {darkness < 0.3 ? 'Daytime — light theme' :
                 darkness < 0.7 ? 'Dusk/Dawn — transitioning' :
                                  'Night — dark theme'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active schedules list */}
        {isSilencing && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Now</Typography>
                <List dense>
                  {activeSchedules.map((s, i) => (
                    <React.Fragment key={s.id}>
                      {i > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={s.name}
                          secondary={`${s.startTime} – ${s.endTime} · ${s.repeatMode}`}
                        />
                        <Chip label="ACTIVE" color="warning" size="small" />
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
