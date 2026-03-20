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

  // Get reCAPTCHA v2 Invisible site key from environment
  const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string) || '';

  // Warn if sitekey is not configured
  if (!RECAPTCHA_SITE_KEY) {
    writeLog('error', 'reCAPTCHA site key not configured in environment variables');
  }

  const { control, handleSubmit, reset } = useForm<ContactFormData>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('sending');
    setErrorMsg('');
    try {
      // Execute reCAPTCHA v2 Invisible to get token (skip if sitekey is not configured)
      let token = '';
      if (RECAPTCHA_SITE_KEY && recaptchaRef.current) {
        token = await recaptchaRef.current.executeAsync();
        if (!token || token.length === 0) {
          setStatus('error');
          setErrorMsg(t('help.form.captchaRequired') || 'reCAPTCHA validation failed');
          writeLog('error', 'reCAPTCHA token not generated');
          return;
        }
      }

      // Send email with reCAPTCHA token
      await sendEmail({ ...data, 'g-recaptcha-response': token }, '');
      setStatus('success');
      writeLog('info', 'Contact form submitted successfully');
      reset();
      // Reset captcha if it exists (only rendered when sitekey is configured)
      if (RECAPTCHA_SITE_KEY && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setErrorMsg(msg);
      writeLog('error', 'Contact form submission failed', { err: msg });
      // Reset captcha if it exists (only rendered when sitekey is configured)
      if (RECAPTCHA_SITE_KEY && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
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
        {/* reCAPTCHA v2 Invisible - only render if sitekey is configured */}
        {RECAPTCHA_SITE_KEY && (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            size="invisible"
          />
        )}
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          {t('help.form.captchaNote') || 'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.'}
        </Typography>
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
