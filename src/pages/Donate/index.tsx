import React from 'react';
import { Box, Card, CardContent, Button, Typography, Stack } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DonatePage: React.FC = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{t('donate.title')}</Typography>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FavoriteIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6">{t('donate.title')}</Typography>
          </Box>
          <Typography color="text.secondary" mb={3}>{t('donate.desc')}</Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FavoriteIcon />}
              href={i18n.language === 'he'
                ? 'https://my.israelgives.org/he/fundme/silent'
                : 'https://my.israelgives.org/en/fundme/silent'}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              {i18n.language === 'he' ? t('donate.donateHe') : t('donate.donateEn')}
            </Button>
            {i18n.language !== 'he' && (
              <Button
                variant="outlined"
                startIcon={<FavoriteIcon />}
                href="https://my.israelgives.org/he/fundme/silent"
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                {t('donate.donateHe')}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DonatePage;
