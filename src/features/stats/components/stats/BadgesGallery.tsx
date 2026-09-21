import React from 'react';
import { Trophy, CheckCircle2, Lock } from 'lucide-react';
import { AchievementBadge } from '@/features/core/types';

interface BadgesGalleryProps {
  badges: AchievementBadge[];
}

export const BadgesGallery: React.FC<BadgesGalleryProps> = ({ badges }) => {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="badges-gallery">
      <div className="badges-header">
        <div className="badges-title">
          <Trophy size={18} color="var(--accent-primary)" />
          <span>Conquistas & Medalhas</span>
        </div>
        <span className="badges-count-badge">
          {unlockedCount} de {badges.length} Desbloqueadas
        </span>
      </div>

      <div className="badges-grid">
        {badges.map((badge) => {
          const unlockedDateStr = badge.unlocked_at
            ? new Date(badge.unlocked_at).toLocaleDateString('pt-BR')
            : null;

          return (
            <div
              key={badge.id}
              className={`badge-card tier-${badge.tier} ${badge.unlocked ? 'unlocked' : 'locked'}`}
              title={badge.description}
            >
              <div className="badge-card-top">
                <div className="badge-icon-box">
                  {badge.icon}
                </div>
                <div className="badge-meta">
                  <div className="badge-name">{badge.title}</div>
                  <span className="badge-tier-tag">{badge.tier}</span>
                </div>
              </div>

              <div className="badge-desc">{badge.description}</div>

              <div className="badge-progress-wrap">
                <div className="badge-progress-bar-bg">
                  <div
                    className="badge-progress-bar-fill"
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
                <div className="badge-progress-labels">
                  {badge.unlocked ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 600 }}>
                      <CheckCircle2 size={11} /> Conquistado {unlockedDateStr ? `(${unlockedDateStr})` : ''}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Lock size={10} /> {badge.current_value} / {badge.target_value} {badge.unit}
                    </span>
                  )}
                  <span>{badge.progress}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
