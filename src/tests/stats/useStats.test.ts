import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStats } from '@/features/stats/hooks/useStats';
import { storageService } from '@/features/core/api/storage';
import { StudySession } from '@/features/core/types';

describe('useStats Hook (Cálculo de Ofensiva / Streaks e Métricas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com streak 0 quando não há sessões', () => {
    const { result } = renderHook(() => useStats());
    expect(result.current.metrics.streak.currentStreak).toBe(0);
    expect(result.current.metrics.todayMinutes).toBe(0);
    expect(result.current.metrics.totalPomodoros).toBe(0);
  });

  it('deve calcular streak 1 quando há sessão concluída hoje', async () => {
    const today = new Date().toISOString();
    const session: StudySession = {
      id: 's-1',
      discipline: 'Java',
      duration_minutes: 25,
      completed_at: today,
    };
    storageService.saveLocalSessions([session]);

    const { result } = renderHook(() => useStats());
    expect(result.current.metrics.streak.currentStreak).toBe(1);
    expect(result.current.metrics.todayMinutes).toBe(25);
    expect(result.current.metrics.totalPomodoros).toBe(1);
    expect(result.current.metrics.subjectMinutes['Java']).toBe(25);
  });

  it('deve acumular minutos ao adicionar nova sessão concluída', async () => {
    const { result } = renderHook(() => useStats());

    await act(async () => {
      await result.current.addCompletedSession('Python & IA', 25);
    });

    expect(result.current.metrics.todayMinutes).toBe(25);
    expect(result.current.metrics.subjectMinutes['Python & IA']).toBe(25);
  });
});
