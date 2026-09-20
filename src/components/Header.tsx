import React from 'react';
import {
  Flame,
  Sun,
  Moon,
  Menu,
  Timer,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ColorMode, SupabaseProfile, AppViewMode } from '../types';
import { HeaderUserMenu } from './header/HeaderUserMenu';

interface HeaderProps {
  streakDays: number;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onOpenSettings: (tab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup') => void;
  onOpenStats: () => void;
  onOpenCommandPalette?: () => void;
  currentView: AppViewMode;
  activeProjectTitle?: string;
  isTimerRunning?: boolean;
  timerFormattedTime?: string;
  activeTaskTitle?: string;
  onOpenTimerTab?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakDays,
  colorMode,
  onToggleColorMode,
  userProfile,
  onGoogleLogin,
  onSignOut,
  onOpenSettings,
  onOpenStats,
  onOpenCommandPalette,
  currentView,
  activeProjectTitle,
  isTimerRunning = false,
  timerFormattedTime = '25:00',
  activeTaskTitle,
  onOpenTimerTab,
  onOpenMobileSidebar,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'timer':
        return 'Foco & Pomodoro';
      case 'projects':
        return 'Projetos & Tarefas';
      case 'project-detail':
        return activeProjectTitle ? `Projetos > ${activeProjectTitle}` : 'Detalhes do Projeto';
      case 'calendar':
        return 'Calendário & Time-Blocking';
      case 'groups':
        return 'Grupos de Estudo & Chat';
      case 'ranking':
        return 'Ranking Semanal de Estudos';
      case 'drafts':
        return 'Rascunhos & Notas Rápidas';
      default:
        return 'FocusFlow';
    }
  };

  return (
    <header className="app-header">
      {/* Esquerda: Menu Mobile e Breadcrumbs de Navegação */}
      <div className="brand-section">
        {onOpenMobileSidebar && (
          <button
            className="mobile-sidebar-toggle"
            onClick={onOpenMobileSidebar}
            title="Abrir menu lateral"
            aria-label="Abrir menu lateral"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="brand-logo">
          <img src="/logo.png" alt="FocusFlow" className="brand-logo-img" />
          <span>FocusFlow</span>
        </div>

        <div className="header-breadcrumbs" aria-current="page">
          <span className="header-breadcrumb-root">FocusFlow</span>
          <ChevronRight size={14} className="header-breadcrumb-arrow" />
          <span className="header-breadcrumb-current">{getViewTitle()}</span>
        </div>
      </div>

      {/* Centro: Indicador de Foco Ativo ao Vivo */}
      <div className="header-center-widget">
        {isTimerRunning ? (
          <button
            className="header-live-focus-chip active"
            onClick={onOpenTimerTab}
            title="Sessão de foco ativa - clique para ir ao timer"
          >
            <span className="live-pulse-dot" />
            <Timer size={15} />
            <span className="live-focus-time">{timerFormattedTime}</span>
            {activeTaskTitle && (
              <span className="live-focus-task">• {activeTaskTitle}</span>
            )}
          </button>
        ) : (
          <div className="header-idle-status">
            <span>Produtividade & Foco Contínuo</span>
          </div>
        )}
      </div>

      {/* Direita: Ofensiva, Alternador Dark/Light e Perfil */}
      <div className="nav-actions">
        {onOpenCommandPalette && (
          <button
            className="header-command-btn"
            onClick={onOpenCommandPalette}
            title="Abrir busca rápida e comandos (Ctrl+K)"
            aria-label="Abrir busca rápida"
          >
            <Search size={14} />
            <span className="header-command-btn-text">Buscar...</span>
            <kbd className="header-command-kbd">Ctrl K</kbd>
          </button>
        )}

        <button
          className="streak-badge"
          onClick={onOpenStats}
          title="Ver estatísticas de estudo e ofensiva diária"
        >
          <Flame size={16} />
          <span className="streak-badge-count">{streakDays}</span>
          <span className="streak-badge-label">{streakDays === 1 ? 'Dia' : 'Dias'}</span>
        </button>

        {/* Alternador Dark / Light Mode */}
        <button
          className="icon-btn"
          onClick={onToggleColorMode}
          title={`Alternar para modo ${colorMode === 'dark' ? 'Claro' : 'Escuro'}`}
          aria-label="Alternar tema de cores"
        >
          {colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Perfil do Usuário & Autenticação Google */}
        <HeaderUserMenu
          userProfile={userProfile}
          onGoogleLogin={onGoogleLogin}
          onSignOut={onSignOut}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
};
