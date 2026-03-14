import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, Chip, Typography, Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { LogEntry, LogLevel } from '@/types';
import { format } from 'date-fns';

const LEVEL_COLORS: Record<Exclude<LogLevel, 'none'>, 'default' | 'info' | 'error' | 'success'> = {
  verbose: 'default',
  info: 'info',
  error: 'error',
};

interface LogListProps {
  logs: LogEntry[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

/** Table displaying log entries with multi-select checkboxes */
const LogList: React.FC<LogListProps> = ({ logs, selectedIds, onToggleSelect, onSelectAll, onClearSelection }) => {
  const { t } = useTranslation();
  const allSelected = logs.length > 0 && selectedIds.length === logs.length;

  if (logs.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography color="text.secondary">{t('logs.noLogs')}</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox indeterminate={selectedIds.length > 0 && !allSelected} checked={allSelected}
                onChange={allSelected ? onClearSelection : onSelectAll} />
            </TableCell>
            <TableCell>{t('logs.timestamp')}</TableCell>
            <TableCell>{t('logs.level')}</TableCell>
            <TableCell>{t('logs.message')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} selected={selectedIds.includes(log.id)}>
              <TableCell padding="checkbox">
                <Checkbox checked={selectedIds.includes(log.id)} onChange={() => onToggleSelect(log.id)} />
              </TableCell>
              <TableCell>
                <Typography variant="caption" fontFamily="monospace">
                  {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={log.level} color={LEVEL_COLORS[log.level]} size="small" />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{log.message}</Typography>
                {log.meta && (
                  <Typography variant="caption" color="text.secondary" component="pre" sx={{ m: 0 }}>
                    {JSON.stringify(log.meta)}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LogList;
