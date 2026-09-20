import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Sun,
  Moon,
  Cloud,
  Settings,
  BarChart2,
  Edit3,
  Maximize2,
  Volume2,
  VolumeX,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { AmbientSound, ColorMode, SupabaseProfile } from '../types';

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
}) => {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown do usuário ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const getAmbientLabel = (sound: AmbientSound) => {
    switch (sound) {
      case 'rain': return '🌧️ Chuva';
      case 'brownNoise': return '🎧 Ruído Marrom';
      case 'whiteNoise': return '📻 Ruído Branco';
      default: return '🔇 Sem Som';
    }
  };

  return (
    <header className="app-header">
      <div className="brand-section">
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

      <div className="nav-actions">
        {/* Dropdown de Som Ambiente */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowAmbientMenu(!showAmbientMenu)}
            title="Sons de Foco Ambiente"
            aria-label="Sons de Foco Ambiente"
          >
            {ambientSound === 'none' ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {showAmbientMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                padding: '0.75rem',
                minWidth: '220px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                ÁUDIO AMBIENTE
              </div>
              {(['none', 'rain', 'brownNoise', 'whiteNoise'] as AmbientSound[]).map((snd) => (
                <button
                  key={snd}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: ambientSound === snd ? 700 : 500,
                    background: ambientSound === snd ? 'var(--accent-primary)' : 'transparent',
                    color: ambientSound === snd ? '#fff' : 'var(--text-primary)',
                  }}
                  onClick={() => {
                    onSelectAmbient(snd);
                    setShowAmbientMenu(false);
                  }}
                >
                  {getAmbientLabel(snd)}
                </button>
              ))}

              {ambientSound !== 'none' && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    Volume: {Math.round(ambientVolume * 100)}%
                  </div>
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
        {!userProfile ? (
          <button
            className="google-login-btn"
            onClick={onGoogleLogin}
            title="Entrar com o Google"
            aria-label="Entrar com o Google"
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="16" height="16">
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
            <span className="google-login-text">Entrar com Google</span>
          </button>
        ) : (
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              className="profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={`Conectado como ${userProfile.full_name || userProfile.email}`}
            >
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="profile-avatar" />
              ) : (
                <Cloud size={16} />
              )}
              <span>{userProfile.full_name ? userProfile.full_name.split(' ')[0] : 'Conta'}</span>
            </button>

            {showUserMenu && (
              <div className="glass-panel user-dropdown-menu">
                <div className="user-dropdown-info">
                  <div className="user-dropdown-name">{userProfile.full_name}</div>
                  <div className="user-dropdown-email">{userProfile.email}</div>
                  <div className="user-dropdown-cloud-status">
                    <CheckCircle2 size={13} color="#10b981" /> Nuvem Supabase Ativa
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings('cloud');
                  }}
                >
                  <Cloud size={15} /> Sincronização & Nuvem
                </button>
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings();
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
                  }}
                >
                  <LogOut size={15} /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        )}

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
