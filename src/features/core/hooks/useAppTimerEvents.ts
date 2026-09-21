import { useRef, useEffect, useCallback } from 'react';
import { storageService } from '@/features/core/api/storage';
import { badgeService } from '@/features/stats/api/badgeService';
import { useToast } from '@/features/core/contexts/ToastContext';
import type { TimerMode, Subtask, StudyMetrics } from '@/features/core/types';

interface TimerEventsProps {
  activeSubtaskId: string | null;
  activeSubtask: Subtask | null;
  subtasks: Subtask[];
  metrics: StudyMetrics;
  addTimeSpent: (subtaskId: string, seconds: number) => void;
  incrementPomodoro: (subtaskId: string) => void;
  addCompletedSession: (discipline: string, minutes: number) => void;
}

export function useAppTimerEvents({
  activeSubtaskId,
  activeSubtask,
  subtasks,
  metrics,
  addTimeSpent,
  incrementPomodoro,
  addCompletedSession
}: TimerEventsProps) {
  const toast = useToast();
  const pendingTimeRef = useRef<{ subtaskId: string; seconds: number } | null>(null);

  const flushPendingTime = useCallback(() => {
    if (pendingTimeRef.current && pendingTimeRef.current.seconds > 0) {
      const { subtaskId, seconds } = pendingTimeRef.current;
      pendingTimeRef.current = null;
      addTimeSpent(subtaskId, seconds);
    }
  }, [addTimeSpent]);

  const handleTickSecond = useCallback((mode: TimerMode, elapsedSeconds: number) => {
    if (mode !== 'pomodoro' || !activeSubtaskId || elapsedSeconds <= 0) return;

    if (!pendingTimeRef.current || pendingTimeRef.current.subtaskId !== activeSubtaskId) {
      flushPendingTime();
      pendingTimeRef.current = { subtaskId: activeSubtaskId, seconds: elapsedSeconds };
    } else {
      pendingTimeRef.current.seconds += elapsedSeconds;
    }

    if (pendingTimeRef.current.seconds >= 15) {
      flushPendingTime();
    }
  }, [activeSubtaskId, flushPendingTime]);

  useEffect(() => {
    return () => {
      flushPendingTime();
    };
  }, [activeSubtaskId, flushPendingTime]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingTime();
      storageService.flushPendingRemoteSync();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushPendingTime();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushPendingTime();
    };
  }, [flushPendingTime]);

  const handlePomodoroComplete = useCallback((durationMinutes: number) => {
    flushPendingTime();
    const discipline = activeSubtask?.discipline || 'Geral';
    addCompletedSession(discipline, durationMinutes);
    if (activeSubtaskId) incrementPomodoro(activeSubtaskId);

    const completedCount = subtasks.filter((t) => t.is_completed).length;
    setTimeout(() => {
      const newBadges = badgeService.checkAndClaimNewBadges(metrics, completedCount);
      newBadges.forEach((badge) => {
        toast.success(
          `Parabéns! Você desbloqueou "${badge.title}" (${badge.icon})`,
          '🏆 Nova Conquista!'
        );
      });
    }, 500);
  }, [activeSubtask, activeSubtaskId, addCompletedSession, incrementPomodoro, subtasks, metrics, toast, flushPendingTime]);

  return {
    flushPendingTime,
    handleTickSecond,
    handlePomodoroComplete
  };
}
