import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Divider,
  Stack, Typography,
} from '@mui/material';
import AndroidIcon from '@mui/icons-material/Android';
import DownloadIcon from '@mui/icons-material/Download';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useTranslation } from 'react-i18next';
import { robotService } from '@/services/robotService';
import { logService } from '@/services/logService';
import SetupGuide from './SetupGuide';
import RecordingControls from './RecordingControls';
import RecordingList from './RecordingList';

const RobotPage: React.FC = () => {
  const { t } = useTranslation();
  const isAndroid = robotService.isAndroid();
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'working'>('idle');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAndroid) {
      robotService.isAccessibilityEnabled().then(setAccessibilityEnabled);
    }
  }, [isAndroid]);

  const handleEnabled = useCallback(() => setAccessibilityEnabled(true), []);
  const handleSaved = useCallback(() => setRefreshKey((k) => k + 1), []);

  const runAction = async (action: 'silence' | 'unsilence' | 'airplane_on' | 'airplane_off') => {
    logService.info(`Robot page: User triggered action: ${action}`);
    setStatus('working');
    setMsg('');
    setError('');
    try {
      let result: string;
      switch (action) {
        case 'silence':
          result = await robotService.silenceWEA();
          break;
        case 'unsilence':
          result = await robotService.unsilenceWEA();
          break;
        case 'airplane_on':
          result = await robotService.enableAirplaneMode();
          break;
        case 'airplane_off':
          result = await robotService.disableAirplaneMode();
          break;
      }
      logService.info(`Robot page: Action ${action} succeeded: ${result}`);
      setMsg(result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logService.error(`Robot page: Action ${action} failed: ${errMsg}`);
      setError(errMsg);
    } finally {
      setStatus('idle');
    }
  };

  // ── Web fallback ──────────────────────────────────────────────────────────
  if (!isAndroid) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t('robot.title')}
        </Typography>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AndroidIcon color="success" fontSize="large" />
              <Typography variant="h6">{t('robot.webNotice.title')}</Typography>
            </Box>
            <Typography color="text.secondary" mb={2}>{t('robot.webNotice.desc')}</Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              href="https://github.com/ikrigel/silent/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('robot.webNotice.downloadApk')}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('robot.webNotice.installTitle')}</Typography>
            <Stack spacing={1}>
              {[1, 2, 3, 4].map((n) => (
                <Typography key={n} variant="body2" color="text.secondary">
                  {n}. {t(`robot.webNotice.step${n}`)}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ── Android native ────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {t('robot.title')}
      </Typography>
      <Stack spacing={3}>

        {/* Accessibility setup */}
        {!accessibilityEnabled && <SetupGuide onEnabled={handleEnabled} />}

        {accessibilityEnabled && (
          <>
            {/* Quick-action WEA buttons */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('robot.quickActions.title')}</Typography>
                <Typography color="text.secondary" variant="body2" mb={2}>
                  {t('robot.quickActions.desc')}
                </Typography>
                {msg   && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMsg('')}>{msg}</Alert>}
                {error && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<VolumeOffIcon />}
                    onClick={() => runAction('silence')}
                    disabled={status === 'working'}
                  >
                    {t('robot.quickActions.silence')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<VolumeUpIcon />}
                    onClick={() => runAction('unsilence')}
                    disabled={status === 'working'}
                  >
                    {t('robot.quickActions.restore')}
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => runAction('airplane_on')}
                    disabled={status === 'working'}
                  >
                    {t('robot.quickActions.airplaneOn')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => runAction('airplane_off')}
                    disabled={status === 'working'}
                  >
                    {t('robot.quickActions.airplaneOff')}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Divider />

            {/* Recording */}
            <RecordingControls onSaved={handleSaved} />

            {/* Recording list */}
            <RecordingList refreshKey={refreshKey} />
          </>
        )}
      </Stack>
    </Box>
  );
};

export default RobotPage;
