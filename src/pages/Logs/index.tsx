import React, { useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Alert,
} from '@mui/material';
import { Delete, DeleteSweep, Send, Refresh } from '@mui/icons-material';
import { useLogStore } from '@/store/logStore';
import { exportLogs } from '@/services/logService';
import LogList from './LogList';

/** Logs page — view, select, delete, and export application logs */
const LogsPage: React.FC = () => {
  const {
    logs, selectedIds, loadLogs,
    removeSelected, clearAll,
    toggleSelect, selectAll, clearSelection,
  } = useLogStore();

  // Refresh logs when page mounts
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
        <Typography variant="h4" fontWeight="bold">Logs</Typography>
        <Button startIcon={<Refresh />} onClick={loadLogs} size="small">Refresh</Button>
      </Box>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          disabled={selectedIds.length === 0}
          onClick={removeSelected}
        >
          Delete Selected ({selectedIds.length})
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteSweep />}
          disabled={logs.length === 0}
          onClick={clearAll}
        >
          Clear All
        </Button>
        <Button
          variant="outlined"
          startIcon={<Send />}
          disabled={logs.length === 0}
          onClick={handleExport}
        >
          Export JSON
        </Button>
      </Stack>

      {logs.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>No logs to show. Actions will be logged here.</Alert>
      )}

      <LogList
        logs={logs}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
      />
    </Box>
  );
};

export default LogsPage;
