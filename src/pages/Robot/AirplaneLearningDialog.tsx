import React from 'react';
import { Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAirplaneLearningStore } from '@/store/airplaneLearningStore';
import { provideFeedback } from '@/services/airplaneModeService';

interface AirplaneLearningDialogProps {
  accessibilityEnabled: boolean;
}

const AirplaneLearningDialog: React.FC<AirplaneLearningDialogProps> = ({ accessibilityEnabled }) => {
  const { t } = useTranslation();
  const { learned, learnedDelay, isLearning, pendingFeedbackAttempt, startLearning, resetLearning } = useAirplaneLearningStore();

  if (!accessibilityEnabled) return null;

  const handleYes = () => provideFeedback(true);
  const handleNo = () => provideFeedback(false);

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('robot.learning.title')}
          </Typography>

          {!learned && !isLearning && (
            <>
              <Typography color="text.secondary" variant="body2" mb={2}>
                {t('robot.learning.calibrationDesc')}
              </Typography>
              <Button variant="contained" color="primary" onClick={startLearning}>
                {t('robot.learning.calibrate')}
              </Button>
            </>
          )}

          {isLearning && pendingFeedbackAttempt === null && (
            <Typography color="text.secondary" variant="body2">
              {t('robot.learning.active')}
            </Typography>
          )}

          {learned && !isLearning && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography color="success.main" variant="body2">
                ✓ {t('robot.learning.calibrated', { delay: learnedDelay })}
              </Typography>
              <Button variant="outlined" size="small" color="inherit" onClick={resetLearning}>
                {t('robot.learning.reset')}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={pendingFeedbackAttempt !== null} maxWidth="xs" fullWidth>
        <DialogTitle>{t('robot.learning.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography>
              {t('robot.learning.feedbackPrompt', { attempt: pendingFeedbackAttempt || 0 })}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNo} color="inherit">
            {t('robot.learning.confirmNo')}
          </Button>
          <Button onClick={handleYes} variant="contained" color="success">
            {t('robot.learning.confirmYes')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AirplaneLearningDialog;
