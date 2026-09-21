import React from 'react';
import { UserSettings, ThemePalette } from '@/features/core/types';

interface SettingsThemeTabProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const SettingsThemeTab: React.FC<SettingsThemeTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <>
      <div>
        <div className="setting-label" style={{ marginBottom: '0.5rem' }}>
          Paleta de Cores
        </div>
        <div className="theme-swatches">
          {[
            { id: 'ruby', name: 'Ruby Focus', color: '#ff2a5f' },
            { id: 'ocean', name: 'Deep Ocean', color: '#0ea5e9' },
            { id: 'matcha', name: 'Matcha Zen', color: '#10b981' },
            { id: 'oled', name: 'Midnight OLED', color: '#a855f7' },
            { id: 'sunset', name: 'Sunset Glow', color: '#f97316' },
          ].map((item) => (
            <button
              key={item.id}
              className={`theme-swatch-btn ${settings.theme === item.id ? 'active' : ''}`}
              style={{ background: item.color }}
              onClick={() => onUpdateSettings({ ...settings, theme: item.id as ThemePalette })}
              title={item.name}
            />
          ))}
        </div>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Modo Visual (Dark / Light)</div>
          <div className="setting-desc">Alternar entre claro, escuro ou seguir o sistema</div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['dark', 'light', 'system'] as const).map((m) => (
            <button
              key={m}
              className="filter-chip"
              style={{
                background: settings.color_mode === m ? 'var(--accent-primary)' : 'transparent',
                color: settings.color_mode === m ? '#fff' : 'var(--text-primary)',
              }}
              onClick={() => onUpdateSettings({ ...settings, color_mode: m })}
            >
              {m === 'dark' ? 'Escuro' : m === 'light' ? 'Claro' : 'Auto'}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Escurecimento Automático em Execução</div>
          <div className="setting-desc">Transita suavemente para o Dark Mode durante o foco</div>
        </div>
        <label className="switch-label">
          <input
            type="checkbox"
            checked={settings.dark_mode_running}
            onChange={(e) =>
              onUpdateSettings({ ...settings, dark_mode_running: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>
    </>
  );
};
