import React from 'react';
import {
  Flame,
  Sun,
  Moon,
  Settings,
  BarChart2,
  Edit3,
  Maximize2,
  Timer,
  FolderKanban,
  Calendar,
  Menu,
} from 'lucide-react';
import { AmbientSound, ColorMode, SupabaseProfile } from '../types';
import { HeaderAmbientMenu } from './header/HeaderAmbientMenu';
import { HeaderUserMenu } from './header/HeaderUserMenu';

interface HeaderProps {
  streakDays: number;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  ambientSound: AmbientSound;
  ambientVolume: number;
  onSelectAmbient: (sound: AmbientSound) => void;
  onSetAmbientVolume: (vol: number) => void;
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onOpenSettings: (tab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup') => void;
  onOpenStats: () => void;
  onToggleScratchpad: () => void;
  onEnterZenMode: () => void;
  currentView: 'timer' | 'projects' | 'calendar';
  onChangeView: (view: 'timer' | 'projects' | 'calendar') => void;
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakDays,
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
  currentView,
  onChangeView,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="app-header">
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

        <button
          className="streak-badge"
          onClick={onOpenStats}
          title="Ver estatísticas de estudo e ofensiva diária"
        >
          <Flame size={16} />
          <span>{streakDays} {streakDays === 1 ? 'Dia' : 'Dias'}</span>
        </button>
      </div>

      {/* Abas de Navegação Central: Foco, Projetos e Calendário */}
      <nav className="header-view-tabs" aria-label="Navegação de Visualizações">
        <button
          className={`header-view-tab ${currentView === 'timer' ? 'active' : ''}`}
          onClick={() => onChangeView('timer')}
          title="Cronômetro Pomodoro e Foco"
        >
          <Timer size={16} />
          <span>Foco</span>
        </button>
        <button
          className={`header-view-tab ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => onChangeView('projects')}
          title="Projetos e Subtarefas"
        >
          <FolderKanban size={16} />
          <span>Projetos</span>
        </button>
        <button
          className={`header-view-tab ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => onChangeView('calendar')}
          title="Calendário e Time-Blocking"
        >
          <Calendar size={16} />
          <span>Calendário</span>
        </button>
      </nav>

      <div className="nav-actions">
        {/* Dropdown de Som Ambiente */}
        <HeaderAmbientMenu
          ambientSound={ambientSound}
          ambientVolume={ambientVolume}
          onSelectAmbient={onSelectAmbient}
          onSetAmbientVolume={onSetAmbientVolume}
        />

        {/* Alternador Dark / Light Mode */}
        <button
          className="icon-btn"
          onClick={onToggleColorMode}
          title={`Alternar para modo ${colorMode === 'dark' ? 'Claro' : 'Escuro'}`}
          aria-label="Alternar tema de cores"
        >
          {colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Botão de Estatísticas */}
        <button
          className="icon-btn"
          onClick={onOpenStats}
          title="Relatórios e Estatísticas"
          aria-label="Abrir Estatísticas"
        >
          <BarChart2 size={18} />
        </button>

        {/* Botão de Rascunho / Scratchpad */}
        <button
          className="icon-btn"
          onClick={onToggleScratchpad}
          title="Notas Rápidas (Scratchpad)"
          aria-label="Abrir Notas Rápidas"
        >
          <Edit3 size={18} />
        </button>

        {/* Modo Zen */}
        <button
          className="icon-btn"
          onClick={onEnterZenMode}
          title="Modo Zen (Foco Total em Tela Cheia)"
          aria-label="Ativar Modo Zen"
        >
          <Maximize2 size={18} />
        </button>

        {/* Opção de Login Visível ou Menu de Usuário Conectado */}
        <HeaderUserMenu
          userProfile={userProfile}
          onGoogleLogin={onGoogleLogin}
          onSignOut={onSignOut}
          onOpenSettings={onOpenSettings}
        />

        {/* Configurações */}
        <button
          className="icon-btn"
          onClick={() => onOpenSettings()}
          title="Configurações"
          aria-label="Abrir Configurações"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
