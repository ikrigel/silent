import React from 'react';
import {
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Switch, Chip, Typography, Box, Divider,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import type { ScheduleEntry } from '@/types';
import { isScheduleActive } from '@/services/schedulerService';

interface SchedulerListProps {
  schedules: ScheduleEntry[];
  onEdit: (entry: ScheduleEntry) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

/** Displays the list of schedule entries with toggle, edit, delete controls */
const SchedulerList: React.FC<SchedulerListProps> = ({ schedules, onEdit, onDelete, onToggle }) => {
  if (schedules.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography color="text.secondary">No schedules yet. Create one to get started.</Typography>
      </Box>
    );
  }

  return (
    <List>
      {schedules.map((entry, i) => {
        const active = isScheduleActive(entry);
        return (
          <React.Fragment key={entry.id}>
            {i > 0 && <Divider />}
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight="bold">{entry.name}</Typography>
                    {active && <Chip label="ACTIVE" color="warning" size="small" />}
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="caption" display="block">
                      {entry.startTime} – {entry.endTime} · {entry.repeatMode}
                    </Typography>
                    {entry.startDate && (
                      <Typography variant="caption" display="block">
                        {entry.startDate} → {entry.endDate || 'ongoing'}
                      </Typography>
                    )}
                    {entry.repeatMode === 'weekly' && entry.daysOfWeek.length > 0 && (
                      <Typography variant="caption" display="block">
                        Days: {['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                          .filter((_, i) => entry.daysOfWeek.includes(i as 0))
                          .join(', ')}
                      </Typography>
                    )}
                  </>
                }
              />
              <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch
                  checked={entry.enabled}
                  onChange={() => onToggle(entry.id)}
                  size="small"
                />
                <IconButton size="small" onClick={() => onEdit(entry)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => onDelete(entry.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default SchedulerList;
