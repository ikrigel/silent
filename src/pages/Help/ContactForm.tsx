import React, { useState } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress, Stack,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { sendEmail, ContactFormData } from '@/services/emailService';
import { writeLog } from '@/services/logService';

/** Contact form using EmailJS to send messages to the developer */
const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, reset } = useForm<ContactFormData>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('sending');
    try {
      // Public key is hardcoded in emailService — no need to pass from settings
      await sendEmail(data, '');
      setStatus('success');
      writeLog('info', 'Contact form submitted successfully');
      reset();
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setErrorMsg(msg);
      writeLog('error', 'Contact form submission failed', { err: msg });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        {status === 'success' && <Alert severity="success">{t('help.form.success')}</Alert>}
        {status === 'error' && <Alert severity="error">{errorMsg}</Alert>}
        <Controller name="name" control={control} rules={{ required: t('help.form.nameRequired') }}
          render={({ field, fieldState }) => (
            <TextField {...field} label={t('help.form.name')} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="email" control={control} rules={{ required: t('help.form.emailRequired') }}
          render={({ field, fieldState }) => (
            <TextField {...field} label={t('help.form.email')} type="email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="subject" control={control} rules={{ required: t('help.form.subjectRequired') }}
          render={({ field, fieldState }) => (
            <TextField {...field} label={t('help.form.subject')} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller name="message" control={control} rules={{ required: t('help.form.messageRequired') }}
          render={({ field, fieldState }) => (
            <TextField {...field} label={t('help.form.message')} multiline rows={4} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={status === 'sending'}
          startIcon={status === 'sending' ? <CircularProgress size={16} /> : undefined}
        >
          {status === 'sending' ? t('help.form.sending') : t('help.form.send')}
        </Button>
      </Stack>
    </Box>
  );
};

export default ContactForm;
