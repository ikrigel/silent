// ─── Robot Types ─────────────────────────────────────────────────────
export interface RobotStep {
  action: 'open_settings' | 'click' | 'click_any' | 'toggle_off_any' | 'toggle_on_any' | 'scroll_down';
  text: string;
  description?: string;
}

export interface RobotRecording {
  id: string;
  name: string;
  steps: RobotStep[];
  createdAt: string;
  isBuiltIn?: boolean;
}

// ─── Scheduler Types ────────────────────────────────────────────────
export type RepeatMode = 'none' | 'daily' | 'weekly' | 'custom';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleEntry {
  id: string;
  name: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  repeatMode: RepeatMode;
  daysOfWeek: DayOfWeek[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  robotRecordingId?: string;
  useAirplaneMode?: boolean;
}

export type LogLevel = 'verbose' | 'info' | 'error' | 'none';

export interface LogEntry {
  id: string;
  level: Exclude<LogLevel, 'none'>;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export type ThemeMode = 'light' | 'dark' | 'time';

// emailjsPublicKey removed — hardcoded in emailService.ts
export interface AppSettings {
  themeMode: ThemeMode;
  logLevel: LogLevel;
  notificationsEnabled: boolean;
  menuPosition?: 'left' | 'right' | 'top' | 'bottom';
  menuPinned?: boolean;
}

export type LocalStorageSchema = {
  schedules: ScheduleEntry[];
  logs: LogEntry[];
  settings: AppSettings;
  themeCurveStrength: number;
};
export type LocalStorageKey = keyof LocalStorageSchema;
