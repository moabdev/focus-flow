import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudySession, StudyMetrics, StreakInfo } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';

export function useStats() {
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const loadSessions = useCallback(() => {
    const loaded = storageService.getLocalSessions();
    setSessions(loaded);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const unsubscribe = syncService.onDataSynced(() => {
      loadSessions();
    });
    return () => unsubscribe();
  }, [loadSessions]);

  // Função auxiliar para calcular data em formato YYYY-MM-DD local
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Cálculo da ofensiva (Streak de dias consecutivos)
  const calculateStreak = (history: StudySession[]): StreakInfo => {
    if (history.length === 0) {
      return { currentStreak: 0, bestStreak: 0, lastStudyDate: null };
    }

    // Agrupa sessões por dia
    const uniqueDays = new Set<string>();
    history.forEach((s) => {
      try {
        const dateStr = formatLocalDate(new Date(s.completed_at));
        uniqueDays.add(dateStr);
      } catch {
        // Ignora datas inválidas
      }
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    const todayStr = formatLocalDate(new Date());

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    let currentStreak = 0;
    let checkDate = new Date();

    // Se o usuário estudou hoje, a contagem começa de hoje
    // Se ainda não estudou hoje, mas estudou ontem, a sequência ainda é válida
    if (sortedDays.includes(todayStr)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (sortedDays.includes(yesterdayStr)) {
      currentStreak = 1;
      checkDate = yesterday;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return { currentStreak: 0, bestStreak: 0, lastStudyDate: sortedDays[0] || null };
    }

    // Itera para trás dia a dia para contar dias consecutivos
    while (true) {
      const prevDayStr = formatLocalDate(checkDate);
      if (sortedDays.includes(prevDayStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      currentStreak,
      bestStreak: Math.max(currentStreak, 5), // Incentivo inicial
      lastStudyDate: sortedDays[0] || null,
    };
  };

  // Métricas agregadas
  const computeMetrics = (): StudyMetrics => {
    const todayStr = formatLocalDate(new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let todayMinutes = 0;
    let weekMinutes = 0;
    const subjectMinutes: Record<string, number> = {};

    sessions.forEach((s) => {
      const sDate = new Date(s.completed_at);
      const sDateStr = formatLocalDate(sDate);

      // Hoje
      if (sDateStr === todayStr) {
        todayMinutes += s.duration_minutes;
      }

      // Últimos 7 dias
      if (sDate >= sevenDaysAgo) {
        weekMinutes += s.duration_minutes;
      }

      // Por disciplina
      const disc = s.discipline || 'Geral';
      subjectMinutes[disc] = (subjectMinutes[disc] || 0) + s.duration_minutes;
    });

    return {
      todayMinutes,
      weekMinutes,
      totalPomodoros: sessions.length,
      subjectMinutes,
      history: sessions.slice(0, 15), // últimas 15 sessões
      streak: calculateStreak(sessions),
    };
  };

  const addCompletedSession = useCallback(async (discipline: string, durationMinutes: number) => {
    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      discipline: discipline || 'Geral',
      duration_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
    };

    await storageService.recordSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    syncService.scheduleSync();
  }, []);

  const clearStats = useCallback(() => {
    setSessions([]);
  }, []);

  const metrics = useMemo(() => computeMetrics(), [sessions]);

  return {
    metrics,
    addCompletedSession,
    refreshStats: loadSessions,
    clearStats,
  };
}
