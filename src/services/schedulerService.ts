import type { ScheduleEntry, DayOfWeek } from '@/types';
import { storage } from './storage';
import { writeLog } from './logService';

/** Check if a schedule is currently active */
export function isScheduleActive(schedule: ScheduleEntry): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay() as DayOfWeek;

  // Check date range if set
  if (schedule.startDate && today < schedule.startDate) return false;
  if (schedule.endDate && today > schedule.endDate) return false;

  // Check day of week for weekly repeat
  if (schedule.repeatMode === 'weekly' && schedule.daysOfWeek.length > 0) {
    if (!schedule.daysOfWeek.includes(dayOfWeek)) return false;
  }

  // Check time range (handles overnight spans)
  if (schedule.startTime <= schedule.endTime) {
    return currentTime >= schedule.startTime && currentTime < schedule.endTime;
  } else {
    // Overnight: e.g. 22:00 - 06:00
    return currentTime >= schedule.startTime || currentTime < schedule.endTime;
  }
}

/** Get all schedules */
export function getSchedules(): ScheduleEntry[] {
  return storage.get('schedules') ?? [];
}

/** Save a schedule (add or update) */
export function saveSchedule(entry: ScheduleEntry): void {
  const existing = getSchedules();
  const idx = existing.findIndex((s) => s.id === entry.id);
  if (idx >= 0) {
    existing[idx] = entry;
  } else {
    existing.push(entry);
  }
  storage.set('schedules', existing);
  writeLog('info', `Schedule "${entry.name}" saved`, { id: entry.id });
}

/** Delete a schedule by ID */
export function deleteSchedule(id: string): void {
  const existing = getSchedules();
  storage.set('schedules', existing.filter((s) => s.id !== id));
  writeLog('info', `Schedule deleted`, { id });
}

/** Toggle a schedule's enabled state */
export function toggleSchedule(id: string): void {
  const existing = getSchedules();
  const entry = existing.find((s) => s.id === id);
  if (!entry) return;
  entry.enabled = !entry.enabled;
  storage.set('schedules', existing);
  writeLog('verbose', `Schedule "${entry.name}" ${entry.enabled ? 'enabled' : 'disabled'}`);
}

/** Get currently active schedules */
export function getActiveSchedules(): ScheduleEntry[] {
  return getSchedules().filter(isScheduleActive);
}
