import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Step, StepContent,
  StepLabel, Stepper, Typography, Alert,
} from '@mui/material';
import SettingsAccessibilityIcon from '@mui/icons-material/SettingsAccessibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { robotService } from '@/services/robotService';

interface Props {
  onEnabled: () => void;
}

const SetupGuide: React.FC<Props> = ({ onEnabled }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Poll every 2 seconds while user is enabling the service
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
    {
      label: t('robot.setup.step1Label'),
      desc: t('robot.setup.step1Desc'),
      action: () => robotService.openAccessibilitySettings(),
      actionLabel: t('robot.setup.openSettings'),
    },
    {
      label: t('robot.setup.step2Label'),
      desc: t('robot.setup.step2Desc'),
    },
    {
      label: t('robot.setup.restrictedTitle'),
      desc: t('robot.setup.restrictedDesc'),
    },
    {
      label: t('robot.setup.confirmTitle'),
      desc: t('robot.setup.confirmDesc'),
    },
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
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('robot.setup.restrictedWarning')}
        </Alert>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
          {steps.map((step, idx) => (
            <Step key={step.label} active={activeStep >= idx}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {step.desc}
                </Typography>
                <Box display="flex" gap={1}>
                  {step.action && (
                    <Button
                      variant="contained"
                      startIcon={<SettingsAccessibilityIcon />}
                      onClick={() => {
                        step.action?.();
                        setActiveStep(Math.min(activeStep + 1, steps.length - 1));
                      }}
                    >
                      {step.actionLabel || 'Next'}
                    </Button>
                  )}
                  {!step.action && activeStep === idx && (
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => setActiveStep(Math.min(activeStep + 1, steps.length - 1))}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <Typography variant="caption" display="block" color="text.secondary" mt={2}>
          {t('robot.setup.waitingHint')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;
