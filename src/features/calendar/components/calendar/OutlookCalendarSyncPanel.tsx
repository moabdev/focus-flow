import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader, Wifi, WifiOff, LogIn, ChevronDown } from 'lucide-react';
import { CloudCalendarSyncStatus } from '@/features/calendar/hooks/useCalendar';
import { supabaseService } from '@/features/core/api/supabase';
import { useToast } from '@/features/core/contexts/ToastContext';
import { MicrosoftCalendarResource } from '@/services/calendar/outlookCalendarService';

interface OutlookCalendarSyncPanelProps {
  syncStatus: CloudCalendarSyncStatus;
  lastSyncTime: Date | null;
  onManualSync: () => void;
  availableCalendars?: MicrosoftCalendarResource[];
  selectedCalendars?: string[];
  onToggleCalendar?: (calendarId: string) => void;
}

const statusConfig: Record<CloudCalendarSyncStatus, { icon: React.ReactNode; label: string; color: string }> = {
  idle: {
    icon: <Wifi size={13} />,
    label: 'Outlook Calendar',
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

export const OutlookCalendarSyncPanel: React.FC<OutlookCalendarSyncPanelProps> = ({
  syncStatus,
  lastSyncTime,
  onManualSync,
  availableCalendars = [],
  selectedCalendars = [],
  onToggleCalendar,
}) => {
  const toast = useToast();
  const cfg = statusConfig[syncStatus];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    const { error } = await supabaseService.signInWithMicrosoft();
    if (error) {
      toast.error(`Falha ao conectar: ${error.message}`, 'Erro');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
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
        {/* Microsoft logo (4 squares) */}
        <svg viewBox="0 0 21 21" width="14" height="14" style={{ flexShrink: 0 }}>
          <path fill="#f25022" d="M0 0h10v10H0z"/>
          <path fill="#7fba00" d="M11 0h10v10H11z"/>
          <path fill="#00a4ef" d="M0 11h10v10H0z"/>
          <path fill="#ffb900" d="M11 11h10v10H11z"/>
        </svg>

        <span style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
          {cfg.icon}
          {cfg.label}
        </span>

        {syncStatus === 'disconnected' ? (
          <button
            className="btn-primary"
            onClick={handleConnect}
            style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', background: '#0078D4' }}
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
            
            {availableCalendars.length > 0 && (
              <button
                className="icon-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Selecionar Calendários"
                style={{ padding: '2px 4px', marginLeft: '4px' }}
              >
                <ChevronDown size={12} />
              </button>
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

      {/* Calendars Dropdown */}
      {isDropdownOpen && availableCalendars.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          padding: '8px',
          zIndex: 100,
          minWidth: '220px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', padding: '0 4px' }}>
            Calendários Disponíveis:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {availableCalendars.map(cal => (
              <label 
                key={cal.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '0.8rem',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                }}
                className="hover-bg"
              >
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes(cal.id)}
                  onChange={() => {
                    if (onToggleCalendar) onToggleCalendar(cal.id);
                  }}
                  style={{ accentColor: cal.hexColor || '#0078D4' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  {cal.hexColor && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cal.hexColor, flexShrink: 0 }} />
                  )}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cal.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
