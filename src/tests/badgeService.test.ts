import { describe, it, expect, beforeEach } from 'vitest';
import { badgeService, BADGE_DEFINITIONS } from '../services/badgeService';
import { StudyMetrics } from '../types';

describe('BadgeService (Gamificação & Conquistas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const emptyMetrics: StudyMetrics = {
    todayMinutes: 0,
    weekMinutes: 0,
    totalPomodoros: 0,
    subjectMinutes: {},
    history: [],
    streak: {
      currentStreak: 0,
      bestStreak: 0,
      lastStudyDate: null,
    },
  };

  it('deve retornar todas as definições de conquistas com progresso inicial zero', () => {
    const badges = badgeService.getBadges(emptyMetrics, 0);
    expect(badges.length).toBe(BADGE_DEFINITIONS.length);
    expect(badges.every((b) => !b.unlocked)).toBe(true);
    expect(badges.every((b) => b.progress === 0)).toBe(true);
  });

  it('deve desbloquear a primeira conquista após 1 pomodoro', () => {
    const metricsWithPomodoro: StudyMetrics = {
      ...emptyMetrics,
      totalPomodoros: 1,
    };

    const badges = badgeService.getBadges(metricsWithPomodoro, 0);
    const firstStep = badges.find((b) => b.id === 'first_pomodoro');
    expect(firstStep).toBeDefined();
    expect(firstStep?.unlocked).toBe(true);
    expect(firstStep?.progress).toBe(100);
  });

  it('deve notificar e persistir novas conquistas com checkAndClaimNewBadges', () => {
    const metrics: StudyMetrics = {
      ...emptyMetrics,
      totalPomodoros: 5,
      streak: { currentStreak: 3, bestStreak: 3, lastStudyDate: '2026-09-20' },
    };

    const claimed = badgeService.checkAndClaimNewBadges(metrics, 10);
    expect(claimed.length).toBeGreaterThan(0);

    const ids = claimed.map((b) => b.id);
    expect(ids).toContain('first_pomodoro');
    expect(ids).toContain('productive_flow');
    expect(ids).toContain('streak_3');
    expect(ids).toContain('tasks_master');

    // Segunda checagem não deve duplicar conquistas já reivindicadas
    const secondCheck = badgeService.checkAndClaimNewBadges(metrics, 10);
    expect(secondCheck.length).toBe(0);
  });
});
