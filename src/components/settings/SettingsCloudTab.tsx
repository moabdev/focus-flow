import React from 'react';
import { LogOut } from 'lucide-react';
import { SupabaseProfile } from '../../types';

interface SettingsCloudTabProps {
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onSyncToCloud: () => void;
  syncStatus: string | null;
}

export const SettingsCloudTab: React.FC<SettingsCloudTabProps> = ({
  userProfile,
  onGoogleLogin,
  onSignOut,
  onSyncToCloud,
  syncStatus,
}) => {
  return (
    <>
      <div className="cloud-info-card">
        <div className="cloud-info-header">
          <div className="cloud-status-indicator">
            <span className="status-dot online" />
            <strong>Supabase Cloud Ativo</strong>
          </div>
          <span className="cloud-db-badge">PostgreSQL</span>
        </div>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: '0.5rem 0 0 0',
            lineHeight: 1.5,
          }}
        >
          Suas tarefas, disciplinas e histórico de foco são sincronizados de forma segura no banco
          de dados na nuvem com criptografia e isolamento de dados por usuário (Row Level Security).
        </p>
      </div>

      {userProfile ? (
        <div className="cloud-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                className="cloud-avatar"
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="cloud-avatar-placeholder">
                {(userProfile.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {userProfile.full_name || userProfile.email}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {userProfile.email}
              </div>
            </div>
          </div>
          <button
            className="filter-chip"
            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: 4 }}
            onClick={onSignOut}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <button
            className="filter-chip"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 700,
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onClick={onGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
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
            <span>Entrar com o Google</span>
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Faça login com sua conta Google para salvar seu progresso e acessar de qualquer lugar.
          </div>
        </div>
      )}

      {userProfile && (
        <button
          className="filter-chip"
          style={{ width: '100%', padding: '0.75rem', fontWeight: 700, justifyContent: 'center' }}
          onClick={onSyncToCloud}
        >
          ☁️ Enviar Tarefas & Histórico Locais para a Nuvem
        </button>
      )}

      {syncStatus && (
        <div style={{ fontSize: '0.85rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
          {syncStatus}
        </div>
      )}
    </>
  );
};
