import type { LogEntry, LogLevel } from '@/types';
import { storage } from './storage';

// Maximum log entries kept in storage
const MAX_LOGS = 500;

/** Append a new log entry if the current log level allows it */
export function writeLog(
  level: Exclude<LogLevel, 'none'>,
  message: string,
  meta?: Record<string, unknown>
): void {
  // Read current log level from settings
  const settings = storage.get('settings');
  const logLevel = settings?.logLevel ?? 'info';

  // none = no logging at all
  if (logLevel === 'none') return;

  // Filter by severity: verbose < info < error
  const order: LogLevel[] = ['verbose', 'info', 'error', 'none'];
  if (order.indexOf(level) < order.indexOf(logLevel)) return;

  const entry: LogEntry = {
    id: crypto.randomUUID(),
    level,
    message,
    timestamp: new Date().toISOString(),
    meta,
  };

  const existing = storage.get('logs') ?? [];
  const updated = [entry, ...existing].slice(0, MAX_LOGS);
  storage.set('logs', updated);
}

/** Remove specific log entries by ID */
export function deleteLogs(ids: string[]): void {
  const existing = storage.get('logs') ?? [];
  storage.set('logs', existing.filter((l) => !ids.includes(l.id)));
}

/** Clear all logs */
export function clearAllLogs(): void {
  storage.set('logs', []);
}

/** Get all stored log entries */
export function getLogs(): LogEntry[] {
  return storage.get('logs') ?? [];
}

/** Export logs as a JSON string for sending/downloading */
export function exportLogs(): string {
  return JSON.stringify(getLogs(), null, 2);
}
