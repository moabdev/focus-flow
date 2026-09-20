import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TimerMode, UserSettings } from '../types';
import { storageService } from '../services/storage';

interface UseTimerProps {
  settings: UserSettings;
  onPomodoroComplete: (durationMinutes: number) => void;
  playAlarm: () => void;
  setIsTimerRunningTheme?: (running: boolean) => void;
}

export function useTimer({
  settings,
  onPomodoroComplete,
  playAlarm,
  setIsTimerRunningTheme,
}: UseTimerProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Determina a duração em segundos com base no modo
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

  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Atualiza duração se as configurações mudarem e o timer estiver parado
  useEffect(() => {
    if (!isRunning) {
      const dur = getDurationForMode(mode);
      setTimeLeft(dur);
      setTotalDuration(dur);
    }
  }, [getDurationForMode, mode, isRunning]);

  // Sincroniza estado de execução com tema (para Focus Dimming)
  useEffect(() => {
    if (setIsTimerRunningTheme) {
      setIsTimerRunningTheme(isRunning);
    }
  }, [isRunning, setIsTimerRunningTheme]);

  // Atualização do título da aba
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const modeLabel = mode === 'pomodoro' ? 'Foco' : 'Pausa';
    document.title = `${formatted} - ${modeLabel} | FocusFlow`;

    return () => {
      document.title = 'FocusFlow | Foco & Produtividade nos Estudos';
    };
  }, [timeLeft, mode]);

  // Trata a conclusão do ciclo
  const handleCycleComplete = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    playAlarm();

    // Notificação do navegador se permitida
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'pomodoro' ? 'Pomodoro Concluído! 🎉' : 'Hora de Voltar ao Foco! 🚀';
      const body = mode === 'pomodoro'
        ? 'Excelente sessão de foco. Aproveite para descansar a mente.'
        : 'Sua pausa terminou. Pronto para mais um ciclo produtivo?';
      new Notification(title, { body, icon: '/vite.svg' });
    }

    if (mode === 'pomodoro') {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e63956', '#4cc9f0', '#06d6a0', '#ffd166'],
        });
      } catch {
        // Fallback
      }

      onPomodoroComplete(settings.pomodoro_time);
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      // Verifica se é hora de pausa longa
      const isLongBreak = nextCycle % settings.long_break_interval === 0;
      const nextMode: TimerMode = isLongBreak ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      const nextDur = getDurationForMode(nextMode);
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.auto_start_breaks) {
        setTimeout(() => start(nextDur), 600);
      }
    } else {
      // Retorno para Pomodoro
      setMode('pomodoro');
      const nextDur = getDurationForMode('pomodoro');
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.auto_start_pomodoros) {
        setTimeout(() => start(nextDur), 600);
      }
    }
  }, [
    mode,
    playAlarm,
    settings.pomodoro_time,
    settings.long_break_interval,
    settings.auto_start_breaks,
    settings.auto_start_pomodoros,
    cycleCount,
    getDurationForMode,
    onPomodoroComplete,
  ]);

  // Contagem regressiva compensada por delta
  useEffect(() => {
    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          endTimeRef.current = null;
          handleCycleComplete();
        }
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      endTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, handleCycleComplete]);

  const start = (customTime?: number) => {
    const timeToSet = customTime !== undefined ? customTime : timeLeft;
    endTimeRef.current = Date.now() + timeToSet * 1000;
    setIsRunning(true);

    // Solicita permissão de notificação se ainda não solicitou
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    setIsRunning(false);
    endTimeRef.current = null;
  };

  const toggle = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const reset = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    const dur = getDurationForMode(mode);
    setTimeLeft(dur);
    setTotalDuration(dur);
  };

  const skip = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    if (mode === 'pomodoro') {
      const nextMode = (cycleCount + 1) % settings.long_break_interval === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      const dur = getDurationForMode(nextMode);
      setTimeLeft(dur);
      setTotalDuration(dur);
    } else {
      setMode('pomodoro');
      const dur = getDurationForMode('pomodoro');
      setTimeLeft(dur);
      setTotalDuration(dur);
    }
  };

  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode(newMode);
    const dur = getDurationForMode(newMode);
    setTimeLeft(dur);
    setTotalDuration(dur);
  };

  // Formatação MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Percentual de progresso (0 a 100)
  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100))
    : 0;

  return {
    mode,
    changeMode,
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
    skip,
  };
}
