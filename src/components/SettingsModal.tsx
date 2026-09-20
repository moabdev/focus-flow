import React, { useState } from 'react';
import {
  X,
  Clock,
  Palette,
  Volume2,
  Cloud,
  Database,
  Download,
  Upload,
  Play,
  Check,
  LogIn,
  LogOut,
} from 'lucide-react';
import { UserSettings, ThemePalette, AlarmSound, SupabaseProfile } from '../types';
import { supabaseService } from '../services/supabase';
import { storageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onPlayAlarmPreview: (alarm: AlarmSound) => void;
  userProfile: SupabaseProfile | null;
  onRefreshTasks: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPlayAlarmPreview,
  userProfile,
  onRefreshTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>('timer');
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('focusflow_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('focusflow_supabase_key') || ''
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = supabaseService.setConfig(supabaseUrl, supabaseKey);
    if (ok) {
      setSyncStatus('Configurações do Supabase salvas com sucesso!');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabaseService.signInWithGoogle();
    if (error) {
      alert(`Erro no login: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
  };

  const handleSyncToCloud = async () => {
    setSyncStatus('Sincronizando tarefas locais com a nuvem...');
    const result = await storageService.syncLocalToCloud();
    setSyncStatus(`${result.count} registros sincronizados no seu PostgreSQL!`);
    onRefreshTasks();
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await storageService.importBackupJSON(file);
      if (ok) {
        alert('Backup restaurado com sucesso! Recarregando...');
        window.location.reload();
      } else {
        alert('Arquivo de backup inválido.');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Configurações do FocusFlow</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Timer
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <Palette size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Temas
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('sounds')}
          >
            <Volume2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Sons
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'cloud' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            <Cloud size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Nuvem
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Database size={16} style={{ display: 'inline', marginRight: '4px' }} />
            Backup
          </button>
        </div>

        <div className="modal-content">
          {/* ABA 1: TIMER */}
          {activeTab === 'timer' && (
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
          )}

          {/* ABA 2: TEMAS & CORES */}
          {activeTab === 'theme' && (
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
          )}

          {/* ABA 3: SONS & ALARMES */}
          {activeTab === 'sounds' && (
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
                        background: settings.alarm_sound === s.id ? 'var(--surface-glass-hover)' : 'rgba(0, 0, 0, 0.15)',
                        border: settings.alarm_sound === s.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
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
          )}

          {/* ABA 4: NUVEM SUPABASE & GOOGLE */}
          {activeTab === 'cloud' && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                O FocusFlow pode se conectar ao <strong>Supabase (PostgreSQL)</strong> para salvar suas tarefas e histórico na nuvem com autenticação Google.
              </div>

              {userProfile ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {userProfile.avatar_url && (
                      <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{userProfile.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile.email}</div>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={handleSignOut} title="Desconectar">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="main-start-btn"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={handleGoogleLogin}
                >
                  <LogIn size={18} /> Entrar com o Google
                </button>
              )}

              {userProfile && (
                <button
                  className="filter-chip"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
                  onClick={handleSyncToCloud}
                >
                  ☁️ Enviar Tarefas & Histórico Locais para a Nuvem
                </button>
              )}

              {syncStatus && (
                <div style={{ fontSize: '0.85rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
                  {syncStatus}
                </div>
              )}

              <form onSubmit={handleSaveSupabaseConfig} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="setting-label">Configuração Manual do Projeto Supabase</div>
                <input
                  type="text"
                  placeholder="SUPABASE_URL (ex: https://xyz.supabase.co)"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
                <input
                  type="password"
                  placeholder="SUPABASE_ANON_KEY"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  type="submit"
                  className="filter-chip"
                  style={{ alignSelf: 'flex-start', background: 'var(--accent-primary)', color: '#fff' }}
                >
                  Salvar Credenciais
                </button>
              </form>
            </>
          )}

          {/* ABA 5: BACKUP & EXPORTAÇÃO */}
          {activeTab === 'backup' && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Exporte todo o seu histórico, tarefas, preferências e anotações para um arquivo JSON ou restaure um backup anterior.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  className="main-start-btn"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                  onClick={() => storageService.exportBackupJSON()}
                >
                  <Download size={18} /> Exportar Backup (JSON)
                </button>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '1rem' }}>
                <div className="setting-label" style={{ marginBottom: '0.5rem' }}>
                  Restaurar de um Arquivo
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
