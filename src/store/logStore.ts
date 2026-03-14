import { create } from 'zustand';
import type { LogEntry } from '@/types';
import { getLogs, deleteLogs, clearAllLogs } from '@/services/logService';

interface LogState {
  logs: LogEntry[];
  selectedIds: string[];
  loadLogs: () => void;
  removeSelected: () => void;
  clearAll: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

/** Zustand store for log management */
export const useLogStore = create<LogState>((set, get) => ({
  logs: getLogs(),
  selectedIds: [],

  loadLogs: () => set({ logs: getLogs() }),

  removeSelected: () => {
    deleteLogs(get().selectedIds);
    set({ logs: getLogs(), selectedIds: [] });
  },

  clearAll: () => {
    clearAllLogs();
    set({ logs: [], selectedIds: [] });
  },

  toggleSelect: (id) => {
    const { selectedIds } = get();
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    set({ selectedIds: next });
  },

  selectAll: () => {
    set({ selectedIds: get().logs.map((l) => l.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),
}));
