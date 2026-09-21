import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader, Wifi, WifiOff, LogIn } from 'lucide-react';
import { GoogleSyncStatus } from '@/features/calendar/hooks/useCalendar';
import { supabaseService } from '@/features/core/api/supabase';
import { useToast } from '@/features/core/contexts/ToastContext';

interface GoogleCalendarSyncPanelProps {
  syncStatus: GoogleSyncStatus;
  lastSyncTime: Date | null;
  onManualSync: () => void;
}

const statusConfig: Record<GoogleSyncStatus, { icon: React.ReactNode; label: string; color: string }> = {
  idle: {
    icon: <Wifi size={13} />,
    label: 'Google Calendar',
    color: 'var(--color-text-muted)',
  },
  syncing: {
    icon: <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />,
    label: 'Sincronizando...',
    color: 'var(--color-primary)',
  },
  synced: {
    icon: <CheckCircle size={13} />,
    label: 'Sincronizado',
    color: 'var(--color-success)',
  },
  error: {
    icon: <AlertCircle size={13} />,
    label: 'Falha no sync',
    color: 'var(--color-danger)',
  },
  disconnected: {
    icon: <WifiOff size={13} />,
    label: 'Desconectado',
    color: 'var(--color-text-muted)',
  },
};

export const GoogleCalendarSyncPanel: React.FC<GoogleCalendarSyncPanelProps> = ({
  syncStatus,
  lastSyncTime,
  onManualSync,
}) => {
  const toast = useToast();
  const cfg = statusConfig[syncStatus];

  const handleConnect = async () => {
    const { error } = await supabaseService.signInWithGoogle();
    if (error) {
      toast.error(`Falha ao conectar: ${error.message}`, 'Erro');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 10px',
        borderRadius: '8px',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        fontSize: '0.8rem',
      }}
    >
      {/* Google logo */}
      <svg viewBox="0 0 48 48" width="14" height="14" style={{ flexShrink: 0 }}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>

      <span style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
        {cfg.icon}
        {cfg.label}
      </span>

      {syncStatus === 'disconnected' ? (
        <button
          className="btn-primary"
          onClick={handleConnect}
          style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <LogIn size={11} />
          Conectar
        </button>
      ) : (
        <>
          {lastSyncTime && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
              · {lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className="icon-btn"
            onClick={onManualSync}
            disabled={syncStatus === 'syncing'}
            title="Forçar sincronização agora"
            style={{ padding: '2px 4px' }}
          >
            <RefreshCw size={12} style={syncStatus === 'syncing' ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </>
      )}
    </div>
  );
};
