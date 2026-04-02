import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Delete, DeleteSweep, Send, Refresh, ErrorOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLogStore } from '@/store/logStore';
import { exportLogs, writeLog } from '@/services/logService';
import LogList from './LogList';

/** Logs page — view, select, delete, and export application logs */
const LogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { logs, selectedIds, loadLogs, removeSelected, clearAll, toggleSelect, selectAll, clearSelection } = useLogStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  /** Build failure report JSON from error-level logs with device info */
  const buildFailureReport = () => {
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
    return JSON.stringify(report, null, 2);
  };

  const reportJson = buildFailureReport();

  /** Export failure report as a downloadable JSON file */
  const handleExportFailureReport = () => {
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `silent-failure-report-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Copy failure report JSON to clipboard */
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(reportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      writeLog('error', `Failed to copy JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
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
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => setReportOpen(true)}>
              {t('logs.viewReport')}
            </Button>
            <Button size="small" startIcon={<ErrorOutline />} onClick={handleExportFailureReport}>
              {t('logs.download')}
            </Button>
          </Stack>
        }>
          Robot automation failures detected ({errorLogs.length}). {t('logs.viewReport')} or {t('logs.download').toLowerCase()}.
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

      {/* Failure Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('logs.failureDialog')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={reportJson}
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCopyJson} variant="contained" color={copied ? 'success' : 'primary'}>
            {copied ? t('logs.copied') : t('logs.copyJson')}
          </Button>
          <Button onClick={handleExportFailureReport} variant="outlined">
            {t('logs.download')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogsPage;
