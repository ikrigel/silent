import React, { useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { handleCustomToken } from '@/services/authService';

/** Login page — Google OAuth sign-in */
const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, error, signIn, clearError } = useAuthStore();

  // Check for OAuth callback result when page loads
  // Server-side OAuth callback redirects back to /login?token=<customToken>
  useEffect(() => {
    handleCustomToken().then(tokenUser => {
      if (tokenUser) {
        console.log('handleCustomToken succeeded:', tokenUser);
        useAuthStore.setState({ user: tokenUser, loading: false });
        setTimeout(() => {
          navigate('/');
        }, 100);
      }
    }).catch(err => {
      console.error('handleCustomToken failed:', err);
    });
  }, [navigate]);

  // Check for OAuth errors in URL
  // Server-side OAuth callback redirects to /login?error=<reason> on failure
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      // Strip error from URL for security
      window.history.replaceState({}, document.title, window.location.pathname);

      // Map error codes to user-facing messages
      const errorMessages: Record<string, string> = {
        'denied': t('auth.oauthDenied'),
        'access_denied': t('auth.oauthDenied'),
        'missing_code': t('auth.oauthError', { reason: 'missing_code' }),
        'server_misconfigured': t('auth.oauthError', { reason: 'server_misconfigured' }),
        'token_exchange_failed': t('auth.oauthError', { reason: 'token_exchange_failed' }),
        'malformed_token': t('auth.oauthError', { reason: 'malformed_token' }),
        'internal_error': t('auth.oauthError', { reason: 'internal_error' }),
      };

      const message = errorMessages[errorParam] || t('auth.oauthError', { reason: errorParam });
      useAuthStore.setState({ error: message });
    }
  }, [t]);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    clearError();
    await signIn();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            {/* App title */}
            <Typography variant="h4" fontWeight="bold">
              💤 Silent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('app.tagline')}
            </Typography>

            {/* Divider */}
            <Typography variant="body2" color="text.secondary">
              {t('auth.loginRequired')}
            </Typography>

            {/* Error alert */}
            {error && (
              <Alert severity="error" onClose={clearError}>
                {error}
              </Alert>
            )}

            {/* Sign in button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
              onClick={handleSignIn}
              disabled={loading}
              fullWidth
            >
              {loading ? t('common.loading') || 'Signing in...' : t('auth.signIn')}
            </Button>

            {/* Loading state */}
            {loading && (
              <Typography variant="caption" color="text.secondary">
                Redirecting after sign in...
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
