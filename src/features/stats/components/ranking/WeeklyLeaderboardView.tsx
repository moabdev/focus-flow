import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Flame, Play, Clock, Sparkles } from 'lucide-react';
import { LeaderboardUser } from '@/features/core/types';
import { leaderboardService } from '../../api/leaderboardService';

interface WeeklyLeaderboardViewProps {
  userWeekMinutes?: number;
  currentUserMinutes?: number;
  userTotalPomodoros?: number;
  userStreakDays?: number;
  userName?: string;
  userProfile?: { id?: string; full_name?: string } | null;
  onOpenTimerTab?: () => void;
}



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
  const [rankingData, setRankingData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchRanking = async () => {
      let data: LeaderboardUser[] = [];
      if (filterType === 'geral') {
        data = await leaderboardService.getCommunityRanking();
      } else {
        data = await leaderboardService.getMyGroupsRanking();
      }

      if (isMounted) {
        setRankingData(data);
        setIsLoading(false);
      }
    };

    fetchRanking();

    return () => {
      isMounted = false;
    };
  }, [filterType]);

  const formatSeconds = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Junta os usuários do ranking dinâmico com as métricas reais do usuário atual local
  const rankedUsers = useMemo(() => {
    const currentUserEntry: LeaderboardUser = {
      id: 'current-user',
      name: effectiveName,
      weekly_seconds: actualMinutes * 60,
      pomodoros_completed: userTotalPomodoros,
      streak_days: userStreakDays,
      is_current_user: true,
    };

    // Remove o usuário atual do fetched data para não duplicar, já que temos dados locais mais recentes (is_current_user)
    const filteredData = rankingData.filter(
      (u) => u.name.toLowerCase() !== effectiveName.toLowerCase() && u.id !== userProfile?.id
    );

    const list = [...filteredData, currentUserEntry];
    list.sort((a, b) => b.weekly_seconds - a.weekly_seconds);
    return list;
  }, [rankingData, actualMinutes, userTotalPomodoros, userStreakDays, effectiveName, userProfile]);

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

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Clock size={24} className="animate-spin" style={{ marginRight: '8px' }} />
          <span>Carregando ranking...</span>
        </div>
      ) : (
        <>
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
      </>
      )}
    </div>
  );
};
