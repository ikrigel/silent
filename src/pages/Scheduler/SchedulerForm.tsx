import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, FormControlLabel, Checkbox,
  Grid, Typography, Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { ScheduleEntry, RepeatMode, DayOfWeek } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REPEAT_MODES: RepeatMode[] = ['none', 'daily', 'weekly', 'custom'];

interface FormValues {
  name: string;
  startTime: string;
  endTime: string;
  repeatMode: RepeatMode;
  daysOfWeek: DayOfWeek[];
  startDate: string;
  endDate: string;
}

interface SchedulerFormProps {
  open: boolean;
  initial?: ScheduleEntry | null;
  onSubmit: (entry: ScheduleEntry) => void;
  onClose: () => void;
}

/** Dialog form for creating/editing a schedule entry */
const SchedulerForm: React.FC<SchedulerFormProps> = ({ open, initial, onSubmit, onClose }) => {
  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      startTime: initial?.startTime ?? '22:00',
      endTime: initial?.endTime ?? '07:00',
      repeatMode: initial?.repeatMode ?? 'daily',
      daysOfWeek: initial?.daysOfWeek ?? [],
      startDate: initial?.startDate ?? '',
      endDate: initial?.endDate ?? '',
    },
  });

  // Watch repeatMode to conditionally show day/date fields
  const repeatMode = watch('repeatMode');

  const onValid = (data: FormValues) => {
    const entry: ScheduleEntry = {
      id: initial?.id ?? crypto.randomUUID(),
      enabled: initial?.enabled ?? true,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...data,
    };
    onSubmit(entry);
    reset();
  };

  const toggleDay = (day: DayOfWeek, current: DayOfWeek[], onChange: (v: DayOfWeek[]) => void) => {
    onChange(current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit Schedule' : 'New Schedule'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller name="name" control={control} rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} label="Schedule Name" fullWidth required />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="startTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Start Time" type="time" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="endTime" control={control}
                render={({ field }) => (
                  <TextField {...field} label="End Time" type="time" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller name="repeatMode" control={control}
                render={({ field }) => (
                  <TextField {...field} label="Repeat" select fullWidth>
                    {REPEAT_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            {repeatMode === 'weekly' && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>Days of Week</Typography>
                <Controller name="daysOfWeek" control={control}
                  render={({ field }) => (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {DAY_NAMES.map((name, i) => (
                        <FormControlLabel key={i}
                          control={<Checkbox
                            checked={field.value.includes(i as DayOfWeek)}
                            onChange={() => toggleDay(i as DayOfWeek, field.value, field.onChange)}
                          />}
                          label={name}
                        />
                      ))}
                    </Box>
                  )}
                />
              </Grid>
            )}
            {(repeatMode === 'custom' || repeatMode === 'none') && (
              <>
                <Grid item xs={6}>
                  <Controller name="startDate" control={control}
                    render={({ field }) => (
                      <TextField {...field} label="From Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller name="endDate" control={control}
                    render={({ field }) => (
                      <TextField {...field} label="To Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onValid)}>
          {initial ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchedulerForm;
