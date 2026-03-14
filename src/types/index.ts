// ─── Scheduler Types ────────────────────────────────────────────────
export type RepeatMode = 'none' | 'daily' | 'weekly' | 'custom';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleEntry {
  id: string;
  name: string;
  enabled: boolean;
  startTime: string;       // "HH:mm"
  endTime: string;         // "HH:mm"
  repeatMode: RepeatMode;
  daysOfWeek: DayOfWeek[]; // for weekly repeat
  startDate?: string;      // ISO date, for date-range
  endDate?: string;        // ISO date, for date-range
  createdAt: string;       // ISO datetime
}

// ─── Log Types ──────────────────────────────────────────────────────
export type LogLevel = 'verbose' | 'info' | 'error' | 'none';

export interface LogEntry {
  id: string;
  level: Exclude<LogLevel, 'none'>;
  message: string;
  timestamp: string; // ISO datetime
  meta?: Record<string, unknown>;
}

// ─── Settings Types ─────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'time';

export interface AppSettings {
  themeMode: ThemeMode;
  logLevel: LogLevel;
  emailjsPublicKey: string;
  notificationsEnabled: boolean;
}

// ─── LocalStorage Schema ─────────────────────────────────────────────
export type LocalStorageSchema = {
  schedules: ScheduleEntry[];
  logs: LogEntry[];
  settings: AppSettings;
  themeCurveStrength: number;
};
export type LocalStorageKey = keyof LocalStorageSchema;
