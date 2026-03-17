import React, { useRef, useState } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress, Stack, Typography,
} from '@mui/material';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { sendEmail, ContactFormData } from '@/services/emailService';
import { writeLog } from '@/services/logService';

/** Contact form using EmailJS + reCAPTCHA v2 to send messages to the developer */
const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Get sitekey from environment or use Google's test key as fallback
  const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) ||
    '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const { control, handleSubmit, reset } = useForm<ContactFormData>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Get reCAPTCHA token
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setStatus('error');
      setErrorMsg(t('help.form.captchaRequired') || 'Please complete the reCAPTCHA');
      return;
    }

    setStatus('sending');
    try {
      // Public key is hardcoded in emailService — no need to pass from settings
      await sendEmail({ ...data, 'g-recaptcha-response': token }, '');
      setStatus('success');
      writeLog('info', 'Contact form submitted successfully');
      reset();
      recaptchaRef.current?.reset();
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setErrorMsg(msg);
      writeLog('error', 'Contact form submission failed', { err: msg });
      recaptchaRef.current?.reset();
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
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
          />
        </Box>
        {status === 'error' && !errorMsg.includes('reCAPTCHA') && (
          <Typography variant="caption" color="text.secondary">
            {t('help.form.captchaNote') || 'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.'}
          </Typography>
        )}
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
