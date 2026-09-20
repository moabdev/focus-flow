import React, { useState, useMemo } from 'react';
import { Trophy, Flame, Play, Clock, Sparkles } from 'lucide-react';
import { LeaderboardUser } from '../../types';

interface WeeklyLeaderboardViewProps {
  userWeekMinutes?: number;
  currentUserMinutes?: number;
  userTotalPomodoros?: number;
  userStreakDays?: number;
  userName?: string;
  userProfile?: { full_name?: string } | null;
  onOpenTimerTab?: () => void;
}

const SEED_COMMUNITY_USERS: LeaderboardUser[] = [
  {
    id: 'u-1',
    name: 'Renata Delegada',
    weekly_seconds: 64800, // 18h
    pomodoros_completed: 36,
    streak_days: 21,
  },
  {
    id: 'u-2',
    name: 'Lucas Code',
    weekly_seconds: 52200, // 14.5h
    pomodoros_completed: 29,
    streak_days: 14,
  },
  {
    id: 'u-3',
    name: 'Dra. Beatriz',
    weekly_seconds: 43200, // 12h
    pomodoros_completed: 24,
    streak_days: 10,
  },
  {
    id: 'u-4',
    name: 'Mariana Concursos',
    weekly_seconds: 37800, // 10.5h
    pomodoros_completed: 21,
    streak_days: 8,
  },
  {
    id: 'u-5',
    name: 'Carlos OAB',
    weekly_seconds: 32400, // 9h
    pomodoros_completed: 18,
    streak_days: 7,
  },
  {
    id: 'u-6',
    name: 'Gabriel DevOps',
    weekly_seconds: 27000, // 7.5h
    pomodoros_completed: 15,
    streak_days: 5,
  },
];

export const WeeklyLeaderboardView: React.FC<WeeklyLeaderboardViewProps> = ({
  userWeekMinutes = 0,
  currentUserMinutes,
  userTotalPomodoros = 0,
  userStreakDays = 0,
  userName,
  userProfile,
  onOpenTimerTab,
}) => {
  const actualMinutes = currentUserMinutes !== undefined ? currentUserMinutes : userWeekMinutes;
  const effectiveName = userName || userProfile?.full_name || 'Você';
  const [filterType, setFilterType] = useState<'geral' | 'grupos'>('geral');

  const formatSeconds = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Junta os usuários da comunidade com as métricas reais do usuário atual
  const rankedUsers = useMemo(() => {
    const currentUserEntry: LeaderboardUser = {
      id: 'current-user',
      name: effectiveName,
      weekly_seconds: actualMinutes * 60,
      pomodoros_completed: userTotalPomodoros,
      streak_days: userStreakDays,
      is_current_user: true,
    };

    const list = [...SEED_COMMUNITY_USERS, currentUserEntry];
    list.sort((a, b) => b.weekly_seconds - a.weekly_seconds);
    return list;
  }, [actualMinutes, userTotalPomodoros, userStreakDays, effectiveName]);

  const top1 = rankedUsers[0];
  const top2 = rankedUsers[1];
  const top3 = rankedUsers[2];
  const restUsers = rankedUsers.slice(3);

  return (
    <div className="ranking-view-container">
      {/* Header do Ranking */}
      <div className="ranking-header-bar">
        <div>
          <h2 className="pm-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={26} color="#f59e0b" />
            Ranking Semanal de Foco
          </h2>
          <p className="pm-subtitle">
            Classificação baseada nas horas reais dedicadas em sessões de Pomodoro esta semana.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="ranking-reset-badge">
            <Clock size={13} />
            <span>Reinicia no Domingo às 23:59</span>
          </div>

          <div className="pm-status-filters">
            <button
              className={`filter-chip ${filterType === 'geral' ? 'active' : ''}`}
              onClick={() => setFilterType('geral')}
            >
              Comunidade Geral
            </button>
            <button
              className={`filter-chip ${filterType === 'grupos' ? 'active' : ''}`}
              onClick={() => setFilterType('grupos')}
            >
              Meus Grupos
            </button>
          </div>
        </div>
      </div>

      {/* Pódio Visual Top 3 */}
      <div className="ranking-podium-grid">
        {/* 2º Lugar */}
        {top2 && (
          <div className="podium-card second rank-2 glass-panel">
            <span className="podium-medal">🥈</span>
            <div className="podium-avatar">{top2.name.charAt(0)}</div>
            <div className="podium-name">{top2.name}</div>
            <div className="podium-time">{formatSeconds(top2.weekly_seconds)}</div>
            <div className="podium-stats">{top2.pomodoros_completed} ciclos • 🔥 {top2.streak_days}d</div>
          </div>
        )}

        {/* 1º Lugar */}
        {top1 && (
          <div className="podium-card first rank-1 glass-panel">
            <span className="podium-medal">🥇</span>
            <div className="podium-avatar" style={{ borderColor: '#f59e0b', boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)' }}>
              {top1.name.charAt(0)}
            </div>
            <div className="podium-name" style={{ fontSize: '1.15rem' }}>{top1.name}</div>
            <div className="podium-time" style={{ fontSize: '1.35rem', color: '#f59e0b' }}>
              {formatSeconds(top1.weekly_seconds)}
            </div>
            <div className="podium-stats">{top1.pomodoros_completed} ciclos • 🔥 {top1.streak_days}d</div>
          </div>
        )}

        {/* 3º Lugar */}
        {top3 && (
          <div className="podium-card third rank-3 glass-panel">
            <span className="podium-medal">🥉</span>
            <div className="podium-avatar">{top3.name.charAt(0)}</div>
            <div className="podium-name">{top3.name}</div>
            <div className="podium-time">{formatSeconds(top3.weekly_seconds)}</div>
            <div className="podium-stats">{top3.pomodoros_completed} ciclos • 🔥 {top3.streak_days}d</div>
          </div>
        )}
      </div>

      {/* Tabela de Classificação da Comunidade */}
      <div className="ranking-table-panel ranking-table-card glass-panel">
        <div className="ranking-table-header">
          <span>Pos.</span>
          <span>Usuário</span>
          <span>Tempo Semanal</span>
          <span>Ofensiva</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {restUsers.map((user, idx) => {
            const position = idx + 4;

            return (
              <div
                key={user.id}
                className={`ranking-row ${user.is_current_user ? 'current-user' : ''}`}
              >
                <div className="ranking-position">#{position}</div>

                <div className="ranking-user-info">
                  <div className="ranking-user-avatar">{user.name.charAt(0)}</div>
                  <div className="ranking-user-name">
                    <span>{user.name}</span>
                    {user.is_current_user && <span className="you-tag">VOCÊ</span>}
                  </div>
                </div>

                <div className="ranking-time-col">
                  {formatSeconds(user.weekly_seconds)}
                </div>

                <div className="ranking-meta-col">
                  <Flame size={14} color="#ff6b00" />
                  <span>{user.streak_days} dias ({user.pomodoros_completed} poms)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action para iniciar o Timer */}
        {onOpenTimerTab && (
          <div className="ranking-cta-box">
            <span className="ranking-cta-text">
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-primary)', flexShrink: 0 }} />
              Deseja subir no ranking desta semana? Complete um ciclo de Pomodoro agora!
            </span>
            <button className="btn btn-primary ranking-cta-btn" onClick={onOpenTimerTab}>
              <Play size={14} /> Focar Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
