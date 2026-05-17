import type { ScheduleEntry, DayOfWeek } from '@/types';
import { storage } from './storage';
import { writeLog } from './logService';

/** Check if a schedule is currently active */
export function isScheduleActive(schedule: ScheduleEntry): boolean {
  try {
    if (!schedule.enabled) {
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: Schedule "${schedule.name}" is DISABLED`, { id: schedule.id });
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay() as DayOfWeek;

    writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: Checking schedule "${schedule.name}"`, {
      id: schedule.id,
      currentTime,
      today,
      dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      repeatMode: schedule.repeatMode,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
    });

    // Check date range if set
    if (schedule.startDate && today < schedule.startDate) {
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: "${schedule.name}" not active - before startDate`, {
        today,
        startDate: schedule.startDate,
      });
      return false;
    }
    if (schedule.endDate && today > schedule.endDate) {
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: "${schedule.name}" not active - after endDate`, {
        today,
        endDate: schedule.endDate,
      });
      return false;
    }

    // Check day of week for weekly repeat
    if (schedule.repeatMode === 'weekly' && schedule.daysOfWeek.length > 0) {
      const isToday = schedule.daysOfWeek.includes(dayOfWeek);
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: "${schedule.name}" weekly check`, {
        dayOfWeek,
        daysOfWeek: schedule.daysOfWeek,
        isToday,
      });
      if (!isToday) return false;
    }

    // Check time range (handles overnight spans)
    let isActive = false;
    if (schedule.startTime <= schedule.endTime) {
      isActive = currentTime >= schedule.startTime && currentTime < schedule.endTime;
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: "${schedule.name}" time check (same-day)`, {
        currentTime,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive,
      });
    } else {
      // Overnight: e.g. 22:00 - 06:00
      isActive = currentTime >= schedule.startTime || currentTime < schedule.endTime;
      writeLog('ultraverbose', `[v${__APP_VERSION__}] isScheduleActive: "${schedule.name}" time check (overnight)`, {
        currentTime,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive,
      });
    }

    if (isActive) {
      writeLog('info', `[v${__APP_VERSION__}] isScheduleActive: Schedule "${schedule.name}" IS ACTIVE`, { id: schedule.id });
    }

    return isActive;
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] isScheduleActive error: ${err}`);
    throw err;
  }
}

/** Get all schedules */
export function getSchedules(): ScheduleEntry[] {
  try {
    return storage.get('schedules') ?? [];
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] getSchedules error: ${err}`);
    throw err;
  }
}

/** Save a schedule (add or update) */
export function saveSchedule(entry: ScheduleEntry): void {
  try {
    const existing = getSchedules();
    const idx = existing.findIndex((s) => s.id === entry.id);
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    storage.set('schedules', existing);
    writeLog('info', `[v${__APP_VERSION__}] Schedule "${entry.name}" saved`, { id: entry.id });
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] saveSchedule error: ${err}`);
    throw err;
  }
}

/** Delete a schedule by ID */
export function deleteSchedule(id: string): void {
  try {
    const existing = getSchedules();
    storage.set('schedules', existing.filter((s) => s.id !== id));
    writeLog('info', `[v${__APP_VERSION__}] Schedule deleted`, { id });
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] deleteSchedule error: ${err}`);
    throw err;
  }
}

/** Toggle a schedule's enabled state */
export function toggleSchedule(id: string): void {
  try {
    const existing = getSchedules();
    const entry = existing.find((s) => s.id === id);
    if (!entry) return;
    entry.enabled = !entry.enabled;
    storage.set('schedules', existing);
    writeLog('verbose', `[v${__APP_VERSION__}] Schedule "${entry.name}" ${entry.enabled ? 'enabled' : 'disabled'}`);
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] toggleSchedule error: ${err}`);
    throw err;
  }
}

/** Get currently active schedules */
export function getActiveSchedules(): ScheduleEntry[] {
  try {
    const allSchedules = getSchedules();
    writeLog('ultraverbose', `[v${__APP_VERSION__}] getActiveSchedules: Checking ${allSchedules.length} total schedules`, {
      count: allSchedules.length,
      scheduleIds: allSchedules.map((s) => ({ id: s.id, name: s.name, enabled: s.enabled })),
    });
    const active = allSchedules.filter(isScheduleActive);
    writeLog('ultraverbose', `[v${__APP_VERSION__}] getActiveSchedules: Found ${active.length} active schedules`, {
      activeCount: active.length,
      activeIds: active.map((s) => ({ id: s.id, name: s.name })),
    });
    return active;
  } catch (err) {
    writeLog('error', `[v${__APP_VERSION__}] getActiveSchedules error: ${err}`);
    throw err;
  }
}
