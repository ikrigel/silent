import React, { useState } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress, Stack,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { sendEmail, ContactFormData } from '@/services/emailService';
import { useSettingsStore } from '@/store/settingsStore';
import { writeLog } from '@/services/logService';

/** Contact form using EmailJS to send messages to the developer */
const ContactForm: React.FC = () => {
  const { settings } = useSettingsStore();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, reset } = useForm<ContactFormData>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('sending');
    try {
      await sendEmail(data, settings.emailjsPublicKey);
      setStatus('success');
      writeLog('info', 'Contact form submitted successfully');
      reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send message');
      writeLog('error', 'Contact form submission failed', { err: String(err) });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        {status === 'success' && <Alert severity="success">Message sent! I'll get back to you soon.</Alert>}
        {status === 'error' && <Alert severity="error">{errorMsg}</Alert>}

        <Controller name="name" control={control} rules={{ required: 'Name is required' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Your Name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="email" control={control} rules={{ required: 'Email is required' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Email Address" type="email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="subject" control={control} rules={{ required: 'Subject is required' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Subject" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="message" control={control} rules={{ required: 'Message is required' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Message" multiline rows={4} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={status === 'sending'}
          startIcon={status === 'sending' ? <CircularProgress size={16} /> : undefined}
        >
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </Button>
      </Stack>
    </Box>
  );
};

export default ContactForm;
