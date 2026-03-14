import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Stepper, Step, StepLabel,
  StepContent, Button, Alert, Chip,
} from '@mui/material';
import { Android, PhoneIphone, OpenInNew, Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * HowToGuide
 * Shows step-by-step manual instructions for silencing emergency alerts
 * on Android and iPhone. Displayed when a schedule is active.
 *
 * IMPORTANT: This app CANNOT automatically silence alerts — WEA messages
 * (Wireless Emergency Alerts) are delivered at radio/modem level and cannot
 * be intercepted by any web or native app. This guide helps users do it manually.
 */

const ANDROID_STEPS = [
  'Open your phone\'s Settings app',
  'Tap "Safety & Emergency" (Samsung: "Emergency alerts", some devices: search "Emergency")',
  'Tap "Wireless Emergency Alerts"',
  'Toggle OFF "Extreme alerts" and/or "Severe alerts"',
  'Presidential alerts cannot be disabled — this is by law',
];

const IPHONE_STEPS = [
  'Open the Settings app',
  'Tap "Notifications"',
  'Scroll all the way to the bottom',
  'Under "Government Alerts", toggle OFF "Extreme Alerts" and "Public Safety Alerts"',
  'Presidential alerts cannot be disabled — this is by law',
];

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
    {value === index && children}
  </Box>
);

interface HowToGuideProps {
  /** Show the guide expanded (e.g. when a schedule is currently active) */
  highlightActive?: boolean;
}

/** Step-by-step guide for manually silencing emergency alerts */
const HowToGuide: React.FC<HowToGuideProps> = ({ highlightActive = false }) => {
  useTranslation(); // loaded for future i18n of step strings
  const [tab, setTab] = useState(0);

  return (
    <Box>
      {/* Critical disclaimer — displayed prominently */}
      <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          ⚠️ This app does NOT automatically silence alerts
        </Typography>
        <Typography variant="body2">
          Wireless Emergency Alerts (WEA) are delivered at the radio/modem level and
          bypass all apps — including Do Not Disturb. You must go to your phone's
          Settings manually. This app reminds you <em>when</em> to do it.
        </Typography>
      </Alert>

      {highlightActive && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            🔔 A schedule is active right now — follow the steps below to silence alerts on your device
          </Typography>
        </Alert>
      )}

      {/* OS selector tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
        <Tab icon={<Android />} label="Android" iconPosition="start" />
        <Tab icon={<PhoneIphone />} label="iPhone" iconPosition="start" />
      </Tabs>

      {/* Android steps */}
      <TabPanel value={tab} index={0}>
        <Stepper orientation="vertical" nonLinear>
          {ANDROID_STEPS.map((step, i) => (
            <Step key={i} active completed={false}>
              <StepLabel>{step}</StepLabel>
              <StepContent>
                {i === 4 && (
                  <Chip label="Cannot be disabled" color="error" size="small" sx={{ mt: 0.5 }} />
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNew />}
          sx={{ mt: 2 }}
          onClick={() => {
            // Best-effort: on mobile browsers this may open Settings on some Android versions
            window.open('intent:#Intent;action=android.settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS;end', '_blank');
          }}
        >
          Try to open Android Settings
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          (Settings link may not work on all Android browsers — navigate manually if needed)
        </Typography>
      </TabPanel>

      {/* iPhone steps */}
      <TabPanel value={tab} index={1}>
        <Stepper orientation="vertical" nonLinear>
          {IPHONE_STEPS.map((step, i) => (
            <Step key={i} active completed={false}>
              <StepLabel>{step}</StepLabel>
              <StepContent>
                {i === 4 && (
                  <Chip label="Cannot be disabled" color="error" size="small" sx={{ mt: 0.5 }} />
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNew />}
          sx={{ mt: 2 }}
          onClick={() => window.open('App-prefs:NOTIFICATIONS_ID', '_blank')}
        >
          Try to open iPhone Settings
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          (Settings link works on Safari iOS — navigate manually in other browsers)
        </Typography>
      </TabPanel>
    </Box>
  );
};

export default HowToGuide;
