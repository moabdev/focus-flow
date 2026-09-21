import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TimerMode, UserSettings } from '@/features/core/types';
import { notificationService } from '@/features/core/api/notificationService';
import { supabaseService } from '@/features/core/api/supabase';
import { storageGroups } from '@/features/groups/api/storageGroups';

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
  const startRef = useRef<(customTime?: number) => void>(() => {});
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

  // Atualização do título da aba com tempo e subtarefa
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  // Alerta de Foco Rigoroso contra Distrações (troca de aba e saída de fullscreen)
  useEffect(() => {
    if (!settings.strict_focus_mode || !isRunning || mode !== 'pomodoro') return;

    let distractionHandled = false;

    const handleDistraction = async () => {
      if (distractionHandled) return;
      distractionHandled = true;

      // Play alert sound
      playAlarm();

      notificationService.notify(
        '⚠️ Alerta de Foco Rigoroso!',
        'Você se distraiu do FocusFlow! Mantenha a concentração para concluir o ciclo.'
      );

      // Notificar grupos de estudo via Supabase
      const client = supabaseService.getClient();
      if (client) {
        const user = await supabaseService.getUser();
        if (user) {
          const myGroups = storageGroups.getGroups();
          for (const group of myGroups) {
            await client.from('group_messages').insert({
              id: crypto.randomUUID(),
              group_id: group.id,
              user_id: user.id,
              user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
              text: '⚠️ Perdeu o foco e saiu da aba/tela cheia!',
              type: 'system_focus'
            });
          }
        }
      }

      // Reset para permitir futuras distrações se ele voltar
      setTimeout(() => { distractionHandled = false; }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleDistraction();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleDistraction();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [settings.strict_focus_mode, isRunning, mode, playAlarm]);

  // Trata a conclusão do ciclo
  const handleCycleComplete = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    playAlarm();

    // Notificação nativa do sistema
    notificationService.notifyTimerComplete(mode, activeTaskTitle);

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
        setTimeout(() => startRef.current(nextDur), 600);
      }
    } else {
      // Retorno para Pomodoro
      setMode('pomodoro');
      const nextDur = getDurationForMode('pomodoro');
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.auto_start_pomodoros) {
        setTimeout(() => startRef.current(nextDur), 600);
      }
    }
  }, [
    mode,
    playAlarm,
    activeTaskTitle,
    settings.pomodoro_time,
    settings.long_break_interval,
    settings.auto_start_breaks,
    settings.auto_start_pomodoros,
    cycleCount,
    getDurationForMode,
    onPomodoroComplete,
  ]);

  const lastSecondRef = useRef<number>(timeLeft);
  const onTickSecondRef = useRef(onTickSecond);
  useEffect(() => {
    onTickSecondRef.current = onTickSecond;
  }, [onTickSecond]);

  const handleCycleCompleteRef = useRef(handleCycleComplete);
  useEffect(() => {
    handleCycleCompleteRef.current = handleCycleComplete;
  }, [handleCycleComplete]);

  // Contagem regressiva compensada por delta (sem recriar o intervalo a cada tick)
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
  }, [isRunning, mode]);

  const start = (customTime?: number) => {
    const timeToSet = customTime !== undefined ? customTime : timeLeft;
    endTimeRef.current = Date.now() + timeToSet * 1000;
    setIsRunning(true);

    // Solicita permissão de notificação se ainda não solicitou
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };
  startRef.current = start;

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
