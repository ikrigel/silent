import React, { useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

/** Login page — Google OAuth sign-in */
const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, error, signIn, clearError } = useAuthStore();

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
