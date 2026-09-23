import { useState, useEffect, useCallback } from 'react';
import { TimerMode, UserSettings } from '@/features/core/types';
import { useTimerEngine } from './useTimerEngine';
import { useTimerFlow } from './useTimerFlow';

interface UseTimerProps {
  settings: UserSettings;
  onPomodoroComplete: (durationMinutes: number) => void;
  playAlarm: () => void;
  setIsTimerRunningTheme?: (running: boolean) => void;
  onTickSecond?: (mode: TimerMode, elapsedSeconds: number) => void;
  activeTaskTitle?: string;
}

export function useTimer({
  settings,
  onPomodoroComplete,
  playAlarm,
  setIsTimerRunningTheme,
  onTickSecond,
  activeTaskTitle,
}: UseTimerProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const getDurationForMode = useCallback(
    (targetMode: TimerMode): number => {
      switch (targetMode) {
        case 'pomodoro':
          return settings.pomodoro_time * 60;
        case 'shortBreak':
          return settings.short_break_time * 60;
        case 'longBreak':
          return settings.long_break_time * 60;
      }
    },
    [settings.pomodoro_time, settings.short_break_time, settings.long_break_time]
  );

  const [timeLeft, setTimeLeft] = useState<number>(() => getDurationForMode('pomodoro'));
  const [totalDuration, setTotalDuration] = useState<number>(() => getDurationForMode('pomodoro'));

  useEffect(() => {
    if (!isRunning) {
      const dur = getDurationForMode(mode);
      setTimeLeft(dur);
      setTotalDuration(dur);
    }
  }, [getDurationForMode, mode, isRunning]);

  useEffect(() => {
    const minutesStr = Math.floor(timeLeft / 60);
    const secondsStr = timeLeft % 60;
    const formatted = `${String(minutesStr).padStart(2, '0')}:${String(secondsStr).padStart(2, '0')}`;
    const modeIcon = mode === 'pomodoro' ? '🍅' : '☕';
    const modeLabel = mode === 'pomodoro' ? 'Foco' : 'Pausa';
    const taskPart = activeTaskTitle ? ` • ${activeTaskTitle}` : '';

    if (isRunning) {
      document.title = `(${formatted}) ${modeIcon} ${modeLabel}${taskPart} | FocusFlow`;
    } else {
      document.title = `${formatted} [Pausado] | FocusFlow`;
    }

    return () => {
      document.title = 'FocusFlow | Foco & Produtividade nos Estudos';
    };
  }, [timeLeft, mode, isRunning, activeTaskTitle]);

  let startEngineRef: (customTime?: number) => void;
  let clearEndTimeRef: () => void;

  const flow = useTimerFlow({
    settings,
    mode,
    setMode,
    cycleCount,
    setCycleCount,
    isRunning,
    setIsRunning,
    setTimeLeft,
    setTotalDuration,
    getDurationForMode,
    playAlarm,
    startEngine: (time) => startEngineRef && startEngineRef(time),
    clearEndTime: () => clearEndTimeRef && clearEndTimeRef(),
    onPomodoroComplete,
    activeTaskTitle,
    setIsTimerRunningTheme,
  });

  const engine = useTimerEngine({
    timeLeft,
    setTimeLeft,
    isRunning,
    mode,
    onTickSecond,
    handleCycleComplete: flow.handleCycleComplete,
  });

  startEngineRef = engine.startEngine;
  clearEndTimeRef = engine.clearEndTime;

  const start = (customTime?: number) => {
    engine.startEngine(customTime);
    setIsRunning(true);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    setIsRunning(false);
    engine.clearEndTime();
  };

  const toggle = () => {
    if (isRunning) pause();
    else start();
  };

  const reset = () => {
    setIsRunning(false);
    engine.clearEndTime();
    const dur = getDurationForMode(mode);
    setTimeLeft(dur);
    setTotalDuration(dur);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
    : 0;

  return {
    mode,
    changeMode: flow.changeMode,
    timeLeft,
    totalDuration,
    formattedTime,
    progressPercent,
    isRunning,
    cycleCount,
    start,
    pause,
    toggle,
    reset,
    skip: flow.skip,
  };
}
