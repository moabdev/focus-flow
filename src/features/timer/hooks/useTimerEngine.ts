import { useRef, useEffect } from 'react';
import { TimerMode } from '@/features/core/types';

interface UseTimerEngineProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  mode: TimerMode;
  onTickSecond?: (mode: TimerMode, diff: number) => void;
  handleCycleComplete: () => void;
}

export function useTimerEngine({
  timeLeft,
  setTimeLeft,
  isRunning,
  mode,
  onTickSecond,
  handleCycleComplete,
}: UseTimerEngineProps) {
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(timeLeft);

  const onTickSecondRef = useRef(onTickSecond);
  useEffect(() => {
    onTickSecondRef.current = onTickSecond;
  }, [onTickSecond]);

  const handleCycleCompleteRef = useRef(handleCycleComplete);
  useEffect(() => {
    handleCycleCompleteRef.current = handleCycleComplete;
  }, [handleCycleComplete]);

  useEffect(() => {
    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
        lastSecondRef.current = timeLeft;
      }

      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
        const diff = lastSecondRef.current - remaining;

        if (diff >= 1) {
          lastSecondRef.current = remaining;
          if (onTickSecondRef.current) {
            onTickSecondRef.current(mode, diff);
          }
        }

        setTimeLeft(remaining);

        if (remaining <= 0) {
          endTimeRef.current = null;
          handleCycleCompleteRef.current();
        }
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      endTimeRef.current = null;
      lastSecondRef.current = timeLeft;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, setTimeLeft]);

  const resetEngine = (newTimeLeft: number) => {
    endTimeRef.current = null;
    lastSecondRef.current = newTimeLeft;
  };

  const startEngine = (customTime?: number) => {
    const timeToSet = customTime !== undefined ? customTime : timeLeft;
    endTimeRef.current = Date.now() + timeToSet * 1000;
  };

  const clearEndTime = () => {
    endTimeRef.current = null;
  };

  return { resetEngine, startEngine, clearEndTime };
}
