import React, { useState, useRef, useEffect } from 'react';
import { Cloud, CheckCircle2, Settings, LogOut } from 'lucide-react';
import { SupabaseProfile } from '../../types';

interface HeaderUserMenuProps {
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onOpenSettings: (tab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup') => void;
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({
  userProfile,
  onGoogleLogin,
  onSignOut,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!userProfile) {
    return (
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
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="profile-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Conectado como ${userProfile.full_name || userProfile.email}`}
      >
        {userProfile.avatar_url ? (
          <img src={userProfile.avatar_url} alt="Avatar" className="profile-avatar" />
        ) : (
          <Cloud size={16} />
        )}
        <span>{userProfile.full_name ? userProfile.full_name.split(' ')[0] : 'Conta'}</span>
      </button>

      {isOpen && (
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
              setIsOpen(false);
              onOpenSettings('cloud');
            }}
          >
            <Cloud size={15} /> Sincronização & Nuvem
          </button>
          <button
            className="user-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
          >
            <Settings size={15} /> Configurações Gerais
          </button>
          <div className="user-dropdown-divider" />
          <button
            className="user-dropdown-item danger"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={15} /> Sair da Conta
          </button>
        </div>
      )}
    </div>
  );
};
