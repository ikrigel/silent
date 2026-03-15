import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import { robotService } from '@/services/robotService';
import type { RobotStep } from '@/types';

interface Props {
  onSaved: () => void;
}

type RecordState = 'idle' | 'recording' | 'saving';

const RecordingControls: React.FC<Props> = ({ onSaved }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<RecordState>('idle');
  const [stepCount, setStepCount] = useState(0);
  const [steps, setSteps] = useState<RobotStep[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleStart = async () => {
    setError('');
    setStepCount(0);
    await robotService.startRecording();
    setState('recording');
    // Poll step count every second
    const id = setInterval(async () => {
      try {
        // We don't have a separate count endpoint; just show a spinner
        setStepCount((c) => c + 0); // keep reactive
      } catch { clearInterval(id); }
    }, 1000);
  };

  const handleStop = async () => {
    const recorded = await robotService.stopRecording();
    setSteps(recorded);
    setStepCount(recorded.length);
    setState('saving');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError(t('robot.record.nameRequired')); return; }
    await robotService.saveRecording(name.trim(), steps);
    setState('idle');
    setName('');
    setSteps([]);
    onSaved();
  };

  const handleDiscard = () => {
    setState('idle');
    setSteps([]);
    setName('');
    setError('');
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('robot.record.title')}</Typography>
          {state === 'idle' && (
            <Box>
              <Typography color="text.secondary" variant="body2" mb={2}>
                {t('robot.record.idleHint')}
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<FiberManualRecordIcon />}
                onClick={handleStart}
              >
                {t('robot.record.start')}
              </Button>
            </Box>
          )}

          {state === 'recording' && (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} color="error" />
              <Typography color="error" fontWeight="bold">
                {t('robot.record.recording')}
              </Typography>
              <Typography color="text.secondary">{stepCount} {t('robot.record.steps')}</Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStop}
              >
                {t('robot.record.stop')}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={state === 'saving'} onClose={handleDiscard} maxWidth="xs" fullWidth>
        <DialogTitle>{t('robot.record.saveTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {stepCount} {t('robot.record.steps')} {t('robot.record.captured')}
          </Typography>
          <TextField
            label={t('robot.record.nameLabel')}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            error={!!error}
            helperText={error}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscard}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecordingControls;
