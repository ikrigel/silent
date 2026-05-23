import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Button, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar } from '@mui/material';
import { Delete, DeleteSweep, Send, Refresh, ErrorOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLogStore } from '@/store/logStore';
import { exportLogs, writeLog } from '@/services/logService';
import { robotService } from '@/services/robotService';
import type { LogLevel } from '@/types';
import LogList from './LogList';
import LogFilterBar from './LogFilterBar';

/** Logs page — view, select, delete, and export application logs */
const LogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { logs, selectedIds, loadLogs, removeSelected, clearAll, toggleSelect, selectAll, clearSelection } = useLogStore();
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<Exclude<LogLevel, 'none'> | 'all' | 'failures'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (levelFilter === 'failures') {
      result = result.filter(l => l.level === 'error' && /failed|FAILED|failure/i.test(l.message));
    } else if (levelFilter !== 'all') {
      result = result.filter(l => l.level === levelFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.message.toLowerCase().includes(q) ||
        (l.meta && JSON.stringify(l.meta).toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      const cmp = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortOrder === 'newest' ? cmp : -cmp;
    });
    return result;
  }, [logs, searchTerm, levelFilter, sortOrder]);

  const handleExport = async () => {
    const data = exportLogs();
    const filename = `silent-logs-${Date.now()}.json`;

    if (robotService.isAndroid()) {
      try {
        const allLogs = JSON.parse(data) as object[];
        const last100 = allLogs.slice(-100);
        await navigator.clipboard.writeText(JSON.stringify(last100, null, 2));
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 3000);
      } catch (err) {
        writeLog('error', `Export copy failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const handleExportFailureReport = async () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `silent-failure-report-${today}.json`;
    const blob = new Blob([reportJson], { type: 'application/json' });

    if (robotService.isAndroid() && typeof navigator.share === 'function') {
      try {
        await navigator.share({ files: [new File([blob], filename, { type: 'application/json' })], title: 'Silent Failure Report' });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          writeLog('error', `Report share failed: ${err.message}`);
        }
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        <Alert severity="warning" sx={{ mb: 2 }}>
          Robot automation failures detected ({errorLogs.length}).
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => setReportOpen(true)}>
              {t('logs.viewReport')}
            </Button>
            <Button size="small" variant="outlined" startIcon={<ErrorOutline />} onClick={handleExportFailureReport}>
              {t('logs.download')}
            </Button>
          </Stack>
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
      <LogFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        levelFilter={levelFilter}
        onLevelChange={setLevelFilter}
        sortOrder={sortOrder}
        onSortToggle={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
      />
      {filteredLogs.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>{t('logs.noLogs')}</Alert>}
      <LogList logs={filteredLogs} searchTerm={searchTerm} selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelectAll={selectAll} onClearSelection={clearSelection} />

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

      {/* Export copied snackbar (Android) */}
      <Snackbar
        open={exportCopied}
        message={t('logs.exportCopied')}
        autoHideDuration={3000}
        onClose={() => setExportCopied(false)}
      />
    </Box>
  );
};

export default LogsPage;
