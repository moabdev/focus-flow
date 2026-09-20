import React, { useState } from 'react';
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
  onOpenAuthModal: () => void;
  onOpenSettings: () => void;
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
  onOpenAuthModal,
  onOpenSettings,
  onOpenStats,
  onToggleScratchpad,
  onEnterZenMode,
}) => {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

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
          <div className="brand-logo-icon">F</div>
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

        {/* Botão de Perfil / Google / Supabase */}
        <button
          className="profile-btn"
          onClick={onOpenAuthModal}
          title="Conta Google & Sincronização Supabase"
        >
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Avatar" className="profile-avatar" />
          ) : (
            <Cloud size={16} />
          )}
          <span>{userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'Nuvem'}</span>
        </button>

        {/* Configurações */}
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Configurações"
          aria-label="Abrir Configurações"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
