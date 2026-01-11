
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'activeTimer';

export interface ActiveTimerState {
  taskId: number;
  taskName: string;
  startTime: string; // ISO string
  worklogId: number | null;
  isRunning: boolean;
  isPaused?: boolean;
  pausedElapsed?: number; // Seconds
  resumeTime?: string; // ISO string
}

export const useActiveTimer = () => {
  const [timerState, setTimerState] = useState<ActiveTimerState | null>(null);

  useEffect(() => {
    // Initial load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setTimerState(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse timer state", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, []);

  const saveTimerState = (state: ActiveTimerState) => {
    setTimerState(state);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  };

  const clearTimerState = () => {
    setTimerState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    timerState,
    saveTimerState,
    clearTimerState,
    isActive: !!timerState
  };
};
