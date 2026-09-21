import React from 'react';
import {
  Timer,
  FolderKanban,
  Calendar,
  Users,
  Trophy,
  BarChart2,
  Edit3,
  Layers,
  GitFork,
} from 'lucide-react';
import { AppViewMode, Project } from '@/features/core/types';

interface SidebarNavProps {
  currentView: AppViewMode;
  isCollapsed: boolean;
  projects: Project[];
  handleNavClick: (view: AppViewMode) => void;
  onOpenStats: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentView,
  isCollapsed,
  projects,
  handleNavClick,
  onOpenStats,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <nav className="sidebar-nav">
      <div className="sidebar-nav-section-title">{!isCollapsed ? 'NAVEGAÇÃO' : '•'}</div>

      <button
        className={`sidebar-nav-item ${currentView === 'timer' ? 'active' : ''}`}
        onClick={() => handleNavClick('timer')}
        title="Cronômetro Pomodoro & Foco"
        data-tooltip="Foco"
      >
        <Timer size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Foco</span>}
      </button>

      <button
        className={`sidebar-nav-item ${
          currentView === 'projects' || currentView === 'project-detail' ? 'active' : ''
        }`}
        onClick={() => handleNavClick('projects')}
        title="Projetos e Subtarefas"
        data-tooltip="Projetos"
      >
        <FolderKanban size={18} className="nav-icon" />
        {isCollapsed && projects.length > 0 && (
          <span className="collapsed-mini-badge">{projects.length}</span>
        )}
        {!isCollapsed && (
          <>
            <span className="nav-label">Projetos</span>
            <span className="sidebar-item-badge">{projects.length}</span>
          </>
        )}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'calendar' ? 'active' : ''}`}
        onClick={() => handleNavClick('calendar')}
        title="Calendário e Time-Blocking"
        data-tooltip="Calendário"
      >
        <Calendar size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Calendário</span>}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'groups' ? 'active' : ''}`}
        onClick={() => handleNavClick('groups')}
        title="Grupos de Estudo e Chat"
        data-tooltip="Grupos"
      >
        <Users size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Grupos</span>}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'ranking' ? 'active' : ''}`}
        onClick={() => handleNavClick('ranking')}
        title="Ranking Semanal de Foco"
        data-tooltip="Ranking"
      >
        <Trophy size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Ranking</span>}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'stats' ? 'active' : ''}`}
        onClick={() => {
          onOpenStats();
          if (isMobileOpen) onCloseMobile();
        }}
        title="Relatórios e Estatísticas de Estudo"
        data-tooltip="Estatísticas"
      >
        <BarChart2 size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Estatísticas</span>}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'drafts' ? 'active' : ''}`}
        onClick={() => handleNavClick('drafts')}
        title="Rascunhos & Notas Rápidas"
        data-tooltip="Rascunhos"
      >
        <Edit3 size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Rascunhos</span>}
      </button>

      <div className="sidebar-nav-section-title" style={{ marginTop: '0.75rem' }}>
        {!isCollapsed ? 'APRENDIZADO' : '•'}
      </div>

      <button
        className={`sidebar-nav-item ${currentView === 'flashcards' ? 'active' : ''}`}
        onClick={() => handleNavClick('flashcards')}
        title="Flashcards & Repetição Espaçada"
        data-tooltip="Flashcards"
      >
        <Layers size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Flashcards</span>}
      </button>

      <button
        className={`sidebar-nav-item ${currentView === 'mindmaps' ? 'active' : ''}`}
        onClick={() => handleNavClick('mindmaps')}
        title="Mapas Mentais Interativos"
        data-tooltip="Mapas Mentais"
      >
        <GitFork size={18} className="nav-icon" />
        {!isCollapsed && <span className="nav-label">Mapas Mentais</span>}
      </button>
    </nav>
  );
};
