import { AchievementBadge, StudyMetrics } from '@/features/core/types';

const STORAGE_KEYS = {
  UNLOCKED_BADGES: 'focusflow_unlocked_badges',
};

interface StoredBadgeRecord {
  id: string;
  unlocked_at: string;
}

export const BADGE_DEFINITIONS: Array<
  Omit<AchievementBadge, 'unlocked' | 'unlocked_at' | 'progress' | 'current_value'> & {
    evaluator: (params: {
      metrics: StudyMetrics;
      completedTasksCount: number;
    }) => number;
  }
> = [
  {
    id: 'first_pomodoro',
    title: 'Primeiro Passo',
    description: 'Conclua seu primeiro ciclo de Pomodoro.',
    icon: '🌱',
    tier: 'bronze',
    target_value: 1,
    unit: 'pomodoro',
    evaluator: ({ metrics }) => metrics.totalPomodoros,
  },
  {
    id: 'productive_flow',
    title: 'Ritmo Produtivo',
    description: 'Conclua 5 ciclos de foco com sucesso.',
    icon: '⚡',
    tier: 'bronze',
    target_value: 5,
    unit: 'pomodoros',
    evaluator: ({ metrics }) => metrics.totalPomodoros,
  },
  {
    id: 'focus_dedicated',
    title: 'Foco Dedicado',
    description: 'Atinja a marca de 25 pomodoros finalizados.',
    icon: '🎯',
    tier: 'prata',
    target_value: 25,
    unit: 'pomodoros',
    evaluator: ({ metrics }) => metrics.totalPomodoros,
  },
  {
    id: 'focus_master',
    title: 'Mestre do Foco',
    description: 'Conclua 50 pomodoros de alta concentração.',
    icon: '🏆',
    tier: 'ouro',
    target_value: 50,
    unit: 'pomodoros',
    evaluator: ({ metrics }) => metrics.totalPomodoros,
  },
  {
    id: 'productivity_legend',
    title: 'Lenda da Produtividade',
    description: 'Alcance a maestria de 100 ciclos de foco.',
    icon: '👑',
    tier: 'diamante',
    target_value: 100,
    unit: 'pomodoros',
    evaluator: ({ metrics }) => metrics.totalPomodoros,
  },
  {
    id: 'streak_3',
    title: 'Chama Acesa',
    description: 'Mantenha 3 dias seguidos de ofensiva nos estudos.',
    icon: '🔥',
    tier: 'bronze',
    target_value: 3,
    unit: 'dias',
    evaluator: ({ metrics }) => Math.max(metrics.streak.currentStreak, metrics.streak.bestStreak),
  },
  {
    id: 'streak_7',
    title: 'Semana Perfeita',
    description: 'Complete 7 dias consecutivos com pelo menos 1 ciclo diário.',
    icon: '🌟',
    tier: 'prata',
    target_value: 7,
    unit: 'dias',
    evaluator: ({ metrics }) => Math.max(metrics.streak.currentStreak, metrics.streak.bestStreak),
  },
  {
    id: 'streak_21',
    title: 'Hábito Inabalável',
    description: 'Atingir 21 dias seguidos: a consolidação de um novo hábito.',
    icon: '🛡️',
    tier: 'ouro',
    target_value: 21,
    unit: 'dias',
    evaluator: ({ metrics }) => Math.max(metrics.streak.currentStreak, metrics.streak.bestStreak),
  },
  {
    id: 'streak_30',
    title: 'Muralha de Ferro',
    description: '30 dias seguidos de disciplina ininterrupta.',
    icon: '💎',
    tier: 'diamante',
    target_value: 30,
    unit: 'dias',
    evaluator: ({ metrics }) => Math.max(metrics.streak.currentStreak, metrics.streak.bestStreak),
  },
  {
    id: 'marathon_10h',
    title: 'Maratonista Mental',
    description: 'Acumule mais de 10 horas totais (600 minutos) de foco.',
    icon: '⏱️',
    tier: 'prata',
    target_value: 600,
    unit: 'minutos',
    evaluator: ({ metrics }) => {
      const historyMins = metrics.history.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      return Math.max(historyMins, metrics.todayMinutes + metrics.weekMinutes);
    },
  },
  {
    id: 'centurion_50h',
    title: 'Centurião dos Estudos',
    description: 'Acumule 50 horas totais (3.000 minutos) imersos em conhecimento.',
    icon: '🏛️',
    tier: 'ouro',
    target_value: 3000,
    unit: 'minutos',
    evaluator: ({ metrics }) => {
      return metrics.history.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    },
  },
  {
    id: 'tasks_master',
    title: 'Executor Implacável',
    description: 'Conclua pelo menos 10 subtarefas ou tarefas em seus projetos.',
    icon: '✅',
    tier: 'prata',
    target_value: 10,
    unit: 'tarefas',
    evaluator: ({ completedTasksCount }) => completedTasksCount,
  },
];

class BadgeService {
  private getStoredUnlocks(): Record<string, string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNLOCKED_BADGES);
      if (!data) return {};
      const list: StoredBadgeRecord[] = JSON.parse(data);
      const map: Record<string, string> = {};
      list.forEach((item) => {
        map[item.id] = item.unlocked_at;
      });
      return map;
    } catch {
      return {};
    }
  }

  private saveStoredUnlocks(map: Record<string, string>): void {
    try {
      const list: StoredBadgeRecord[] = Object.entries(map).map(([id, unlocked_at]) => ({
        id,
        unlocked_at,
      }));
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(list));
    } catch {}
  }

  public getBadges(metrics: StudyMetrics, completedTasksCount: number = 0): AchievementBadge[] {
    const unlocks = this.getStoredUnlocks();

    return BADGE_DEFINITIONS.map((def) => {
      const current_value = def.evaluator({ metrics, completedTasksCount });
      const progress = Math.min(100, Math.round((current_value / def.target_value) * 100));
      const previouslyUnlockedAt = unlocks[def.id];
      const isNowUnlocked = current_value >= def.target_value;

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        tier: def.tier,
        unlocked: Boolean(previouslyUnlockedAt || isNowUnlocked),
        unlocked_at: previouslyUnlockedAt || (isNowUnlocked ? new Date().toISOString() : undefined),
        progress,
        current_value,
        target_value: def.target_value,
        unit: def.unit,
      };
    });
  }

  public checkAndClaimNewBadges(
    metrics: StudyMetrics,
    completedTasksCount: number = 0
  ): AchievementBadge[] {
    const unlocks = this.getStoredUnlocks();
    const newlyUnlocked: AchievementBadge[] = [];
    let hasChanges = false;

    BADGE_DEFINITIONS.forEach((def) => {
      if (unlocks[def.id]) return; // Já desbloqueado anteriormente

      const current_value = def.evaluator({ metrics, completedTasksCount });
      if (current_value >= def.target_value) {
        const now = new Date().toISOString();
        unlocks[def.id] = now;
        hasChanges = true;

        newlyUnlocked.push({
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          tier: def.tier,
          unlocked: true,
          unlocked_at: now,
          progress: 100,
          current_value,
          target_value: def.target_value,
          unit: def.unit,
        });
      }
    });

    if (hasChanges) {
      this.saveStoredUnlocks(unlocks);
    }

    return newlyUnlocked;
  }

  public clearBadges(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.UNLOCKED_BADGES);
    } catch {}
  }
}

export const badgeService = new BadgeService();
