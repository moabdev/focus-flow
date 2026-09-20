import React from 'react';
import { Plus } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProjectsListProps {
  projects: Project[];
  selectedProjectId?: string | 'todos';
  onSelectProject?: (id: string | 'todos') => void;
  onOpenProjectDetail?: (id: string) => void;
  onCreateProject?: () => void;
  onNavigateProjects: () => void;
  onCloseMobile: () => void;
  isMobileOpen: boolean;
}

export const SidebarProjectsList: React.FC<SidebarProjectsListProps> = ({
  projects,
  selectedProjectId = 'todos',
  onSelectProject,
  onOpenProjectDetail,
  onCreateProject,
  onNavigateProjects,
  onCloseMobile,
  isMobileOpen,
}) => {
  return (
    <div className="sidebar-projects-section">
      <div className="sidebar-projects-header">
        <span className="sidebar-nav-section-title">PROJETOS</span>
        {onCreateProject && (
          <button
            className="sidebar-add-proj-btn"
            onClick={() => {
              onCreateProject();
              if (isMobileOpen) onCloseMobile();
            }}
            title="Criar Novo Projeto"
            aria-label="Criar Novo Projeto"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="sidebar-projects-list">
        {projects.length === 0 ? (
          <div className="sidebar-empty-projects">
            <span>Nenhum projeto</span>
          </div>
        ) : (
          projects.slice(0, 6).map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <button
                key={proj.id}
                className={`sidebar-project-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (onOpenProjectDetail) {
                    onOpenProjectDetail(proj.id);
                  } else {
                    if (onSelectProject) onSelectProject(proj.id);
                    onNavigateProjects();
                  }
                  if (isMobileOpen) onCloseMobile();
                }}
                title={proj.title}
              >
                <span
                  className="project-dot"
                  style={{ backgroundColor: proj.color || 'var(--accent-primary)' }}
                >
                  {proj.icon || '📁'}
                </span>
                <span className="project-name">{proj.title}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
