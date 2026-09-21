import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogIn, LogOut, Download, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { CalendarEvent } from '@/features/core/types';
import {
  getGoogleAccessToken,
  isGoogleCalendarConnected,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
} from '@/services/calendar/googleCalendarService';
import { supabaseService } from '@/features/core/api/supabase';
import { useToast } from '@/features/core/contexts/ToastContext';

interface GoogleCalendarSyncPanelProps {
  localEvents: CalendarEvent[];
  onImportEvents: (events: CalendarEvent[]) => void;
  onExportComplete: (updatedEvents: CalendarEvent[]) => void;
}

export const GoogleCalendarSyncPanel: React.FC<GoogleCalendarSyncPanelProps> = ({
  localEvents,
  onImportEvents,
  onExportComplete,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSyncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const toast = useToast();

  const checkConnection = useCallback(async () => {
    setIsCheckingAuth(true);
    const connected = await isGoogleCalendarConnected();
    setIsConnected(connected);
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleConnect = async () => {
    const { error } = await supabaseService.signInWithGoogle();
    if (error) {
      toast.error(`Falha ao conectar com Google: ${error.message}`, 'Erro de Conexão');
    }
    // After redirect back, the auth state listener will update.
    // User needs to have Supabase Google OAuth provider configured.
  };

  const handleDisconnect = async () => {
    await supabaseService.signOut();
    setIsConnected(false);
    toast.info('Desconectado do Google Calendar.', 'Desconectado');
  };

  const handleImport = async () => {
    const token = await getGoogleAccessToken();
    if (!token) {
      toast.error('Não foi possível obter o token do Google. Reconecte sua conta.', 'Erro de Auth');
      return;
    }

    setSyncing(true);
    try {
      // Fetch events for the next 3 months
      const now = new Date();
      const future = new Date();
      future.setMonth(future.getMonth() + 3);

      const googleEvents = await fetchGoogleCalendarEvents(
        token,
        now.toISOString(),
        future.toISOString()
      );

      // Filter out events that are already imported
      const existingGoogleIds = new Set(
        localEvents
          .filter((e) => e.source === 'google')
          .map((e) => e.google_event_id)
      );
      const newEvents = googleEvents.filter(
        (e) => !existingGoogleIds.has(e.google_event_id)
      );

      if (newEvents.length === 0) {
        toast.info('Nenhum evento novo encontrado no Google Calendar.', 'Já sincronizado');
      } else {
        onImportEvents(newEvents);
        toast.success(`${newEvents.length} evento(s) importado(s) do Google Calendar!`, 'Importação Concluída');
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err: any) {
      toast.error(`Falha ao importar: ${err.message}`, 'Erro na Importação');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    const token = await getGoogleAccessToken();
    if (!token) {
      toast.error('Não foi possível obter o token do Google. Reconecte sua conta.', 'Erro de Auth');
      return;
    }

    // Only export local events that don't have a Google Event ID yet
    const eventsToExport = localEvents.filter(
      (e) => e.source !== 'google' && !e.google_event_id
    );

    if (eventsToExport.length === 0) {
      toast.info('Todos os eventos já foram exportados para o Google Calendar.', 'Nada a exportar');
      return;
    }

    setSyncing(true);
    const updatedEvents: CalendarEvent[] = [...localEvents];
    let successCount = 0;

    try {
      for (const event of eventsToExport) {
        try {
          const googleId = await createGoogleCalendarEvent(token, event);
          // Update the local event with the google_event_id
          const idx = updatedEvents.findIndex((e) => e.id === event.id);
          if (idx >= 0) {
            updatedEvents[idx] = { ...updatedEvents[idx], google_event_id: googleId };
          }
          successCount++;
        } catch (err: any) {
          console.warn(`[GoogleSync] Falha ao exportar evento "${event.title}":`, err.message);
        }
      }

      onExportComplete(updatedEvents);
      toast.success(
        `${successCount} de ${eventsToExport.length} evento(s) exportado(s) para o Google Calendar!`,
        'Exportação Concluída'
      );
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      toast.error(`Falha na exportação: ${err.message}`, 'Erro na Exportação');
    } finally {
      setSyncing(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Verificando conexão...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '8px',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        fontSize: '0.82rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isConnected ? (
          <CheckCircle size={14} color="var(--color-success)" />
        ) : (
          <AlertCircle size={14} color="var(--color-text-muted)" />
        )}
        <span style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 500 }}>
          {isConnected ? 'Google Calendar' : 'Desconectado'}
        </span>
      </div>

      {/* Google icon */}
      <svg viewBox="0 0 48 48" width="16" height="16" style={{ flexShrink: 0 }}>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>

      {!isConnected ? (
        <button
          className="btn-primary"
          onClick={handleConnect}
          style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <LogIn size={13} />
          Conectar
        </button>
      ) : (
        <>
          <button
            className="btn-secondary"
            onClick={handleImport}
            disabled={isSyncing}
            style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Importar eventos do Google Calendar"
          >
            {isSyncing ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
            Importar
          </button>
          <button
            className="btn-secondary"
            onClick={handleExport}
            disabled={isSyncing}
            style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Exportar eventos do FocusFlow para o Google Calendar"
          >
            {isSyncing ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
            Exportar
          </button>
          <button
            className="icon-btn"
            onClick={handleDisconnect}
            title="Desconectar do Google Calendar"
            style={{ padding: '4px 6px' }}
          >
            <LogOut size={13} />
          </button>
          {lastSyncTime && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              Último sync: {lastSyncTime}
            </span>
          )}
        </>
      )}
    </div>
  );
};
