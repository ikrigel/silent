import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSchedulerStore } from '@/store/schedulerStore';
import { robotService } from '@/services/robotService';
import SchedulerList from './SchedulerList';
import SchedulerForm from './SchedulerForm';
import type { ScheduleEntry } from '@/types';

/** Scheduler page — manage silencing schedules */
const SchedulerPage: React.FC = () => {
  const { t } = useTranslation();
  const { schedules, addOrUpdateSchedule, removeSchedule, toggleScheduleEnabled } = useSchedulerStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const isAndroid = robotService.isAndroid();

  const handleEdit = (entry: ScheduleEntry) => { setEditing(entry); setFormOpen(true); };
  const handleClose = () => { setEditing(null); setFormOpen(false); };
  const handleSubmit = (entry: ScheduleEntry) => { addOrUpdateSchedule(entry); handleClose(); };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">{t('scheduler.title')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
          {t('scheduler.newSchedule')}
        </Button>
      </Box>
      {!isAndroid && <Alert severity="info" sx={{ mb: 2 }}>{t('scheduler.browserNote')}</Alert>}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <SchedulerList schedules={schedules} onEdit={handleEdit} onDelete={removeSchedule} onToggle={toggleScheduleEnabled} />
        </CardContent>
      </Card>
      <SchedulerForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={handleClose} />
    </Box>
  );
};

export default SchedulerPage;
