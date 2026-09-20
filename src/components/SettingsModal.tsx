import React, { useState, useEffect } from 'react';
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
  initialTab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPlayAlarmPreview,
  userProfile,
  onRefreshTasks,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>(initialTab || 'timer');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

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

  if (!isOpen) return null;

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
              <div className="cloud-info-card">
                <div className="cloud-info-header">
                  <div className="cloud-status-indicator">
                    <span className="status-dot online" />
                    <strong>Supabase Cloud Ativo</strong>
                  </div>
                  <span className="cloud-db-badge">PostgreSQL</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
                  Suas tarefas, disciplinas e histórico de foco são sincronizados de forma segura no banco de dados na nuvem com criptografia e isolamento de dados por usuário (Row Level Security).
                </p>
              </div>

              {userProfile ? (
                <div className="cloud-user-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                    ) : (
                      <div className="brand-logo-icon" style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}>
                        {userProfile.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userProfile.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile.email}</div>
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={handleSignOut}
                    title="Desconectar Conta"
                    aria-label="Desconectar Conta"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <button
                    className="google-login-btn-lg"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
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
