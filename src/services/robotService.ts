import { Capacitor, registerPlugin } from '@capacitor/core';
import type { RobotRecording, RobotStep } from '../types';
import { writeLog } from './logService';

// ── Capacitor plugin interface ────────────────────────────────────────────────

interface WEARobotPlugin {
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ steps: RobotStep[] }>;
  saveRecording(opts: { id?: string; name: string; steps: RobotStep[] }): Promise<{ id: string }>;
  getRecordings(): Promise<{ recordings: RobotRecording[] }>;
  deleteRecording(opts: { id: string }): Promise<void>;
  executeRecording(opts: { id: string }): Promise<{ message: string }>;
  silenceWEA(): Promise<{ message: string }>;
  unsilenceWEA(): Promise<{ message: string }>;
  enableAirplaneMode(): Promise<{ message: string }>;
  disableAirplaneMode(): Promise<{ message: string }>;
}

// Only register the plugin on Android — silently no-op on web
const WEARobot = Capacitor.isNativePlatform()
  ? registerPlugin<WEARobotPlugin>('WEARobot')
  : null;

// ── Public API ────────────────────────────────────────────────────────────────

export const robotService = {
  isAndroid: () => Capacitor.isNativePlatform(),

  async isAccessibilityEnabled(): Promise<boolean> {
    if (!WEARobot) {
      writeLog('info', 'robotService: Not Android platform');
      return false;
    }
    try {
      const { enabled } = await WEARobot.isAccessibilityEnabled();
      writeLog('verbose',`robotService: isAccessibilityEnabled = ${enabled}`);
      return enabled;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: isAccessibilityEnabled failed: ${msg}`);
      throw err;
    }
  },

  async openAccessibilitySettings(): Promise<void> {
    if (!WEARobot) return;
    await WEARobot.openAccessibilitySettings();
  },

  async startRecording(): Promise<void> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Starting recording');
      await WEARobot.startRecording();
      writeLog('info','robotService: Recording started');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: startRecording failed: ${msg}`);
      throw err;
    }
  },

  async stopRecording(): Promise<RobotStep[]> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Stopping recording');
      const { steps } = await WEARobot.stopRecording();
      writeLog('info',`robotService: Recording stopped, captured ${steps.length} steps`);
      return steps;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: stopRecording failed: ${msg}`);
      throw err;
    }
  },

  async saveRecording(name: string, steps: RobotStep[], id?: string): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info',`robotService: Saving recording "${name}" with ${steps.length} steps`);
      const { id: savedId } = await WEARobot.saveRecording({ id, name, steps });
      writeLog('info',`robotService: Recording saved with ID: ${savedId}`);
      return savedId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: saveRecording failed: ${msg}`);
      throw err;
    }
  },

  async getRecordings(): Promise<RobotRecording[]> {
    if (!WEARobot) return [];
    const { recordings } = await WEARobot.getRecordings();
    return recordings;
  },

  async deleteRecording(id: string): Promise<void> {
    if (!WEARobot) return;
    await WEARobot.deleteRecording({ id });
  },

  async executeRecording(id: string): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { message } = await WEARobot.executeRecording({ id });
    return message;
  },

  async silenceWEA(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Attempting to silence WEA');
      const { message } = await WEARobot.silenceWEA();
      writeLog('info',`robotService: WEA silenced: ${message}`);
      return message;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: silenceWEA failed: ${msg}`);
      throw err;
    }
  },

  async unsilenceWEA(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Attempting to restore WEA');
      const { message } = await WEARobot.unsilenceWEA();
      writeLog('info',`robotService: WEA restored: ${message}`);
      return message;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: unsilenceWEA failed: ${msg}`);
      throw err;
    }
  },

  async enableAirplaneMode(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Attempting to enable Airplane Mode');
      const { message } = await WEARobot.enableAirplaneMode();
      writeLog('info',`robotService: Airplane Mode enabled: ${message}`);
      return message;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: enableAirplaneMode failed: ${msg}`);
      throw err;
    }
  },

  async disableAirplaneMode(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    try {
      writeLog('info','robotService: Attempting to disable Airplane Mode');
      const { message } = await WEARobot.disableAirplaneMode();
      writeLog('info',`robotService: Airplane Mode disabled: ${message}`);
      return message;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeLog('error',`robotService: disableAirplaneMode failed: ${msg}`);
      throw err;
    }
  },
};
