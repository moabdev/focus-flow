import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TimerMode, UserSettings } from '@/features/core/types';
import { notificationService } from '@/features/core/api/notificationService';
import { supabaseService } from '@/features/core/api/supabase';
import { storageGroups } from '@/features/groups/api/storageGroups';

interface UseTimerFlowProps {
  settings: UserSettings;
  mode: TimerMode;
  setMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  cycleCount: number;
  setCycleCount: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  setTotalDuration: React.Dispatch<React.SetStateAction<number>>;
  getDurationForMode: (mode: TimerMode) => number;
  playAlarm: () => void;
  startEngine: (customTime?: number) => void;
  clearEndTime: () => void;
  onPomodoroComplete: (durationMinutes: number) => void;
  activeTaskTitle?: string;
  setIsTimerRunningTheme?: (running: boolean) => void;
}

export function useTimerFlow({
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
  startEngine,
  clearEndTime,
  onPomodoroComplete,
  activeTaskTitle,
  setIsTimerRunningTheme,
}: UseTimerFlowProps) {
  // Sincroniza estado de execução com tema (para Focus Dimming)
  useEffect(() => {
    if (setIsTimerRunningTheme) {
      setIsTimerRunningTheme(isRunning);
    }
  }, [isRunning, setIsTimerRunningTheme]);

  // Alerta de Foco Rigoroso contra Distrações
  useEffect(() => {
    if (!settings.strict_focus_mode || !isRunning || mode !== 'pomodoro') return;

    let distractionHandled = false;

    const handleDistraction = async () => {
      if (distractionHandled) return;
      distractionHandled = true;

      playAlarm();

      notificationService.notify(
        '⚠️ Alerta de Foco Rigoroso!',
        'Você se distraiu do FocusFlow! Mantenha a concentração para concluir o ciclo.'
      );

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

      setTimeout(() => { distractionHandled = false; }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleDistraction();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleDistraction();
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
    clearEndTime();
    playAlarm();

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

      const isLongBreak = nextCycle % settings.long_break_interval === 0;
      const nextMode: TimerMode = isLongBreak ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      
      const nextDur = getDurationForMode(nextMode);
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.auto_start_breaks) {
        setTimeout(() => startEngine(nextDur), 600);
      }
    } else {
      setMode('pomodoro');
      const nextDur = getDurationForMode('pomodoro');
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.auto_start_pomodoros) {
        setTimeout(() => startEngine(nextDur), 600);
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
    setIsRunning,
    clearEndTime,
    setCycleCount,
    setMode,
    setTimeLeft,
    setTotalDuration,
    startEngine,
  ]);

  const skip = () => {
    setIsRunning(false);
    clearEndTime();
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
    clearEndTime();
    setMode(newMode);
    const dur = getDurationForMode(newMode);
    setTimeLeft(dur);
    setTotalDuration(dur);
  };

  return { handleCycleComplete, skip, changeMode };
}
