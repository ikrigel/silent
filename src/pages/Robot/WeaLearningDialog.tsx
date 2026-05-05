import React from 'react';
import { Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useWeaLearningStore } from '@/store/weaLearningStore';
import { provideWeaFeedback } from '@/services/weaSilenceService';

interface WeaLearningDialogProps {
  accessibilityEnabled: boolean;
}

const WeaLearningDialog: React.FC<WeaLearningDialogProps> = ({ accessibilityEnabled }) => {
  const { t } = useTranslation();
  const { learned, learnedDelay, isLearning, pendingFeedbackAttempt, startLearning, resetLearning } = useWeaLearningStore();

  if (!accessibilityEnabled) return null;

  const handleYes = () => provideWeaFeedback(true);
  const handleNo = () => provideWeaFeedback(false);

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('robot.weaLearning.title')}
          </Typography>

          {!learned && !isLearning && (
            <>
              <Typography color="text.secondary" variant="body2" mb={2}>
                {t('robot.weaLearning.calibrationDesc')}
              </Typography>
              <Button variant="contained" color="primary" onClick={startLearning}>
                {t('robot.weaLearning.calibrate')}
              </Button>
            </>
          )}

          {isLearning && pendingFeedbackAttempt === null && (
            <Typography color="text.secondary" variant="body2">
              {t('robot.weaLearning.active')}
            </Typography>
          )}

          {learned && !isLearning && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography color="success.main" variant="body2">
                ✓ {t('robot.weaLearning.calibrated', { delay: learnedDelay })}
              </Typography>
              <Button variant="outlined" size="small" color="inherit" onClick={resetLearning}>
                {t('robot.weaLearning.reset')}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={pendingFeedbackAttempt !== null} maxWidth="xs" fullWidth>
        <DialogTitle>{t('robot.weaLearning.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography>
              {t('robot.weaLearning.feedbackPrompt', { attempt: pendingFeedbackAttempt || 0 })}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNo} color="inherit">
            {t('robot.weaLearning.confirmNo')}
          </Button>
          <Button onClick={handleYes} variant="contained" color="success">
            {t('robot.weaLearning.confirmYes')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WeaLearningDialog;
