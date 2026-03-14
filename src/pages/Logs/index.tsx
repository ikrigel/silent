import React, { useEffect } from 'react';
import { Box, Typography, Button, Stack, Alert } from '@mui/material';
import { Delete, DeleteSweep, Send, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLogStore } from '@/store/logStore';
import { exportLogs } from '@/services/logService';
import LogList from './LogList';

/** Logs page — view, select, delete, and export application logs */
const LogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { logs, selectedIds, loadLogs, removeSelected, clearAll, toggleSelect, selectAll, clearSelection } = useLogStore();

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleExport = () => {
    const data = exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silent-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">{t('logs.title')}</Typography>
        <Button startIcon={<Refresh />} onClick={loadLogs} size="small">{t('logs.refresh')}</Button>
      </Box>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        <Button variant="outlined" color="error" startIcon={<Delete />}
          disabled={selectedIds.length === 0} onClick={removeSelected}>
          {t('logs.deleteSelected', { count: selectedIds.length })}
        </Button>
        <Button variant="outlined" color="error" startIcon={<DeleteSweep />}
          disabled={logs.length === 0} onClick={clearAll}>
          {t('logs.clearAll')}
        </Button>
        <Button variant="outlined" startIcon={<Send />}
          disabled={logs.length === 0} onClick={handleExport}>
          {t('logs.exportJson')}
        </Button>
      </Stack>
      {logs.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>{t('logs.noLogs')}</Alert>}
      <LogList logs={logs} selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelectAll={selectAll} onClearSelection={clearSelection} />
    </Box>
  );
};

export default LogsPage;
