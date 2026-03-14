import React from 'react';
import {
  Box, Typography, Card, CardContent, Accordion,
  AccordionSummary, AccordionDetails, Divider, Stack,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import ContactForm from './ContactForm';

const FAQ = [
  {
    q: 'How do I silence emergency alerts on iPhone?',
    a: 'Go to Settings → Notifications → scroll to bottom → Government Alerts. Turn off "Extreme Alert" and "Public Safety Alerts".',
  },
  {
    q: 'How do I silence emergency alerts on Android?',
    a: 'Go to Settings → Safety & Emergency → Wireless Emergency Alerts → toggle off "Allow alerts" or specific alert types.',
  },
  {
    q: 'What does a schedule do?',
    a: 'A schedule marks a time window during which the app reminds you to silence your alerts. It does not automatically change your phone settings — you must manually toggle them.',
  },
  {
    q: 'What are the repeat modes?',
    a: '"none" = one-time window (use with date range), "daily" = every day, "weekly" = specific days of week, "custom" = date-range with any settings.',
  },
  {
    q: 'What is the time-based theme?',
    a: 'The theme smoothly transitions from light (at noon) to dark (at midnight) using a cosine curve. It updates every 5 seconds.',
  },
  {
    q: 'Where is my data stored?',
    a: "All schedules, logs, and settings are stored locally in your browser's localStorage. Nothing is sent to any server.",
  },
  {
    q: 'How do I configure the contact form?',
    a: 'Go to Settings and enter your EmailJS Public Key. You can get it from your EmailJS dashboard under Account → API Keys.',
  },
];

/** Help page — FAQ and contact form */
const HelpPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Help</Typography>

      {/* FAQ */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
          <Stack spacing={1}>
            {FAQ.map(({ q, a }, i) => (
              <Accordion key={i} disableGutters elevation={0} variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight="medium">{q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">{a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Contact the Developer</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Have a question, bug report, or feature request? Send a message directly.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <ContactForm />
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpPage;
