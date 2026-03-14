import { create } from 'zustand';
import type { ScheduleEntry } from '@/types';
import {
  getSchedules,
  saveSchedule,
  deleteSchedule,
  toggleSchedule,
} from '@/services/schedulerService';

interface SchedulerState {
  schedules: ScheduleEntry[];
  loadSchedules: () => void;
  addOrUpdateSchedule: (entry: ScheduleEntry) => void;
  removeSchedule: (id: string) => void;
  toggleScheduleEnabled: (id: string) => void;
}

/** Zustand store for schedule management */
export const useSchedulerStore = create<SchedulerState>((set) => ({
  schedules: getSchedules(),

  loadSchedules: () => {
    set({ schedules: getSchedules() });
  },

  addOrUpdateSchedule: (entry) => {
    saveSchedule(entry);
    set({ schedules: getSchedules() });
  },

  removeSchedule: (id) => {
    deleteSchedule(id);
    set({ schedules: getSchedules() });
  },

  toggleScheduleEnabled: (id) => {
    toggleSchedule(id);
    set({ schedules: getSchedules() });
  },
}));
