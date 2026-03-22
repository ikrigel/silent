import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, FormControlLabel, Checkbox,
  Grid, Typography, Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { RobotRecording, ScheduleEntry, RepeatMode, DayOfWeek } from '@/types';
import { robotService } from '@/services/robotService';

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
  robotRecordingId: string;
  useAirplaneMode: boolean;
  restoreOnEnd: boolean;
  unsilenceWEAOnEnd: boolean;
}

interface SchedulerFormProps {
  open: boolean;
  initial?: ScheduleEntry | null;
  onSubmit: (entry: ScheduleEntry) => void;
  onClose: () => void;
}

/** Dialog form for creating/editing a schedule entry */
const SchedulerForm: React.FC<SchedulerFormProps> = ({ open, initial, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [robotRecordings, setRobotRecordings] = useState<RobotRecording[]>([]);
  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? '',
      startTime: initial?.startTime ?? '22:00',
      endTime: initial?.endTime ?? '07:00',
      repeatMode: initial?.repeatMode ?? 'daily',
      daysOfWeek: initial?.daysOfWeek ?? [],
      startDate: initial?.startDate ?? '',
      endDate: initial?.endDate ?? '',
      robotRecordingId: initial?.robotRecordingId ?? '',
      useAirplaneMode: initial?.useAirplaneMode ?? false,
      restoreOnEnd: initial?.restoreOnEnd !== false,
      unsilenceWEAOnEnd: initial?.unsilenceWEAOnEnd ?? false,
    },
  });

  const repeatMode = watch('repeatMode');
  const useAirplaneMode = watch('useAirplaneMode');
  const robotRecordingId = watch('robotRecordingId');

  useEffect(() => {
    if (open && robotService.isAndroid()) {
      robotService.getRecordings().then(setRobotRecordings);
    }
  }, [open]);

  const onValid = (data: FormValues) => {
    const entry: ScheduleEntry = {
      id: initial?.id ?? crypto.randomUUID(),
      enabled: initial?.enabled ?? true,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...data,
      robotRecordingId: data.robotRecordingId || undefined,
    };
    onSubmit(entry);
    reset();
  };

  const toggleDay = (day: DayOfWeek, current: DayOfWeek[], onChange: (v: DayOfWeek[]) => void) => {
    onChange(current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? t('scheduler.editSchedule') : t('scheduler.newSchedule')}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller name="name" control={control} rules={{ required: true }}
                render={({ field }) => <TextField {...field} label={t('scheduler.name')} fullWidth required />}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="startTime" control={control}
                render={({ field }) => <TextField {...field} label={t('scheduler.startTime')} type="time" fullWidth InputLabelProps={{ shrink: true }} />}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="endTime" control={control}
                render={({ field }) => <TextField {...field} label={t('scheduler.endTime')} type="time" fullWidth InputLabelProps={{ shrink: true }} />}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller name="repeatMode" control={control}
                render={({ field }) => (
                  <TextField {...field} label={t('scheduler.repeat')} select fullWidth>
                    {REPEAT_MODES.map((m) => <MenuItem key={m} value={m}>{t(`scheduler.repeatModes.${m}`)}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            {repeatMode === 'weekly' && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>{t('scheduler.daysOfWeek')}</Typography>
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
                    render={({ field }) => <TextField {...field} label={t('scheduler.fromDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller name="endDate" control={control}
                    render={({ field }) => <TextField {...field} label={t('scheduler.toDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />}
                  />
                </Grid>
              </>
            )}
            {robotService.isAndroid() && robotRecordings.length > 0 && (
              <Grid item xs={12}>
                <Controller name="robotRecordingId" control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t('scheduler.robotRecording')} select fullWidth>
                      <MenuItem value="">{t('scheduler.noRobotRecording')}</MenuItem>
                      {robotRecordings.map((r) => (
                        <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            {robotService.isAndroid() && (
              <Grid item xs={12}>
                <Controller name="useAirplaneMode" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label={t('scheduler.useAirplaneMode')}
                    />
                  )}
                />
              </Grid>
            )}
            {robotService.isAndroid() && robotRecordingId && (
              <Grid item xs={12}>
                <Controller name="unsilenceWEAOnEnd" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label={t('scheduler.unsilenceWEAOnEnd')}
                    />
                  )}
                />
              </Grid>
            )}
            {robotService.isAndroid() && (useAirplaneMode || robotRecordingId) && (
              <Grid item xs={12}>
                <Controller name="restoreOnEnd" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label={t('scheduler.restoreOnEnd')}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('scheduler.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit(onValid)}>
          {initial ? t('scheduler.update') : t('scheduler.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchedulerForm;
