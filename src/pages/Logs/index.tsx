import React, { useEffect } from 'react';
import { Box, Typography, Button, Stack, Alert } from '@mui/material';
import { Delete, DeleteSweep, Send, Refresh, ErrorOutline } from '@mui/icons-material';
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

  /** Export only error-level logs as a failure report with device info */
  const handleExportFailureReport = () => {
    const errorLogs = logs.filter((log) => log.level === 'error');
    const report = {
      exportedAt: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
      failures: errorLogs.map((log) => ({
        timestamp: log.timestamp,
        message: log.message,
        meta: log.meta || {},
      })),
      summary: {
        totalErrors: errorLogs.length,
        totalLogs: logs.length,
      },
    };
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `silent-failure-report-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorLogs = logs.filter((log) => log.level === 'error');
  const hasErrors = errorLogs.length > 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">{t('logs.title')}</Typography>
        <Button startIcon={<Refresh />} onClick={loadLogs} size="small">{t('logs.refresh')}</Button>
      </Box>

      {hasErrors && (
        <Alert severity="warning" sx={{ mb: 2 }} action={
          <Button size="small" startIcon={<ErrorOutline />} onClick={handleExportFailureReport}>
            {t('robot.exportLogs')}
          </Button>
        }>
          Robot automation failures detected ({errorLogs.length}). Export failure report for debugging.
        </Alert>
      )}

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
