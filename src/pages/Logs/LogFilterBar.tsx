import React from 'react';
import { Box, Chip, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Search, SwapVert } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { LogLevel } from '@/types';

type LevelFilter = Exclude<LogLevel, 'none'> | 'all' | 'failures';

interface LogFilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  levelFilter: LevelFilter;
  onLevelChange: (v: LevelFilter) => void;
  sortOrder: 'newest' | 'oldest';
  onSortToggle: () => void;
  totalCount: number;
  filteredCount: number;
}

const LEVEL_OPTIONS: { value: LevelFilter; color: 'default' | 'error' | 'info' | 'success' | 'warning' }[] = [
  { value: 'all', color: 'default' },
  { value: 'error', color: 'error' },
  { value: 'failures', color: 'warning' },
  { value: 'info', color: 'info' },
  { value: 'verbose', color: 'default' },
  { value: 'ultraverbose', color: 'success' },
];

const LogFilterBar: React.FC<LogFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  levelFilter,
  onLevelChange,
  sortOrder,
  onSortToggle,
  totalCount,
  filteredCount,
}) => {
  const { t } = useTranslation();
  return (
    <Box mb={2}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <TextField
          size="small"
          placeholder={t('logs.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Tooltip title={sortOrder === 'newest' ? t('logs.sortNewest') : t('logs.sortOldest')}>
          <IconButton size="small" onClick={onSortToggle}>
            <SwapVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing={0.5} flexWrap="wrap">
        {LEVEL_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={t(`logs.filter_${opt.value}`)}
            color={levelFilter === opt.value ? opt.color : 'default'}
            variant={levelFilter === opt.value ? 'filled' : 'outlined'}
            size="small"
            onClick={() => onLevelChange(opt.value)}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Stack>
      {(searchTerm.trim() || levelFilter !== 'all') && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {t('logs.showing', { filtered: filteredCount, total: totalCount })}
        </Typography>
      )}
    </Box>
  );
};

export default LogFilterBar;
