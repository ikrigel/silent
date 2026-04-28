import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AirplaneLearningState {
  learned: boolean;
  learnedDelay: number;
  isLearning: boolean;
  pendingFeedbackAttempt: number | null;

  startLearning: () => void;
  resetLearning: () => void;
  setPendingFeedback: (attempt: number) => void;
  clearPendingFeedback: () => void;
  saveLearned: (delay: number) => void;
}

export const useAirplaneLearningStore = create<AirplaneLearningState>()(
  persist(
    (set) => ({
      learned: false,
      learnedDelay: 0,
      isLearning: false,
      pendingFeedbackAttempt: null,

      startLearning: () => set({ isLearning: true, learned: false, learnedDelay: 0 }),
      resetLearning: () => set({ isLearning: false, learned: false, learnedDelay: 0 }),
      setPendingFeedback: (attempt: number) => set({ pendingFeedbackAttempt: attempt }),
      clearPendingFeedback: () => set({ pendingFeedbackAttempt: null }),
      saveLearned: (delay: number) => set({ learned: true, learnedDelay: delay, isLearning: false }),
    }),
    {
      name: 'airplane_learning',
      partialize: (state) => ({
        learned: state.learned,
        learnedDelay: state.learnedDelay,
      }),
    }
  )
);
