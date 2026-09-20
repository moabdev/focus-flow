import React from 'react';
import { UserSettings } from '../../types';

interface SettingsTimerTabProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const SettingsTimerTab: React.FC<SettingsTimerTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
        DURAÇÕES DOS CICLOS (MINUTOS)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="setting-desc">Pomodoro</label>
          <input
            type="number"
            min="1"
            max="120"
            value={settings.pomodoro_time}
            onChange={(e) =>
              onUpdateSettings({ ...settings, pomodoro_time: parseInt(e.target.value) || 25 })
            }
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-glass-subtle)',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          />
        </div>
        <div>
          <label className="setting-desc">Pausa Curta</label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.short_break_time}
            onChange={(e) =>
              onUpdateSettings({ ...settings, short_break_time: parseInt(e.target.value) || 5 })
            }
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-glass-subtle)',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          />
        </div>
        <div>
          <label className="setting-desc">Pausa Longa</label>
          <input
            type="number"
            min="1"
            max="90"
            value={settings.long_break_time}
            onChange={(e) =>
              onUpdateSettings({ ...settings, long_break_time: parseInt(e.target.value) || 15 })
            }
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-glass-subtle)',
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          />
        </div>
      </div>

      <div className="setting-row" style={{ marginTop: '0.5rem' }}>
        <div>
          <div className="setting-label">Iniciar Pausas Automaticamente</div>
          <div className="setting-desc">Começa a pausa assim que o pomodoro termina</div>
        </div>
        <label className="switch-label">
          <input
            type="checkbox"
            checked={settings.auto_start_breaks}
            onChange={(e) =>
              onUpdateSettings({ ...settings, auto_start_breaks: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Iniciar Pomodoros Automaticamente</div>
          <div className="setting-desc">Começa o foco após a pausa terminar</div>
        </div>
        <label className="switch-label">
          <input
            type="checkbox"
            checked={settings.auto_start_pomodoros}
            onChange={(e) =>
              onUpdateSettings({ ...settings, auto_start_pomodoros: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Intervalo da Pausa Longa</div>
          <div className="setting-desc">Ciclos de foco necessários até a pausa longa</div>
        </div>
        <input
          type="number"
          min="2"
          max="12"
          value={settings.long_break_interval}
          onChange={(e) =>
            onUpdateSettings({ ...settings, long_break_interval: parseInt(e.target.value) || 4 })
          }
          style={{
            width: '60px',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-glass-subtle)',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        />
      </div>
    </>
  );
};
