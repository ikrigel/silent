import { create } from 'zustand';
import type { DeviceStateSnapshot } from '../types';

/** In-memory store for device state snapshots taken at schedule start */
interface RobotStateStore {
  snapshots: Record<string, DeviceStateSnapshot>;
  captureSnapshot: (scheduleId: string, airplaneModeWasActive: boolean, weaWasSilenced: boolean) => void;
  getSnapshot: (scheduleId: string) => DeviceStateSnapshot | null;
  clearSnapshot: (scheduleId: string) => void;
}

export const useRobotStateStore = create<RobotStateStore>((set, get) => ({
  snapshots: {},

  captureSnapshot: (scheduleId: string, airplaneModeWasActive: boolean, weaWasSilenced: boolean) => {
    const snapshot: DeviceStateSnapshot = {
      scheduleId,
      airplaneModeWasActive,
      weaWasSilenced,
      capturedAt: new Date().toISOString(),
    };
    set((state) => ({
      snapshots: { ...state.snapshots, [scheduleId]: snapshot },
    }));
  },

  getSnapshot: (scheduleId: string) => {
    const snapshot = get().snapshots[scheduleId];
    return snapshot || null;
  },

  clearSnapshot: (scheduleId: string) => {
    set((state) => {
      const newSnapshots = { ...state.snapshots };
      delete newSnapshots[scheduleId];
      return { snapshots: newSnapshots };
    });
  },
}));
