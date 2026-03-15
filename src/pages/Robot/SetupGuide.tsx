import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Step, StepContent,
  StepLabel, Stepper, Typography, Alert,
} from '@mui/material';
import SettingsAccessibilityIcon from '@mui/icons-material/SettingsAccessibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTranslation } from 'react-i18next';
import { robotService } from '@/services/robotService';

interface Props {
  onEnabled: () => void;
}

const SetupGuide: React.FC<Props> = ({ onEnabled }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  // Poll every 2 seconds while user is in Accessibility Settings
  useEffect(() => {
    const id = setInterval(async () => {
      const ok = await robotService.isAccessibilityEnabled();
      if (ok) {
        setEnabled(true);
        clearInterval(id);
        onEnabled();
      }
    }, 2000);
    return () => clearInterval(id);
  }, [onEnabled]);

  const steps = [
    { label: t('robot.setup.step1Label'), desc: t('robot.setup.step1Desc') },
    { label: t('robot.setup.step2Label'), desc: t('robot.setup.step2Desc') },
    { label: t('robot.setup.step3Label'), desc: t('robot.setup.step3Desc') },
  ];

  if (enabled) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleOutlineIcon color="success" fontSize="large" />
            <Typography variant="h6">{t('robot.setup.enabledTitle')}</Typography>
          </Box>
          <Typography color="text.secondary" mt={1}>{t('robot.setup.enabledDesc')}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>{t('robot.setup.title')}</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>{t('robot.setup.info')}</Alert>
        <Stepper activeStep={-1} orientation="vertical">
          {steps.map((step) => (
            <Step key={step.label} active>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <Button
          variant="contained"
          startIcon={<SettingsAccessibilityIcon />}
          onClick={() => robotService.openAccessibilitySettings()}
          sx={{ mt: 2 }}
        >
          {t('robot.setup.openSettings')}
        </Button>
        <Typography variant="caption" display="block" color="text.secondary" mt={1}>
          {t('robot.setup.waitingHint')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;
