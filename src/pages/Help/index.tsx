import React from 'react';
import {
  Box, Typography, Card, CardContent, Accordion,
  AccordionSummary, AccordionDetails, Divider, Stack,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ContactForm from './ContactForm';

/** Error boundary to isolate ContactForm crashes from the rest of the Help page */
class ContactFormErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Typography color="error">Contact form temporarily unavailable.</Typography>;
    }
    return this.props.children;
  }
}

/** Help page — FAQ accordion and contact form */
const HelpPage: React.FC = () => {
  const { t } = useTranslation();

  const FAQ_KEYS = ['1','2','3','4','5','6','7'] as const;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{t('help.title')}</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('help.faqTitle')}</Typography>
          <Stack spacing={1}>
            {FAQ_KEYS.map((k) => (
              <Accordion key={k} disableGutters elevation={0} variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight="medium">{t(`help.faq.q${k}`)}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">{t(`help.faq.a${k}`)}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t('help.contactTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>{t('help.contactDesc')}</Typography>
          <Divider sx={{ my: 2 }} />
          <ContactFormErrorBoundary>
            <ContactForm />
          </ContactFormErrorBoundary>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpPage;
