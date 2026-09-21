import React, { useState } from 'react';
import { Play, Bell, BellRing, Check } from 'lucide-react';
import { UserSettings, AlarmSound } from '@/features/core/types';
import { notificationService } from '@/features/core/api/notificationService';
import { useToast } from '@/features/core/contexts/ToastContext';

interface SettingsSoundsTabProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onPlayAlarmPreview: (alarm: AlarmSound) => void;
}

export const SettingsSoundsTab: React.FC<SettingsSoundsTabProps> = ({
  settings,
  onUpdateSettings,
  onPlayAlarmPreview,
}) => {
  const toast = useToast();
  const [notifGranted, setNotifGranted] = useState(notificationService.isGranted());

  const handleRequestNotification = async () => {
    const granted = await notificationService.requestPermission();
    setNotifGranted(granted);
    if (granted) {
      toast.success('Notificações do sistema ativadas!', 'Notificações');
      notificationService.notify(
        '🍅 FocusFlow Notificações Ativadas',
        'Você será notificado a cada ciclo de foco ou pausa concluído!'
      );
    } else {
      toast.warning('Permissão de notificação não concedida.', 'Atenção');
    }
  };

  const handleTestNotification = () => {
    if (!notifGranted) {
      handleRequestNotification();
      return;
    }
    notificationService.notifyTimerComplete('pomodoro', 'Estudo de Alta Performance');
    toast.info('Notificação de teste disparada!', 'Notificação de Teste');
  };

  return (
    <>
      <div>
        <div className="setting-label" style={{ marginBottom: '0.5rem' }}>
          Som de Alarme de Conclusão
        </div>
        <div className="settings-sound-options-grid">
          {[
            { id: 'crystal', label: '💎 Cristal Harmônico' },
            { id: 'bell', label: '🔔 Sino Zen 528Hz' },
            { id: 'digital', label: '⚡ Digital Tech' },
            { id: 'marimba', label: '🪵 Marimba Suave' },
          ].map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background:
                  settings.alarm_sound === s.id
                    ? 'var(--surface-glass-hover)'
                    : 'rgba(0, 0, 0, 0.15)',
                border:
                  settings.alarm_sound === s.id
                    ? '1px solid var(--accent-primary)'
                    : '1px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => onUpdateSettings({ ...settings, alarm_sound: s.id as AlarmSound })}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</span>
              <button
                className="icon-btn"
                style={{ width: '26px', height: '26px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAlarmPreview(s.id as AlarmSound);
                }}
                title="Ouvir prévia"
              >
                <Play size={12} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="setting-row" style={{ marginTop: '0.5rem' }}>
        <div>
          <div className="setting-label">Volume do Alarme</div>
          <div className="setting-desc">{Math.round(settings.sound_volume * 100)}%</div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.sound_volume}
          onChange={(e) =>
            onUpdateSettings({ ...settings, sound_volume: parseFloat(e.target.value) })
          }
          style={{ width: '140px', accentColor: 'var(--accent-primary)' }}
        />
      </div>

      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass-subtle)' }}>
        <div className="setting-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={16} color="var(--accent-primary)" />
          Notificações no Navegador & Desktop
        </div>
        <div className="setting-desc" style={{ marginBottom: '0.75rem' }}>
          Receba alertas visuais no sistema quando ciclos de foco ou pausas terminarem, mesmo em segundo plano.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!notifGranted ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
              onClick={handleRequestNotification}
            >
              <BellRing size={15} style={{ marginRight: '0.4rem' }} />
              Ativar Notificações Nativas
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                <Check size={16} /> Notificações Ativas
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={handleTestNotification}
              >
                Testar Alerta
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
