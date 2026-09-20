import React, { useState, useRef, useEffect } from 'react';
import {
  Timer,
  FolderKanban,
  Calendar,
  BarChart2,
  Edit3,
  Flame,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCircle2,
  Cloud,
  X,
  Sparkles,
} from 'lucide-react';
import { Project, AmbientSound, ColorMode, SupabaseProfile } from '../types';

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
  const userMenuRef = useRef<HTMLDivElement>(null);
  const ambientMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (ambientMenuRef.current && !ambientMenuRef.current.contains(event.target as Node)) {
        setShowAmbientMenu(false);
      }
    };
    if (showUserMenu || showAmbientMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showAmbientMenu]);

  const getAmbientLabel = (sound: AmbientSound) => {
    switch (sound) {
      case 'rain': return '🌧️ Chuva';
      case 'brownNoise': return '🎧 Ruído Marrom';
      case 'whiteNoise': return '📻 Ruído Branco';
      default: return '🔇 Sem Som';
    }
  };

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

          {/* Botão recolher no desktop */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Botão fechar exclusivo mobile */}
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
                <span className="streak-days-count">{streakDays} {streakDays === 1 ? 'Dia' : 'Dias'}</span>
                <span className="streak-days-sub">Ofensiva ativa</span>
              </div>
            )}
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-title">
            {!isCollapsed ? 'NAVEGAÇÃO' : '•'}
          </div>

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

        {/* Seção de Atalhos Rápidos para Projetos (visível quando expandido) */}
        {!isCollapsed && (
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
                        if (onSelectProject) onSelectProject(proj.id);
                        handleNavClick('projects');
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
        )}

        {/* Espaço flexível para empurrar o rodapé */}
        <div style={{ flex: 1 }} />

        {/* Rodapé da Sidebar: Controles e Perfil */}
        <div className="sidebar-footer">
          {/* Linha de Utilitários Rápidos */}
          <div className="sidebar-quick-tools">
            {/* Som Ambiente Popover */}
            <div style={{ position: 'relative' }} ref={ambientMenuRef}>
              <button
                className={`icon-btn ${ambientSound !== 'none' ? 'active-audio' : ''}`}
                onClick={() => setShowAmbientMenu(!showAmbientMenu)}
                title="Sons de Foco Ambiente"
                aria-label="Sons de Foco Ambiente"
              >
                {ambientSound === 'none' ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>

              {showAmbientMenu && (
                <div className="glass-panel sidebar-ambient-popover">
                  <div className="popover-title">ÁUDIO AMBIENTE</div>
                  {(['none', 'rain', 'brownNoise', 'whiteNoise'] as AmbientSound[]).map((snd) => (
                    <button
                      key={snd}
                      className={`ambient-opt-btn ${ambientSound === snd ? 'active' : ''}`}
                      onClick={() => {
                        onSelectAmbient(snd);
                        setShowAmbientMenu(false);
                      }}
                    >
                      {getAmbientLabel(snd)}
                    </button>
                  ))}

                  {ambientSound !== 'none' && (
                    <div className="volume-slider-wrap">
                      <div className="volume-label">Volume: {Math.round(ambientVolume * 100)}%</div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ambientVolume}
                        onChange={(e) => onSetAmbientVolume(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alternador Dark / Light Mode */}
            <button
              className="icon-btn"
              onClick={onToggleColorMode}
              title={`Alternar para modo ${colorMode === 'dark' ? 'Claro' : 'Escuro'}`}
              aria-label="Alternar tema de cores"
            >
              {colorMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Modo Zen */}
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

            {/* Configurações */}
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

          {/* Cartão de Usuário / Login Google */}
          <div className="sidebar-user-section" ref={userMenuRef}>
            {!userProfile ? (
              <button
                className="sidebar-login-btn"
                onClick={onGoogleLogin}
                title="Conectar com o Google"
                aria-label="Entrar com o Google"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {!isCollapsed && <span>Entrar com Google</span>}
              </button>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <button
                  className="sidebar-profile-card"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={`Conectado como ${userProfile.full_name || userProfile.email}`}
                >
                  {userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="sidebar-user-avatar"
                    />
                  ) : (
                    <div className="sidebar-user-placeholder">
                      <Cloud size={16} />
                    </div>
                  )}

                  {!isCollapsed && (
                    <div className="sidebar-user-details">
                      <span className="sidebar-user-name">
                        {userProfile.full_name ? userProfile.full_name.split(' ')[0] : 'Conta'}
                      </span>
                      <span className="sidebar-user-status">
                        <CheckCircle2 size={11} color="#10b981" /> Nuvem Ativa
                      </span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="glass-panel sidebar-user-popover">
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">{userProfile.full_name}</div>
                      <div className="user-dropdown-email">{userProfile.email}</div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings('cloud');
                        if (isMobileOpen) onCloseMobile();
                      }}
                    >
                      <Cloud size={15} /> Sincronização & Nuvem
                    </button>
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings();
                        if (isMobileOpen) onCloseMobile();
                      }}
                    >
                      <Settings size={15} /> Configurações Gerais
                    </button>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item danger"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                        if (isMobileOpen) onCloseMobile();
                      }}
                    >
                      <LogOut size={15} /> Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
