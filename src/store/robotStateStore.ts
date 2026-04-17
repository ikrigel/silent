import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceStateSnapshot } from '../types';

/** Store for device state snapshots taken at schedule start, persisted to localStorage */
interface RobotStateStore {
  snapshots: Record<string, DeviceStateSnapshot>;
  captureSnapshot: (scheduleId: string, airplaneModeWasActive: boolean, weaWasSilenced: boolean) => void;
  getSnapshot: (scheduleId: string) => DeviceStateSnapshot | null;
  clearSnapshot: (scheduleId: string) => void;
}

export const useRobotStateStore = create<RobotStateStore>()(
  persist(
    (set, get) => ({
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
    }),
    { name: 'robot_state_snapshots' }
  )
);
