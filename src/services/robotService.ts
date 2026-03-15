import { Capacitor, registerPlugin } from '@capacitor/core';
import type { RobotRecording, RobotStep } from '../types';

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
    if (!WEARobot) return false;
    const { enabled } = await WEARobot.isAccessibilityEnabled();
    return enabled;
  },

  async openAccessibilitySettings(): Promise<void> {
    if (!WEARobot) return;
    await WEARobot.openAccessibilitySettings();
  },

  async startRecording(): Promise<void> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    await WEARobot.startRecording();
  },

  async stopRecording(): Promise<RobotStep[]> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { steps } = await WEARobot.stopRecording();
    return steps;
  },

  async saveRecording(name: string, steps: RobotStep[], id?: string): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { id: savedId } = await WEARobot.saveRecording({ id, name, steps });
    return savedId;
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
    const { message } = await WEARobot.silenceWEA();
    return message;
  },

  async unsilenceWEA(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { message } = await WEARobot.unsilenceWEA();
    return message;
  },

  async enableAirplaneMode(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { message } = await WEARobot.enableAirplaneMode();
    return message;
  },

  async disableAirplaneMode(): Promise<string> {
    if (!WEARobot) throw new Error('Robot only available on Android');
    const { message } = await WEARobot.disableAirplaneMode();
    return message;
  },
};
