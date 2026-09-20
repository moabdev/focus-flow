import React, { useState, useEffect } from 'react';
import { X, Clock, Palette, Volume2, Cloud, Database } from 'lucide-react';
import { UserSettings, AlarmSound, SupabaseProfile } from '../types';
import { supabaseService } from '../services/supabase';
import { storageService } from '../services/storage';
import { useToast } from '../context/ToastContext';
import { SettingsTimerTab } from './settings/SettingsTimerTab';
import { SettingsThemeTab } from './settings/SettingsThemeTab';
import { SettingsSoundsTab } from './settings/SettingsSoundsTab';
import { SettingsCloudTab } from './settings/SettingsCloudTab';
import { SettingsBackupTab } from './settings/SettingsBackupTab';

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
  const [activeTab, setActiveTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>(
    initialTab || 'timer'
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleGoogleLogin = async () => {
    const { error } = await supabaseService.signInWithGoogle();
    if (error) {
      toast.error(`Erro no login: ${error.message}`, 'Falha de Autenticação');
    }
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    toast.info('Sessão encerrada com sucesso.', 'Logout');
  };

  const handleSyncToCloud = async () => {
    setSyncStatus('Sincronizando tarefas locais com a nuvem...');
    const result = await storageService.syncLocalToCloud();
    setSyncStatus(`${result.count} registros sincronizados no seu PostgreSQL!`);
    toast.success(`${result.count} registros sincronizados no PostgreSQL!`, 'Sincronização Concluída');
    onRefreshTasks();
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await storageService.importBackupJSON(file);
      if (ok) {
        toast.success('Backup restaurado com sucesso! Atualizando...', 'Backup Restaurado');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error('Arquivo de backup inválido ou corrompido.', 'Erro no Backup');
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
          {activeTab === 'timer' && (
            <SettingsTimerTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'theme' && (
            <SettingsThemeTab settings={settings} onUpdateSettings={onUpdateSettings} />
          )}

          {activeTab === 'sounds' && (
            <SettingsSoundsTab
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onPlayAlarmPreview={onPlayAlarmPreview}
            />
          )}

          {activeTab === 'cloud' && (
            <SettingsCloudTab
              userProfile={userProfile}
              onGoogleLogin={handleGoogleLogin}
              onSignOut={handleSignOut}
              onSyncToCloud={handleSyncToCloud}
              syncStatus={syncStatus}
            />
          )}

          {activeTab === 'backup' && <SettingsBackupTab onFileImport={handleFileImport} />}
        </div>
      </div>
    </div>
  );
};
