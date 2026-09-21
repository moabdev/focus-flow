import React from 'react';
import { Calendar, Clock, CheckCircle2, Play, Trash2 } from 'lucide-react';
import { Project } from '@/features/core/types';

interface ProjectHeroCardProps {
  project: Project;
  totalProjectTimeSpent: number;
  completedCount: number;
  totalSubtasks: number;
  progressPercent: number;
  onOpenTimerTab?: () => void;
  onDeleteProject?: () => void;
}

export const ProjectHeroCard: React.FC<ProjectHeroCardProps> = ({
  project,
  totalProjectTimeSpent,
  completedCount,
  totalSubtasks,
  progressPercent,
  onOpenTimerTab,
  onDeleteProject,
}) => {
  const formatTime = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '0 min';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="project-detail-hero glass-panel" style={{ borderLeftColor: project.color }}>
      <div className="project-hero-header">
        <div className="project-hero-identity">
          <span className="project-hero-icon" style={{ backgroundColor: `${project.color}22` }}>
            {project.icon || '📁'}
          </span>
          <div>
            <h1 className="project-hero-title">{project.title}</h1>
            {project.description && <p className="project-hero-desc">{project.description}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {onOpenTimerTab && (
            <button className="project-focus-btn" onClick={onOpenTimerTab} title="Focar neste projeto no Cronômetro">
              <Play size={16} fill="currentColor" /> Focar Agora
            </button>
          )}
          {onDeleteProject && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: '0.65rem 1rem', fontSize: '0.86rem' }}
              onClick={onDeleteProject}
              title="Excluir este projeto"
            >
              <Trash2 size={15} />
              <span>Excluir</span>
            </button>
          )}
        </div>
      </div>

      <div className="project-hero-meta-grid">
        {(project.start_date || project.end_date) && (
          <div className="hero-meta-pill">
            <Calendar size={14} />
            <span>
              {project.start_date || 'Início'} → {project.end_date || 'Sem prazo'}
            </span>
          </div>
        )}
        <div className="hero-meta-pill">
          <Clock size={14} />
          <span>Tempo Investido: {formatTime(totalProjectTimeSpent)}</span>
        </div>
        <div className="hero-meta-pill">
          <CheckCircle2 size={14} />
          <span>
            {completedCount} de {totalSubtasks} subtarefas concluídas ({progressPercent}%)
          </span>
        </div>
      </div>

      <div className="project-hero-progress-track">
        <div
          className="project-hero-progress-fill"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: project.color || 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
};
