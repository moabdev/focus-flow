import React from 'react';
import { Play } from 'lucide-react';
import { UserSettings, AlarmSound } from '../../types';

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
  return (
    <>
      <div>
        <div className="setting-label" style={{ marginBottom: '0.5rem' }}>
          Som de Alarme de Conclusão
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
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
    </>
  );
};
