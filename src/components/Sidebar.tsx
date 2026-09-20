import React, { useState } from 'react';
import {
  Timer,
  FolderKanban,
  Calendar,
  BarChart2,
  Edit3,
  Flame,
  Sun,
  Moon,
  Maximize2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Project, AmbientSound, ColorMode, SupabaseProfile } from '../types';
import { SidebarProjectsList } from './sidebar/SidebarProjectsList';
import { SidebarAmbientMenu } from './sidebar/SidebarAmbientMenu';
import { SidebarUserProfile } from './sidebar/SidebarUserProfile';

interface SidebarProps {
  currentView: 'timer' | 'projects' | 'calendar';
  onChangeView: (view: 'timer' | 'projects' | 'calendar') => void;
  streakDays: number;
  projects: Project[];
  selectedProjectId?: string | 'todos';
  onSelectProject?: (id: string | 'todos') => void;
  onCreateProject?: () => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  ambientSound: AmbientSound;
  ambientVolume: number;
  onSelectAmbient: (snd: AmbientSound) => void;
  onSetAmbientVolume: (vol: number) => void;
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onOpenSettings: (tab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup') => void;
  onOpenStats: () => void;
  onToggleScratchpad: () => void;
  onEnterZenMode: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  streakDays,
  projects,
  selectedProjectId = 'todos',
  onSelectProject,
  onCreateProject,
  colorMode,
  onToggleColorMode,
  ambientSound,
  ambientVolume,
  onSelectAmbient,
  onSetAmbientVolume,
  userProfile,
  onGoogleLogin,
  onSignOut,
  onOpenSettings,
  onOpenStats,
  onToggleScratchpad,
  onEnterZenMode,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavClick = (view: 'timer' | 'projects' | 'calendar') => {
    onChangeView(view);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop para mobile drawer */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-label="Fechar menu lateral"
        />
      )}

      <aside
        className={`app-sidebar glass-panel ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Navegação Lateral Principal"
      >
        {/* Topo da Sidebar: Logo & Botão de Recolher */}
        <div className="sidebar-header">
          <div
            className="sidebar-brand"
            onClick={() => handleNavClick('timer')}
            title="FocusFlow - Início"
          >
            <img src="/logo.png" alt="FocusFlow" className="sidebar-logo-img" />
            {!isCollapsed && <span className="sidebar-brand-title">FocusFlow</span>}
          </div>

          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Fechar barra lateral"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge de Streak de Estudos */}
        <div className="sidebar-streak-wrap">
          <button
            className="sidebar-streak-badge"
            onClick={() => {
              onOpenStats();
              if (isMobileOpen) onCloseMobile();
            }}
            title="Ver ofensiva de estudos e métricas"
          >
            <Flame size={18} className="streak-flame-icon" />
            {!isCollapsed && (
              <div className="streak-info-text">
                <span className="streak-days-count">
                  {streakDays} {streakDays === 1 ? 'Dia' : 'Dias'}
                </span>
                <span className="streak-days-sub">Ofensiva ativa</span>
              </div>
            )}
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-title">{!isCollapsed ? 'NAVEGAÇÃO' : '•'}</div>

          <button
            className={`sidebar-nav-item ${currentView === 'timer' ? 'active' : ''}`}
            onClick={() => handleNavClick('timer')}
            title="Cronômetro Pomodoro & Foco"
          >
            <Timer size={18} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Foco</span>}
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => handleNavClick('projects')}
            title="Projetos e Subtarefas"
          >
            <FolderKanban size={18} className="nav-icon" />
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
          >
            <Calendar size={18} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Calendário</span>}
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => {
              onOpenStats();
              if (isMobileOpen) onCloseMobile();
            }}
            title="Relatórios e Estatísticas de Estudo"
          >
            <BarChart2 size={18} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Estatísticas</span>}
          </button>

          <button
            className="sidebar-nav-item"
            onClick={() => {
              onToggleScratchpad();
              if (isMobileOpen) onCloseMobile();
            }}
            title="Bloco de Notas Rápidas (Scratchpad)"
          >
            <Edit3 size={18} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Rascunho</span>}
          </button>
        </nav>

        {/* Seção de Atalhos Rápidos para Projetos */}
        {!isCollapsed && (
          <SidebarProjectsList
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onNavigateProjects={() => handleNavClick('projects')}
            onCloseMobile={onCloseMobile}
            isMobileOpen={isMobileOpen}
          />
        )}

        <div style={{ flex: 1 }} />

        {/* Rodapé da Sidebar */}
        <div className="sidebar-footer">
          <div className="sidebar-quick-tools">
            <SidebarAmbientMenu
              ambientSound={ambientSound}
              ambientVolume={ambientVolume}
              onSelectAmbient={onSelectAmbient}
              onSetAmbientVolume={onSetAmbientVolume}
              isOpen={showAmbientMenu}
              onToggleOpen={() => setShowAmbientMenu(!showAmbientMenu)}
              onClose={() => setShowAmbientMenu(false)}
            />

            <button
              className="icon-btn"
              onClick={onToggleColorMode}
              title={`Alternar para modo ${colorMode === 'dark' ? 'Claro' : 'Escuro'}`}
              aria-label="Alternar tema de cores"
            >
              {colorMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              className="icon-btn"
              onClick={() => {
                onEnterZenMode();
                if (isMobileOpen) onCloseMobile();
              }}
              title="Modo Zen (Tela Cheia)"
              aria-label="Modo Zen"
            >
              <Maximize2 size={17} />
            </button>

            <button
              className="icon-btn"
              onClick={() => {
                onOpenSettings();
                if (isMobileOpen) onCloseMobile();
              }}
              title="Configurações"
              aria-label="Configurações"
            >
              <Settings size={17} />
            </button>
          </div>

          <SidebarUserProfile
            userProfile={userProfile}
            isCollapsed={isCollapsed}
            isOpen={showUserMenu}
            onToggleOpen={() => setShowUserMenu(!showUserMenu)}
            onClose={() => setShowUserMenu(false)}
            onGoogleLogin={onGoogleLogin}
            onSignOut={onSignOut}
            onOpenSettings={onOpenSettings}
            onCloseMobile={onCloseMobile}
            isMobileOpen={isMobileOpen}
          />
        </div>
      </aside>
    </>
  );
};
