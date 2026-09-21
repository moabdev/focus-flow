import React from 'react';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { Project } from '@/features/core/types';

interface ProjectCardHeaderProps {
  project: Project;
  onOpenProjectDetail?: (id: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: () => void;
}

export const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({
  project,
  onOpenProjectDetail,
  onEditProject,
  onDeleteProject,
}) => {
  return (
    <div className="project-card-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        <span
          className="project-icon-badge"
          style={{
            backgroundColor: `${project.color || 'var(--accent-primary)'}18`,
            borderColor: `${project.color || 'var(--accent-primary)'}35`,
          }}
        >
          {project.icon || '📁'}
        </span>
        <div
          className="project-title-wrap"
          onClick={() => onOpenProjectDetail && onOpenProjectDetail(project.id)}
          style={{ cursor: onOpenProjectDetail ? 'pointer' : 'default', minWidth: 0, flex: 1 }}
          title={onOpenProjectDetail ? 'Abrir detalhes do projeto' : undefined}
        >
          <h3 className="project-card-title">{project.title}</h3>
          {project.description && (
            <p className="project-card-desc">{project.description}</p>
          )}
        </div>
      </div>

      <div className="project-card-actions">
        {onOpenProjectDetail && (
          <button
            className="icon-btn"
            onClick={() => onOpenProjectDetail(project.id)}
            title="Abrir página do projeto"
            aria-label="Abrir página do projeto"
          >
            <ExternalLink size={14} />
          </button>
        )}
        <button
          className="icon-btn"
          onClick={() => onEditProject(project)}
          title="Editar Projeto"
          aria-label="Editar Projeto"
        >
          <Edit size={14} />
        </button>
        <button
          className="icon-btn text-danger"
          onClick={onDeleteProject}
          title="Excluir Projeto"
          aria-label="Excluir Projeto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
