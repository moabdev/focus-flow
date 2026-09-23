import '../styles/sidebar.css';
import '../styles/sidebar-widgets.css';
import React, { useState } from 'react';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Project, AmbientSound, ColorMode, SupabaseProfile, AppViewMode } from '@/features/core/types';
import { SidebarProjectsList } from './sidebar/SidebarProjectsList';
import { SidebarUserProfile } from './sidebar/SidebarUserProfile';
import { SidebarQuickTools } from './sidebar/SidebarQuickTools';
import { SidebarNav } from './sidebar/SidebarNav';

interface SidebarProps {
  currentView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  streakDays: number;
  projects: Project[];
  selectedProjectId?: string | 'todos';
  onSelectProject?: (id: string | 'todos') => void;
  onOpenProjectDetail?: (id: string) => void;
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

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  currentView,
  onChangeView,
  streakDays,
  projects,
  selectedProjectId = 'todos',
  onSelectProject,
  onOpenProjectDetail,
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
  onEnterZenMode,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavClick = (view: AppViewMode) => {
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
            title={streakDays > 0 ? `${streakDays} dias de ofensiva de estudos` : 'Ver ofensiva de estudos e métricas'}
            data-tooltip={streakDays > 0 ? `${streakDays} dias de ofensiva` : 'Ofensiva de estudos'}
          >
            <Flame size={18} className="streak-flame-icon" />
            {isCollapsed && streakDays > 0 && (
              <span className="collapsed-streak-pill">{streakDays}</span>
            )}
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

        <SidebarNav
          currentView={currentView}
          isCollapsed={isCollapsed}
          projects={projects}
          handleNavClick={handleNavClick}
          onOpenStats={onOpenStats}
          isMobileOpen={isMobileOpen}
          onCloseMobile={onCloseMobile}
        />

        {/* Seção de Atalhos Rápidos para Projetos */}
        {!isCollapsed && (
          <SidebarProjectsList
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
            onOpenProjectDetail={onOpenProjectDetail}
            onCreateProject={onCreateProject}
            onNavigateProjects={() => handleNavClick('projects')}
            onCloseMobile={onCloseMobile}
            isMobileOpen={isMobileOpen}
          />
        )}

        <div style={{ flex: 1 }} />

        {/* Rodapé da Sidebar */}
        <div className="sidebar-footer">
          <SidebarQuickTools
            colorMode={colorMode}
            onToggleColorMode={onToggleColorMode}
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            onSelectAmbient={onSelectAmbient}
            onSetAmbientVolume={onSetAmbientVolume}
            showAmbientMenu={showAmbientMenu}
            onToggleAmbientMenu={() => setShowAmbientMenu(!showAmbientMenu)}
            onCloseAmbientMenu={() => setShowAmbientMenu(false)}
            onEnterZenMode={onEnterZenMode}
            onOpenSettings={onOpenSettings}
            onCloseMobile={onCloseMobile}
            isMobileOpen={isMobileOpen}
          />

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
});

