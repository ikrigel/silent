import React from 'react';
import { Card, CardContent, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * iOS Manual Steps — displayed on iPhone/iPad devices.
 * Since iOS does not allow Accessibility Service automation,
 * we show users step-by-step instructions for manual control.
 */
const IOSManualSteps: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          {t('robot.ios.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('robot.ios.desc')}
        </Typography>

        <Stepper orientation="vertical">
          <Step active={true} completed={false}>
            <StepLabel>{t('robot.ios.step1Label')}</StepLabel>
            <Typography variant="body2" sx={{ mt: 1, ml: 4 }}>
              {t('robot.ios.step1Desc')}
            </Typography>
          </Step>

          <Step active={true} completed={false}>
            <StepLabel>{t('robot.ios.step2Label')}</StepLabel>
            <Typography variant="body2" sx={{ mt: 1, ml: 4 }}>
              {t('robot.ios.step2Desc')}
            </Typography>
          </Step>

          <Step active={true} completed={false}>
            <StepLabel>{t('robot.ios.step3Label')}</StepLabel>
            <Typography variant="body2" sx={{ mt: 1, ml: 4 }}>
              {t('robot.ios.step3Desc')}
            </Typography>
          </Step>
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default IOSManualSteps;
