import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  IconButton, List, ListItem, ListItemText, Typography, Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { robotService } from '@/services/robotService';
import type { RobotRecording } from '@/types';

interface Props {
  refreshKey?: number;
}

const RecordingList: React.FC<Props> = ({ refreshKey }) => {
  const { t } = useTranslation();
  const [recordings, setRecordings] = useState<RobotRecording[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playMsg, setPlayMsg] = useState('');
  const [playError, setPlayError] = useState('');

  const load = useCallback(async () => {
    setRecordings(await robotService.getRecordings());
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handlePlay = async (rec: RobotRecording) => {
    setPlaying(rec.id);
    setPlayMsg('');
    setPlayError('');
    try {
      const msg = await robotService.executeRecording(rec.id);
      setPlayMsg(msg);
    } catch (err: unknown) {
      setPlayError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlaying(null);
    }
  };

  const handleDelete = async (id: string) => {
    await robotService.deleteRecording(id);
    await load();
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">{t('robot.list.empty')}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>{t('robot.list.title')}</Typography>
        {playMsg   && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setPlayMsg('')}>{playMsg}</Alert>}
        {playError && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setPlayError('')}>{playError}</Alert>}
        <List disablePadding>
          {recordings.map((rec, idx) => (
            <React.Fragment key={rec.id}>
              {idx > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
              <ListItem
                disableGutters
                secondaryAction={
                  <Box display="flex" gap={0.5}>
                    <IconButton
                      onClick={() => handlePlay(rec)}
                      disabled={playing !== null}
                      color="primary"
                      title={t('robot.list.play')}
                    >
                      {playing === rec.id
                        ? <CircularProgress size={20} />
                        : <PlayArrowIcon />}
                    </IconButton>
                    {!rec.isBuiltIn && (
                      <IconButton
                        onClick={() => handleDelete(rec.id)}
                        disabled={playing !== null}
                        color="error"
                        title={t('robot.list.delete')}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {rec.name}
                      {rec.isBuiltIn && (
                        <Chip label={t('robot.list.builtIn')} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={`${rec.steps.length} ${t('robot.record.steps')} · ${rec.createdAt}`}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecordingList;
